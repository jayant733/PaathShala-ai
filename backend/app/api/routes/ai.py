from fastapi import APIRouter, Depends
from app.schemas.ai import ChatRequest, ChatResponse
from app.database.models.user import User
from app.api.dependencies import get_current_user, get_ai_service
from app.services.ai_service import AIService
from app.ai.prompts.tutor_prompts import TUTOR_SYSTEM_PROMPT
import time

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends(get_ai_service)
):
    """
    Chat with the AI tutor.
    """
    result = await ai_service.chat_with_tutor(
        user_id=current_user.id,
        message=request.message,
        system_instruction=TUTOR_SYSTEM_PROMPT
    )
    
    return {
        "response": result["response_text"],
        "model": result["model_name"],
        "tokens": {
            "input": result["token_usage"]["input"],
            "output": result["token_usage"]["output"]
        }
    }

@router.get("/providers/health")
async def get_providers_health(
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends(get_ai_service)
):
    """
    Get real-time health and latency metrics for all AI providers.
    """
    pm = ai_service.provider
    
    # Gemini Health
    t0 = time.perf_counter()
    gemini_healthy = await pm.gemini.check_health()
    t1 = time.perf_counter()
    gemini_latency = int((t1 - t0) * 1000) if gemini_healthy else None

    # Ollama Health
    t0 = time.perf_counter()
    ollama_healthy = await pm.ollama.check_health()
    t1 = time.perf_counter()
    ollama_latency = int((t1 - t0) * 1000) if ollama_healthy else None
    
    ollama_models = []
    if ollama_healthy:
        models_data = await pm.ollama.model_service.get_available_models()
        ollama_models = [m["name"] for m in models_data]

    return {
        "gemini": {
            "status": "healthy" if gemini_healthy else "offline",
            "latency": gemini_latency
        },
        "ollama": {
            "status": "healthy" if ollama_healthy else "offline",
            "latency": ollama_latency,
            "models": ollama_models
        }
    }

# Keeping the old endpoint to not break frontend before updating it
@router.get("/providers")
async def get_providers(
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends(get_ai_service)
):
    pm = ai_service.provider
    gemini_healthy = await pm.gemini.check_health()
    ollama_healthy = await pm.ollama.check_health()
    
    ollama_models = []
    if ollama_healthy:
        models_data = await pm.ollama.model_service.get_available_models()
        ollama_models = [m["name"] for m in models_data]
        
    return {
        "cloud": {
            "provider": "gemini",
            "available": gemini_healthy
        },
        "local": {
            "provider": "ollama",
            "available": ollama_healthy,
            "models": ollama_models
        }
    }
