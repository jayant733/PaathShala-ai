import json
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.dependencies import (
    get_current_user,
    get_quiz_export_service,
    get_quiz_generator_service,
    get_quiz_repository,
)
from app.database.models.quiz import Quiz
from app.database.models.user import User
from app.repositories.quiz_repository import QuizRepository
from app.schemas.quiz import (
    QuestionTakeRead,
    QuizAttemptRead,
    QuizAttemptUpdate,
    QuizGenerateFromHistoryRequest,
    QuizGenerateRequest,
    QuizRead,
    QuizResultRead,
    QuizSourceItem,
    QuizUpdateRequest,
)
from app.services.quiz_export_service import QuizExportService
from app.services.quiz_generator_service import QuizGeneratorService, grade_attempt

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

EXPORT_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "json": "application/json",
    "appsscript": "text/plain",
    "google-forms-json": "application/json",
}


async def _get_owned_quiz(quiz_id: UUID, user: User, repo: QuizRepository) -> Quiz:
    quiz = await repo.get_quiz(quiz_id, with_questions=True)
    if not quiz or quiz.created_by != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz


async def _to_quiz_read(repo: QuizRepository, quiz: Quiz) -> QuizRead:
    quiz = await repo.get_quiz(quiz.id, with_questions=True)
    return QuizRead.model_validate(quiz)


def _take_questions(quiz: Quiz) -> list[QuestionTakeRead]:
    return [QuestionTakeRead.model_validate(q) for q in quiz.questions]


# ------------------------------------------------------------------ Generation
@router.post("/generate", response_model=QuizRead)
async def generate_quiz(
    payload: QuizGenerateRequest,
    current_user: User = Depends(get_current_user),
    service: QuizGeneratorService = Depends(get_quiz_generator_service),
):
    quiz = await service.generate_from_prompt(current_user.id, payload)
    return await _to_quiz_read(service.repository, quiz)


@router.post("/generate-from-history", response_model=QuizRead)
async def generate_quiz_from_history(
    payload: QuizGenerateFromHistoryRequest,
    current_user: User = Depends(get_current_user),
    service: QuizGeneratorService = Depends(get_quiz_generator_service),
):
    quiz = await service.generate_from_history(current_user.id, payload)
    return await _to_quiz_read(service.repository, quiz)


