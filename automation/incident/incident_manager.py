import os
import json
import datetime
from typing import Dict, Any, Optional
from automation.notifications.notifier import global_notifier
from automation.auto_heal.audit_logger import global_audit_logger

INCIDENT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "incidents")

class IncidentManager:
    """
    Manages Incident Lifecycle: Open Incident -> Collect Logs -> Auto-Recover -> Close -> Postmortem.
    """
    def __init__(self):
        os.makedirs(INCIDENT_DIR, exist_ok=True)

    async def open_incident(self, service: str, trigger_reason: str, severity: str = "HIGH") -> Dict[str, Any]:
        stamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        inc_id = f"INC-{stamp}"
        
        inc_data = {
            "incident_id": inc_id,
            "service": service,
            "severity": severity,
            "status": "OPEN",
            "trigger_reason": trigger_reason,
            "opened_at": datetime.datetime.utcnow().isoformat(),
            "closed_at": None,
            "actions_taken": [],
            "resolution_summary": None
        }

        filepath = os.path.join(INCIDENT_DIR, f"{inc_id}.json")
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(inc_data, f, indent=2)

        await global_notifier.send_alert(
            title=f"Incident Opened: {inc_id} ({service})",
            message=f"Reason: {trigger_reason}\nSeverity: {severity}",
            level="CRITICAL"
        )
        global_audit_logger.log_action("Open Incident", trigger_reason, "OPEN", 0.1, {"incident_id": inc_id})
        return inc_data

    async def close_incident(self, incident_id: str, resolution_summary: str) -> Dict[str, Any]:
        filepath = os.path.join(INCIDENT_DIR, f"{incident_id}.json")
        if not os.path.exists(filepath):
            return {"error": "Incident not found"}

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        data["status"] = "CLOSED"
        data["closed_at"] = datetime.datetime.utcnow().isoformat()
        data["resolution_summary"] = resolution_summary

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        # Build Postmortem
        from automation.incident.postmortem_generator import generate_postmortem_markdown
        generate_postmortem_markdown(data)

        await global_notifier.send_alert(
            title=f"Incident Resolved: {incident_id}",
            message=f"Resolution: {resolution_summary}",
            level="INFO"
        )
        return data

global_incident_manager = IncidentManager()
