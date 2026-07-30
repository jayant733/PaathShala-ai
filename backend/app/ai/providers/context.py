import contextvars
from typing import Optional
from pydantic import BaseModel

class AIRequestContext(BaseModel):
    provider: Optional[str] = None
    model_name: Optional[str] = None
    mode: Optional[str] = "auto"

# Thread-safe context variable
ai_request_context: contextvars.ContextVar[AIRequestContext] = contextvars.ContextVar(
    "ai_request_context", default=AIRequestContext()
)

def set_ai_context(provider: Optional[str] = None, model_name: Optional[str] = None, mode: str = "auto") -> contextvars.Token:
    """Set the AI context for the current async task/thread."""
    ctx = AIRequestContext(provider=provider, model_name=model_name, mode=mode)
    return ai_request_context.set(ctx)

def get_ai_context() -> AIRequestContext:
    """Get the AI context for the current async task/thread."""
    return ai_request_context.get()
