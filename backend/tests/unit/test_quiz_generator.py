"""Unit tests for the quiz generator service — no DB, no network.

Covers the pure grading function, JSON parsing, and the validate → repair → persist
loop with a mocked provider.
"""

import json
import uuid

import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock

from app.database.models.quiz import Question
from app.schemas.quiz import QuizGenerateRequest
from app.services.quiz_generator_service import QuizGeneratorService, grade_attempt


def _q(question_text: str, qtype: str = "MCQ", options=None, correct=None,
       topic: str = "General", points: int = 1, explanation: str = "") -> Question:
    return Question(
        id=uuid.uuid4(),
        quiz_id=uuid.uuid4(),
        question_text=question_text,
        question_type=qtype,
        options=options or [],
        correct_answers=correct or [],
        explanation=explanation,
        difficulty="medium",
        topic=topic,
        points=points,
        order_index=0,
    )


# ------------------------------------------------------------------ grade_attempt
def test_grade_mcq_exact_match():
    q = _q("Q", "MCQ", ["A", "B", "C"], ["B"])
    res = grade_attempt([q], {str(q.id): "B"})
    assert res["score"] == 1.0
    assert res["correct_count"] == 1
    assert res["wrong_count"] == 0
    assert res["skipped_count"] == 0
    assert res["question_results"][0].is_correct is True


def test_grade_mcq_wrong_and_case_insensitive():
    q = _q("Q", "MCQ", ["A", "B", "C"], ["b"])
    wrong = grade_attempt([q], {str(q.id): "C"})
    assert wrong["wrong_count"] == 1
    # correct_answers comparison is case-insensitive
    right = grade_attempt([q], {str(q.id): "B"})
    assert right["correct_count"] == 1


def test_grade_multiple_unordered_set_equality():
    q = _q("Multi", "multiple", ["A", "B", "C", "D"], ["A", "C"])
    res = grade_attempt([q], {str(q.id): ["C", "A"]})
    assert res["correct_count"] == 1
    res2 = grade_attempt([q], {str(q.id): ["A", "D"]})
    assert res2["wrong_count"] == 1


def test_grade_true_false():
    q = _q("T", "true_false", ["True", "False"], ["True"])
    res = grade_attempt([q], {str(q.id): "true"})  # lowercase input still matches
    assert res["correct_count"] == 1


def test_grade_short_answer_case_insensitive_trimmed():
    q = _q("SA", "short_answer", correct=["spring boot"])
    res = grade_attempt([q], {str(q.id): "  Spring Boot "})
    assert res["correct_count"] == 1


def test_grade_skipped_counts_as_skipped():
    q = _q("Q", "MCQ", ["A", "B"], ["A"])
    res = grade_attempt([q], {str(q.id): ""})
    assert res["skipped_count"] == 1
    assert res["wrong_count"] == 0


def test_grade_weak_topics_grouping():
    q1 = _q("wrong-1", "MCQ", ["A", "B"], ["A"], topic="Fractions")
    q2 = _q("wrong-2", "MCQ", ["A", "B"], ["A"], topic="Fractions")
    q3 = _q("right", "MCQ", ["A", "B"], ["A"], topic="Algebra")
    res = grade_attempt([q1, q2, q3], {str(q1.id): "B", str(q2.id): "B", str(q3.id): "A"})
    weak = {w.topic: w for w in res["weak_topics"]}
    assert weak["Fractions"].wrong_count == 2
    assert weak["Fractions"].total_count == 2
    assert weak["Algebra"].wrong_count == 0
    assert weak["Algebra"].total_count == 1


def test_grade_points_weighting():
    q1 = _q("easy-pt", "MCQ", ["A", "B"], ["A"], points=1)
    q2 = _q("hard-pt", "MCQ", ["A", "B"], ["A"], points=3)
    res = grade_attempt([q1, q2], {str(q1.id): "A", str(q2.id): "B"})
    assert res["score"] == 1.0
    assert res["total_points"] == 4
    assert res["percent"] == 25.0


# ------------------------------------------------------------------ parsing
def test_parse_strips_json_fences():
    service = QuizGeneratorService(ai_service=None, repository=None)
    text = '```json\n{"title": "T", "difficulty": "easy", "number_of_questions": 0, "questions": []}\n```'
    draft = service._parse(text)
    assert draft.title == "T"


