from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class AgentChatRequest(BaseModel):
    message: str
    conversation_id: Optional[UUID] = None
    ai_mode: Optional[str] = Field(default=None, description="The mode to use: auto, gemini, or ollama")
    provider: Optional[str] = Field(default=None, description="The AI provider to use, e.g., 'gemini' or 'ollama'")
    model_name: Optional[str] = Field(default=None, description="The specific model name to use, e.g., 'llama3.1'")

class AgentChatResponse(BaseModel):
    agent: str
    response: str
    conversation_id: UUID