# ------------------------------------------------------------------ Sources
@router.get("/sources", response_model=list[QuizSourceItem])
async def list_quiz_sources(
    search: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    return await repo.list_sources(current_user.id, search=search, limit=limit)


# ------------------------------------------------------------------ My attempts (static path — must precede /{quiz_id})
@router.get("/attempts", response_model=list[QuizAttemptRead])
async def list_my_attempts(
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    return await repo.list_user_attempts(current_user.id)


# ------------------------------------------------------------------ CRUD
@router.get("", response_model=list[QuizRead])
async def list_quizzes(
    status: Optional[str] = None,
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    quizzes = await repo.list_quizzes(
        current_user.id, status=status, subject=subject, difficulty=difficulty, search=search
    )
    return [QuizRead.model_validate(q) for q in quizzes]


@router.post("", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    payload: QuizUpdateRequest,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    data = {
        "title": payload.title,
        "description": payload.description,
        "subject": payload.subject,
        "difficulty": payload.difficulty,
        "duration_minutes": payload.duration_minutes,
        "number_of_questions": len(payload.questions),
        "status": "draft",
    }
    questions = [q.model_dump() for q in payload.questions]
    quiz = await repo.create_quiz(current_user.id, data, questions)
    return await _to_quiz_read(repo, quiz)


@router.get("/{quiz_id}", response_model=QuizRead)
async def get_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    quiz = await _get_owned_quiz(quiz_id, current_user, repo)
    return QuizRead.model_validate(quiz)


@router.put("/{quiz_id}", response_model=QuizRead)
async def update_quiz(
    quiz_id: UUID,
    payload: QuizUpdateRequest,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    quiz = await _get_owned_quiz(quiz_id, current_user, repo)
    data = {
        "title": payload.title,
        "description": payload.description,
        "subject": payload.subject,
        "difficulty": payload.difficulty,
        "duration_minutes": payload.duration_minutes,
        "number_of_questions": len(payload.questions),
    }
    questions = [q.model_dump() for q in payload.questions]
    quiz = await repo.update_quiz(quiz, data, questions)
    return await _to_quiz_read(repo, quiz)


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    quiz = await _get_owned_quiz(quiz_id, current_user, repo)
    await repo.delete_quiz(quiz)


@router.post("/{quiz_id}/publish", response_model=QuizRead)
async def publish_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    quiz = await _get_owned_quiz(quiz_id, current_user, repo)
    quiz = await repo.save_quiz(quiz, {"status": "published"})
    return await _to_quiz_read(repo, quiz)


@router.post("/{quiz_id}/duplicate", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
async def duplicate_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    quiz = await _get_owned_quiz(quiz_id, current_user, repo)
    data = {
        "title": f"{quiz.title} (Copy)",
        "description": quiz.description,
        "subject": quiz.subject,
        "difficulty": quiz.difficulty,
        "duration_minutes": quiz.duration_minutes,
        "number_of_questions": quiz.number_of_questions,
        "status": "draft",
        "source_type": quiz.source_type,
        "source_id": quiz.source_id,
        "generation_prompt": quiz.generation_prompt,
    }
    questions = [
        {
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": list(q.options or []),
            "correct_answers": list(q.correct_answers or []),
            "explanation": q.explanation or "",
            "difficulty": q.difficulty,
            "topic": q.topic,
            "points": q.points,
        }
        for q in quiz.questions
    ]
    new_quiz = await repo.create_quiz(current_user.id, data, questions)
    return await _to_quiz_read(repo, new_quiz)


@router.post("/{quiz_id}/regenerate", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
async def regenerate_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    service: QuizGeneratorService = Depends(get_quiz_generator_service),
):
    """Generate a fresh draft from the quiz's original source (prompt or history)."""
    quiz = await _get_owned_quiz(quiz_id, current_user, service.repository)
    if quiz.source_type and quiz.source_id:
        req = QuizGenerateFromHistoryRequest(
            source_type=quiz.source_type,
            source_id=quiz.source_id,
            question_count=quiz.number_of_questions,
            difficulty=quiz.difficulty,
        )
        new_quiz = await service.generate_from_history(current_user.id, req)
    elif quiz.generation_prompt:
        req = QuizGenerateRequest(
            prompt=quiz.generation_prompt,
            question_count=quiz.number_of_questions,
            difficulty=quiz.difficulty,
        )
        new_quiz = await service.generate_from_prompt(current_user.id, req)
    else:
        raise HTTPException(status_code=400, detail="No generation source stored for this quiz")
    return await _to_quiz_read(service.repository, new_quiz)


# ------------------------------------------------------------------ Attempts
@router.post("/{quiz_id}/attempts", response_model=QuizAttemptRead, status_code=status.HTTP_201_CREATED)
async def start_attempt(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    quiz = await repo.get_quiz(quiz_id, with_questions=True)
    if not quiz or quiz.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    attempt = await repo.create_attempt(quiz_id, current_user.id)
    result = QuizAttemptRead.model_validate(attempt)
    result.questions = _take_questions(quiz)
    result.quiz_title = quiz.title
    result.duration_minutes = quiz.duration_minutes
    return result


@router.get("/{quiz_id}/attempts/{attempt_id}", response_model=QuizAttemptRead)
async def get_attempt(
    quiz_id: UUID,
    attempt_id: UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    attempt = await repo.get_attempt(attempt_id, current_user.id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    quiz = await repo.get_quiz(quiz_id, with_questions=True)
    result = QuizAttemptRead.model_validate(attempt)
    if quiz:
        result.questions = _take_questions(quiz)
        result.quiz_title = quiz.title
        result.duration_minutes = quiz.duration_minutes
    return result


@router.put("/{quiz_id}/attempts/{attempt_id}", response_model=QuizAttemptRead)
async def save_attempt(
    quiz_id: UUID,
    attempt_id: UUID,
    payload: QuizAttemptUpdate,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    attempt = await repo.get_attempt(attempt_id, current_user.id)
    if not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        attempt = await repo.save_attempt(attempt, updates)
    result = QuizAttemptRead.model_validate(attempt)
    quiz = await repo.get_quiz(quiz_id, with_questions=True)
    if quiz:
        result.questions = _take_questions(quiz)
        result.quiz_title = quiz.title
        result.duration_minutes = quiz.duration_minutes
    return result


@router.post("/{quiz_id}/attempts/{attempt_id}/submit", response_model=QuizResultRead)
async def submit_attempt(
    quiz_id: UUID,
    attempt_id: UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    quiz = await repo.get_quiz(quiz_id, with_questions=True)
    attempt = await repo.get_attempt(attempt_id, current_user.id)
    if not quiz or not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    grading = grade_attempt(list(quiz.questions), attempt.answers or {})
    await repo.save_attempt(attempt, {
        "status": "completed",
        "score": grading["score"],
        "total_points": grading["total_points"],
        "correct_count": grading["correct_count"],
        "wrong_count": grading["wrong_count"],
        "skipped_count": grading["skipped_count"],
        "submitted_at": datetime.now(timezone.utc),
    })
    return QuizResultRead(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        score=grading["score"],
        total_points=grading["total_points"],
        percent=grading["percent"],
        correct_count=grading["correct_count"],
        wrong_count=grading["wrong_count"],
        skipped_count=grading["skipped_count"],
        weak_topics=grading["weak_topics"],
        question_results=grading["question_results"],
    )


@router.get("/{quiz_id}/attempts/{attempt_id}/result", response_model=QuizResultRead)
async def get_attempt_result(
    quiz_id: UUID,
    attempt_id: UUID,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
):
    """Read-only grading of a saved attempt — powers the results page on reload."""
    quiz = await repo.get_quiz(quiz_id, with_questions=True)
    attempt = await repo.get_attempt(attempt_id, current_user.id)
    if not quiz or not attempt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")

    grading = grade_attempt(list(quiz.questions), attempt.answers or {})
    return QuizResultRead(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        score=grading["score"],
        total_points=grading["total_points"],
        percent=grading["percent"],
        correct_count=grading["correct_count"],
        wrong_count=grading["wrong_count"],
        skipped_count=grading["skipped_count"],
        weak_topics=grading["weak_topics"],
        question_results=grading["question_results"],
    )


# ------------------------------------------------------------------ Exports
@router.get("/{quiz_id}/export/{format}")
async def export_quiz(
    quiz_id: UUID,
    format: str,
    current_user: User = Depends(get_current_user),
    repo: QuizRepository = Depends(get_quiz_repository),
    export_service: QuizExportService = Depends(get_quiz_export_service),
):
    quiz = await _get_owned_quiz(quiz_id, current_user, repo)
    if format == "pdf":
        data = await export_service.to_pdf_bytes(quiz_id)
        ext = "pdf"
    elif format == "docx":
        data = await export_service.to_docx_bytes(quiz_id)
        ext = "docx"
    elif format == "json":
        data = await export_service.to_json_bytes(quiz_id)
        ext = "json"
    elif format == "appsscript":
        data = (await export_service.to_apps_script(quiz_id)).encode("utf-8")
        ext = "gs"
    elif format == "google-forms-json":
        data = json.dumps(await export_service.to_google_forms_json(quiz_id)).encode("utf-8")
        ext = "json"
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")

    filename = f"{QuizExportService.slug(quiz.title)}.{ext}"
    return StreamingResponse(
        BytesIO(data),
        media_type=EXPORT_MEDIA_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
