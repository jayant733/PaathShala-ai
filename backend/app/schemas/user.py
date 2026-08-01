from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class UserProfileBase(BaseModel):
    learning_goal: Optional[str] = None
    experience_level: Optional[str] = None
    preferred_learning_style: Optional[str] = None
    weekly_learning_hours: Optional[int] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileRead(UserProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserAIPreferenceBase(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    mode: Optional[str] = "auto"

class UserAIPreferenceUpdate(UserAIPreferenceBase):
    pass

class UserAIPreferenceRead(UserAIPreferenceBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    profile: Optional[UserProfileRead] = None
    ai_preferences: Optional[UserAIPreferenceRead] = None

    model_config = ConfigDict(from_attributes=True)
