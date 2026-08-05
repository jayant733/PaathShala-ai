import json
import re
from typing import Any, Optional
from uuid import UUID

from fastapi import HTTPException

from app.ai.prompts.quiz_prompts import (
    QUIZ_GENERATION_SYSTEM_PROMPT,
    build_quiz_from_source_prompt,
    build_quiz_generation_prompt,
    build_quiz_repair_prompt,
)
from app.ai.providers.context import set_ai_context
from app.database.models.quiz import Question
from app.repositories.quiz_repository import QuizRepository
from app.schemas.quiz import (
    QuestionDraft,
    QuizDraft,
    QuizGenerateFromHistoryRequest,
    QuizGenerateRequest,
    QuestionResult,
    WeakTopic,
)

_FENCE_RE = re.compile(r"^```(?:json)?\s*", re.IGNORECASE)
_FENCE_END_RE = re.compile(r"\s*```$")


def _strip_fences(text: str) -> str:
    text = _FENCE_RE.sub("", text.strip())
    text = _FENCE_END_RE.sub("", text)
    return text.strip()


def grade_attempt(questions: list[Question], answers: Optional[dict]) -> dict[str, Any]:
    """Grade a quiz attempt. ``answers`` maps question_id (str) -> submitted answer.

    Pure function (no DB / AI) so it is trivially unit-testable.
    """
    answers = answers or {}
    total_points = sum(q.points or 1 for q in questions)
    score = 0
    correct = wrong = skipped = 0
    question_results: list[QuestionResult] = []
    wrong_by_topic: dict[str, dict[str, int]] = {}

    for q in questions:
        submitted = answers.get(str(q.id))
        topic = (q.topic or "General").strip() or "General"
        bucket = wrong_by_topic.setdefault(topic, {"wrong": 0, "total": 0})
        bucket["total"] += 1

        if submitted in (None, "", [], [None]):
            is_correct = False
            skipped += 1
        elif q.question_type == "multiple":
            is_correct = set(map(_normalize, submitted)) == set(map(_normalize, q.correct_answers or []))
        elif q.question_type == "short_answer":
            is_correct = any(_normalize(submitted) == _normalize(ca) for ca in (q.correct_answers or []))
        else:  # MCQ / true_false
            is_correct = _normalize(submitted) in set(map(_normalize, q.correct_answers or []))

        if is_correct:
            correct += 1
            score += q.points or 1
        elif submitted not in (None, "", []):
            wrong += 1
            bucket["wrong"] += 1

        question_results.append(QuestionResult(
            question_id=q.id,
            question_text=q.question_text,
            question_type=q.question_type,
            your_answer=submitted,
            correct_answers=list(q.correct_answers or []),
            is_correct=is_correct,
            explanation=q.explanation or "",
            topic=topic,
            points=q.points or 1,
        ))

    weak_topics = [
        WeakTopic(topic=t, wrong_count=v["wrong"], total_count=v["total"])
        for t, v in sorted(wrong_by_topic.items(), key=lambda kv: kv[1]["wrong"], reverse=True)
    ]

    return {
        "score": float(score),
        "total_points": total_points,
        "percent": round((score / total_points * 100) if total_points else 0.0, 1),
        "correct_count": correct,
        "wrong_count": wrong,
        "skipped_count": skipped,
        "question_results": question_results,
        "weak_topics": weak_topics,
    }


def _normalize(value: Any) -> str:
    return str(value).strip().lower()


