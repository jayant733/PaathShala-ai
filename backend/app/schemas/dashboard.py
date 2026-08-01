from pydantic import BaseModel
from typing import List, Optional

class GoalStatus(BaseModel):
    title: str
    progress: int

class StreakStatus(BaseModel):
    days: int
    message: Optional[str] = None

class LearningTime(BaseModel):
    hours: Optional[int] = None
    minutes: int

class ContinueLearning(BaseModel):
    empty: Optional[bool] = False
    message: Optional[str] = None
    title: Optional[str] = None
    progress: Optional[int] = None

class Recommendation(BaseModel):
    title: str
    reason: str

class RecentSession(BaseModel):
    title: str
    date: str

class DashboardResponse(BaseModel):
    is_new_user: bool
    username: str
    goal: Optional[GoalStatus] = None
    streak: StreakStatus
    learning_time: LearningTime
    knowledge_nodes: int
    continue_learning: Optional[ContinueLearning] = None
    recommendations: List[Recommendation]
    recent_sessions: List[RecentSession]
