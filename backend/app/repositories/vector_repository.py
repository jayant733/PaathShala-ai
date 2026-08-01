from typing import List, Tuple
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from app.database.models.document import DocumentChunk

class VectorRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_chunks_with_embeddings(self, document_id: UUID, chunks: List[str], embeddings: List[List[float]]):
        """
        Save document chunks and their embeddings to the database.
        """
        db_chunks = [
            DocumentChunk(
                document_id=document_id,
                content=chunk,
                chunk_index=i,
                embedding=embedding
            )
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        self.session.add_all(db_chunks)
        await self.session.commit()

    async def similarity_search(self, document_id: UUID, query_embedding: List[float], limit: int = 5) -> List[DocumentChunk]:
        """
        Perform a cosine similarity search on the chunks of a specific document.
        """
        # Using pgvector <=> operator for cosine distance
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
