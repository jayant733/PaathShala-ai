import asyncio
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv()

async def main():
    engine = create_async_engine(os.environ['DATABASE_URL'])
    async with engine.begin() as conn:
        # Get user
        result = await conn.execute(text("SELECT id FROM users WHERE email = 'jayantsharma3228@gmail.com'"))
        user = result.first()
        if not user:
            print("User not found.")
            return
        user_id = user[0]
        
        # Insert learning activity for today and yesterday (streak = 2)
        today = datetime.now(timezone.utc)
        yesterday = today - timedelta(days=1)
        
        await conn.execute(text(
            f"INSERT INTO learning_activities (id, user_id, activity_type, created_at) "
            f"VALUES (gen_random_uuid(), '{user_id}', 'chat', '{yesterday.isoformat()}')"
        ))
        await conn.execute(text(
            f"INSERT INTO learning_activities (id, user_id, activity_type, created_at) "
            f"VALUES (gen_random_uuid(), '{user_id}', 'chat', '{today.isoformat()}')"
        ))
        
        # Insert session tracking for 2 hours (7200 seconds)
        await conn.execute(text(
            f"INSERT INTO session_tracking (id, user_id, session_start, session_end, duration_seconds, created_at) "
            f"VALUES (gen_random_uuid(), '{user_id}', '{yesterday.isoformat()}', '{today.isoformat()}', 7200, '{today.isoformat()}')"
        ))
        
    print("Test data inserted successfully.")

asyncio.run(main())
