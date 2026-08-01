import os

base_dir = r"c:/Users/jayan/Downloads/PathShala/backend"

files = {
    "requirements.txt": """fastapi>=0.109.0
uvicorn>=0.27.0
sqlalchemy>=2.0.25
asyncpg>=0.29.0
alembic>=1.13.1
pydantic>=2.5.3
pydantic-settings>=2.1.0
redis>=5.0.1
""",
    ".env.example": """DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/paathshala
GEMINI_API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
""",
    "Dockerfile": """FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
""",
    "docker-compose.yml": """version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/paathshala
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: ankane/pgvector:v0.5.1
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: paathshala
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
""",
    "README.md": """# PaathShal AI Backend

## Project Overview
PaathShal AI is a production-grade Agentic AI Learning Platform. This backend provides the foundation for uploading resources, generating lessons, tracking progress, and communicating with multi-agent workflows.

## Architecture
The backend is built with:
- **FastAPI**: High-performance async web framework.
- **PostgreSQL + pgvector**: Relational database with vector similarity search capabilities.
- **Redis**: Caching and background task queues (prepared).
- **Clean Architecture**: Separation of concerns into routers (API), core logic, services, and data layers.

## Local Setup
1. Create a virtual environment: `python -m venv venv`
2. Activate it: `source venv/bin/activate` (or `venv\\Scripts\\activate` on Windows)
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill in your values.
5. Run the app: `uvicorn app.main:app --reload`

## Docker Setup
To run the entire stack (FastAPI, PostgreSQL with pgvector, Redis):
```bash
docker compose up --build
```
The API will be available at `http://localhost:8000`.

## Environment Variables
- `DATABASE_URL`: Connection string for PostgreSQL.
- `GEMINI_API_KEY`: API key for Gemini models.
- `REDIS_URL`: Connection string for Redis.
- `ENVIRONMENT`: Environment mode (e.g., development, production).

## Future Roadmap
- Alembic database migrations configuration.
- Authentication and security.
- Gemini integration via the AI module.
- Vector embeddings extraction and storage.
- Multi-agent workflow capabilities.
""",
    "app/main.py": """from fastapi import FastAPI
from app.core.config import settings
from app.api.routes import health

app = FastAPI(
    title="PaathShal AI API",
    version="0.1.0",
    description="Agentic AI Learning Platform Backend"
)

app.include_router(health.router)
""",
    "app/core/config.py": """from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    REDIS_URL: str
    GEMINI_API_KEY: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
""",
    "app/core/security.py": """# Security utilities (e.g., password hashing, JWT token generation) will be placed here.
""",
    "app/core/logging.py": """import logging

def setup_logging():
    logging.basicConfig(level=logging.INFO)
    return logging.getLogger("paathshala")

logger = setup_logging()
""",
    "app/database/session.py": """from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
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
""",
    "app/database/models/__init__.py": """from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here so Alembic can discover them
""",
    "app/api/routes/health.py": """from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Paradigm AI backend"
    }
""",
    "app/api/routes/__init__.py": """# API Routes
""",
    "app/schemas/__init__.py": """# Pydantic schemas for request and response models
""",
    "app/services/__init__.py": """# Business logic and service layer
""",
    "app/repositories/__init__.py": """# Database operations
""",
    "app/ai/llm/provider.py": """from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str) -> str:
        \"\"\"Generate a response from the LLM based on the prompt.\"\"\"
        pass
""",
    "app/ai/llm/__init__.py": """from .provider import LLMProvider
""",
    "app/ai/embeddings/__init__.py": """# Embeddings service abstractions
""",
    "app/ai/agents/__init__.py": """# Multi-agent workflows
""",
    "app/utils/__init__.py": """# Helper functions and utilities
""",
    "app/database/migrations/README.md": """# Alembic Migrations
Migrations will be placed here.
"""
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Project structure created successfully.")
