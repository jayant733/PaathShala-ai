from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.config import settings
from app.database.session import get_db
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.services.ai_service import AIService
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService
from app.services.document_processor import DocumentProcessor
from app.services.chunking_service import ChunkingService
from app.services.agent_service import AgentService
from app.services.memory_service import MemoryService
from app.ai.agents.tools import AgentTools
from app.repositories.ai_repository import AIRepository
from app.repositories.vector_repository import VectorRepository
from app.repositories.memory_repository import MemoryRepository
from app.ai.embeddings.gemini import GeminiEmbeddingProvider
from app.ai.providers import ProviderManager
from app.database.models.user import User
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(session)

def get_user_service(repository: UserRepository = Depends(get_user_repository)) -> UserService:
    return UserService(repository)

def get_auth_service(repository: UserRepository = Depends(get_user_repository)) -> AuthService:
    return AuthService(repository)

def get_ai_repository(session: AsyncSession = Depends(get_db)) -> AIRepository:
    return AIRepository(session)

def get_ai_service(repository: AIRepository = Depends(get_ai_repository)) -> AIService:
    provider = ProviderManager()
    return AIService(provider=provider, repository=repository)

def get_vector_repository(session: AsyncSession = Depends(get_db)) -> VectorRepository:
    return VectorRepository(session)

def get_memory_repository(session: AsyncSession = Depends(get_db)) -> MemoryRepository:
    return MemoryRepository(session)

def get_embedding_provider() -> GeminiEmbeddingProvider:
    return GeminiEmbeddingProvider()

def get_document_processor() -> DocumentProcessor:
    return DocumentProcessor()

def get_chunking_service() -> ChunkingService:
    return ChunkingService()

def get_document_service(
    session: AsyncSession = Depends(get_db),
    processor: DocumentProcessor = Depends(get_document_processor),
    chunker: ChunkingService = Depends(get_chunking_service),
    embedder: GeminiEmbeddingProvider = Depends(get_embedding_provider),
    vector_repo: VectorRepository = Depends(get_vector_repository)
) -> DocumentService:
    return DocumentService(session, processor, chunker, embedder, vector_repo)

def get_rag_service(
    ai_service: AIService = Depends(get_ai_service),
    embedder: GeminiEmbeddingProvider = Depends(get_embedding_provider),
    vector_repo: VectorRepository = Depends(get_vector_repository)
) -> RAGService:
    return RAGService(ai_service, embedder, vector_repo)

def get_memory_service(
    ai_service: AIService = Depends(get_ai_service),
    embedder: GeminiEmbeddingProvider = Depends(get_embedding_provider),
    memory_repository: MemoryRepository = Depends(get_memory_repository)
) -> MemoryService:
    return MemoryService(ai_service, embedder, memory_repository)

def get_agent_tools(
    rag_service: RAGService = Depends(get_rag_service),
    user_service: UserService = Depends(get_user_service),
    memory_repository: MemoryRepository = Depends(get_memory_repository),
    embedder: GeminiEmbeddingProvider = Depends(get_embedding_provider)
) -> AgentTools:
    return AgentTools(rag_service, user_service, memory_repository, embedder)

def get_agent_service(
    session: AsyncSession = Depends(get_db),
    ai_service: AIService = Depends(get_ai_service),
    tools: AgentTools = Depends(get_agent_tools),
    memory_service: MemoryService = Depends(get_memory_service),
    memory_repository: MemoryRepository = Depends(get_memory_repository)
) -> AgentService:
    return AgentService(session, ai_service, tools, memory_service, memory_repository)

async def get_current_user(



    token: str = Depends(oauth2_scheme),
    user_service: UserService = Depends(get_user_service)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        sub: str = payload.get("sub")
        if sub is None:
            raise credentials_exception
        token_data = TokenPayload(sub=sub)
    except JWTError:
        raise credentials_exception
        
    try:
        user_id = UUID(token_data.sub)
    except ValueError:
        raise credentials_exception

    try:
        user = await user_service.get_user_by_id(user_id)
    except HTTPException:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user
