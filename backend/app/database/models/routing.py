import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database.models import Base

class RoutingRule(Base):
    """A user-defined, condition-based routing rule for the AI tutor.

    Rules are evaluated in priority order (lower priority first) when the
    chat is in "auto" mode. The first enabled rule whose condition matches
    the incoming user message decides which provider/model actually runs.
    """
    __tablename__ = "routing_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    priority = Column(Integer, default=0)  # lower = evaluated first
    name = Column(String, default="")
    condition_type = Column(String, nullable=False)  # message_contains | message_regex | always
    condition_value = Column(String, nullable=True)
    provider = Column(String, nullable=False)  # gemini | ollama
    model = Column(String, nullable=True)  # None = provider default
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
