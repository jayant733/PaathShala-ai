from uuid import UUID
from typing import Dict, Any, Optional
from app.ai.providers import LLMProvider
from app.repositories.ai_repository import AIRepository

class AIService:
    def __init__(self, provider: Optional[LLMProvider] = None, repository: Optional[AIRepository] = None):
        if provider is None:
            from app.ai.providers import ProviderManager
            provider = ProviderManager()
        self.provider = provider
        self.repository = repository

    async def chat_with_tutor(self, user_id: UUID, message: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        """
        Send a message to the AI tutor, log the interaction, and return the response.
        """
        # Call provider
        result = await self.provider.generate_response(
            prompt=message, 
            system_instruction=system_instruction
        )
        
        # Extract data
        response_text = result.get("response_text", "")
        model_name = result.get("model_name", "unknown")
        tokens = result.get("token_usage", {"input": 0, "output": 0})
        
        # Save to database if repository and user_id available
        if self.repository and user_id is not None:
            await self.repository.save_interaction(
                user_id=user_id,
                prompt=message,
                response=response_text,
                model_used=model_name,
                input_tokens=tokens.get("input", 0),
                output_tokens=tokens.get("output", 0)
            )
        
        return result
