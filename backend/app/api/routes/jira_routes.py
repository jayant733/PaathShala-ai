from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from app.api.dependencies import get_current_user
from app.database.models.user import User
from app.integrations.jira.service.jira_service import global_jira_service
from app.integrations.jira.client.jira_client import global_jira_client
from app.database.telemetry_db import SessionTelemetry, TelemetryRecord

router = APIRouter(prefix="/router/jira", tags=["jira"])

@router.get("/status")
async def get_jira_status(current_user: User = Depends(get_current_user)):
    """Returns Jira connection status, project stats, and operational issue counters."""
    return global_jira_client.get_connection_status()

@router.get("/issues")
async def list_jira_issues(current_user: User = Depends(get_current_user)):
    """Lists active Jira incident tickets."""
    return await global_jira_client.list_issues()

@router.post("/create-from-replay")
async def create_jira_issue_from_replay(
    request_id: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """
    1-Click Replay Trigger: Generates an AI-assisted Jira Incident ticket from a historical request ID.
    """
    db = SessionTelemetry()
    try:
        rec = db.query(TelemetryRecord).filter_by(request_id=request_id).first()
        if not rec:
            raise HTTPException(status_code=404, detail="Telemetry request ID not found")

        req_ctx = {
            "request_id": rec.request_id,
            "trace_id": rec.trace_id,
            "prompt_hash": rec.prompt_hash,
            "intent": rec.detected_intent,
            "complexity": rec.detected_complexity,
            "selected_model": rec.selected_model,
            "confidence_score": rec.confidence_score,
            "total_latency_ms": rec.total_latency_ms
        }

        res = await global_jira_service.create_incident_ticket(
            service=rec.selected_model or "backend",
            trigger_reason=f"Manual 1-Click Replay Incident Trigger for {request_id}",
            event_type="REPLAY_ONE_CLICK",
            request_context=req_ctx
        )
        return res
    finally:
        db.close()

@router.post("/create-from-alert")
async def create_jira_issue_from_alert(
    alert_name: str = Body(..., embed=True),
    service: str = Body("backend", embed=True),
    current_user: User = Depends(get_current_user)
):
    """Prometheus Alertmanager Alert Hook -> Creates Jira P1 Incident."""
    return await global_jira_service.create_incident_ticket(
        service=service,
        trigger_reason=f"Prometheus Metric Alert Triggered: {alert_name}",
        event_type="PROMETHEUS_ALERT"
    )
