from app.ai.agents.state import AgentState
from app.services.ai_service import AIService
from app.services.study_guardrail_service import STUDY_ONLY_SYSTEM_RULES

PLANNER_PROMPT = """You are a Learning Planner Agent.
Your job is to generate a structured learning roadmap based on the user's goals.
Break the learning path down into logical steps (e.g., Week 1, Week 2).
""" + STUDY_ONLY_SYSTEM_RULES

def create_planner_node(ai_service: AIService):
    async def planner_node(state: AgentState) -> dict:
        user_message = state.get("user_message", "")
        
        context = ""
        if state.get("user_memories"):
            context += "User Background & Goals:\n" + "\n".join([m["content"] for m in state["user_memories"]]) + "\n\n"
        
        result = await ai_service.chat_with_tutor(
            user_id=state["user_id"],
            message=f"{context}Create a learning roadmap for: {user_message}",
            system_instruction=PLANNER_PROMPT
        )
        
        return {"agent_response": result["response_text"]}
        
    return planner_node
