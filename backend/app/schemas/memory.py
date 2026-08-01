from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import datetime

class MemoryResponse(BaseModel):
    type: str
    content: str

class MemoryListResponse(BaseModel):
    memories: List[MemoryResponse]
