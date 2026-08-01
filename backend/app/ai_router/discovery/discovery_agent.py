import httpx
from typing import List, Dict, Any
from app.database.registry_db import SessionRegistry, ModelFamily, ModelRegistryVersion, ModelHealthState
from app.router_config import router_settings
from app.ai_router.event_bus import global_event_bus
from app.ai_router.events import RouterEventType
from app.core.logging import logger

class DiscoveryAgent:
    """
    1. Discovery Agent: Scans Ollama `/api/tags`, registers version tags, publishes MODEL_DISCOVERED event.
    """
    def __init__(self, ollama_url: str = None):
        self.ollama_url = ollama_url or router_settings.OLLAMA_BASE_URL

    async def scan_ollama_models(self) -> List[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.ollama_url}/api/tags")
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    return [
                        {
                            "name": m["name"],
                            "size_bytes": m.get("size", 0),
                            "details": m.get("details", {})
                        }
                        for m in models
                    ]
        except Exception as e:
            logger.warning(f"DiscoveryAgent: Unable to reach Ollama at {self.ollama_url}: {e}")
        return []

    async def run_discovery_pipeline(self) -> List[str]:
        discovered = await self.scan_ollama_models()
        new_models = []

        db = SessionRegistry()
        try:
            for d in discovered:
                model_name = d["name"]
                family_name = model_name.split(":")[0] if ":" in model_name else model_name

                # Ensure Model Family exists
                family = db.query(ModelFamily).filter_by(family_name=family_name).first()
                if not family:
                    family = ModelFamily(
                        family_name=family_name,
                        description=f"{family_name.capitalize()} Model Family"
                    )
                    db.add(family)
                    db.commit()

                # Ensure Model Version exists
                version = db.query(ModelRegistryVersion).filter_by(model_name=model_name).first()
                if not version:
                    version = ModelRegistryVersion(
                        family_name=family_name,
                        model_name=model_name,
                        version_tag=model_name.split(":")[-1] if ":" in model_name else "latest",
                        provider="ollama",
                        parameter_size="7B" if "7b" in model_name else "4B",
                        quantization=d["details"].get("quantization_level", "Unknown"),
                        context_window=8192
                    )
                    db.add(version)

                    health = ModelHealthState(
                        model_name=model_name,
                        lifecycle_state="DISCOVERED",
                        is_healthy=True
                    )
                    db.add(health)
                    db.commit()

                    new_models.append(model_name)
                    logger.info(f"DiscoveryAgent: Discovered & registered new model tag: {model_name}")

                    # Publish Event
                    global_event_bus.publish(
                        RouterEventType.MODEL_DISCOVERED,
                        {"model_name": model_name, "details": d}
                    )
        finally:
            db.close()

        return new_models
