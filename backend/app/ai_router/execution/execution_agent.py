from typing import Dict, Any, Optional
from app.services.ai_service import AIService
from app.ai_router.execution.queue_manager import global_queue_manager
from app.core.logging import logger

class ExecutionAgent:
    """
    Execution Agent: Handles Ollama/Cloud dispatch, concurrency locks, timeouts, and fallbacks.
    """
    def __init__(self, ai_service: AIService = None):
        self.ai_service = ai_service or AIService()

    async def execute_prompt(
        self,
        model_name: str,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:

        global_queue_manager.acquire(model_name)
        try:
            res = await self.ai_service.chat_with_tutor(
                user_id=None,
                message=prompt,
                system_instruction=system_instruction,
                override_model=model_name
            )
            return res
        except Exception as e:
            logger.error(f"ExecutionAgent: Error executing prompt on model {model_name}: {e}")
            raise e
        finally:
            global_queue_manager.release(model_name)
