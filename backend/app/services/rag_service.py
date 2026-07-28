from uuid import UUID
from typing import Dict, Any, List
from app.services.ai_service import AIService
from app.ai.embeddings.embedding_provider import EmbeddingProvider
from app.repositories.vector_repository import VectorRepository
from app.schemas.document import AskResponse, DocumentChunkResponse

RAG_SYSTEM_PROMPT = """You are a helpful learning assistant.
Answer the user's question based ONLY on the provided document context.
If the context doesn't contain the answer, say "I cannot answer this based on the provided document."
"""

class RAGService:
    def __init__(self, ai_service: AIService, embedder: EmbeddingProvider, vector_repo: VectorRepository):
        self.ai_service = ai_service
        self.embedder = embedder
        self.vector_repo = vector_repo

    async def ask_question(self, user_id: UUID, document_id: UUID, question: str) -> AskResponse:
        # Embed the query
        query_embedding = await self.embedder.create_embedding(question)
        
        # Search the vector database
        relevant_chunks = await self.vector_repo.similarity_search(document_id, query_embedding, limit=5)
        
        if not relevant_chunks:
            return AskResponse(answer="No relevant information found in this document.", sources=[])

        # Construct context
        context = "\n\n---\n\n".join([chunk.content for chunk in relevant_chunks])
        augmented_prompt = f"Context:\n{context}\n\nQuestion: {question}"
        
        # Get answer from AI
        result = await self.ai_service.chat_with_tutor(
            user_id=user_id,
            message=augmented_prompt,
            system_instruction=RAG_SYSTEM_PROMPT
        )
        
        # Prepare response
        sources = [DocumentChunkResponse(chunk_id=chunk.id, content=chunk.content) for chunk in relevant_chunks]
        
        return AskResponse(
            answer=result["response_text"],
            sources=sources
        )
