from app.ai.agents.state import AgentState
from app.services.ai_service import AIService

QUIZ_PROMPT = """You are a Quiz Generation Agent.
Your job is to generate practice questions to test the user's knowledge.
Include a mix of multiple-choice and conceptual questions, followed by an answer key.
"""

def create_quiz_node(ai_service: AIService):
    async def quiz_node(state: AgentState) -> dict:
        user_message = state.get("user_message", "")
        
        context = ""
        if state.get("user_memories"):
            context += "User Knowledge & Weaknesses:\n" + "\n".join([m["content"] for m in state["user_memories"]]) + "\n\n"
        
        result = await ai_service.chat_with_tutor(
            user_id=state["user_id"],
            message=f"{context}Generate a quiz for: {user_message}",
            system_instruction=QUIZ_PROMPT
        )
        
        return {"agent_response": result["response_text"]}
        
    return quiz_node
