"""Schemas for the adaptive ML engine (mastery, learning path, spaced repetition)."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

MasteryStatus = Literal["weak", "improving", "strong"]
ReviewOutcome = Literal["correct", "wrong"]


class TopicMasteryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    topic: str
    mastery: float
    elo_rating: float
    attempts: int
    correct_count: int
    wrong_count: int
    p_correct: Optional[float] = None
    confidence: float
    status: MasteryStatus = "weak"
    updated_at: Optional[datetime] = None


class MasterySummary(BaseModel):
    topics: list[TopicMasteryRead]
    average_mastery: float
    goal_progress: int  # 0..100 aggregate mastery (replaces the mocked dashboard progress)
    strong_count: int
    improving_count: int
    weak_count: int


class LearningPathItem(BaseModel):
    topic: str
    mastery: float
    status: MasteryStatus
    suggested_action: str
    next_topics: list[str] = []


class LearningPathResponse(BaseModel):
    items: list[LearningPathItem]
    ordered_topics: list[str]


class ReviewDue(BaseModel):
    topic: str
    due_date: datetime
    interval_days: int
    ease_factor: float
    repetitions: int
    decayed_mastery: float  # Ebbinghaus-decayed mastery (display + rationale)
    reason: str


class ReviewCompleteRequest(BaseModel):
    topic: str
    outcome: ReviewOutcome


class ReviewCompleteResponse(BaseModel):
    topic: str
    next_due_date: datetime
    interval_days: int
    ease_factor: float


class TrainingStatus(BaseModel):
    backend: str
    status: Literal["ok", "no_data", "error"]
    observations_count: int
    item_difficulty_updated: int
    trained_at: Optional[datetime] = None
    error: Optional[str] = None
