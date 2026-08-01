from typing import Dict, Any, Optional
from app.database.telemetry_db import SessionTelemetry, TelemetryRecord, ValidationFailureRecord
from app.ai_router.observability.metrics import ROUTER_REQUESTS_TOTAL, ROUTER_LATENCY_SECONDS, ROUTER_FALLBACK_TOTAL, ROUTER_VALIDATION_FAILURES
from app.core.logging import logger

class TelemetryAnalyticsAgent:
    """
    Telemetry & Analytics Agent: Persists timeline telemetry to telemetry.db and exports Prometheus metrics.
    """
    def log_execution(
        self,
        request_id: str,
        trace_id: str,
        prompt_hash: str,
        router_version: str,
        policy_version: str,
        intent: str,
        complexity: str,
        context_tokens: int,
        selected_model: str,
        confidence_score: float,
        explainability: Dict[str, Any],
        timeline_ms: Dict[str, float],
        total_latency_ms: float,
        fallback_used: bool = False,
        fallback_reason: Optional[str] = None
    ):
        # 1. Export Prometheus Metrics
        ROUTER_REQUESTS_TOTAL.labels(intent=intent, selected_model=selected_model).inc()
        ROUTER_LATENCY_SECONDS.labels(selected_model=selected_model).observe(total_latency_ms / 1000.0)
        if fallback_used:
            ROUTER_FALLBACK_TOTAL.labels(primary_model=selected_model, fallback_model="gemini-flash-latest").inc()

        # 2. Persist to telemetry.db
        db = SessionTelemetry()
        try:
            record = TelemetryRecord(
                request_id=request_id,
                trace_id=trace_id,
                prompt_hash=prompt_hash,
                router_version=router_version,
                policy_version=policy_version,
                detected_intent=intent,
                detected_complexity=complexity,
                context_tokens=context_tokens,
                selected_model=selected_model,
                confidence_score=confidence_score,
                explainability=explainability,
                timeline_ms=timeline_ms,
                total_latency_ms=total_latency_ms,
                fallback_used=fallback_used,
                fallback_reason=fallback_reason
            )
            db.add(record)
            db.commit()
            logger.info(f"TelemetryAnalyticsAgent: Recorded telemetry for request {request_id}")
        except Exception as e:
            logger.error(f"TelemetryAnalyticsAgent: Error persisting telemetry: {e}")
        finally:
            db.close()

    def log_validation_failure(self, request_id: str, model_name: str, reason: str, output_snippet: str):
        ROUTER_VALIDATION_FAILURES.labels(model_name=model_name, reason=reason).inc()
        db = SessionTelemetry()
        try:
            rec = ValidationFailureRecord(
                request_id=request_id,
                model_name=model_name,
                failure_reason=reason,
                output_snippet=output_snippet[:200]
            )
            db.add(rec)
            db.commit()
        finally:
            db.close()
