from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.database.models.user import User
from app.schemas.activity import ActivityCreate, ActivityResponse, SessionCreate, SessionResponse
from app.services.activity_service import ActivityService

router = APIRouter(prefix="/activity", tags=["activity"])

def get_activity_service(db: Session = Depends(get_db)) -> ActivityService:
    return ActivityService(db)

@router.post("/log", response_model=ActivityResponse)
async def log_activity(
    activity_data: ActivityCreate,
    current_user: User = Depends(get_current_user),
    activity_service: ActivityService = Depends(get_activity_service)
):
    """
    Log a distinct learning activity for streak tracking.
    """
    return activity_service.log_activity(current_user.id, activity_data)

@router.post("/session", response_model=SessionResponse)
async def log_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user),
    activity_service: ActivityService = Depends(get_activity_service)
):
    """
    Log a learning session for time spent tracking.
    """
    return activity_service.log_session(current_user.id, session_data)
