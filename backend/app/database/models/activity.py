import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.models import Base

class LearningActivity(Base):
    __tablename__ = "learning_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False) # 'chat', 'document_read', 'quiz_completed', 'agent_session'
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="learning_activities")

class SessionTracking(Base):
    __tablename__ = "session_tracking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_start = Column(DateTime(timezone=True), nullable=False)
    session_end = Column(DateTime(timezone=True), nullable=False)
    duration_seconds = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="sessions")
