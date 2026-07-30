from app.ai.agents.state import AgentState
from app.services.ai_service import AIService
import json

SUPERVISOR_PROMPT = """You are a Supervisor Agent orchestrating a learning platform.
Given the user's message, decide which specialized agent should handle the request.
Your options are:
- 'tutor': For explaining concepts, answering questions, teaching.
- 'planner': For generating roadmaps, schedules, or learning plans.
- 'quiz': For generating practice questions or tests.
- 'research': For finding external resources or web search (placeholder).

You MUST respond with a JSON object in this exact format:
{
  "next_agent": "tutor" | "planner" | "quiz" | "research"
}
Do not include markdown blocks or any other text.
"""

def create_supervisor_node(ai_service: AIService):
    async def supervisor_node(state: AgentState) -> dict:
        user_message = state.get("user_message", "")
        
        # Call Gemini to decide
        result = await ai_service.chat_with_tutor(
            user_id=state["user_id"],
            message=user_message,
            system_instruction=SUPERVISOR_PROMPT
        )
        
        response_text = result["response_text"].strip()
        
        # Clean up markdown formatting if present
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        try:
            decision = json.loads(response_text)
            next_agent = decision.get("next_agent", "tutor")
        except json.JSONDecodeError:
            # Fallback
            next_agent = "tutor"
            
        return {"next_agent": next_agent}
        
    return supervisor_node
