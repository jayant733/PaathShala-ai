from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database.models.ai import AIInteraction

class AIRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_interaction(self, user_id: UUID, prompt: str, response: str, model_used: str, input_tokens: int, output_tokens: int) -> AIInteraction:
        interaction = AIInteraction(
            user_id=user_id,
            prompt=prompt,
            response=response,
            model_used=model_used,
            input_tokens=input_tokens,
            output_tokens=output_tokens
        )
        self.session.add(interaction)
        await self.session.commit()
        await self.session.refresh(interaction)
        return interaction

    async def get_user_interactions(self, user_id: UUID, limit: int = 10) -> List[AIInteraction]:
        stmt = select(AIInteraction).where(AIInteraction.user_id == user_id).order_by(AIInteraction.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
