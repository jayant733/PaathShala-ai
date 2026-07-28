from uuid import UUID
from typing import Optional
import json
from app.services.ai_service import AIService
from app.ai.embeddings.embedding_provider import EmbeddingProvider
from app.repositories.memory_repository import MemoryRepository

MEMORY_EXTRACTION_PROMPT = """You are a Memory Extraction Agent.
Analyze the following conversation between a User and an AI Tutor.
Extract any important facts, preferences, or learning events about the User.

Important categories:
1. "profile": User's goals, background, career aspirations.
2. "knowledge": Facts about what the user knows or struggles with.
3. "learning_event": An event such as 'learned', 'struggled', 'completed', or 'review_needed'.

If there is nothing significant to extract, return an empty JSON object: {}

If there are memories to extract, return a JSON object exactly in this format:
{
  "memories": [
    {
      "type": "profile" | "knowledge",
      "content": "Description of the fact",
      "importance_score": 1.0 to 10.0
    }
  ],
  "learning_events": [
    {
      "topic": "Topic Name",
      "event_type": "learned" | "struggled" | "completed" | "review_needed",
      "description": "Optional details"
    }
  ]
}

Respond ONLY with the JSON object, no markdown.
"""

class MemoryService:
    def __init__(self, ai_service: AIService, embedder: EmbeddingProvider, repository: MemoryRepository):
        self.ai_service = ai_service
        self.embedder = embedder
        self.repository = repository

    async def extract_and_save_memory(self, user_id: UUID, user_message: str, ai_response: str) -> None:
        """
        Analyze the conversation turn, extract memories, embed them, and save them.
        """
        conversation_context = f"User: {user_message}\nAI: {ai_response}"
        
        result = await self.ai_service.chat_with_tutor(
            user_id=user_id,
            message=conversation_context,
            system_instruction=MEMORY_EXTRACTION_PROMPT
        )
        
        response_text = result["response_text"].strip()
        
        # Clean up markdown
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        try:
            extraction = json.loads(response_text)
        except json.JSONDecodeError:
            return # Nothing to extract or parsing failed
            
        # Process User Memories
        memories = extraction.get("memories", [])
        for mem in memories:
            m_type = mem.get("type")
            m_content = mem.get("content")
            m_score = mem.get("importance_score", 1.0)
            
            if m_type and m_content:
                embedding = await self.embedder.create_embedding(m_content)
                await self.repository.save_memory(
                    user_id=user_id,
                    memory_type=m_type,
                    content=m_content,
                    embedding=embedding,
                    importance_score=m_score
                )
                
        # Process Learning Events
        events = extraction.get("learning_events", [])
        for ev in events:
            topic = ev.get("topic")
            event_type = ev.get("event_type")
            desc = ev.get("description")
            
            if topic and event_type:
                await self.repository.save_learning_event(
                    user_id=user_id,
                    topic=topic,
                    event_type=event_type,
                    description=desc
                )
