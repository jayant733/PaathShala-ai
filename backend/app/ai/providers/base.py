from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class LLMProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a single completion response.
        Must return a dict containing:
        - response_text: str
        - model_name: str
        - token_usage: dict
        """
        pass

    @abstractmethod
    async def stream_response(self, prompt: str, system_instruction: Optional[str] = None, history: list = None):
        """
        Stream response from the LLM (optional implementation, can raise NotImplementedError).
        history: list of {"role": "user"|"assistant", "content": str} dicts
        """
        pass

    @abstractmethod
    async def check_health(self) -> bool:
        """
        Check if the provider is available and healthy.
        """
        pass

    @abstractmethod
    async def get_model_info(self) -> Dict[str, Any]:
        """
        Get info about the currently active model for this provider.
        """
        pass
