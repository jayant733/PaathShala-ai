import uuid
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.database.models.user import User, UserProfile
from app.database.models.memory import UserMemory
from app.database.models.chat import Conversation
from app.database.models.activity import LearningActivity, SessionTracking
from datetime import datetime, timezone, timedelta

class DashboardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_dashboard_data(self, user_id: uuid.UUID) -> Tuple[Optional[User], Optional[UserProfile]]:
        user_res = await self.db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        
        profile_res = await self.db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = profile_res.scalar_one_or_none()
        return user, profile
        
    async def get_knowledge_nodes_count(self, user_id: uuid.UUID) -> int:
        res = await self.db.execute(select(func.count(UserMemory.id)).where(UserMemory.user_id == user_id))
        count = res.scalar()
        return count or 0
        
    async def get_recent_conversations(self, user_id: uuid.UUID, limit: int = 3) -> List[Conversation]:
        stmt = select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.created_at.desc()).limit(limit)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_top_memories(self, user_id: uuid.UUID, limit: int = 5) -> List[UserMemory]:
        stmt = select(UserMemory).where(UserMemory.user_id == user_id).order_by(UserMemory.importance_score.desc()).limit(limit)
        res = await self.db.execute(stmt)
        return list(res.scalars().all())

    async def get_total_learning_time(self, user_id: uuid.UUID) -> int:
        res = await self.db.execute(select(func.sum(SessionTracking.duration_seconds)).where(SessionTracking.user_id == user_id))
        total_seconds = res.scalar()
        return total_seconds or 0

    async def get_learning_streak(self, user_id: uuid.UUID) -> int:
        # Get all distinct dates of learning activity for the user, ordered descending
        stmt = select(func.date(LearningActivity.created_at))\
            .where(LearningActivity.user_id == user_id)\
            .group_by(func.date(LearningActivity.created_at))\
            .order_by(func.date(LearningActivity.created_at).desc())
            
        res = await self.db.execute(stmt)
        activities = res.all()
            
        if not activities:
            return 0
            
        dates = [a[0] for a in activities]
        today = datetime.now(timezone.utc).date()
        
        streak = 0
        current_check = today
        
        if dates and dates[0] == today:
            pass # Streak starts today
        elif dates and dates[0] == today - timedelta(days=1):
            current_check = today - timedelta(days=1)
        else:
            return 0 # No activity today or yesterday, streak is broken
            
        for d in dates:
            if d == current_check:
                streak += 1
                current_check -= timedelta(days=1)
            elif d > current_check:
                continue
            else:
                break
                
        return streak
