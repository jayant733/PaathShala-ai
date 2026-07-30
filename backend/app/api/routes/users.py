from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.schemas.user import UserRead, UserAIPreferenceRead, UserAIPreferenceUpdate
from app.database.models.user import User, UserAIPreference
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserRead)
async def get_users_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user profile.
    """
    return current_user

@router.get("/me/ai-preferences", response_model=UserAIPreferenceRead)
async def get_user_ai_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UserAIPreference).filter(UserAIPreference.user_id == current_user.id))
    pref = result.scalar_one_or_none()
    if not pref:
        pref = UserAIPreference(user_id=current_user.id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
    return pref

@router.put("/me/ai-preferences", response_model=UserAIPreferenceRead)
async def update_user_ai_preferences(
    pref_in: UserAIPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UserAIPreference).filter(UserAIPreference.user_id == current_user.id))
    pref = result.scalar_one_or_none()
    if not pref:
        pref = UserAIPreference(user_id=current_user.id)
        db.add(pref)
    
    if pref_in.provider is not None:
        pref.provider = pref_in.provider
    if pref_in.model is not None:
        pref.model = pref_in.model
    if pref_in.mode is not None:
        pref.mode = pref_in.mode
        
    await db.commit()
    await db.refresh(pref)
    return pref
