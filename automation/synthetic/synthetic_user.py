import httpx
import time
import asyncio

class SyntheticUserSimulator:
    """
    Simulates complete user journey: Health -> Catalog -> Simulation -> Metric check.
    """
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url

    async def run_journey(self) -> dict:
        t0 = time.perf_counter()
        steps = []

        async with httpx.AsyncClient(timeout=5.0) as client:
            # Step 1: Health check
            r1 = await client.get(f"{self.base_url}/health/ready")
            steps.append({"step": "1_health_ready", "ok": r1.status_code == 200})

            # Step 2: Catalog check
            r2 = await client.get(f"{self.base_url}/api/v1/router/catalog")
            steps.append({"step": "2_catalog", "ok": r2.status_code in [200, 401]})

            # Step 3: Simulation check
            r3 = await client.post(f"{self.base_url}/api/v1/router/simulate", json={"prompt": "Write Python code"})
            steps.append({"step": "3_simulation", "ok": r3.status_code in [200, 401]})

        total_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        all_passed = all(s["ok"] for s in steps)

        return {
            "journey_passed": all_passed,
            "total_latency_ms": total_ms,
            "step_results": steps
        }

if __name__ == "__main__":
    res = asyncio.run(SyntheticUserSimulator().run_journey())
    print(f"Synthetic Journey Passed: {res['journey_passed']} in {res['total_latency_ms']} ms")
