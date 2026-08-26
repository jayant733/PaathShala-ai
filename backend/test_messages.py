import asyncio
import httpx
from jose import jwt
from app.core.config import settings
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.database.models.chat import Conversation

async def main():
    user_id = "5f26b713-44bc-4171-a80e-bdf5d462a2e1"
    token = jwt.encode({"sub": user_id}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    headers = {"Authorization": f"Bearer {token}"}
    
    async with AsyncSessionLocal() as db:
        stmt = select(Conversation).where(Conversation.user_id == user_id).limit(1)
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()
        
    if not conv:
        print("No conversation found")
        return
        
    url = f"http://127.0.0.1:8000/api/v1/chat/conversations/{conv.id}/messages"
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=headers)
        print(f"Messages Status: {res.status_code}")
        
        ctx_url = f"http://127.0.0.1:8000/api/v1/chat/conversations/{conv.id}/context"
        ctx_res = await client.get(ctx_url, headers=headers)
        print(f"Context Status: {ctx_res.status_code}")
        print(ctx_res.text)

if __name__ == "__main__":
    asyncio.run(main())
