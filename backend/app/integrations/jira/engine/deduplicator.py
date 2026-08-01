import time
from typing import Dict, Any, Optional

class IncidentDeduplicator:
    """
    Prevents duplicate ticket creation for the same service within a 15-minute window.
    Appends diagnostic comments to the open ticket instead.
    """
    def __init__(self, window_seconds: int = 900):
        self.window = window_seconds
        self._recent_incidents: Dict[str, Dict[str, Any]] = {} # service -> {ticket_key, timestamp, count}

    def check_duplicate(self, service: str) -> Optional[Dict[str, Any]]:
        now = time.time()
        if service in self._recent_incidents:
            record = self._recent_incidents[service]
            if now - record["timestamp"] < self.window:
                record["count"] += 1
                record["timestamp"] = now
                return record
        return None

    def register_incident(self, service: str, ticket_key: str):
        self._recent_incidents[service] = {
            "ticket_key": ticket_key,
            "timestamp": time.time(),
            "count": 1
        }
