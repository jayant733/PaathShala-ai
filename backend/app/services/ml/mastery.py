"""Knowledge-mastery engine: Elo tracing + IRT/logistic difficulty calibration.

This is the platform's trainable "adaptive learning" core. Every quiz submit
feeds per-question outcomes (``mastery_observations``); the engine:

1. Updates per-topic Elo ratings live (correct raises mastery, wrong lowers it,
   missing an easy question hurts more than missing a hard one).
2. Periodically fits a classifier (``fit_models``) over all observations to
   calibrate per-question difficulty (IRT ``b`` parameter) and predict
   P(correct) for arbitrary (topic, difficulty, question_type) tuples.

The outputs (``topic_mastery``, ``item_difficulty``) drive adaptive quiz
generation, the dashboard learning path, and spaced-repetition scheduling.
"""

import math
import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

import numpy as np
import pandas as pd

from app.core.config import settings
from app.repositories.ml_repository import MLRepository
from app.services.ml.backends import FEATURE_COLS, BACKENDS, get_backend
from app.services.ml.spaced_repetition import ReviewScheduler

logger = logging.getLogger(__name__)

DIFFICULTY_ORD = {"easy": 0, "medium": 1, "hard": 2}
DIFFICULTY_RATING = {"easy": 1100.0, "medium": 1400.0, "hard": 1700.0}
_IRT_RATING_OFFSET = 1400.0  # opponent rating for an item with b_param == 0
_IRT_RATING_SLOPE = 200.0    # +b -> harder item -> stronger "opponent"
MASTERY_SERVICE_MODEL = "mastery_service.joblib"


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-max(-50.0, min(50.0, x))))


def _logit(p: float) -> float:
    p = max(1e-6, min(1 - 1e-6, p))
    return math.log(p / (1 - p))


def _normalize_topic(topic: Optional[str]) -> str:
    return (topic or "General").strip() or "General"


def _elo_expected(rating: float, opponent: float) -> float:
    """Expected score of a student at ``rating`` vs an item at ``opponent``."""
    return 1.0 / (1.0 + 10.0 ** ((opponent - rating) / 400.0))


def _mastery_from_rating(rating: float, center: float = 1500.0, scale: float = 300.0) -> float:
    return _sigmoid((rating - center) / scale)


def _b_to_opponent(b: Optional[float]) -> Optional[float]:
    if b is None:
        return None
    return _IRT_RATING_OFFSET + b * _IRT_RATING_SLOPE


def observations_to_frame(observations) -> pd.DataFrame:
    """Turn MasteryObservation rows into the training DataFrame used by backends."""
    rows = []
    for o in observations:
        diff = (o.difficulty_label or "medium").lower()
        rows.append(
            {
                "question_id": str(o.question_id),
                "topic": _normalize_topic(o.topic),
                "difficulty_ordinal": DIFFICULTY_ORD.get(diff, 1),
                "attempt_seq": int(o.attempt_seq or 0),
                "recency_days": float(o.recency_days or 0.0),
                "question_type": (o.question_type or "MCQ"),
                "is_correct": int(bool(o.is_correct)),
            }
        )
    return pd.DataFrame(rows)


class _TopicState:
    __slots__ = ("rating", "attempts", "correct", "wrong", "last_obs_at")

    def __init__(self, rating: float):
        self.rating = rating
        self.attempts = 0
        self.correct = 0
        self.wrong = 0
        self.last_obs_at: Optional[datetime] = None


