import asyncio
import json
import httpx
from jose import jwt
from app.core.config import settings

async def main():
    user_id = "5f26b713-44bc-4171-a80e-bdf5d462a2e1"
    token = jwt.encode({"sub": user_id}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    url = "http://127.0.0.1:8000/api/v1/agent/chat/stream"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "message": "PRINT_KEY",
        "ai_mode": "manual",
        "provider": "gemini",
        "model_name": "gemini-flash-latest"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                print(f"Status: {response.status_code}")
                async for chunk in response.aiter_text():
                    print(chunk)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
