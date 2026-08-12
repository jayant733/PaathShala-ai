"""Adaptive-ML API: mastery, learning path, spaced-repetition reviews.

All endpoints are gated by ``settings.ML_ENABLED`` — when the flag is off they
return 503 with a clear message, so the rest of the app is untouched. Every
route is behind ``get_current_user`` (same JWT auth as quizzes).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import (
    get_current_user,
    get_ml_engine,
    get_ml_recommender,
    get_ml_scheduler,
)
from app.core.config import settings
from app.database.models.user import User
from app.services.ml import (
    KnowledgeMasteryEngine,
    LearningPathRecommender,
    ReviewScheduler,
)
from app.schemas.ml import (
    LearningPathResponse,
    MasterySummary,
    ReviewCompleteRequest,
    ReviewCompleteResponse,
    ReviewDue,
    TrainingStatus,
)

router = APIRouter(prefix="/ml", tags=["ml"])


def _guard() -> None:
    if not settings.ML_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Adaptive ML is disabled. Set ML_ENABLED=true to enable it.",
        )


@router.get("/mastery", response_model=MasterySummary)
async def get_mastery(
    current_user: User = Depends(get_current_user),
    engine: KnowledgeMasteryEngine = Depends(get_ml_engine),
):
    """Per-topic mastery for the current user + aggregate dashboard progress."""
    _guard()
    rows = await engine.repo.list_topic_mastery(current_user.id)
    topics = []
    for m in rows:
        status = LearningPathRecommender.mastery_status(m.mastery, m.confidence, m.attempts)
        topics.append(
            {
                "topic": m.topic,
                "mastery": m.mastery,
                "elo_rating": m.elo_rating,
                "attempts": m.attempts,
                "correct_count": m.correct_count,
                "wrong_count": m.wrong_count,
                "p_correct": m.p_correct,
                "confidence": m.confidence,
                "status": status,
                "updated_at": m.updated_at,
            }
        )
    if not topics:
        return {"topics": [], "average_mastery": 0.0, "goal_progress": 0,
                "strong_count": 0, "improving_count": 0, "weak_count": 0}
    avg = sum(t["mastery"] for t in topics) / len(topics)
    goal_progress = int(round(avg * 100))
    return {
        "topics": topics,
        "average_mastery": round(avg, 4),
        "goal_progress": goal_progress,
        "strong_count": sum(1 for t in topics if t["status"] == "strong"),
        "improving_count": sum(1 for t in topics if t["status"] == "improving"),
        "weak_count": sum(1 for t in topics if t["status"] == "weak"),
    }


@router.get("/learning-path", response_model=LearningPathResponse)
async def get_learning_path(
    current_user: User = Depends(get_current_user),
    recommender: LearningPathRecommender = Depends(get_ml_recommender),
):
    """Ranked learning path: weak topics first, foundations before advanced."""
    _guard()
    return await recommender.build_learning_path(current_user.id)


@router.get("/reviews/due", response_model=list[ReviewDue])
async def get_due_reviews(
    current_user: User = Depends(get_current_user),
    scheduler: ReviewScheduler = Depends(get_ml_scheduler),
):
    """Topics due for spaced repetition (past due date or high forgetting risk)."""
    _guard()
    return await scheduler.get_due_reviews(current_user.id)


@router.post("/reviews/complete", response_model=ReviewCompleteResponse)
async def complete_review(
    payload: ReviewCompleteRequest,
    current_user: User = Depends(get_current_user),
    scheduler: ReviewScheduler = Depends(get_ml_scheduler),
):
    """Mark a topic as reviewed; advance the SM-2 schedule."""
    _guard()
    result = await scheduler.record_study(current_user.id, payload.topic, payload.outcome)
    if not result:
        raise HTTPException(status_code=500, detail="Could not record review")
    return {
        "topic": result["topic"],
        "next_due_date": result["next_due_date"],
        "interval_days": result["interval_days"],
        "ease_factor": result["ease_factor"],
    }


@router.post("/train", response_model=TrainingStatus)
async def train_models(
    current_user: User = Depends(get_current_user),
    engine: KnowledgeMasteryEngine = Depends(get_ml_engine),
):
    """(Re)fit the mastery model + calibrate per-question difficulty."""
    _guard()
    try:
        return await engine.fit_models()
    except Exception as exc:
        return {
            "backend": engine.backend_name,
            "status": "error",
            "observations_count": 0,
            "item_difficulty_updated": 0,
            "trained_at": None,
            "error": str(exc),
        }
