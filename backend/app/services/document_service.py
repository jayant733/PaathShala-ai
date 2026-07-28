import os
import aiofiles
from uuid import UUID
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database.models.document import Document
from app.services.document_processor import DocumentProcessor
from app.services.chunking_service import ChunkingService
from app.ai.embeddings.embedding_provider import EmbeddingProvider
from app.repositories.vector_repository import VectorRepository

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DocumentService:
    def __init__(self, session: AsyncSession, processor: DocumentProcessor, chunker: ChunkingService, embedder: EmbeddingProvider, vector_repo: VectorRepository):
        self.session = session
        self.processor = processor
        self.chunker = chunker
        self.embedder = embedder
        self.vector_repo = vector_repo

    async def get_document_by_id(self, document_id: UUID, user_id: UUID) -> Document:
        stmt = select(Document).where(Document.id == document_id, Document.user_id == user_id)
        result = await self.session.execute(stmt)
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        return doc

    async def upload_and_process_document(self, user_id: UUID, file: UploadFile) -> Document:
        # Validate file
        allowed_types = ["application/pdf", "text/plain", "text/markdown"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, TXT, and MD are allowed.")
            
        file_path = os.path.join(UPLOAD_DIR, f"{user_id}_{file.filename}")
        
        # Save file
        try:
            async with aiofiles.open(file_path, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

        # Create document record
        db_document = Document(
            user_id=user_id,
            filename=file.filename,
            file_type=file.content_type,
            file_path=file_path,
            status="processing"
        )
        self.session.add(db_document)
        await self.session.flush()

        try:
            # Extract text
            text = self.processor.extract_text(file_path, file.content_type)
            
            # Chunk text
            chunks = self.chunker.chunk_text(text)
            
            # Embed chunks
            embeddings = await self.embedder.create_embeddings(chunks)
            
            # Save to vector database
            await self.vector_repo.save_chunks_with_embeddings(db_document.id, chunks, embeddings)
            
            db_document.status = "completed"
        except Exception as e:
            db_document.status = "failed"
            raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
        finally:
            await self.session.commit()
            await self.session.refresh(db_document)
            
        return db_document
