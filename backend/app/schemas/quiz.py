from datetime import datetime
from typing import Literal, Optional, Union
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

QuestionType = Literal["MCQ", "multiple", "true_false", "short_answer"]
Difficulty = Literal["easy", "medium", "hard"]
QuizStatus = Literal["draft", "published", "archived"]
QuizTemplate = Literal["beginner", "intermediate", "advanced", "coding", "concept"]
SourceType = Literal["conversation", "interaction"]


# --------------------------------------------------------------------------
# LLM JSON contract (QuizDraft) — this exact shape is emitted by the model
# --------------------------------------------------------------------------
class QuestionDraft(BaseModel):
    question_text: str
    question_type: QuestionType = "MCQ"
    options: list[str] = []
    correct_answers: list[str]
    explanation: str = ""
    difficulty: Difficulty = "medium"
    topic: str = "General"
    points: int = 1


class QuizDraft(BaseModel):
    title: str
    description: str = ""
    subject: str = ""
    difficulty: Difficulty = "medium"
    duration_minutes: int = 10
    number_of_questions: int = 5
    questions: list[QuestionDraft]


# --------------------------------------------------------------------------
# Requests
# --------------------------------------------------------------------------
class QuizGenerateRequest(BaseModel):
    prompt: str
    template: QuizTemplate = "intermediate"
    question_count: Optional[int] = Field(default=None, ge=1, le=50)
    difficulty: Optional[Difficulty] = None
    subject: Optional[str] = None
    provider: Optional[str] = Field(default=None, description="AI provider, e.g. 'gemini' or 'ollama'")
    model_name: Optional[str] = None


class QuizGenerateFromHistoryRequest(BaseModel):
    source_type: SourceType
    source_id: UUID
    template: QuizTemplate = "intermediate"
    question_count: Optional[int] = Field(default=None, ge=1, le=50)
    difficulty: Optional[Difficulty] = None


class QuizUpdateRequest(BaseModel):
    title: str
    description: str = ""
    subject: str = ""
    difficulty: Difficulty = "medium"
    duration_minutes: int = 10
    questions: list[QuestionDraft]


# --------------------------------------------------------------------------
# Reads
# --------------------------------------------------------------------------
class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quiz_id: UUID
    question_text: str
    question_type: QuestionType
    options: list[str]
    correct_answers: list[str]
    explanation: str = ""
    difficulty: Difficulty
    topic: str
    points: int
    order_index: int


class QuestionTakeRead(BaseModel):
    """Student/taking view — correct answers & explanations are stripped."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question_text: str
    question_type: QuestionType
    options: list[str]
    difficulty: Difficulty
    topic: str
    order_index: int


class QuizRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str] = None
    subject: Optional[str] = None
    difficulty: Difficulty
    duration_minutes: int
    number_of_questions: int
    status: QuizStatus
    created_by: UUID
    source_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionRead] = []


class QuizListResponse(BaseModel):
    quizzes: list[QuizRead]


# --------------------------------------------------------------------------
# Attempts
# --------------------------------------------------------------------------
class QuizAttemptUpdate(BaseModel):
    answers: Optional[dict] = None
    status: Optional[Literal["in_progress", "completed"]] = None
    time_taken_seconds: Optional[int] = None


class QuizAttemptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quiz_id: UUID
    user_id: UUID
    status: str
    score: Optional[float] = None
    total_points: int
    correct_count: int
    wrong_count: int
    skipped_count: int
    answers: Optional[dict] = None
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_taken_seconds: Optional[int] = None
    questions: Optional[list[QuestionTakeRead]] = None
    quiz_title: Optional[str] = None
    duration_minutes: Optional[int] = None


class AttemptListResponse(BaseModel):
    attempts: list[QuizAttemptRead]


# --------------------------------------------------------------------------
# Results
# --------------------------------------------------------------------------
class WeakTopic(BaseModel):
    topic: str
    wrong_count: int
    total_count: int


class QuestionResult(BaseModel):
    question_id: UUID
    question_text: str
    question_type: QuestionType
    your_answer: Optional[Union[str, list[str]]] = None
    correct_answers: list[str]
    is_correct: bool
    explanation: str = ""
    topic: str
    points: int


class QuizResultRead(BaseModel):
    attempt_id: UUID
    quiz_id: UUID
    score: float
    total_points: int
    percent: float
    correct_count: int
    wrong_count: int
    skipped_count: int
    weak_topics: list[WeakTopic]
    question_results: list[QuestionResult]


# --------------------------------------------------------------------------
# Sources (the "generate from history" picker)
# --------------------------------------------------------------------------
class QuizSourceItem(BaseModel):
    id: UUID
    source_type: SourceType
    title: str
    preview: str
    created_at: datetime


class QuizSourceListResponse(BaseModel):
    items: list[QuizSourceItem]
