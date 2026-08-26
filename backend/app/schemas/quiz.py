from datetime import datetime
from typing import Literal, Optional, Union, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator

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
    correct_answers: list[str] = []
    explanation: str = ""
    difficulty: Difficulty = "medium"
    topic: str = "General"
    points: int = 1

    @field_validator("question_type", mode="before")
    @classmethod
    def normalize_question_type(cls, v: Any) -> str:
        if not isinstance(v, str):
            return "MCQ"
        s = v.strip().lower().replace("-", "_").replace(" ", "_")
        if s in ("mcq", "multiple_choice", "single_choice", "singlechoice"):
            return "MCQ"
        if s in ("multiple", "multi_select", "checkbox", "multiple_select", "multiselect"):
            return "multiple"
        if s in ("true_false", "truefalse", "boolean", "tf", "true/false"):
            return "true_false"
        if s in ("short_answer", "shortanswer", "text", "open_ended", "short"):
            return "short_answer"
        return "MCQ"

    @field_validator("difficulty", mode="before")
    @classmethod
    def normalize_difficulty(cls, v: Any) -> str:
        if not isinstance(v, str):
            return "medium"
        s = v.strip().lower()
        if s in ("easy", "beginner"):
            return "easy"
        if s in ("hard", "advanced", "expert"):
            return "hard"
        return "medium"

    @field_validator("correct_answers", mode="before")
    @classmethod
    def normalize_correct_answers(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [v]
        if isinstance(v, list):
            return [str(x) for x in v]
        return []

    @field_validator("options", mode="before")
    @classmethod
    def normalize_options(cls, v: Any) -> list[str]:
        if isinstance(v, list):
            return [str(x) for x in v]
        return []


class QuizDraft(BaseModel):
    title: str
    description: str = ""
    subject: str = ""
    difficulty: Difficulty = "medium"
    duration_minutes: int = 10
    number_of_questions: int = 5
    questions: list[QuestionDraft]

    @field_validator("difficulty", mode="before")
    @classmethod
    def normalize_difficulty(cls, v: Any) -> str:
        if not isinstance(v, str):
            return "medium"
        s = v.strip().lower()
        if s in ("easy", "beginner"):
            return "easy"
        if s in ("hard", "advanced", "expert"):
            return "hard"
        return "medium"


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


class LastAttemptSummary(BaseModel):
    attempt_id: UUID
    status: str
    score: Optional[float] = None
    total_points: int
    percent: Optional[float] = None
    submitted_at: Optional[datetime] = None


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
    last_attempt: Optional[LastAttemptSummary] = None


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
