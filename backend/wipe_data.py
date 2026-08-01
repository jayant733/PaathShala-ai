import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import delete
from app.database.models import UserMemory, Conversation, Message
from app.database.models.activity import LearningActivity, SessionTracking

load_dotenv()

async def wipe_data():
    engine = create_async_engine(os.environ['DATABASE_URL'])
    async with AsyncSession(engine) as session:
        await session.execute(delete(Message))
        await session.execute(delete(LearningActivity))
        await session.execute(delete(SessionTracking))
        await session.execute(delete(UserMemory))
        await session.execute(delete(Conversation))
        await session.commit()
        print("Successfully wiped user history, learning activities, sessions, and memories!")

if __name__ == "__main__":
    asyncio.run(wipe_data())
