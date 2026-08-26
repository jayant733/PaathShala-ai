import asyncio
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.database.models.chat import Conversation, Message

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Conversation))
        convs = res.scalars().all()
        for c in convs:
            print(f"Conv: {c.id} - {c.title}")
            msgs = await db.execute(select(Message).where(Message.conversation_id == c.id))
            for m in msgs.scalars().all():
                print(f"  {m.role}: {m.content[:50]}")

asyncio.run(check())
