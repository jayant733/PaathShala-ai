"""ML models for the adaptive learning engine.

These tables power the platform's trainable ML layer:
- ``topic_mastery``        — live per-user per-topic mastery state (Elo-derived).
- ``mastery_observations`` — append-only per-question outcome rows (the training set).
- ``item_difficulty``      — IRT-calibrated difficulty per question (``b`` parameter).
- ``review_schedule``      — SM-2 / spaced-repetition state per (user, topic).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID

from app.database.models import Base


class TopicMastery(Base):
    __tablename__ = "topic_mastery"
    __table_args__ = (UniqueConstraint("user_id", "topic", name="uq_topic_mastery_user_topic"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String, nullable=False, index=True)
    elo_rating = Column(Float, default=1500.0, nullable=False)
    mastery = Column(Float, default=0.5, nullable=False)  # 0..1
    attempts = Column(Integer, default=0, nullable=False)
    correct_count = Column(Integer, default=0, nullable=False)
    wrong_count = Column(Integer, default=0, nullable=False)
    p_correct = Column(Float, nullable=True)  # model-estimated P(correct)
    confidence = Column(Float, default=0.0, nullable=False)  # 0..1 (smoothed)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class MasteryObservation(Base):
    __tablename__ = "mastery_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False, index=True)
    topic = Column(String, nullable=False)
    difficulty_label = Column(String, nullable=True)  # easy | medium | hard
    question_type = Column(String, nullable=True)     # MCQ | multiple | true_false | short_answer
    is_correct = Column(Boolean, nullable=False)
    attempt_seq = Column(Integer, default=0, nullable=False)  # nth question this user saw on this topic
    recency_days = Column(Float, nullable=True)               # days since previous observation on topic
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class ItemDifficulty(Base):
    __tablename__ = "item_difficulty"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False, unique=True, index=True)
    topic = Column(String, nullable=True)
    b_param = Column(Float, default=0.0, nullable=False)  # IRT difficulty
    p_correct = Column(Float, default=0.5, nullable=False)  # observed smoothed P(correct)
    n_attempts = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class ReviewSchedule(Base):
    __tablename__ = "review_schedule"
    __table_args__ = (UniqueConstraint("user_id", "topic", name="uq_review_schedule_user_topic"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    topic = Column(String, nullable=False, index=True)
    ease_factor = Column(Float, default=2.5, nullable=False)
    repetitions = Column(Integer, default=0, nullable=False)
    interval_days = Column(Integer, default=0, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    last_reviewed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
