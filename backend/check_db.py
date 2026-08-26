import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5432/paathshala')
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE user_memories ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL"))
            print("Added conversation_id column successfully")
        except Exception as e:
            print("Error adding column:", e)

if __name__ == '__main__':
    asyncio.run(main())
