import json
from typing import Dict, Any
from app.ai_router.knowledge.metadata.base_provider import BaseMetadataProvider
from app.services.ai_service import AIService
from app.core.logging import logger

GEMINI_PROFILER_PROMPT = """
Evaluate the AI model '{model_name}'. Return a strict JSON object with fields:
score_coding (0-10), score_python (0-10), score_java (0-10), score_math (0-10),
score_reasoning (0-10), score_creative (0-10), score_summarization (0-10),
supports_vision (bool), supports_json (bool), supports_tool_calling (bool),
strengths (array of strings), weaknesses (array of strings).
"""

class GeminiProfilerMetadataProvider(BaseMetadataProvider):
    def __init__(self, ai_service: AIService = None):
        self.ai_service = ai_service or AIService()

    async def extract_capabilities(self, model_name: str) -> Dict[str, Any]:
        try:
            prompt = GEMINI_PROFILER_PROMPT.format(model_name=model_name)
            res = await self.ai_service.chat_with_tutor(
                user_id=None,
                message=prompt,
                system_instruction="You are a strict JSON metadata evaluator."
            )
            text = res.get("response_text", "").strip()
            if text.startswith("```json"): text = text[7:]
            if text.endswith("```"): text = text[:-3]
            return json.loads(text.strip())
        except Exception as e:
            logger.warning(f"GeminiProfiler failed for {model_name}: {e}. Falling back to rule provider.")
            from app.ai_router.knowledge.metadata.ollama_metadata import OllamaRuleMetadataProvider
            return await OllamaRuleMetadataProvider().extract_capabilities(model_name)
