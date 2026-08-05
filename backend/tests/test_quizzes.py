"""API tests for the quiz routes — in-memory fake repo, no DB.

Mirrors test_ai.py: overrides get_current_user plus the quiz dependencies so no
real database or AI provider is touched.
"""

import datetime
import uuid

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.api.dependencies import (
    get_current_user,
    get_quiz_repository,
    get_quiz_generator_service,
    get_quiz_export_service,
)
from app.database.models.user import User
from app.database.models.quiz import Quiz, Question, QuizAttempt

pytestmark = pytest.mark.asyncio

CURRENT_USER_ID = uuid.uuid4()


async def mock_get_current_user():
    return User(
        id=CURRENT_USER_ID,
        email="quiz@example.com",
        username="quizuser",
        hashed_password="mocked",
        is_active=True,
        created_at=datetime.datetime.now(datetime.timezone.utc),
    )


# ------------------------------------------------------------------ fake repo
class FakeRepo:
    def __init__(self):
        self.quizzes: dict[uuid.UUID, Quiz] = {}
        self.attempts: dict[uuid.UUID, QuizAttempt] = {}

    async def get_quiz(self, quiz_id, with_questions=False):
        return self.quizzes.get(quiz_id)

    async def list_quizzes(self, user_id, status=None, subject=None, difficulty=None, search=None):
        return [q for q in self.quizzes.values() if q.created_by == user_id]

    async def create_quiz(self, user_id, data, questions):
        now = datetime.datetime.now(datetime.timezone.utc)
        quiz = Quiz(id=uuid.uuid4(), created_by=user_id, created_at=now, updated_at=now, **data)
        quiz.questions = [
            Question(id=uuid.uuid4(), quiz_id=quiz.id, created_at=now, order_index=i, **qd)
            for i, qd in enumerate(questions)
        ]
        self.quizzes[quiz.id] = quiz
        return quiz

    async def save_quiz(self, quiz, updates):
        for k, v in updates.items():
            setattr(quiz, k, v)
        return quiz

    async def update_quiz(self, quiz, data, questions):
        now = datetime.datetime.now(datetime.timezone.utc)
        for k, v in data.items():
            setattr(quiz, k, v)
        quiz.questions = [
            Question(id=uuid.uuid4(), quiz_id=quiz.id, created_at=now, order_index=i, **qd)
            for i, qd in enumerate(questions)
        ]
        return quiz

    async def delete_quiz(self, quiz):
        self.quizzes.pop(quiz.id, None)

    async def create_attempt(self, quiz_id, user_id):
        now = datetime.datetime.now(datetime.timezone.utc)
        att = QuizAttempt(
            id=uuid.uuid4(), quiz_id=quiz_id, user_id=user_id,
            status="in_progress", total_points=0, correct_count=0,
            wrong_count=0, skipped_count=0, started_at=now, created_at=now,
        )
        self.attempts[att.id] = att
        return att

    async def get_attempt(self, attempt_id, user_id):
        att = self.attempts.get(attempt_id)
        if att and att.user_id == user_id:
            return att
        return None

    async def save_attempt(self, attempt, updates):
        for k, v in updates.items():
            setattr(attempt, k, v)
        return attempt

    async def list_user_attempts(self, user_id):
        return [a for a in self.attempts.values() if a.user_id == user_id]


repo = FakeRepo()


# ------------------------------------------------------------------ fake services
class FakeGenerator:
    def __init__(self, repository):
        self.repository = repository

    def _questions(self, count, difficulty):
        return [
            {
                "question_text": f"Question {i + 1}: What is 2 + 2?",
                "question_type": "MCQ",
                "options": ["3", "4", "5", "6"],
                "correct_answers": ["4"],
                "explanation": "Basic arithmetic.",
                "difficulty": difficulty,
                "topic": "Math",
                "points": 1,
            }
            for i in range(count)
        ]

    async def generate_from_prompt(self, user_id, req):
        questions = self._questions(req.question_count or 5, req.difficulty or "medium")
        return await self.repository.create_quiz(user_id, {
            "title": f"Quiz: {req.prompt[:40]}",
            "description": "",
            "subject": req.subject or "Math",
            "difficulty": req.difficulty or "medium",
            "duration_minutes": 10,
            "number_of_questions": len(questions),
            "status": "draft",
        }, questions)

    async def generate_from_history(self, user_id, req):
        questions = self._questions(req.question_count or 5, req.difficulty or "medium")
        return await self.repository.create_quiz(user_id, {
            "title": "Quiz from history",
            "description": "",
            "subject": "Math",
            "difficulty": req.difficulty or "medium",
            "duration_minutes": 10,
            "number_of_questions": len(questions),
            "status": "draft",
            "source_type": req.source_type,
            "source_id": req.source_id,
        }, questions)


class FakeExport:
    async def to_pdf_bytes(self, quiz_id):
        return b"%PDF-fake"

    async def to_docx_bytes(self, quiz_id):
        return b"PK-fake"

    async def to_json_bytes(self, quiz_id):
        return b'{"quiz": true}'

    async def to_apps_script(self, quiz_id):
        return "function createQuizForm() {}"

    async def to_google_forms_json(self, quiz_id):
        return {"items": []}


