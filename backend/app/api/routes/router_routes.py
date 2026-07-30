from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.database.registry_db import SessionRegistry, ModelRegistryVersion, ModelCapabilitiesVerified, ModelHealthState, ModelBenchmarkRecord
from app.database.telemetry_db import SessionTelemetry, TelemetryRecord
from app.api.dependencies import get_current_user
from app.database.models.user import User

router = APIRouter(prefix="/router", tags=["router"])

@router.get("/catalog")
async def get_router_catalog(current_user: User = Depends(get_current_user)):
    """Returns model catalog with capabilities and health statuses."""
    db = SessionRegistry()
    try:
        models = db.query(ModelRegistryVersion).all()
        result = []
        for m in models:
            caps = db.query(ModelCapabilitiesVerified).filter_by(model_name=m.model_name).first()
            health = db.query(ModelHealthState).filter_by(model_name=m.model_name).first()
            result.append({
                "model_name": m.model_name,
                "display_name": m.model_name.capitalize(),
                "family": m.family_name,
                "parameter_size": m.parameter_size,
                "context_window": m.context_window,
                "lifecycle_state": health.lifecycle_state if health else "UNKNOWN",
                "is_healthy": health.is_healthy if health else True,
                "capabilities": {
                    "coding": caps.score_coding if caps else 5.0,
                    "math": caps.score_math if caps else 5.0,
                    "reasoning": caps.score_reasoning if caps else 5.0,
                    "creative": caps.score_creative if caps else 5.0
                } if caps else {}
            })
        return result
    finally:
        db.close()

@router.get("/models/{model_name}/card")
async def get_model_card(model_name: str, current_user: User = Depends(get_current_user)):
    """Returns HuggingFace-style Model Card with detailed benchmarks and specs."""
    db = SessionRegistry()
    try:
        m = db.query(ModelRegistryVersion).filter_by(model_name=model_name).first()
        if not m:
            raise HTTPException(status_code=404, detail="Model not found in registry")
            
        caps = db.query(ModelCapabilitiesVerified).filter_by(model_name=model_name).first()
        health = db.query(ModelHealthState).filter_by(model_name=model_name).first()
        benchmarks = db.query(ModelBenchmarkRecord).filter_by(model_name=model_name).all()

        return {
            "model_name": m.model_name,
            "version_tag": m.version_tag,
            "family": m.family_name,
            "parameter_size": m.parameter_size,
            "quantization": m.quantization,
            "context_window": m.context_window,
            "lifecycle_state": health.lifecycle_state if health else "READY",
            "capabilities": {
                "coding": caps.score_coding,
                "python": caps.score_python,
                "java": caps.score_java,
                "math": caps.score_math,
                "reasoning": caps.score_reasoning,
                "creative": caps.score_creative,
                "strengths": caps.strengths,
                "weaknesses": caps.weaknesses
            } if caps else {},
            "benchmarks": [
                {
                    "category": b.category,
                    "accuracy": b.accuracy,
                    "avg_latency_sec": b.avg_latency_sec,
                    "avg_tps": b.avg_tps
                } for b in benchmarks
            ]
        }
    finally:
        db.close()

@router.get("/telemetry")
async def get_router_telemetry(current_user: User = Depends(get_current_user)):
    """Returns recent telemetry execution logs."""
    db = SessionTelemetry()
    try:
        records = db.query(TelemetryRecord).order_by(TelemetryRecord.created_at.desc()).limit(30).all()
        return records
    finally:
        db.close()
