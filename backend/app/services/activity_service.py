import uuid
from sqlalchemy.orm import Session
from app.database.models.activity import LearningActivity, SessionTracking
from app.schemas.activity import ActivityCreate, ActivityResponse, SessionCreate, SessionResponse

class ActivityService:
    def __init__(self, db: Session):
        self.db = db

    def log_activity(self, user_id: uuid.UUID, activity_data: ActivityCreate) -> ActivityResponse:
        activity = LearningActivity(
            user_id=user_id,
            activity_type=activity_data.activity_type
        )
        self.db.add(activity)
        self.db.commit()
        return ActivityResponse(status="success", message="Activity logged successfully")

    def log_session(self, user_id: uuid.UUID, session_data: SessionCreate) -> SessionResponse:
        session_tracking = SessionTracking(
            user_id=user_id,
            session_start=session_data.session_start,
            session_end=session_data.session_end,
            duration_seconds=session_data.duration_seconds
        )
        self.db.add(session_tracking)
        self.db.commit()
        return SessionResponse(status="success", message="Session logged successfully")
