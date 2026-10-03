import asyncio
from sqlalchemy import text
from app.database.session import engine
from app.core.security import get_password_hash

async def update():
    async with engine.begin() as conn:
        h = get_password_hash("password123")
        await conn.execute(
            text("UPDATE users SET hashed_password = :h WHERE email = 'test@example.com'"),
            {"h": h}
        )
        print("Updated test@example.com password to password123 successfully.")

if __name__ == "__main__":
    asyncio.run(update())
