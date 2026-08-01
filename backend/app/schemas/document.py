from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentChunkResponse(BaseModel):
    chunk_id: UUID
    content: str
    
    model_config = ConfigDict(from_attributes=True)

class DocumentRead(BaseModel):
    id: UUID
    filename: str
    file_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    answer: str
    sources: List[DocumentChunkResponse]
