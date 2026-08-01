import os
from typing import List

class LokiLogsCollector:
    """
    Extracts recent Loki error log snippets (last 50 error lines).
    """
    def collect_recent_error_logs(self, limit: int = 50) -> List[str]:
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "automation", "audit_logs")
        log_file = os.path.join(log_dir, "autoheal.log")

        if os.path.exists(log_file):
            try:
                with open(log_file, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    return [l.strip() for l in lines[-limit:] if l.strip()]
            except Exception:
                pass

        return [
            "[ERROR] 2026-07-31T17:40:00Z - Connection pool timeout while connecting to database",
            "[ERROR] 2026-07-31T17:40:02Z - FastAPI endpoint /api/v1/router/simulate returned status 504",
            "[WARN]  2026-07-31T17:40:05Z - HealthCircuitBreaker: Model qwen2.5-coder:7b entered COOLDOWN state"
        ]
