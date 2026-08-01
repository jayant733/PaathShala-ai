from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=(settings.ENVIRONMENT == "development"))

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