class KnowledgeMasteryEngine:
    def __init__(
        self,
        repo: MLRepository,
        scheduler: Optional[ReviewScheduler] = None,
        backend_name: Optional[str] = None,
        model_dir: Optional[str] = None,
        elo_start: Optional[float] = None,
        elo_k: Optional[float] = None,
    ):
        self.repo = repo
        self.scheduler = scheduler or ReviewScheduler(repo)
        self.backend_name = backend_name or settings.ML_BACKEND
        self.model_dir = model_dir or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            settings.ML_MODEL_DIR,
        )
        self.elo_start = elo_start if elo_start is not None else settings.ML_ELO_START
        self.elo_k = elo_k if elo_k is not None else settings.ML_ELO_K
        self._service_model = None

    # ------------------------------------------------------------------ live update
    async def update_from_submit(
        self,
        user_id: UUID,
        questions: list[Any],
        question_results: list[Any],
    ) -> dict[str, dict[str, float]]:
        """Process one graded attempt: update per-topic Elo mastery + observations.

        ``question_results`` comes from ``grade_attempt`` and is guaranteed to
        contain one entry per question (skipped included).
        """
        if not settings.ML_ENABLED:
            return {}  # no-op guard: adaptive ML must be explicitly enabled
        q_by_id = {str(q.id): q for q in questions}
        question_ids = [r.question_id for r in question_results]
        item_map = await self.repo.get_item_difficulty_map(question_ids)
        topics = {_normalize_topic(r.topic) for r in question_results}
        mastery_map = await self.repo.get_topic_mastery_map(user_id, list(topics))

        states: dict[str, _TopicState] = {}
        now = datetime.now(timezone.utc)

        for r in question_results:
            q = q_by_id.get(str(r.question_id))
            topic = _normalize_topic(r.topic or (q.topic if q else None))
            diff_label = ((q.difficulty if q else None) or "medium").lower()
            qtype = (r.question_type or (q.question_type if q else None)) or "MCQ"
            is_correct = bool(r.is_correct)

            state = states.get(topic)
            if state is None:
                existing = mastery_map.get(topic)
                state = _TopicState(existing.elo_rating if existing else self.elo_start)
                states[topic] = state

            state.attempts += 1
            if is_correct:
                state.correct += 1
            else:
                state.wrong += 1

            # recency (days since the previous observation on this topic)
            recency_days = None
            if state.last_obs_at is not None:
                recency_days = max(0.0, (now - state.last_obs_at).total_seconds() / 86400.0)
            state.last_obs_at = now

            # Elo update against the item's calibrated (or labelled) difficulty
            item = item_map.get(r.question_id)
            opponent = _b_to_opponent(item.b_param if item else None) or DIFFICULTY_RATING.get(diff_label, 1400.0)
            expected = _elo_expected(state.rating, opponent)
            outcome = 1.0 if is_correct else 0.0
            state.rating += self.elo_k * (outcome - expected)

            await self.repo.add_observation(
                user_id=user_id,
                question_id=r.question_id,
                topic=topic,
                difficulty_label=diff_label,
                question_type=qtype,
                is_correct=is_correct,
                attempt_seq=state.attempts,
                recency_days=recency_days,
            )

        # persist per-topic state + schedule spaced repetition
        summary: dict[str, dict[str, float]] = {}
        for topic, state in states.items():
            mastery = _mastery_from_rating(state.rating)
            confidence = 1.0 - 2.0 / (state.attempts + 4)
            p_correct = state.correct / state.attempts
            await self.repo.upsert_topic_mastery(
                user_id=user_id,
                topic=topic,
                elo_rating=state.rating,
                mastery=mastery,
                attempts=state.attempts,
                correct_count=state.correct,
                wrong_count=state.wrong,
                p_correct=p_correct,
                confidence=confidence,
            )
            await self.scheduler.record_study(
                user_id, topic, outcome="correct" if state.correct >= state.wrong else "wrong"
            )
            summary[topic] = {"mastery": mastery, "confidence": confidence, "p_correct": p_correct}

        await self.repo.commit()
        return summary

    async def update_from_study(self, user_id: UUID, topic: str) -> dict[str, float]:
        """Process a study event: bump confidence and reset spaced repetition without affecting Elo."""
        if not settings.ML_ENABLED:
            return {}

        topic = _normalize_topic(topic)
        mastery_map = await self.repo.get_topic_mastery_map(user_id, [topic])
        existing = mastery_map.get(topic)
        
        # Start at base Elo if unseen, otherwise keep current
        rating = existing.elo_rating if existing else self.elo_start
        attempts = (existing.attempts if existing else 0) + 1
        correct = existing.correct_count if existing else 0
        wrong = existing.wrong_count if existing else 0
        
        mastery = _mastery_from_rating(rating)
        # Increasing attempts automatically boosts confidence in this formula
        confidence = 1.0 - 2.0 / (attempts + 4)
        p_correct = correct / attempts if attempts > 0 else 0.5
        
        await self.repo.upsert_topic_mastery(
            user_id=user_id,
            topic=topic,
            elo_rating=rating,
            mastery=mastery,
            attempts=attempts,
            correct_count=correct,
            wrong_count=wrong,
            p_correct=p_correct,
            confidence=confidence,
        )
        
        await self.scheduler.record_study(user_id, topic, outcome="study")
        await self.repo.commit()
        
        return {"mastery": mastery, "confidence": confidence, "p_correct": p_correct}

    async def sync_user_history(self, user_id: UUID) -> int:
        """Backfill topic mastery & observations from all past completed quiz attempts."""
        attempts = await self.repo.list_user_attempts_with_questions(user_id)
        if not attempts:
            return 0

        attempts.sort(key=lambda a: a.submitted_at or a.created_at or datetime.min.replace(tzinfo=timezone.utc))

        from app.services.quiz_generator_service import grade_attempt

        processed_count = 0
        for attempt in attempts:
            if not attempt.quiz or not attempt.quiz.questions:
                continue
            grading = grade_attempt(list(attempt.quiz.questions), attempt.answers or {})
            question_results = grading.get("question_results", [])
            if not question_results:
                continue

            q_by_id = {str(q.id): q for q in attempt.quiz.questions}
            topics = {_normalize_topic(r.topic) for r in question_results}
            mastery_map = await self.repo.get_topic_mastery_map(user_id, list(topics))

            states: dict[str, _TopicState] = {}
            now = attempt.submitted_at or datetime.now(timezone.utc)

            for r in question_results:
                q = q_by_id.get(str(r.question_id))
                topic = _normalize_topic(r.topic or (q.topic if q else None))
                diff_label = ((q.difficulty if q else None) or "medium").lower()
                qtype = (r.question_type or (q.question_type if q else None)) or "MCQ"
                is_correct = bool(r.is_correct)

                state = states.get(topic)
                if state is None:
                    existing = mastery_map.get(topic)
                    state = _TopicState(existing.elo_rating if existing else self.elo_start)
                    states[topic] = state

                state.attempts += 1
                if is_correct:
                    state.correct += 1
                else:
                    state.wrong += 1

                recency_days = None
                if state.last_obs_at is not None:
                    recency_days = max(0.0, (now - state.last_obs_at).total_seconds() / 86400.0)
                state.last_obs_at = now

                opponent = DIFFICULTY_RATING.get(diff_label, 1400.0)
                expected = _elo_expected(state.rating, opponent)
                outcome = 1.0 if is_correct else 0.0
                state.rating += self.elo_k * (outcome - expected)

                await self.repo.add_observation(
                    user_id=user_id,
                    question_id=r.question_id,
                    topic=topic,
                    difficulty_label=diff_label,
                    question_type=qtype,
                    is_correct=is_correct,
                    attempt_seq=state.attempts,
                    recency_days=recency_days,
                )

            for topic, state in states.items():
                mastery = _mastery_from_rating(state.rating)
                confidence = 1.0 - 2.0 / (state.attempts + 4)
                p_correct = state.correct / state.attempts
                await self.repo.upsert_topic_mastery(
                    user_id=user_id,
                    topic=topic,
                    elo_rating=state.rating,
                    mastery=mastery,
                    attempts=state.attempts,
                    correct_count=state.correct,
                    wrong_count=state.wrong,
                    p_correct=p_correct,
                    confidence=confidence,
                )
                await self.scheduler.record_study(
                    user_id, topic, outcome="correct" if state.correct >= state.wrong else "wrong"
                )
            processed_count += 1

        await self.repo.commit()
        return processed_count

    async def update_from_chat_interaction(
        self,
        user_id: UUID,
        topic: str
    ) -> None:
        """Simulate a correct answer to artificially boost mastery from a chat interaction.
        This provides a steady progression towards 100% mastery for learning via chat.
        """
        if not settings.ML_ENABLED:
            return

        topic_norm = _normalize_topic(topic)

        # Query a real question from the questions table for this topic to satisfy FK
        from app.database.models.quiz import Question
        from sqlalchemy import select
        
        stmt = select(Question.id).where(Question.topic == topic_norm).limit(1)
        res = await self.repo.session.execute(stmt)
        real_q_id = res.scalar_one_or_none()
        
        if not real_q_id:
            stmt = select(Question.id).limit(1)
            res = await self.repo.session.execute(stmt)
            real_q_id = res.scalar_one_or_none()
            
        if not real_q_id:
            # If still None, generate a synthetic one if FK check is disabled, but since it is enabled we will warn
            logger.warning("No question found in database to link for chat observation. Faking one.")
            real_q_id = UUID("00000000-0000-0000-0000-000000000000")

        # Simulate a single correct observation of medium difficulty
        now = datetime.now(timezone.utc)
        obs_data = {
            "user_id": user_id,
            "question_id": real_q_id,
            "topic": topic_norm,
            "difficulty_label": "medium",
            "is_correct": True,
            "time_taken_seconds": 30,
            "question_type": "chat",
            "attempt_seq": 1,
            "recency_days": 0.0,
            "observed_at": now
        }
        
        # Get current state
        mastery_map = await self.repo.get_topic_mastery_map(user_id, [topic_norm])
        state = _TopicState(self.elo_start)
        m_row = mastery_map.get(topic_norm)
        if m_row:
            state.rating = m_row.elo_rating
            state.attempts = m_row.attempts
            state.correct = m_row.correct_count
            state.wrong = m_row.wrong_count

        # Apply Elo update
        opponent_b = 0.0  # medium difficulty b_param
        opponent_rating = _b_to_opponent(opponent_b) or DIFFICULTY_RATING["medium"]
        
        expected = _elo_expected(state.rating, opponent_rating)
        actual = 1.0 # Correct
        
        # We can increase the K factor here to make chat interactions more impactful if needed,
        # but 5 interactions with standard K=32 means 5 * 32 * (1 - expected) = roughly +50 to +100 rating.
        # Let's use a significantly boosted K for chat to ensure visible progress per response (K=150).
        chat_k = 150.0
        new_rating = state.rating + chat_k * (actual - expected)
        
        state.rating = new_rating
        state.attempts += 1
        state.correct += 1
        state.last_obs_at = now

        new_mastery = _mastery_from_rating(state.rating)
        
        # Explicit rule: after 5 responses, mastery becomes 100%
        if state.attempts >= 5:
            new_mastery = 1.0
            state.rating = max(state.rating, 3000.0) # Ensure underlying rating matches 100%
        
        # Calculate confidence
        base_conf = min(1.0, state.attempts / 10.0)
        recency_penalty = 0.0
        confidence = max(0.0, base_conf - recency_penalty)
        
        upsert_data = {
            "topic": topic_norm,
            "elo_rating": state.rating,
            "mastery": new_mastery,
            "attempts": state.attempts,
            "correct_count": state.correct,
            "wrong_count": state.wrong,
            "p_correct": expected,
            "confidence": confidence,
            "updated_at": now
        }
        
        # Save to DB
        await self.repo.add_observation(
            user_id=user_id,
            question_id=obs_data["question_id"],
            topic=obs_data["topic"],
            is_correct=obs_data["is_correct"],
            difficulty_label=obs_data["difficulty_label"],
            question_type=obs_data["question_type"],
            attempt_seq=obs_data["attempt_seq"],
            recency_days=obs_data["recency_days"]
        )
        
        topic_for_upsert = upsert_data.pop("topic")
        await self.repo.upsert_topic_mastery(user_id=user_id, topic=topic_for_upsert, **upsert_data)
        await self.scheduler.record_study(user_id=user_id, topic=topic_norm, outcome="study")
        await self.repo.commit()


    # ------------------------------------------------------------------ training
    async def fit_models(self) -> dict[str, Any]:
        """Fit the selected backend over observations and calibrate item difficulty.

        Always also persists a tiny sklearn pipeline as the loadable service
        model, so live inference works regardless of which backend is chosen.
        """
        observations = await self.repo.list_observations()
        n = len(observations)
        if n < 3:
            return {"backend": self.backend_name, "status": "no_data", "observations_count": n,
                    "item_difficulty_updated": 0, "trained_at": None, "error": None}

        df = observations_to_frame(observations)
        y = df["is_correct"].to_numpy()
        X = df[FEATURE_COLS]

        backend = get_backend(self.backend_name)
        try:
            model = backend.fit(X, y)
            probs = backend.predict_proba(model, X)
        except Exception as exc:  # framework missing / fit error -> sklearn fallback
            logger.warning("ML backend '%s' failed (%s); falling back to sklearn", self.backend_name, exc)
            backend = BACKENDS["sklearn"]
            model = backend.fit(X, y)
            probs = backend.predict_proba(model, X)

        # calibrated per-question difficulty (IRT b = -logit(p))
        frame = df.copy()
        frame["p_correct"] = probs
        updated = 0
        for qid, grp in frame.groupby("question_id"):
            p = float(np.clip(grp["p_correct"].mean(), 0.02, 0.98))
            b_param = -_logit(p)
            topic = _normalize_topic(grp["topic"].iloc[0])
            await self.repo.upsert_item_difficulty(
                question_id=UUID(qid),
                topic=topic,
                b_param=b_param,
                p_correct=p,
                n_attempts=int(len(grp)),
            )
            updated += 1

        # persist the loadable service model (sklearn pipeline)
        self._save_service_model(BACKENDS["sklearn"], X, y)

        return {
            "backend": backend.name,
            "status": "ok",
            "observations_count": n,
            "item_difficulty_updated": updated,
            "trained_at": datetime.now(timezone.utc),
            "error": None,
        }

    def _save_service_model(self, backend, X, y) -> None:
        try:
            import joblib

            os.makedirs(self.model_dir, exist_ok=True)
            model = backend.fit(X, y)
            joblib.dump(model, os.path.join(self.model_dir, MASTERY_SERVICE_MODEL))
            self._service_model = model
        except Exception as exc:
            logger.warning("Could not persist service model: %s", exc)

    def _load_service_model(self):
        if self._service_model is not None:
            return self._service_model
        try:
            import joblib

            path = os.path.join(self.model_dir, MASTERY_SERVICE_MODEL)
            if os.path.exists(path):
                self._service_model = joblib.load(path)
        except Exception as exc:
            logger.warning("Could not load service model: %s", exc)
        return self._service_model

    # ------------------------------------------------------------------ inference
    async def predict_topic(
        self,
        user_id: UUID,
        topic: str,
        difficulty: str = "medium",
        question_type: str = "MCQ",
    ) -> float:
        """Blended P(correct) for a (topic, difficulty, question_type) tuple."""
        topic = _normalize_topic(topic)
        mastery_row = await self.repo.get_topic_mastery(user_id, topic)
        elo = mastery_row.mastery if mastery_row else 0.5
        model = self._load_service_model()
        if model is not None:
            try:
                row = pd.DataFrame(
                    [
                        {
                            "topic": topic,
                            "question_type": question_type,
                            "difficulty_ordinal": DIFFICULTY_ORD.get(difficulty.lower(), 1),
                            "attempt_seq": mastery_row.attempts if mastery_row else 0,
                            "recency_days": 0.0,
                        }
                    ]
                )
                prob = float(model.predict_proba(row[FEATURE_COLS])[0])
                return float(np.clip(0.5 * prob + 0.5 * elo, 0.0, 1.0))
            except Exception as exc:
                logger.warning("Service-model inference failed (%s); using Elo mastery", exc)
        return float(elo)

    async def predict_question(self, user_id: UUID, question: Any) -> float:
        """P(correct) for a specific Question, using calibrated difficulty when available."""
        item = await self.repo.get_item_difficulty(question.id)
        if item is not None and item.n_attempts >= 3 and item.p_correct is not None:
            return float(np.clip(item.p_correct, 0.0, 1.0))
        return await self.predict_topic(
            user_id, _normalize_topic(question.topic),
            difficulty=(question.difficulty or "medium"),
            question_type=(question.question_type or "MCQ"),
        )
