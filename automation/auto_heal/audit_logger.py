import os
import json
import datetime
from typing import Dict, Any

AUDIT_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audit_logs")
AUDIT_FILE_PATH = os.path.join(AUDIT_LOG_DIR, "operational_audit.json")

class AuditLogger:
    """
    Structured Operational Audit Logger recording SRE actions, reasons, and results.
    """
    def __init__(self):
        os.makedirs(AUDIT_LOG_DIR, exist_ok=True)

    def log_action(self, action: str, reason: str, result: str, duration_sec: float, metadata: Dict[str, Any] = None):
        entry = {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "action": action,
            "reason": reason,
            "result": result,
            "duration_sec": round(duration_sec, 2),
            "metadata": metadata or {}
        }
        
        logs = []
        if os.path.exists(AUDIT_FILE_PATH):
            try:
                with open(AUDIT_FILE_PATH, "r", encoding="utf-8") as f:
                    logs = json.load(f)
            except Exception:
                logs = []

        logs.append(entry)
        # Keep last 500 records
        logs = logs[-500:]

        with open(AUDIT_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)

global_audit_logger = AuditLogger()
