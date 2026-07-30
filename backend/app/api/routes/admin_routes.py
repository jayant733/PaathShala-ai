from fastapi import APIRouter, Depends, Body, HTTPException
from typing import Dict, Any
from app.api.dependencies import get_current_user
from app.database.models.user import User
from app.ai_router.routing.policy_engine import global_policy_engine
from app.benchmarks.benchmark_suite import BenchmarkSuiteRunner

router = APIRouter(prefix="/router/admin", tags=["admin"])

@router.get("/policies")
async def get_active_policies(current_user: User = Depends(get_current_user)):
    """Returns currently loaded YAML routing policies."""
    return global_policy_engine._policies

@router.post("/policies/reload")
async def reload_policies(current_user: User = Depends(get_current_user)):
    """Reloads YAML policies from disk."""
    global_policy_engine.reload_policies()
    return {"status": "reloaded", "active_policies": list(global_policy_engine._policies.keys())}

@router.post("/benchmark/run")
async def run_benchmark(
    model_name: str = Body(..., embed=True),
    category: str = Body("coding", embed=True),
    current_user: User = Depends(get_current_user)
):
    """Triggers micro-benchmark suite for a model."""
    runner = BenchmarkSuiteRunner()
    res = await runner.run_benchmark_for_model(model_name, category)
    return res
