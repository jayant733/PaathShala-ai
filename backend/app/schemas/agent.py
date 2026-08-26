from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID
from app.core.config import settings

class AgentChatRequest(BaseModel):
    message: str = Field(
        ...,
        max_length=3000,
        description="Chat message (max ~500 words / 3000 characters)"
    )
    conversation_id: Optional[UUID] = None
    ai_mode: Optional[str] = Field(default=None, description="The mode to use: auto, gemini, or ollama")
    provider: Optional[str] = Field(default=None, description="The AI provider to use, e.g., 'gemini' or 'ollama'")
    model_name: Optional[str] = Field(default=None, description="The specific model name to use, e.g., 'llama3.1'")

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message cannot be empty.")
        word_count = len(v.split())
        if len(v) > settings.MAX_MESSAGE_LENGTH:
            raise ValueError(
                f"Message is too long ({word_count} words). "
                f"Please keep it under ~500 words ({settings.MAX_MESSAGE_LENGTH} characters)."
            )
        return v.strip()

class AgentChatResponse(BaseModel):
    agent: str
    response: str
    conversation_id: UUID
