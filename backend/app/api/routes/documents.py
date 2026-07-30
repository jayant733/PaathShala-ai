from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from app.api.dependencies import get_current_user, get_document_service, get_rag_service
from app.database.models.user import User
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService
from app.schemas.document import DocumentRead, AskRequest, AskResponse

router = APIRouter(prefix="/documents", tags=["documents"])

from typing import Optional
from sqlalchemy.future import select
from app.database.models.chat import Conversation

@router.post("/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: Optional[UUID] = Form(None),
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service)
):
    """
    Upload a document and process it for RAG.
    """
    try:
        db_document = await document_service.upload_and_process_document(current_user.id, file)
        
        if conversation_id:
            stmt = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id
            )
            result = await document_service.session.execute(stmt)
            conv = result.scalar_one_or_none()
            if conv:
                conv.document_id = db_document.id
                await document_service.session.commit()
                
        return db_document
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error uploading document: {e}\n{traceback.format_exc()}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/{document_id}/ask", response_model=AskResponse)
async def ask_question(
    document_id: UUID,
    request: AskRequest,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    rag_service: RAGService = Depends(get_rag_service)
):
    """
    Ask a question based on a specific document.
    """
    # Verify the document belongs to the user
    await document_service.get_document_by_id(document_id, current_user.id)
    
    return await rag_service.ask_question(current_user.id, document_id, request.question)
