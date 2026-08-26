"""Repository for the adaptive ML engine.

All methods are async and follow the ``QuizRepository`` style (single
``AsyncSession`` per instance, ``select`` + ``selectinload`` for eager loads).
"""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.models.ml import TopicMastery, MasteryObservation, ItemDifficulty, ReviewSchedule
from app.database.models.quiz import QuizAttempt, Question, Quiz
from app.database.models.memory import UserMemory


class MLRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def commit(self) -> None:
        """Commit current transaction changes to persistent storage."""
        await self.session.commit()

    # ------------------------------------------------------------------ Topic mastery
    async def get_topic_mastery_map(self, user_id: UUID, topics: list[str]) -> dict[str, TopicMastery]:
        """Batch lookup of topic mastery rows, keyed by exact topic string."""
        if not topics:
            return {}
        stmt = select(TopicMastery).where(
            TopicMastery.user_id == user_id,
            TopicMastery.topic.in_(topics),
        )
        result = await self.session.execute(stmt)
        return {row.topic: row for row in result.scalars().all()}

    async def get_topic_mastery(self, user_id: UUID, topic: str) -> Optional[TopicMastery]:
        stmt = select(TopicMastery).where(
            TopicMastery.user_id == user_id,
            TopicMastery.topic == topic,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_topic_mastery(self, user_id: UUID, topic: str, **updates: Any) -> TopicMastery:
        row = await self.get_topic_mastery(user_id, topic)
        if row is None:
            row = TopicMastery(user_id=user_id, topic=topic, **updates)
            self.session.add(row)
        else:
            for k, v in updates.items():
                setattr(row, k, v)
        await self.session.flush()
        return row

    async def list_topic_mastery(self, user_id: UUID) -> list[TopicMastery]:
        stmt = select(TopicMastery).where(TopicMastery.user_id == user_id).order_by(desc(TopicMastery.mastery))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ------------------------------------------------------------------ Observations
    async def add_observation(
        self,
        user_id: UUID,
        question_id: UUID,
        topic: str,
        is_correct: bool,
        difficulty_label: Optional[str] = None,
        question_type: Optional[str] = None,
        attempt_seq: int = 0,
        recency_days: Optional[float] = None,
    ) -> MasteryObservation:
        row = MasteryObservation(
            user_id=user_id,
            question_id=question_id,
            topic=topic,
            difficulty_label=difficulty_label,
            question_type=question_type,
            is_correct=is_correct,
            attempt_seq=attempt_seq,
            recency_days=recency_days,
        )
        self.session.add(row)
        await self.session.flush()
        return row

    async def list_observations(self, user_id: Optional[UUID] = None, limit: int = 100_000) -> list[MasteryObservation]:
        stmt = select(MasteryObservation).order_by(MasteryObservation.created_at.asc()).limit(limit)
        if user_id:
            stmt = select(MasteryObservation).where(MasteryObservation.user_id == user_id) \
                .order_by(MasteryObservation.created_at.asc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_observations(self) -> int:
        stmt = select(func.count(MasteryObservation.id))
        result = await self.session.execute(stmt)
        return int(result.scalar() or 0)

    # ------------------------------------------------------------------ Item difficulty
    async def get_item_difficulty_map(self, question_ids: list[UUID]) -> dict[UUID, ItemDifficulty]:
        """Batch lookup of calibrated difficulty rows, keyed by question UUID."""
        if not question_ids:
            return {}
        stmt = select(ItemDifficulty).where(ItemDifficulty.question_id.in_(question_ids))
        result = await self.session.execute(stmt)
        return {row.question_id: row for row in result.scalars().all()}

    async def get_item_difficulty(self, question_id: UUID) -> Optional[ItemDifficulty]:
        stmt = select(ItemDifficulty).where(ItemDifficulty.question_id == question_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_item_difficulty(self, question_id: UUID, topic: str, **updates: Any) -> ItemDifficulty:
        row = await self.get_item_difficulty(question_id)
        if row is None:
            row = ItemDifficulty(question_id=question_id, topic=topic, **updates)
            self.session.add(row)
        else:
            for k, v in updates.items():
                setattr(row, k, v)
        await self.session.flush()
        return row

    async def list_item_difficulty(self, topic: Optional[str] = None) -> list[ItemDifficulty]:
        stmt = select(ItemDifficulty)
        if topic:
            stmt = stmt.where(ItemDifficulty.topic == topic)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ------------------------------------------------------------------ Review schedule
    async def get_review_schedule(self, user_id: UUID, topic: str) -> Optional[ReviewSchedule]:
        stmt = select(ReviewSchedule).where(
            ReviewSchedule.user_id == user_id,
            ReviewSchedule.topic == topic,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def upsert_review_schedule(self, user_id: UUID, topic: str, **updates: Any) -> ReviewSchedule:
        row = await self.get_review_schedule(user_id, topic)
        if row is None:
            row = ReviewSchedule(user_id=user_id, topic=topic, **updates)
            self.session.add(row)
        else:
            for k, v in updates.items():
                setattr(row, k, v)
        await self.session.flush()
        return row

    async def list_review_schedules(self, user_id: UUID) -> list[ReviewSchedule]:
        stmt = select(ReviewSchedule).where(ReviewSchedule.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_due_reviews(self, user_id: UUID, now: datetime) -> list[ReviewSchedule]:
        stmt = (
            select(ReviewSchedule)
            .where(ReviewSchedule.user_id == user_id, ReviewSchedule.due_date <= now)
            .order_by(ReviewSchedule.due_date.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ------------------------------------------------------------------ Quiz attempts (training / backfill)
    async def list_user_attempts_with_questions(self, user_id: UUID, limit: int = 5000) -> list[QuizAttempt]:
        """Completed quiz attempts with their quiz + questions eager-loaded.

        Lets the training job reconstruct per-question outcomes from
        ``attempt.answers`` (JSONB) joined to ``attempt.quiz.questions`` — the
        same join ``grade_attempt`` performs.
        """
        stmt = (
            select(QuizAttempt)
            .options(selectinload(QuizAttempt.quiz).selectinload(Quiz.questions))
            .where(QuizAttempt.user_id == user_id, QuizAttempt.status == "completed")
            .order_by(desc(QuizAttempt.submitted_at))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ------------------------------------------------------------------ Memories (recommender content-similarity)
    async def get_user_memories(self, user_id: UUID, limit: int = 50) -> list[UserMemory]:
        stmt = (
            select(UserMemory)
            .where(UserMemory.user_id == user_id)
            .order_by(UserMemory.importance_score.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    # ------------------------------------------------------------------ Topics (recommender candidate pool)
    async def list_question_topics(self, limit: int = 5000) -> list[str]:
        stmt = select(Question.topic).distinct().limit(limit)
        result = await self.session.execute(stmt)
        return [t for (t,) in result.all() if t]

    async def count_topic_mastery(self, user_id: UUID) -> int:
        stmt = select(func.count(TopicMastery.id)).where(TopicMastery.user_id == user_id)
        result = await self.session.execute(stmt)
        return int(result.scalar() or 0)
