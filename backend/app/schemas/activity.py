from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActivityCreate(BaseModel):
    activity_type: str

class ActivityResponse(BaseModel):
    status: str
    message: str

class SessionCreate(BaseModel):
    session_start: datetime
    session_end: datetime
    duration_seconds: int

class SessionResponse(BaseModel):
    status: str
    message: str
