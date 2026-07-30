from fastapi import APIRouter, Response, status
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import httpx
import psutil
import os

from app.database.registry_db import REGISTRY_DB_PATH
from app.database.telemetry_db import TELEMETRY_DB_PATH
from app.router_config import router_settings
from app.ai_router.resource_health.resource_agent import ResourceAgent
from app.ai_router.resource_health.health_agent import HealthCircuitBreakerAgent

router = APIRouter(tags=["health"])

@router.get("/health/live")
async def liveness_check():
    """Kubernetes-style Liveness Check: verifies FastAPI process is running."""
    return {"status": "alive", "router_version": router_settings.ROUTER_VERSION}

@router.get("/health/ready")
async def readiness_check(response: Response):
    """
    Kubernetes-style Readiness Check: verifies Ollama, registry.db, and telemetry.db connections.
    """
    db_reg_ok = os.path.exists(REGISTRY_DB_PATH)
    db_telem_ok = os.path.exists(TELEMETRY_DB_PATH)

    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{router_settings.OLLAMA_BASE_URL}/api/tags")
            ollama_ok = res.status_code == 200
    except Exception:
        ollama_ok = False

    is_ready = db_reg_ok and db_telem_ok and ollama_ok
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    resources = ResourceAgent.get_system_resources()

    return {
        "status": "ready" if is_ready else "degraded",
        "components": {
            "ollama_runtime": "healthy" if ollama_ok else "unreachable",
            "registry_db": "healthy" if db_reg_ok else "missing",
            "telemetry_db": "healthy" if db_telem_ok else "missing"
        },
        "system_resources": resources
    }

@router.get("/metrics")
async def prometheus_metrics():
    """Native Prometheus Metrics Exporter Endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
