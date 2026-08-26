"""Adaptive-ML API: mastery, learning path, spaced-repetition reviews.

All endpoints are gated by ``settings.ML_ENABLED`` — when the flag is off they
return 503 with a clear message, so the rest of the app is untouched. Every
route is behind ``get_current_user`` (same JWT auth as quizzes).
"""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from app.api.dependencies import (
    get_current_user,
    get_ml_engine,
    get_ml_recommender,
    get_ml_scheduler,
    get_quiz_repository,
)
from app.core.config import settings
from app.database.models.user import User
from app.services.ml import (
    KnowledgeMasteryEngine,
    LearningPathRecommender,
    ReviewScheduler,
)
from app.repositories.quiz_repository import QuizRepository
from app.schemas.ml import (
    LearningPathResponse,
    LearningPathQuizzesResponse,
    QuizMasteryDetailed,
    MasterySummary,
    ReviewCompleteRequest,
    ReviewCompleteResponse,
    StudyCompleteRequest,
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
    quiz_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    engine: KnowledgeMasteryEngine = Depends(get_ml_engine),
    quiz_repo: QuizRepository = Depends(get_quiz_repository),
):
    """Per-topic mastery for the current user + aggregate dashboard progress."""
    _guard()
    rows = await engine.repo.list_topic_mastery(current_user.id)
    if not rows:
        processed = await engine.sync_user_history(current_user.id)
        if processed > 0:
            rows = await engine.repo.list_topic_mastery(current_user.id)

    if quiz_id:
        quiz = await quiz_repo.get_quiz(quiz_id, with_questions=True)
        if quiz:
            quiz_topics = {q.topic for q in quiz.questions if q.topic}
            rows = [r for r in rows if r.topic in quiz_topics]

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


@router.post("/sync-history")
async def sync_history(
    current_user: User = Depends(get_current_user),
    engine: KnowledgeMasteryEngine = Depends(get_ml_engine),
):
    """Force re-synchronization of topic mastery from all past completed quiz attempts."""
    _guard()
    count = await engine.sync_user_history(current_user.id)
    return {"status": "ok", "attempts_processed": count}


@router.get("/learning-path", response_model=LearningPathResponse)
async def get_learning_path(
    quiz_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    recommender: LearningPathRecommender = Depends(get_ml_recommender),
    quiz_repo: QuizRepository = Depends(get_quiz_repository),
):
    """Ranked learning path: weak topics first, foundations before advanced."""
    _guard()
    path = await recommender.build_learning_path(current_user.id)
    if quiz_id:
        quiz = await quiz_repo.get_quiz(quiz_id, with_questions=True)
        if quiz:
            quiz_topics = {q.topic for q in quiz.questions if q.topic}
            path["items"] = [item for item in path["items"] if item["topic"] in quiz_topics]
    return path


@router.get("/learning-path/quizzes", response_model=LearningPathQuizzesResponse)
async def get_learning_path_quizzes(
    current_user: User = Depends(get_current_user),
    recommender: LearningPathRecommender = Depends(get_ml_recommender),
    quiz_repo: QuizRepository = Depends(get_quiz_repository),
):
    """Grouped learning path by Quiz."""
    _guard()
    
    # 1. Fetch user quizzes
    quizzes = await quiz_repo.list_quizzes(current_user.id)
    if not quizzes:
        return {"items": []}
    
    # 2. Fetch overall topic mastery
    mastery_rows = await recommender.repo.list_topic_mastery(current_user.id)
    mastery_map = {m.topic: {"mastery": m.mastery, "confidence": m.confidence, "attempts": m.attempts} for m in mastery_rows}
    
    items = []
    for quiz in quizzes:
        topics = list(set(q.topic for q in quiz.questions if q.topic))
        if not topics:
            continue
            
        total_mastery = 0.0
        total_confidence = 0.0
        total_attempts = 0
        for t in topics:
            m = mastery_map.get(t)
            if m:
                total_mastery += m["mastery"]
                total_confidence += m["confidence"]
                total_attempts += m["attempts"]
                
        avg_mastery = total_mastery / len(topics)
        avg_confidence = total_confidence / len(topics)
        
        if total_attempts == 0:
            continue
            
        status = LearningPathRecommender.mastery_status(avg_mastery, avg_confidence, total_attempts)
        
        items.append({
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "mastery": round(avg_mastery, 4),
            "status": status,
            "topic_count": len(topics)
        })
        
    return {"items": items}


@router.get("/learning-path/quizzes/{quiz_id}", response_model=QuizMasteryDetailed)
async def get_quiz_mastery_detailed(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    recommender: LearningPathRecommender = Depends(get_ml_recommender),
    quiz_repo: QuizRepository = Depends(get_quiz_repository),
):
    """Get the learning path topics for a specific quiz."""
    _guard()
    
    quiz = await quiz_repo.get_quiz(quiz_id, with_questions=True)
    if not quiz or quiz.created_by != current_user.id:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    quiz_topics = list(set(q.topic for q in quiz.questions if q.topic))
    
    # Let recommender build the path but only for these topics
    full_path = await recommender.build_learning_path(current_user.id, topic_limit=100)
    
    quiz_items = []
    for item in full_path["items"]:
        if item["topic"] in quiz_topics:
            quiz_items.append(item)
            quiz_topics.remove(item["topic"])
            
    # For topics that aren't in the learning path (no mastery data yet)
    for t in quiz_topics:
        quiz_items.append({
            "topic": t,
            "mastery": 0.0,
            "status": "weak",
            "gap": 1.0,
            "suggested_action": "Review fundamentals — start with easy questions to rebuild the base.",
            "next_topics": []
        })
        
    return {
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "topics": quiz_items
    }


@router.get("/reviews/due", response_model=list[ReviewDue])
async def get_due_reviews(
    quiz_id: UUID | None = None,
    current_user: User = Depends(get_current_user),
    scheduler: ReviewScheduler = Depends(get_ml_scheduler),
    quiz_repo: QuizRepository = Depends(get_quiz_repository),
):
    """Topics due for spaced repetition (past due date or high forgetting risk)."""
    _guard()
    reviews = await scheduler.get_due_reviews(current_user.id)
    if quiz_id:
        quiz = await quiz_repo.get_quiz(quiz_id, with_questions=True)
        if quiz:
            quiz_topics = {q.topic for q in quiz.questions if q.topic}
            reviews = [r for r in reviews if r["topic"] in quiz_topics]
    return reviews


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


@router.post("/study", response_model=dict)
async def record_study(
    payload: StudyCompleteRequest,
    current_user: User = Depends(get_current_user),
    engine: KnowledgeMasteryEngine = Depends(get_ml_engine),
):
    """Record a study session (e.g. AI Tutor presentation) to bump confidence & reset Ebbinghaus decay."""
    _guard()
    result = await engine.update_from_study(current_user.id, payload.topic)
    if not result:
        raise HTTPException(status_code=500, detail="Could not record study event")
    return result


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
