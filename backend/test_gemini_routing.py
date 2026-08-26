import asyncio
import httpx
from jose import jwt
from app.core.config import settings
import json

async def main():
    user_id = "5f26b713-44bc-4171-a80e-bdf5d462a2e1"
    token = jwt.encode({"sub": user_id}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    url = f"http://127.0.0.1:8000/api/v1/agent/chat/stream"
    payload = {
        "message": "write code for a complex web server in python",
        "ai_mode": "auto"
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream('POST', url, headers=headers, json=payload) as r:
            async for chunk in r.aiter_text():
                print(chunk, end='', flush=True)

if __name__ == "__main__":
    asyncio.run(main())
