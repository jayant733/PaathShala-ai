import asyncio
import httpx
from jose import jwt
from app.core.config import settings

async def main():
    user_id = "5f26b713-44bc-4171-a80e-bdf5d462a2e1"
    token = jwt.encode({"sub": user_id}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    headers = {"Authorization": f"Bearer {token}"}
    
    ctx_url = f"http://127.0.0.1:8000/api/v1/chat/conversations/f4ca344c-074a-4c3a-a7da-317abcf53742/context"
    async with httpx.AsyncClient() as client:
        ctx_res = await client.get(ctx_url, headers=headers)
        print(f"Context Status: {ctx_res.status_code}")
        print(ctx_res.text)

if __name__ == "__main__":
    asyncio.run(main())