# ------------------------------------------------------------------ generation flow
VALID_DRAFT = {
    "title": "Spring Boot Basics",
    "description": "Test",
    "subject": "Java",
    "difficulty": "medium",
    "duration_minutes": 10,
    "number_of_questions": 2,
    "questions": [
        {
            "question_text": "What does dependency injection do?",
            "question_type": "MCQ",
            "options": ["Wires beans", "Compiles code", "Deploys", "Tests"],
            "correct_answers": ["Wires beans"],
            "explanation": "It wires dependencies.",
            "difficulty": "medium",
            "topic": "DI",
            "points": 1,
        },
        {
            "question_text": "Is @RestController a valid Spring annotation?",
            "question_type": "true_false",
            "options": ["True", "False"],
            "correct_answers": ["True"],
            "explanation": "Yes.",
            "difficulty": "medium",
            "topic": "Controllers",
            "points": 1,
        },
    ],
}


def _make_service(responses, saved=None):
    """AI stub whose provider returns the given responses in order."""
    class Provider:
        def __init__(self):
            self.queue = list(responses)
        async def generate_response(self, prompt, system_instruction=None):
            return self.queue.pop(0)

    repo = AsyncMock()
    saved_quiz = saved or object()
    repo.create_quiz.return_value = saved_quiz

    ai = AsyncMock()
    ai.provider = Provider()
    ai.repository = repo

    service = QuizGeneratorService(ai_service=ai, repository=repo)
    return service, repo


@pytest.mark.asyncio
async def test_generate_from_prompt_persists_and_logs():
    service, repo = _make_service([
        {"response_text": json.dumps(VALID_DRAFT), "model_name": "gemini-test", "token_usage": {"input": 10, "output": 20}},
    ])
    req = QuizGenerateRequest(prompt="make a spring quiz", template="intermediate", question_count=2, difficulty="medium")
    quiz = await service.generate_from_prompt(uuid.uuid4(), req)

    assert quiz is not None
    repo.create_quiz.assert_awaited_once()
    # Interaction logged for the "from history" picker.
    repo.save_interaction.assert_awaited_once()
    saved_kwargs = repo.save_interaction.await_args.kwargs
    assert saved_kwargs["input_tokens"] == 10
    assert saved_kwargs["output_tokens"] == 20


@pytest.mark.asyncio
async def test_repair_invoked_when_first_draft_invalid():
    broken = dict(VALID_DRAFT)
    # Corrupt every option list so validation fails on the first pass.
    broken["questions"] = [
        {**q, "options": [q["options"][0]]} for q in VALID_DRAFT["questions"]
    ]
    service, repo = _make_service([
        {"response_text": json.dumps(broken), "model_name": "m", "token_usage": {}},
        {"response_text": json.dumps(VALID_DRAFT), "model_name": "m", "token_usage": {}},
    ])
    req = QuizGenerateRequest(prompt="spring", template="intermediate", question_count=2)
    quiz = await service.generate_from_prompt(uuid.uuid4(), req)
    assert quiz is not None
    repo.create_quiz.assert_awaited_once()


@pytest.mark.asyncio
async def test_repair_exhausted_raises_422():
    broken = dict(VALID_DRAFT)
    broken["questions"] = [
        {**q, "options": [q["options"][0]]} for q in VALID_DRAFT["questions"]
    ]
    # Initial generation + both repair rounds return the same broken draft → never validates.
    service, _repo = _make_service([
        {"response_text": json.dumps(broken), "model_name": "m", "token_usage": {}},
        {"response_text": json.dumps(broken), "model_name": "m", "token_usage": {}},
        {"response_text": json.dumps(broken), "model_name": "m", "token_usage": {}},
    ])
    req = QuizGenerateRequest(prompt="spring", template="intermediate", question_count=2)
    with pytest.raises(HTTPException) as exc:
        await service.generate_from_prompt(uuid.uuid4(), req)
    assert exc.value.status_code == 422
    assert exc.value.detail["errors"]


@pytest.mark.asyncio
async def test_question_count_mismatch_triggers_repair():
    wrong_count = dict(VALID_DRAFT)
    wrong_count["number_of_questions"] = 5  # says 5, has 2
    service, repo = _make_service([
        {"response_text": json.dumps(wrong_count), "model_name": "m", "token_usage": {}},
        {"response_text": json.dumps(VALID_DRAFT), "model_name": "m", "token_usage": {}},
    ])
    req = QuizGenerateRequest(prompt="spring", template="intermediate", question_count=2)
    quiz = await service.generate_from_prompt(uuid.uuid4(), req)
    assert quiz is not None
