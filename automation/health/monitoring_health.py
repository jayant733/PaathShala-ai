import httpx
from typing import Dict, Any

class MonitoringHealthChecker:
    """
    Checks Prometheus (9090) and Grafana (3000) stack health.
    """
    async def check_health(self) -> Dict[str, Any]:
        prom_ok = False
        grafana_ok = False

        async with httpx.AsyncClient(timeout=3.0) as client:
            try:
                res1 = await client.get("http://localhost:9090/-/healthy")
                prom_ok = res1.status_code == 200
            except Exception:
                prom_ok = False

            try:
                res2 = await client.get("http://localhost:3000/api/health")
                grafana_ok = res2.status_code == 200
            except Exception:
                grafana_ok = False

        status = "PASS" if (prom_ok and grafana_ok) else ("WARNING" if (prom_ok or grafana_ok) else "CRITICAL")
        return {
            "status": status,
            "prometheus_ok": prom_ok,
            "grafana_ok": grafana_ok
        }