app.dependency_overrides[get_current_user] = mock_get_current_user
app.dependency_overrides[get_quiz_repository] = lambda: repo
app.dependency_overrides[get_quiz_generator_service] = lambda: FakeGenerator(repo)
app.dependency_overrides[get_quiz_export_service] = lambda: FakeExport()


def _transport():
    return ASGITransport(app=app)


async def _create_published_quiz():
    q = await repo.create_quiz(CURRENT_USER_ID, {
        "title": "Published quiz",
        "description": "",
        "subject": "Math",
        "difficulty": "easy",
        "duration_minutes": 10,
        "number_of_questions": 2,
        "status": "published",
    }, [
        {
            "question_text": "What is 2 + 2?",
            "question_type": "MCQ",
            "options": ["3", "4", "5", "6"],
            "correct_answers": ["4"],
            "explanation": "Basic arithmetic.",
            "difficulty": "easy",
            "topic": "Math",
            "points": 1,
        },
        {
            "question_text": "Is 10 greater than 5?",
            "question_type": "true_false",
            "options": ["True", "False"],
            "correct_answers": ["True"],
            "explanation": "10 > 5.",
            "difficulty": "easy",
            "topic": "Math",
            "points": 1,
        },
    ])
    return q


# ------------------------------------------------------------------ tests
async def test_generate_endpoint_returns_draft():
    transport = _transport()
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/quizzes/generate", json={
            "prompt": "make a math quiz",
            "template": "beginner",
            "question_count": 3,
            "difficulty": "easy",
        })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "draft"
    assert len(data["questions"]) == 3
    # Drafts still expose correct answers (owner view).
    assert "correct_answers" in data["questions"][0]


async def test_publish_flips_status():
    quiz = await _create_published_quiz()
    quiz.status = "draft"
    async with AsyncClient(transport=_transport(), base_url="http://test") as ac:
        response = await ac.post(f"/api/v1/quizzes/{quiz.id}/publish")
    assert response.status_code == 200
    assert response.json()["status"] == "published"


async def test_non_owner_gets_404():
    other = uuid.uuid4()
    quiz = await repo.create_quiz(other, {
        "title": "Someone else's quiz",
        "status": "published",
    }, [
        {
            "question_text": "Private question?",
            "question_type": "MCQ",
            "options": ["A", "B"],
            "correct_answers": ["A"],
            "explanation": "",
            "difficulty": "easy",
            "topic": "T",
            "points": 1,
        }
    ])
    async with AsyncClient(transport=_transport(), base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/quizzes/{quiz.id}")
    assert response.status_code == 404


async def test_take_attempt_strips_answers():
    quiz = await _create_published_quiz()
    async with AsyncClient(transport=_transport(), base_url="http://test") as ac:
        response = await ac.post(f"/api/v1/quizzes/{quiz.id}/attempts")
    assert response.status_code == 201
    data = response.json()
    assert len(data["questions"]) == 2
    assert "correct_answers" not in data["questions"][0]
    assert "explanation" not in data["questions"][0]
    assert data["quiz_title"] == "Published quiz"
    assert data["duration_minutes"] == 10


async def test_submit_grades_attempt():
    quiz = await _create_published_quiz()
    q1, q2 = quiz.questions
    async with AsyncClient(transport=_transport(), base_url="http://test") as ac:
        start = await ac.post(f"/api/v1/quizzes/{quiz.id}/attempts")
        attempt_id = start.json()["id"]

        save = await ac.put(
            f"/api/v1/quizzes/{quiz.id}/attempts/{attempt_id}",
            json={"answers": {str(q1.id): "4", str(q2.id): "false"}, "status": "in_progress"},
        )
        assert save.status_code == 200

        result = await ac.post(f"/api/v1/quizzes/{quiz.id}/attempts/{attempt_id}/submit")
    assert result.status_code == 200
    body = result.json()
    assert body["score"] == 1
    assert body["total_points"] == 2
    assert body["correct_count"] == 1
    assert body["wrong_count"] == 1
    assert body["skipped_count"] == 0


async def test_export_formats_content_type():
    quiz = await _create_published_quiz()
    async with AsyncClient(transport=_transport(), base_url="http://test") as ac:
        pdf = await ac.get(f"/api/v1/quizzes/{quiz.id}/export/pdf")
        docx = await ac.get(f"/api/v1/quizzes/{quiz.id}/export/docx")
        js = await ac.get(f"/api/v1/quizzes/{quiz.id}/export/json")
        gs = await ac.get(f"/api/v1/quizzes/{quiz.id}/export/appsscript")
        forms = await ac.get(f"/api/v1/quizzes/{quiz.id}/export/google-forms-json")
    assert pdf.status_code == 200 and pdf.headers["content-type"].startswith("application/pdf")
    assert docx.headers["content-type"].startswith("application/vnd.openxmlformats")
    assert js.headers["content-type"].startswith("application/json")
    assert gs.headers["content-type"].startswith("text/plain")
    assert forms.headers["content-type"].startswith("application/json")


async def test_generate_from_history_endpoint():
    async with AsyncClient(transport=_transport(), base_url="http://test") as ac:
        response = await ac.post("/api/v1/quizzes/generate-from-history", json={
            "source_type": "interaction",
            "source_id": str(uuid.uuid4()),
            "template": "intermediate",
            "question_count": 2,
            "difficulty": "hard",
        })
    assert response.status_code == 200
    assert response.json()["status"] == "draft"
