from typing import Optional
from uuid import UUID
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.database.models.user import User

class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def get_user_by_id(self, user_id: UUID) -> User:
        user = await self.repository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        return await self.repository.get_by_email(email)
