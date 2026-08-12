import uuid
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    DashboardResponse, GoalStatus, StreakStatus, LearningTime,
    ContinueLearning, Recommendation, RecentSession
)

from app.services.ai_service import AIService
from app.services.ml import KnowledgeMasteryEngine
from app.ai.agents.recommendation_agent import RecommendationAgent

class DashboardService:
    def __init__(self, repository: DashboardRepository, ai_service: AIService,
                 ml_engine: KnowledgeMasteryEngine = None):
        self.repository = repository
        self.ai_service = ai_service
        self.ml_engine = ml_engine

    async def get_dashboard(self, user_id: uuid.UUID) -> DashboardResponse:
        user, profile = await self.repository.get_user_dashboard_data(user_id)
        
        if not user:
            raise ValueError("User not found")
            
        username = user.username
        
        # Knowledge Nodes & Sessions
        knowledge_nodes_count = await self.repository.get_knowledge_nodes_count(user_id)
        recent_convs = await self.repository.get_recent_conversations(user_id, limit=3)
        streak_days = await self.repository.get_learning_streak(user_id)
        
        is_new_user = (knowledge_nodes_count == 0 and streak_days == 0 and len(recent_convs) == 0)

        if is_new_user:
            return DashboardResponse(
                is_new_user=True,
                username=username,
                goal=None,
                streak=StreakStatus(days=0, message="Start your first learning streak"),
                learning_time=LearningTime(minutes=0),
                knowledge_nodes=0,
                continue_learning=ContinueLearning(empty=True, message="Start your first AI conversation"),
                recommendations=[],
                recent_sessions=[]
            )
            
        # Existing User Logic
        
        # Goal Status
        goal_title = profile.learning_goal if profile and profile.learning_goal else "AI Engineer"
        # Mastery progress is real when the adaptive ML engine is wired in
        # (guarded — falls back to the old placeholder when ML is disabled).
        mastery_rows = []
        if self.ml_engine is not None:
            try:
                mastery_rows = await self.ml_engine.repo.list_topic_mastery(user_id)
            except Exception:
                mastery_rows = []
        if mastery_rows:
            goal_progress = int(round(sum(m.mastery or 0.0 for m in mastery_rows) / len(mastery_rows) * 100))
        else:
            goal_progress = 65  # placeholder (no ML data yet)
        
        recent_sessions = []
        for conv in recent_convs:
            # Simple date formatting for now
            date_str = conv.created_at.strftime("%b %d, %Y") if conv.created_at else "Recently"
            recent_sessions.append(
                RecentSession(
                    title=conv.title or "New Conversation",
                    date=date_str
                )
            )
            
        # Streak and Learning Time
        streak = StreakStatus(days=streak_days)
        
        total_seconds = await self.repository.get_total_learning_time(user_id)
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        learning_time = LearningTime(hours=int(hours), minutes=int(minutes))
        
        # AI Generation
        agent = RecommendationAgent(self.ai_service)
        
        # Format context
        conv_context = [c.title for c in recent_convs if c.title]
        raw_memories = await self.repository.get_top_memories(user_id)
        mem_context = [f"Knows: {m.content}" if m.memory_type == 'knowledge' else f"Needs: {m.content}" for m in raw_memories]

        # Mastery gaps (weak topics first) ground the AI recommendations in real data
        mastery_context = [
            f"{m.topic}: mastery {m.mastery:.0%}, confidence {m.confidence:.0%}"
            for m in sorted(mastery_rows, key=lambda r: r.mastery or 0.0)[:6]
        ] if mastery_rows else None

        # Invoke LLM
        try:
            agent_output = await agent.generate_recommendations(conv_context, mem_context, mastery_context)
            continue_learning = ContinueLearning(
                empty=False,
                title=agent_output.continue_learning_title, 
                progress=agent_output.continue_learning_progress
            )
            recommendations = agent_output.recommendations
        except Exception as e:
            # Fallback if AI generation fails
            continue_learning = ContinueLearning(empty=False, title="Continue your learning journey", progress=20)
            recommendations = [Recommendation(title="Introduction to Machine Learning", reason="A great starting point for AI enthusiasts.")]
        
        return DashboardResponse(
            is_new_user=False,
            username=username,
            goal=GoalStatus(title=goal_title, progress=goal_progress),
            streak=streak,
            learning_time=learning_time,
            knowledge_nodes=knowledge_nodes_count,
            continue_learning=continue_learning,
            recommendations=recommendations,
            recent_sessions=recent_sessions
        )
