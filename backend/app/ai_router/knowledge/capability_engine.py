from typing import Dict, Any
from app.database.registry_db import SessionRegistry, ModelCapabilitiesVerified, ModelHealthState
from app.ai_router.knowledge.capability_cache import global_capability_cache
from app.ai_router.knowledge.metadata.ollama_metadata import OllamaRuleMetadataProvider
from app.core.logging import logger

class CapabilityIntelligenceEngine:
    """
    2. Capability Intelligence Engine: Profiles capabilities, manages cache, updates registry.db.
    """
    def __init__(self, provider = None):
        self.provider = provider or OllamaRuleMetadataProvider()

    async def profile_model(self, model_name: str) -> Dict[str, Any]:
        # Check Memory Cache first
        cached = global_capability_cache.get(model_name)
        if cached:
            return cached

        # Check DB
        db = SessionRegistry()
        try:
            existing = db.query(ModelCapabilitiesVerified).filter_by(model_name=model_name).first()
            if existing:
                caps = {
                    "score_coding": existing.score_coding,
                    "score_python": existing.score_python,
                    "score_java": existing.score_java,
                    "score_math": existing.score_math,
                    "score_reasoning": existing.score_reasoning,
                    "score_creative": existing.score_creative,
                    "score_summarization": existing.score_summarization,
                    "supports_vision": existing.supports_vision,
                    "supports_json": existing.supports_json,
                    "supports_tool_calling": existing.supports_tool_calling,
                    "strengths": existing.strengths or [],
                    "weaknesses": existing.weaknesses or []
                }
                global_capability_cache.set(model_name, caps)
                return caps

            # Extract from Metadata Provider
            caps = await self.provider.extract_capabilities(model_name)

            # Persist to registry.db
            new_caps = ModelCapabilitiesVerified(
                model_name=model_name,
                score_coding=caps.get("score_coding", 5.0),
                score_python=caps.get("score_python", 5.0),
                score_java=caps.get("score_java", 5.0),
                score_math=caps.get("score_math", 5.0),
                score_reasoning=caps.get("score_reasoning", 5.0),
                score_creative=caps.get("score_creative", 5.0),
                score_summarization=caps.get("score_summarization", 5.0),
                supports_vision=caps.get("supports_vision", False),
                supports_json=caps.get("supports_json", True),
                supports_tool_calling=caps.get("supports_tool_calling", False),
                strengths=caps.get("strengths", []),
                weaknesses=caps.get("weaknesses", [])
            )
            db.add(new_caps)

            # Update Health lifecycle state to PROFILING -> READY
            health = db.query(ModelHealthState).filter_by(model_name=model_name).first()
            if health:
                health.lifecycle_state = "READY"

            db.commit()

            global_capability_cache.set(model_name, caps)
            logger.info(f"CapabilityIntelligenceEngine: Profiled & stored capabilities for {model_name}")
            return caps
        finally:
            db.close()
