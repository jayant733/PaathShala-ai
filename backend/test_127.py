import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post('http://127.0.0.1:8000/api/v1/chat/stream', json={'message':'hi','ai_mode':'auto'})
        print(res.text)

asyncio.run(test())
