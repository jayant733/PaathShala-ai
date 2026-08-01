from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database.models.user import User, UserProfile
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email).options(selectinload(User.profile), selectinload(User.ai_preferences))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = select(User).where(User.username == username).options(selectinload(User.profile), selectinload(User.ai_preferences))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
        
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        stmt = select(User).where(User.id == user_id).options(selectinload(User.profile), selectinload(User.ai_preferences))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, user_in: UserCreate) -> User:
        db_user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
        )
        self.session.add(db_user)
        await self.session.flush()
        
        # Create empty profile
        db_profile = UserProfile(user_id=db_user.id)
        self.session.add(db_profile)
        await self.session.commit()
        
        # Fetch the user again to eager load the profile relationship
        return await self.get_by_id(db_user.id)
