import asyncio
from typing import Dict, Any, Optional
import google.generativeai as genai
from google.generativeai.types import generation_types
from google.api_core import exceptions as google_exceptions

from app.core.config import settings
from app.ai.providers.context import get_ai_context
from app.core.exceptions import (
    AITimeoutException,
    AIRateLimitException,
    AIConfigurationException,
    AIBadRequestException
)
from app.ai.providers.base import LLMProvider

class GeminiProvider(LLMProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise AIConfigurationException("GEMINI_API_KEY is not set.")
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        
    async def generate_response(self, prompt: str, system_instruction: Optional[str] = None) -> Dict[str, Any]:
        try:
            ctx = get_ai_context()
            model_to_use = ctx.model_name if ctx.model_name else self.model_name
            
            model = genai.GenerativeModel(
                model_name=model_to_use,
                system_instruction=system_instruction
            )
            
            response = await model.generate_content_async(prompt)
            
            input_tokens = response.usage_metadata.prompt_token_count if response.usage_metadata else 0
            output_tokens = response.usage_metadata.candidates_token_count if response.usage_metadata else 0
            
            return {
                "response_text": response.text,
                "model_name": self.model_name,
                "token_usage": {
                    "input": input_tokens,
                    "output": output_tokens
                }
            }
            
        except google_exceptions.DeadlineExceeded:
            raise AITimeoutException()
        except google_exceptions.ResourceExhausted:
            raise AIRateLimitException()
        except google_exceptions.InvalidArgument as e:
            raise AIBadRequestException(str(e))
        except Exception as e:
            raise AIBadRequestException(f"Gemini API Error: {str(e)}")

    async def stream_response(self, prompt: str, system_instruction: Optional[str] = None, history: list = None):
        try:
            ctx = get_ai_context()
            model_to_use = ctx.model_name if ctx.model_name else self.model_name
            
            model = genai.GenerativeModel(
                model_name=model_to_use,
                system_instruction=system_instruction
            )
            
            if history:
                # Build Gemini-format history
                gemini_history = [
                    {"role": "model" if m["role"] == "assistant" else "user", "parts": [m["content"]]}
                    for m in history
                ]
                chat = model.start_chat(history=gemini_history)
                response = await chat.send_message_async(prompt, stream=True)
            else:
                response = await model.generate_content_async(prompt, stream=True)
            
            async for chunk in response:
                if chunk.text:
                    yield {
                        "chunk": chunk.text,
                        "model_name": model_to_use,
                        "done": False
                    }
                    
            # Send a final chunk to signal completion
            yield {
                "chunk": "",
                "model_name": model_to_use,
                "done": True
            }
            
        except google_exceptions.DeadlineExceeded:
            raise AITimeoutException()
        except google_exceptions.ResourceExhausted:
            raise AIRateLimitException()
        except google_exceptions.InvalidArgument as e:
            raise AIBadRequestException(str(e))
        except Exception as e:
            raise AIBadRequestException(f"Gemini API Error: {str(e)}")

    async def check_health(self) -> bool:
        if not settings.GEMINI_ENABLED:
            return False
        try:
            # simple ping or just check if API key exists for now
            return bool(settings.GEMINI_API_KEY)
        except Exception:
            return False

    async def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "provider": "gemini"
        }
