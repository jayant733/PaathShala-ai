from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.dependencies import get_current_user
from app.database.models.user import User
from app.ai_router.master_platform import MasterLocalAIRouter
from app.database.telemetry_db import SessionTelemetry, TelemetryRecord

router = APIRouter(prefix="/router", tags=["playground"])

@router.post("/simulate")
async def simulate_routing_decision(
    prompt: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """
    Simulation Mode: Evaluates prompt routing scores and XAI explainability without executing LLM inference.
    """
    master = MasterLocalAIRouter()
    res = await master.route_and_process(prompt=prompt, simulate_only=True)
    return res

@router.get("/replay/{request_id}")
async def replay_historical_request(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Replay Engine: Retrieves full decision timeline and telemetry for a past request.
    """
    db = SessionTelemetry()
    try:
        rec = db.query(TelemetryRecord).filter_by(request_id=request_id).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Telemetry request ID not found")
        return rec
    finally:
        db.close()
