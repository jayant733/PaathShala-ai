from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate
from app.schemas.auth import Token
from app.core.security import verify_password, create_access_token
from app.database.models.user import User

class AuthService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    async def register_user(self, user_in: UserCreate) -> User:
        existing_email = await self.repository.get_by_email(user_in.email)
        if existing_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
            
        existing_username = await self.repository.get_by_username(user_in.username)
        if existing_username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
            
        return await self.repository.create(user_in)

    async def authenticate_user(self, form_data: OAuth2PasswordRequestForm) -> Token:
        user = await self.repository.get_by_email(form_data.username)
        if not user:
            # Fallback to checking by username since OAuth2 uses 'username' field
            user = await self.repository.get_by_username(form_data.username)
            
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email/username or password")
            
        if not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email/username or password")
            
        access_token = create_access_token(subject=user.id)
        return Token(access_token=access_token, token_type="bearer")
