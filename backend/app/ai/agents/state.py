from typing import TypedDict, Optional, List, Dict, Any
from uuid import UUID

class AgentState(TypedDict):
    """
    Shared state for the LangGraph agents.
    """
    user_id: UUID
    conversation_id: Optional[UUID]
    user_message: str
    
    # Context injected by tools/services
    current_goal: Optional[str]
    learning_context: Optional[str]
    retrieved_documents: List[Dict[str, Any]]
    
    # Memory Context
    user_memories: List[Dict[str, Any]]
    learning_history: List[Dict[str, Any]]
    user_preferences: Dict[str, Any]
    
    # Outputs
    agent_response: str
    next_agent: str
