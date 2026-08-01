import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5432/paathshala')
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT email, username, is_active FROM users"))
        print(res.fetchall())

if __name__ == '__main__':
    asyncio.run(main())
