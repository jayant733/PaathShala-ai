import asyncio
import contextvars
from pydantic import BaseModel
from typing import Optional

class AIRequestContext(BaseModel):
    provider: Optional[str] = None
    model_name: Optional[str] = None
    mode: Optional[str] = "auto"

ai_request_context: contextvars.ContextVar[AIRequestContext] = contextvars.ContextVar(
    "ai_request_context", default=AIRequestContext()
)

async def event_generator():
    ctx = ai_request_context.get()
    print(f"Inside generator: provider={ctx.provider}, mode={ctx.mode}")
    yield "data"

async def route_handler():
    ctx = AIRequestContext(provider="gemini", mode="manual")
    ai_request_context.set(ctx)
    print(f"Inside route: provider={ai_request_context.get().provider}")
    
    # Simulate what StreamingResponse does:
    gen = event_generator()
    # In some web servers, the consumption might happen in a different asyncio Task
    async def consume():
        async for _ in gen:
            pass
    
    # Let's run it in a new task to simulate Starlette's behavior
    await asyncio.create_task(consume())

asyncio.run(route_handler())
