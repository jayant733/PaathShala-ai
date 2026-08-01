from typing import Dict, Any
from app.ai_router.knowledge.metadata.base_provider import BaseMetadataProvider

class OllamaRuleMetadataProvider(BaseMetadataProvider):
    async def extract_capabilities(self, model_name: str) -> Dict[str, Any]:
        m_lower = model_name.lower()
        is_coder = "coder" in m_lower or "qwen" in m_lower
        
        return {
            "score_coding": 9.5 if is_coder else 6.5,
            "score_python": 9.7 if is_coder else 6.5,
            "score_java": 9.2 if is_coder else 6.0,
            "score_math": 8.5 if "gemma" in m_lower or "qwen3" in m_lower else 6.0,
            "score_reasoning": 8.8 if "qwen3" in m_lower or "llama" in m_lower else 7.0,
            "score_creative": 9.0 if "llama" in m_lower else 6.0,
            "score_summarization": 8.0,
            "supports_vision": "vision" in m_lower,
            "supports_json": True,
            "supports_tool_calling": "qwen" in m_lower,
            "strengths": ["coding", "python"] if is_coder else ["conversation"],
            "weaknesses": ["vision"] if "vision" not in m_lower else []
        }
