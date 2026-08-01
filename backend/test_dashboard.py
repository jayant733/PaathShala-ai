import asyncio
import os
from dotenv import load_dotenv
import httpx

load_dotenv()

async def test_dashboard():
    async with httpx.AsyncClient() as client:
        # Register user (if exists, ignore error)
        user_data = {"email": "testdash@gmail.com", "username": "testdash", "password": "password"}
        res = await client.post("http://localhost:8000/api/v1/auth/register", json=user_data)
        
        # Login
        form_data = {"username": "testdash@gmail.com", "password": "password"}
        res = await client.post("http://localhost:8000/api/v1/auth/login", data=form_data)
        token = res.json().get("access_token")
        
        if not token:
            print("Failed to login", res.json())
            return
            
        # Get dashboard
        headers = {"Authorization": f"Bearer {token}"}
        res = await client.get("http://localhost:8000/api/v1/dashboard", headers=headers)
        print(res.status_code)
        print(res.text)

if __name__ == "__main__":
    asyncio.run(test_dashboard())
