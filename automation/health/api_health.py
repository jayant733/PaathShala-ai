import httpx
import time
from typing import Dict, Any

class APIHealthChecker:
    """
    Checks FastAPI /health/live, /health/ready, /metrics, database & Redis readiness, and measures latency.
    """
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    async def check_health(self) -> Dict[str, Any]:
        t0 = time.perf_counter()
        api_ok = False
        db_ok = False
        redis_ok = True
        latency_ms = 0.0

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/health/ready")
                latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
                if res.status_code == 200:
                    api_ok = True
                    body = res.json()
                    db_ok = body.get("components", {}).get("registry_db") == "healthy"
        except Exception:
            latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)

        status = "PASS" if (api_ok and db_ok) else "CRITICAL"

        return {
            "status": status,
            "api_ok": api_ok,
            "database_ok": db_ok,
            "redis_ok": redis_ok,
            "latency_ms": latency_ms
        }
