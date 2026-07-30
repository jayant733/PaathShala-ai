from fastapi import APIRouter, Depends
from typing import List
from app.api.dependencies import get_current_user, get_memory_repository
from app.database.models.user import User
from app.repositories.memory_repository import MemoryRepository
from app.schemas.memory import MemoryListResponse, MemoryResponse

router = APIRouter(prefix="/memory", tags=["memory"])

@router.get("", response_model=MemoryListResponse)
async def get_user_memories(
    current_user: User = Depends(get_current_user),
    memory_repo: MemoryRepository = Depends(get_memory_repository)
):
    """
    Retrieve user memories (knowledge and profile).
    """
    memories = await memory_repo.get_user_memories(current_user.id, limit=50)
    
    # Format according to spec
    formatted_memories = [
        {"type": m.memory_type, "content": m.content}
        for m in memories
    ]
    
    return {"memories": formatted_memories}

from pydantic import BaseModel
from typing import Optional
class MemoryCreate(BaseModel):
    content: str
    memory_type: str = "preference"
    conversation_id: Optional[str] = None

@router.post("", response_model=MemoryResponse)
async def create_memory(
    request: MemoryCreate,
    current_user: User = Depends(get_current_user),
    memory_repo: MemoryRepository = Depends(get_memory_repository)
):
    from app.ai.embeddings.gemini import GeminiEmbeddingProvider
    provider = GeminiEmbeddingProvider()
    
    try:
        embedding = await provider.create_embedding(request.content)
    except Exception:
        embedding = [0.0] * 768
    
    conv_id = None
    if request.conversation_id:
        import uuid as _uuid
        try:
            conv_id = _uuid.UUID(request.conversation_id)
        except Exception:
            pass
    
    memory = await memory_repo.save_memory(
        user_id=current_user.id,
        memory_type=request.memory_type,
        content=request.content,
        embedding=embedding,
        importance_score=1.0,
        conversation_id=conv_id
    )
    return {"type": memory.memory_type, "content": memory.content}
