import time
from typing import Dict, List

class IncidentRateLimiter:
    """
    Limits ticket creation to a maximum of 5 incidents per minute per service.
    """
    def __init__(self, max_per_minute: int = 5):
        self.max_per_min = max_per_minute
        self._history: Dict[str, List[float]] = {}

    def is_rate_limited(self, service: str) -> bool:
        now = time.time()
        if service not in self._history:
            self._history[service] = []

        # Filter out events older than 60s
        self._history[service] = [t for t in self._history[service] if now - t <= 60.0]

        if len(self._history[service]) >= self.max_per_min:
            return True

        self._history[service].append(now)
        return False
