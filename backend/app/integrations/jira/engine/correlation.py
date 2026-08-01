import time
from typing import List, Dict, Any

class IncidentCorrelationEngine:
    """
    Correlates simultaneous failures across services (Redis, Backend, Gateway) within a 30-second window into 1 Master Root Incident.
    """
    def __init__(self, window_seconds: int = 30):
        self.window = window_seconds
        self._active_window_events: List[Dict[str, Any]] = []

    def correlate_incident(self, service: str, trigger_reason: str) -> List[str]:
        now = time.time()
        self._active_window_events.append({"service": service, "timestamp": now})
        
        # Clean older events
        self._active_window_events = [e for e in self._active_window_events if now - e["timestamp"] <= self.window]

        affected_services = list(set([e["service"] for e in self._active_window_events]))
        if len(affected_services) > 1:
            affected_services.extend(["gateway", "frontend"])
            
        return list(set(affected_services))