class QuizGeneratorService:
    MAX_REPAIR_ROUNDS = 2

    def __init__(self, ai_service, repository: QuizRepository):
        self.ai_service = ai_service
        self.repository = repository

    async def generate_from_prompt(self, user_id: UUID, req: QuizGenerateRequest):
        if req.provider:
            set_ai_context(provider=req.provider, model_name=req.model_name)
        prompt = build_quiz_generation_prompt(
            req.prompt, req.template, req.question_count, req.difficulty, req.subject
        )
        draft = await self._generate(user_id, prompt)
        return await self._validate_repair_persist(
            user_id, draft, source_type=None, source_id=None,
            requested_count=req.question_count, difficulty=req.difficulty, generation_prompt=req.prompt,
        )

    async def generate_from_history(self, user_id: UUID, req: QuizGenerateFromHistoryRequest):
        source_text, _title = await self._load_source(user_id, req.source_type, req.source_id)
        prompt = build_quiz_from_source_prompt(source_text, req.template, req.question_count, req.difficulty)
        draft = await self._generate(user_id, prompt)
        return await self._validate_repair_persist(
            user_id, draft, source_type=req.source_type, source_id=req.source_id,
            requested_count=req.question_count, difficulty=req.difficulty, generation_prompt=None,
        )

    # ------------------------------------------------------------------ internals
    async def _generate(self, user_id: UUID, prompt: str) -> QuizDraft:
        result = await self.ai_service.provider.generate_response(
            prompt, system_instruction=QUIZ_GENERATION_SYSTEM_PROMPT
        )
        response_text = result.get("response_text", "")
        if self.ai_service.repository:
            tokens = result.get("token_usage", {})
            await self.ai_service.repository.save_interaction(
                user_id=user_id,
                prompt=prompt,
                response=response_text,
                model_used=result.get("model_name", "unknown"),
                input_tokens=tokens.get("input", 0),
                output_tokens=tokens.get("output", 0),
            )
        return self._parse(response_text)

    def _parse(self, response_text: str) -> QuizDraft:
        data = json.loads(_strip_fences(response_text))
        return QuizDraft(**data)

    def _apply_overrides(self, draft: QuizDraft, req) -> None:
        if getattr(req, "difficulty", None) is not None:
            draft.difficulty = req.difficulty

    async def _validate_repair_persist(
        self,
        user_id: UUID,
        draft: QuizDraft,
        source_type: Optional[str],
        source_id: Optional[UUID],
        requested_count: Optional[int] = None,
        difficulty: Optional[str] = None,
        generation_prompt: Optional[str] = None,
    ):
        self._deterministic_pre_fix(draft)
        if requested_count is not None:
            draft.number_of_questions = requested_count
        if difficulty is not None:
            draft.difficulty = difficulty
        errors = self.validate(draft)
        for _ in range(self.MAX_REPAIR_ROUNDS):
            if not errors:
                break
            draft = await self._repair_with_ai(draft, errors)
            self._deterministic_pre_fix(draft)
            if requested_count is not None:
                draft.number_of_questions = requested_count
            errors = self.validate(draft)
        if errors:
            raise HTTPException(status_code=422, detail={"errors": errors})
        return await self._persist(user_id, draft, source_type, source_id, generation_prompt)

    async def _repair_with_ai(self, draft: QuizDraft, errors: list[str]) -> QuizDraft:
        result = await self.ai_service.provider.generate_response(
            build_quiz_repair_prompt(json.dumps(draft.model_dump()), errors),
            system_instruction=QUIZ_GENERATION_SYSTEM_PROMPT,
        )
        return self._parse(result.get("response_text", ""))

    async def _persist(
        self,
        user_id: UUID,
        draft: QuizDraft,
        source_type: Optional[str],
        source_id: Optional[UUID],
        generation_prompt: Optional[str] = None,
    ):
        data = {
            "title": draft.title,
            "description": draft.description,
            "subject": draft.subject,
            "difficulty": draft.difficulty,
            "duration_minutes": draft.duration_minutes,
            "number_of_questions": len(draft.questions),
            "status": "draft",
            "source_type": source_type,
            "source_id": source_id,
            "generation_prompt": generation_prompt,
        }
        questions = [q.model_dump() for q in draft.questions]
        return await self.repository.create_quiz(user_id, data, questions)

    async def _load_source(self, user_id: UUID, source_type: str, source_id: UUID) -> tuple[str, str]:
        if source_type == "conversation":
            conv = await self.repository.get_conversation(source_id, user_id)
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found")
            messages = await self.repository.get_conversation_messages(source_id)
            lines = []
            for m in messages:
                role = "User" if m.role == "user" else "Tutor" if m.role == "assistant" else m.role
                lines.append(f"{role}: {m.content}")
            text = "\n".join(lines) or "No messages in this conversation."
            return text, conv.title or "AI Conversation"
        if source_type == "interaction":
            interaction = await self.repository.get_interaction(source_id, user_id)
            if not interaction:
                raise HTTPException(status_code=404, detail="Interaction not found")
            text = f"Prompt: {interaction.prompt}\nResponse: {interaction.response}"
            return text, interaction.prompt[:80]
        raise HTTPException(status_code=400, detail="Invalid source_type")

    # ----------------------------------------------------------------- validation
    @staticmethod
    def validate(draft: QuizDraft) -> list[str]:
        errors: list[str] = []
        if not draft.title or not draft.title.strip():
            errors.append("title is empty")

        questions = draft.questions
        if draft.number_of_questions != len(questions):
            errors.append(f"question count mismatch: expected {draft.number_of_questions}, got {len(questions)}")

        seen_texts: set[str] = set()
        difficulty_matches = 0
        for q in questions:
            text = (q.question_text or "").strip()
            if len(text) < 10:
                errors.append(f"question text too short: {text[:40]!r}")
            key = text.lower()
            if key in seen_texts:
                errors.append(f"duplicate question_text: {text[:60]}")
            seen_texts.add(key)

            if q.difficulty == draft.difficulty:
                difficulty_matches += 1

            if q.question_type in ("MCQ", "multiple"):
                opts = [o.strip() for o in (q.options or [])]
                if len(opts) < 2:
                    errors.append(f"question needs >= 2 options: {text[:40]!r}")
                lowered = [o.lower() for o in opts]
                if len(set(lowered)) != len(lowered):
                    errors.append(f"duplicate options: {text[:40]!r}")
                for ca in (q.correct_answers or []):
                    if ca.strip().lower() not in lowered:
                        errors.append(f"correct answer {ca!r} not in options for: {text[:40]!r}")
            elif q.question_type == "true_false":
                if not all(ca.strip().lower() in ("true", "false") for ca in (q.correct_answers or [])):
                    errors.append(f"true_false must have True/False answers: {text[:40]!r}")
            elif q.question_type == "short_answer":
                if not (q.correct_answers and any(ca.strip() for ca in q.correct_answers)):
                    errors.append(f"short_answer needs non-empty correct_answers: {text[:40]!r}")

        if questions and draft.difficulty and difficulty_matches / len(questions) < 0.5:
            errors.append(f"< 50% of questions match difficulty {draft.difficulty}")
        return errors

    @staticmethod
    def _deterministic_pre_fix(draft: QuizDraft) -> None:
        """Trim, dedupe, and drop empty/duplicate content before AI repair."""
        draft.title = draft.title.strip()
        draft.description = (draft.description or "").strip()
        draft.subject = (draft.subject or "").strip()

        cleaned: list[QuestionDraft] = []
        seen: set[str] = set()
        for q in draft.questions:
            text = (q.question_text or "").strip()
            if not text:
                continue
            key = text.lower()
            if key in seen:
                continue
            seen.add(key)

            q.question_text = text
            q.explanation = (q.explanation or "").strip()
            q.topic = (q.topic or "General").strip() or "General"

            opts: list[str] = []
            seen_opts: set[str] = set()
            for o in (q.options or []):
                o = (o or "").strip()
                if not o or o.lower() in seen_opts:
                    continue
                seen_opts.add(o.lower())
                opts.append(o)
            q.options = opts

            if q.question_type == "true_false":
                q.options = ["True", "False"]
                q.correct_answers = [ca for ca in (q.correct_answers or []) if ca.strip().lower() in ("true", "false")]
            elif q.question_type in ("MCQ", "multiple"):
                existing = {o.lower() for o in opts}
                q.correct_answers = [ca for ca in (q.correct_answers or []) if ca.strip().lower() in existing]

            cleaned.append(q)
        draft.questions = cleaned
        draft.number_of_questions = len(cleaned)
