from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, delete

from app.api.dependencies import get_current_user, get_db
from app.database.models.user import User
from app.database.models.chat import Conversation, Message
from app.database.models.memory import UserMemory
from app.schemas.chat import (
    ConversationListResponse,
    ConversationItem,
    ConversationMessagesResponse,
    ChatMessage,
    ConversationContextResponse
)
from app.repositories.memory_repository import MemoryRepository

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all conversations for the current user.
    """
    stmt = select(Conversation).where(Conversation.user_id == current_user.id).order_by(desc(Conversation.created_at))
    result = await db.execute(stmt)
    conversations = result.scalars().all()
    
    # We would ideally get the last message for the preview, but for now we'll just return the title
    items = []
    for conv in conversations:
        items.append(ConversationItem(
            id=conv.id,
            title=conv.title or "New Conversation",
            last_message=None, # Optimization: could join messages later
            created_at=conv.created_at
        ))
        
    return ConversationListResponse(conversations=items)

@router.get("/conversations/{conversation_id}/messages", response_model=ConversationMessagesResponse)
async def get_conversation_messages(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get messages for a specific conversation.
    """
    # Verify ownership
    stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
    stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    return ConversationMessagesResponse(messages=messages)

@router.get("/conversations/{conversation_id}/context", response_model=ConversationContextResponse)
async def get_conversation_context(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get context (topics, focus, memory) for a specific conversation.
    """
    # Verify ownership and load conversation with document
    from sqlalchemy.orm import selectinload
    stmt = select(Conversation).options(selectinload(Conversation.document)).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()
    
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
    focus_name = conv.document.filename if conv.document else None
        
    # Fetch recent topics and memories
    memory_repo = MemoryRepository(db)
    
    # We fetch the latest learning events to use as topics
    learning_events = await memory_repo.get_learning_events(current_user.id, limit=5)
    topics = list(set([event.topic for event in learning_events]))
    
    # Fetch recent user memories SCOPED TO THIS CONVERSATION
    user_memories = await memory_repo.get_conversation_memories(conversation_id, limit=20)
    memories = [mem.content for mem in user_memories]

    return ConversationContextResponse(
        focus=focus_name,
        topics=topics,
        memories=memories
    )

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a conversation owned by the current user.
    """
    stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
    result = await db.execute(stmt)
    conv = result.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # Clear conversation-scoped memories first (FK is ON DELETE SET NULL)
    await db.execute(delete(UserMemory).where(UserMemory.conversation_id == conversation_id))

    # Messages cascade via the Conversation relationship
    await db.delete(conv)
    await db.commit()

