import datetime
import httpx
from typing import Dict, List
from app.database.registry_db import SessionRegistry, ModelHealthState
from app.router_config import router_settings
from app.ai_router.observability.metrics import MODEL_HEALTH_STATUS
from app.core.logging import logger

class HealthCircuitBreakerAgent:
    """
    Health Agent & Circuit Breaker: Runs 30s health pings, updates lifecycle state, enforces 60s cooldown.
    """
    def __init__(self, ollama_url: str = None):
        self.ollama_url = ollama_url or router_settings.OLLAMA_BASE_URL

    async def check_all_health(self) -> Dict[str, bool]:
        db = SessionRegistry()
        results = {}
        now = datetime.datetime.utcnow()

        try:
            states = db.query(ModelHealthState).all()
            for s in states:
                # Check if in Circuit Breaker Cooldown
                if s.circuit_breaker_active and s.circuit_cooldown_until:
                    if now < s.circuit_cooldown_until:
                        results[s.model_name] = False
                        s.lifecycle_state = "COOLDOWN"
                        MODEL_HEALTH_STATUS.labels(model_name=s.model_name).set(0)
                        continue
                    else:
                        # Cooldown expired, reset circuit breaker
                        s.circuit_breaker_active = False
                        s.consecutive_failures = 0
                        s.lifecycle_state = "READY"
                        s.is_healthy = True
                        logger.info(f"CircuitBreaker: Cooldown expired for model {s.model_name}. Resetting state to READY.")

                # Ping Ollama health
                is_alive = await self._ping_ollama_model(s.model_name)
                s.is_healthy = is_alive
                s.last_check = now

                if is_alive:
                    s.consecutive_failures = 0
                    if s.lifecycle_state == "DISABLED" or s.lifecycle_state == "COOLDOWN":
                        s.lifecycle_state = "READY"
                    MODEL_HEALTH_STATUS.labels(model_name=s.model_name).set(1)
                else:
                    s.consecutive_failures += 1
                    if s.consecutive_failures >= router_settings.CIRCUIT_BREAKER_FAILURES:
                        s.circuit_breaker_active = True
                        s.circuit_cooldown_until = now + datetime.timedelta(seconds=router_settings.CIRCUIT_BREAKER_COOLDOWN_SEC)
                        s.lifecycle_state = "COOLDOWN"
                        logger.warning(f"CircuitBreaker: Model {s.model_name} failed {s.consecutive_failures} times. Entered 60s COOLDOWN.")
                    MODEL_HEALTH_STATUS.labels(model_name=s.model_name).set(0)

                results[s.model_name] = s.is_healthy and not s.circuit_breaker_active

            db.commit()
        finally:
            db.close()

        return results

    async def record_model_failure(self, model_name: str):
        db = SessionRegistry()
        now = datetime.datetime.utcnow()
        try:
            s = db.query(ModelHealthState).filter_by(model_name=model_name).first()
            if s:
                s.consecutive_failures += 1
                if s.consecutive_failures >= router_settings.CIRCUIT_BREAKER_FAILURES:
                    s.circuit_breaker_active = True
                    s.circuit_cooldown_until = now + datetime.timedelta(seconds=router_settings.CIRCUIT_BREAKER_COOLDOWN_SEC)
                    s.lifecycle_state = "COOLDOWN"
                    logger.warning(f"CircuitBreaker: Model {model_name} triggered circuit breaker!")
                db.commit()
        finally:
            db.close()

    async def _ping_ollama_model(self, model_name: str) -> bool:
        if "gemini" in model_name: return True
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.ollama_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False
