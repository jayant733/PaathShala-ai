import httpx
from typing import Dict, Any, Optional
from app.ai.providers.context import get_ai_context

from app.core.config import settings
from app.core.exceptions import (
    AITimeoutException,
    AIBadRequestException
)
from app.ai.providers.base import LLMProvider
from app.ai.providers.local_model_service import LocalModelService

class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model_service = LocalModelService()
        self.model_name = "llama3:latest" # Default, could be dynamic

    async def _get_active_model(self) -> str:
        models = await self.model_service.get_available_models()
        if models:
            return models[0]["name"]
        return self.model_name

    async def generate_response(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        try:
            ctx = get_ai_context()
            model_to_use = ctx.model_name if ctx.model_name else await self._get_active_model()
            
            payload = {
                "model": model_to_use,
                "prompt": prompt,
                "stream": False
            }
            if system_instruction:
                payload["system"] = system_instruction
                
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "response_text": data.get("response", ""),
                    "model_name": model_to_use,
                    "token_usage": {
                        "input": data.get("prompt_eval_count", 0),
                        "output": data.get("eval_count", 0)
                    }
                }
                
        except httpx.TimeoutException:
            raise AITimeoutException()
        except Exception as e:
            raise AIBadRequestException(f"Ollama API Error: {str(e)}")

    async def stream_response(self, prompt: str, system_instruction: Optional[str] = None, history: list = None):
        import json
        try:
            ctx = get_ai_context()
            model_to_use = ctx.model_name if ctx.model_name else await self._get_active_model()
            
            if history:
                # Use /api/chat for multi-turn conversations
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                for m in history:
                    messages.append({"role": m["role"], "content": m["content"]})
                messages.append({"role": "user", "content": prompt})
                
                payload = {"model": model_to_use, "messages": messages, "stream": True}
                endpoint = f"{self.base_url}/api/chat"
                
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", endpoint, json=payload) as response:
                        response.raise_for_status()
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    chunk_text = data.get("message", {}).get("content", "")
                                    yield {
                                        "chunk": chunk_text,
                                        "model_name": model_to_use,
                                        "done": data.get("done", False)
                                    }
                                except json.JSONDecodeError:
                                    pass
            else:
                payload = {
                    "model": model_to_use,
                    "prompt": prompt,
                    "stream": True
                }
                if system_instruction:
                    payload["system"] = system_instruction
                    
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", f"{self.base_url}/api/generate", json=payload) as response:
                        response.raise_for_status()
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    yield {
                                        "chunk": data.get("response", ""),
                                        "model_name": model_to_use,
                                        "done": data.get("done", False)
                                    }
                                except json.JSONDecodeError:
                                    pass
        except httpx.TimeoutException:
            raise AITimeoutException()
        except Exception as e:
            raise AIBadRequestException(f"Ollama API Error: {str(e)}")

    async def check_health(self) -> bool:
        if not settings.OLLAMA_ENABLED:
            return False
        return await self.model_service.is_running()

    async def get_model_info(self) -> Dict[str, Any]:
        model_name = await self._get_active_model()
        return {
            "name": model_name,
            "provider": "ollama"
        }
