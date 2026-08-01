import datetime
from typing import List, Dict, Any

class IncidentTimelineBuilder:
    """
    Builds structured Incident Timelines (e.g. 10:14 Health Check Failed -> 10:15 Container Restart Attempted -> 10:16 Ticket Created).
    """
    def build_timeline(self, service: str, trigger_reason: str) -> List[Dict[str, Any]]:
        now = datetime.datetime.utcnow()
        t0 = (now - datetime.timedelta(seconds=120)).strftime("%H:%M:%S")
        t1 = (now - datetime.timedelta(seconds=60)).strftime("%H:%M:%S")
        t2 = now.strftime("%H:%M:%S")

        return [
            {"timestamp": t0, "event": "Health Check Probe Failed", "detail": f"Service '{service}' failed readiness check."},
            {"timestamp": t1, "event": "Auto-Healing Attempted", "detail": f"Triggered container restart for '{service}'."},
            {"timestamp": t2, "event": "Jira Incident Ticket Created", "detail": f"Opened P1 ticket: {trigger_reason}"}
        ]
