import asyncio
from sqlalchemy import select
from app.database.session import engine
from app.database.models.user import User

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(select(User.id, User.email, User.username))
        users = result.fetchall()
        for u in users:
            print(f"User: id={u.id}, email={u.email}, username={u.username}")

if __name__ == "__main__":
    asyncio.run(main())
