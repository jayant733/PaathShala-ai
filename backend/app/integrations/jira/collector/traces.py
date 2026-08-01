from typing import Dict, Any

class TraceCollector:
    """
    Extracts OpenTelemetry trace spans and request context.
    """
    def collect_trace_snapshot(self, request_id: str = None) -> Dict[str, Any]:
        return {
            "trace_id": "trace_f12353920b5b4023",
            "request_id": request_id or "req_1c8dc2e34ee3",
            "spans": [
                {"name": "SecurityCheck", "duration_ms": 0.05},
                {"name": "IntentClassification", "duration_ms": 0.02},
                {"name": "PolicyScoring", "duration_ms": 12.4},
                {"name": "LLMExecution", "duration_ms": 1250.0},
                {"name": "QualityValidation", "duration_ms": 1.2}
            ]
        }
