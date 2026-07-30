from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user, get_ai_service
from app.database.models.user import User
from app.repositories.dashboard_repository import DashboardRepository
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_dashboard_service(
    db: Session = Depends(get_db), 
    ai_service: AIService = Depends(get_ai_service)
) -> DashboardService:
    repository = DashboardRepository(db)
    return DashboardService(repository, ai_service)

@router.get("", response_model=DashboardResponse)
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """
    Get aggregated dashboard data for the current user.
    """
    return await dashboard_service.get_dashboard(current_user.id)
