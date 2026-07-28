from uuid import UUID
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.agents.state import AgentState
from app.ai.agents.graph import create_agent_graph
from app.services.ai_service import AIService
from app.ai.agents.tools import AgentTools
from app.database.models.chat import Conversation, Message
from app.services.memory_service import MemoryService
from app.repositories.memory_repository import MemoryRepository
from sqlalchemy.future import select
import asyncio

class AgentService:
    def __init__(self, session: AsyncSession, ai_service: AIService, tools: AgentTools, memory_service: MemoryService, memory_repo: MemoryRepository):
        self.session = session
        self.ai_service = ai_service
        self.tools = tools
        self.memory_service = memory_service
        self.memory_repo = memory_repo
        self.graph = create_agent_graph(ai_service, tools)

    async def chat(self, user_id: UUID, message: str, conversation_id: Optional[UUID] = None) -> Dict[str, Any]:
        """
        Execute the agent graph and return the response, saving chat history.
        """
        # DB operations for conversation history
        if conversation_id:
            stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == user_id)
            result = await self.session.execute(stmt)
            conv = result.scalar_one_or_none()
            if not conv:
                raise ValueError("Invalid conversation_id or conversation does not belong to user")
        else:
            conv = Conversation(user_id=user_id, title=message[:50])
            self.session.add(conv)
            await self.session.commit()
            await self.session.refresh(conv)
            conversation_id = conv.id
            
        # Save user message
        user_msg = Message(conversation_id=conversation_id, role="user", content=message)
        self.session.add(user_msg)
        await self.session.commit()
        
        # Prepare state with memory context
        try:
            memories = await self.tools.retrieve_user_memory(user_id, message)
            learning_events = await self.memory_repo.get_learning_events(user_id, limit=5)
            history = [{"topic": ev.topic, "event": ev.event_type} for ev in learning_events]
        except Exception:
            memories = []
            history = []

        initial_state = AgentState(
            user_id=user_id,
            conversation_id=conversation_id,
            user_message=message,
            current_goal=None,
            learning_context=None,
            retrieved_documents=[],
            user_memories=memories,
            learning_history=history,
            user_preferences={},
            agent_response="",
            next_agent=""
        )
        
        # Run graph
        # Using ainvoke instead of invoke for async execution
        final_state = await self.graph.ainvoke(initial_state)
        
        # Extract response
        agent_response = final_state.get("agent_response", "Sorry, I could not generate a response.")
        agent_used = final_state.get("next_agent", "unknown")
        
        # Save assistant message
        assistant_msg = Message(conversation_id=conversation_id, role="assistant", content=agent_response)
        self.session.add(assistant_msg)
        await self.session.commit()
        
        # Asynchronously extract memory
        asyncio.create_task(self.memory_service.extract_and_save_memory(user_id, message, agent_response))
        
        return {
            "agent": agent_used,
            "response": agent_response,
            "conversation_id": conversation_id
        }
