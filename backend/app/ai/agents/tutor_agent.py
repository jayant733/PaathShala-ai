from app.ai.agents.state import AgentState
from app.services.ai_service import AIService
from app.ai.agents.tools import AgentTools

TUTOR_PROMPT = """You are an AI Tutor.
Your job is to explain concepts clearly, patiently, and adaptively.
If you have retrieved documents in the context, use them to ground your answer.
"""

def create_tutor_node(ai_service: AIService, tools: AgentTools):
    async def tutor_node(state: AgentState) -> dict:
        user_message = state.get("user_message", "")
        
        # Here we could optionally use tools.get_user_profile(state["user_id"]) to customize the prompt
        
        context = ""
        if state.get("retrieved_documents"):
            context += "Document Context:\n" + "\n".join([doc["content"] for doc in state["retrieved_documents"]]) + "\n\n"
            
        if state.get("user_memories"):
            context += "User Memory Context:\n" + "\n".join([m["content"] for m in state["user_memories"]]) + "\n\n"
            
        full_message = f"{context}User: {user_message}"
        
        result = await ai_service.chat_with_tutor(
            user_id=state["user_id"],
            message=full_message,
            system_instruction=TUTOR_PROMPT
        )
        
        return {"agent_response": result["response_text"]}
        
    return tutor_node
