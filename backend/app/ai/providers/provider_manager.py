import logging
from typing import Dict, Any, Optional

from app.core.config import settings
from app.ai.providers.base import LLMProvider
from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.ollama_provider import OllamaProvider
from app.ai.providers.context import get_ai_context
from app.core.exceptions import AIBadRequestException

logger = logging.getLogger(__name__)

class ProviderManager(LLMProvider):
    def __init__(self):
        self.gemini = GeminiProvider()
        self.ollama = OllamaProvider()

    async def _execute_auto(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        """Auto mode tries Gemini first, then falls back to Ollama."""
        try:
            return await self.gemini.generate_response(prompt, system_instruction)
        except Exception as e:
            logger.warning(f"Auto Mode: Primary (Gemini) failed: {str(e)}. Falling back to Local.")
            try:
                return await self.ollama.generate_response(prompt, system_instruction)
            except Exception as fallback_err:
                logger.error(f"Auto Mode: Fallback (Ollama) also failed: {str(fallback_err)}")
                raise fallback_err

    async def _execute_auto_stream(self, prompt: str, system_instruction: Optional[str] = None):
        """Auto mode tries Gemini first, then falls back to Ollama."""
        logger.info("[ProviderManager] Executing Auto Stream: trying Gemini first.")
        try:
            gen = self.gemini.stream_response(prompt, system_instruction)
            first = True
            async for chunk in gen:
                if first:
                    first = False
                yield chunk
        except Exception as e:
            if not locals().get('first', True):
                # We already yielded something, so we cannot seamlessly fallback
                logger.error(f"Auto Mode: Gemini failed mid-stream: {e}")
                raise e
            
            logger.warning(f"Auto Mode: Primary (Gemini) stream failed: {str(e)}. Falling back to Local.")
            try:
                gen2 = self.ollama.stream_response(prompt, system_instruction)
                async for chunk in gen2:
                    yield chunk
            except Exception as fallback_err:
                logger.error(f"Auto Mode: Fallback (Ollama) stream also failed: {str(fallback_err)}")
                raise fallback_err

    async def _execute_manual(self, provider_name: str, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        """Manual mode strictly forces the chosen provider without fallback."""
        if provider_name == "ollama":
            target = self.ollama
        elif provider_name == "gemini":
            target = self.gemini
        else:
            raise AIBadRequestException(f"Unknown provider: {provider_name}")
            
        try:
            return await target.generate_response(prompt, system_instruction)
        except Exception as e:
            logger.error(f"Manual Mode: Requested provider '{provider_name}' failed: {str(e)}")
            raise e

    async def _execute_manual_stream(self, provider_name: str, prompt: str, system_instruction: Optional[str] = None):
        """Manual mode strictly forces the chosen provider without fallback."""
        logger.info(f"[ProviderManager] Executing Manual Stream: forcing provider={provider_name}")
        if provider_name == "ollama":
            target = self.ollama
        elif provider_name == "gemini":
            target = self.gemini
        else:
            raise AIBadRequestException(f"Unknown provider: {provider_name}")
            
        try:
            gen = target.stream_response(prompt, system_instruction)
            async for chunk in gen:
                yield chunk
        except Exception as e:
            logger.error(f"Manual Mode: Requested provider '{provider_name}' stream failed: {str(e)}")
            raise e

    async def generate_response(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        ctx = get_ai_context()
        if ctx.mode == "manual" and ctx.provider:
            return await self._execute_manual(ctx.provider, prompt, system_instruction)
        return await self._execute_auto(prompt, system_instruction)

    async def stream_response(self, prompt: str, system_instruction: Optional[str] = None):
        ctx = get_ai_context()
        if ctx.mode == "manual" and ctx.provider:
            async for chunk in self._execute_manual_stream(ctx.provider, prompt, system_instruction):
                yield chunk
        else:
            async for chunk in self._execute_auto_stream(prompt, system_instruction):
                yield chunk

    async def check_health(self) -> bool:
        # Check if at least one is alive
        return await self.gemini.check_health() or await self.ollama.check_health()

    async def get_model_info(self) -> Dict[str, Any]:
        ctx = get_ai_context()
        if ctx.mode == "manual" and ctx.provider:
            if ctx.provider == "ollama":
                return await self.ollama.get_model_info()
            return await self.gemini.get_model_info()
            
        if await self.gemini.check_health():
            return await self.gemini.get_model_info()
        return await self.ollama.get_model_info()
