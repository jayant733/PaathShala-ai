from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from app.database.models.memory import UserMemory, LearningEvent

class MemoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_memory(self, user_id: UUID, memory_type: str, content: str, embedding: List[float], importance_score: float = 1.0, conversation_id: Optional[UUID] = None) -> UserMemory:
        memory = UserMemory(
            user_id=user_id,
            conversation_id=conversation_id,
            memory_type=memory_type,
            content=content,
            importance_score=importance_score,
            embedding=embedding
        )
        self.session.add(memory)
        await self.session.commit()
        await self.session.refresh(memory)
        return memory

    async def save_learning_event(self, user_id: UUID, topic: str, event_type: str, description: Optional[str] = None) -> LearningEvent:
        event = LearningEvent(
            user_id=user_id,
            topic=topic,
            event_type=event_type,
            description=description
        )
        self.session.add(event)
        await self.session.commit()
        await self.session.refresh(event)
        return event

    async def get_user_memories(self, user_id: UUID, limit: int = 10) -> List[UserMemory]:
        stmt = select(UserMemory).where(UserMemory.user_id == user_id).order_by(UserMemory.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_conversation_memories(self, conversation_id: UUID, limit: int = 50) -> List[UserMemory]:
        stmt = select(UserMemory).where(UserMemory.conversation_id == conversation_id).order_by(UserMemory.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_learning_events(self, user_id: UUID, limit: int = 10) -> List[LearningEvent]:
        stmt = select(LearningEvent).where(LearningEvent.user_id == user_id).order_by(LearningEvent.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def search_memories(self, user_id: UUID, query_embedding: List[float], limit: int = 5) -> List[UserMemory]:
        stmt = (
            select(UserMemory)
            .where(UserMemory.user_id == user_id)
            .order_by(UserMemory.embedding.cosine_distance(query_embedding))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
