from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models here so Alembic can discover them
from app.database.models.user import User, UserProfile
from app.database.models.ai import AIInteraction
from app.database.models.document import Document, DocumentChunk
from app.database.models.chat import Conversation, Message
from app.database.models.memory import UserMemory, LearningEvent
from app.database.models.activity import LearningActivity, SessionTracking
from app.database.models.routing import RoutingRule
