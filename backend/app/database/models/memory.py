import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database.models import Base

class UserMemory(Base):
    __tablename__ = "user_memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True, index=True)
    memory_type = Column(String, nullable=False) # 'profile', 'knowledge', 'preference', 'achievement'
    content = Column(Text, nullable=False)
    importance_score = Column(Float, default=1.0)
    embedding = Column(Vector(768)) # For semantic retrieval
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="memories")

class LearningEvent(Base):
    __tablename__ = "learning_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    topic = Column(String, nullable=False)
    event_type = Column(String, nullable=False) # 'learned', 'struggled', 'completed', 'review_needed'
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="learning_events")
