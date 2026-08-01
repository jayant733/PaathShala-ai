from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class ConversationItem(BaseModel):
    id: UUID
    title: str
    last_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationListResponse(BaseModel):
    conversations: List[ConversationItem]

class ChatMessage(BaseModel):
    id: UUID
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationMessagesResponse(BaseModel):
    messages: List[ChatMessage]

class ConversationContextResponse(BaseModel):
    focus: Optional[str] = None
    topics: List[str] = []
    memories: List[str] = []
