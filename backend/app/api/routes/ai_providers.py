from fastapi import APIRouter, Depends
from typing import Dict, Any

from app.core.config import settings
from app.api.dependencies import get_current_user
from app.ai.providers import ProviderManager, LocalModelService

router = APIRouter()

@router.get("/providers")
async def get_ai_providers(
    current_user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get available AI providers and their status.
    """
    manager = ProviderManager()
    local_service = LocalModelService()
    
    gemini_health = await manager.gemini.check_health()
    
    ollama_health = await manager.ollama.check_health()
    ollama_models = []
    if ollama_health:
        models = await local_service.get_available_models()
        ollama_models = [m["name"] for m in models]

    return {
        "cloud": {
            "provider": "gemini",
            "available": gemini_health
        },
        "local": {
            "provider": "ollama",
            "available": ollama_health,
            "models": ollama_models
        }
    }
