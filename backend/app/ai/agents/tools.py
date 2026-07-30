from typing import List, Dict, Any
from uuid import UUID
from app.services.rag_service import RAGService
from app.services.user_service import UserService
from app.repositories.memory_repository import MemoryRepository
from app.ai.embeddings.embedding_provider import EmbeddingProvider

class AgentTools:
    def __init__(
        self, 
        rag_service: RAGService, 
        user_service: UserService, 
        memory_repository: MemoryRepository,
        embedder: EmbeddingProvider
    ):
        self.rag_service = rag_service
        self.user_service = user_service
        self.memory_repository = memory_repository
        self.embedder = embedder

    async def retrieve_documents(self, user_id: UUID, document_id: UUID, query: str) -> List[Dict[str, Any]]:
        """
        Tool to search vector database for relevant chunks.
        """
        response = await self.rag_service.ask_question(user_id, document_id, query)
        # return the raw sources since ask_question generates a final answer, 
        # but for an agent tool, we might just want to use the vector repo directly.
        # However, following the instruction to wrap existing services:
        return [
            {"chunk_id": str(source.chunk_id), "content": source.content} 
            for source in response.sources
        ]

    async def get_user_profile(self, user_id: UUID) -> Dict[str, Any]:
        """
        Fetch the user's profile to adapt learning.
        """
        user = await self.user_service.get_user(user_id)
        if user and user.profile:
            return {
                "bio": user.profile.bio,
                "learning_goals": user.profile.learning_goals,
                "preferred_difficulty": user.profile.preferred_difficulty
            }
        return {}

    async def retrieve_user_memory(self, user_id: UUID, query: str) -> List[Dict[str, Any]]:
        """
        Search user memories semantically based on a query.
        """
        query_embedding = await self.embedder.create_embedding(query)
        memories = await self.memory_repository.search_memories(user_id, query_embedding, limit=5)
        
        return [
            {
                "memory_type": m.memory_type,
                "content": m.content,
                "importance": m.importance_score
            }
            for m in memories
        ]
