import time
import asyncio
import subprocess
from prometheus_client import Counter
from automation.health.system_health import SystemHealthChecker
from automation.health.docker_health import DockerHealthChecker
from automation.health.api_health import APIHealthChecker
from automation.maintenance.cleanup_docker import DockerCleaner
from automation.maintenance.rotate_logs import LogRotator
from automation.incident.incident_manager import global_incident_manager
from automation.auto_heal.audit_logger import global_audit_logger
import logging
logger = logging.getLogger("AutoHealer")

AUTOHEAL_ACTIONS_COUNTER = Counter('sre_autoheal_total', 'Total auto-healing recovery actions executed', ['service', 'action'])

class AutoHealerEngine:
    """
    Autonomous Self-Healing Loop: Restarts unhealthy containers, purges disk space on overflow, and manages incident lifecycle.
    """
    def __init__(self):
        self.sys_checker = SystemHealthChecker()
        self.docker_checker = DockerHealthChecker()
        self.api_checker = APIHealthChecker()
        self.docker_cleaner = DockerCleaner()
        self.log_rotator = LogRotator()

    async def run_autoheal_cycle(self) -> dict:
        sys_res = self.sys_checker.check_health()
        docker_res = self.docker_checker.check_health()
        api_res = await self.api_checker.check_health()

        actions_performed = []

        # 1. Disk Space / High Memory Healing
        if sys_res["status"] in ["WARNING", "CRITICAL"]:
            if sys_res["metrics"]["disk_percent"] > 80:
                print("AutoHealer: Disk usage high! Executing safe Docker & Log prune...")
                self.docker_cleaner.run_cleanup()
                self.log_rotator.rotate_logs()
                AUTOHEAL_ACTIONS_COUNTER.labels(service="disk", action="prune_cache").inc()
                actions_performed.append("disk_prune")

        # 2. Unhealthy Docker Container Healing
        if docker_res["status"] == "CRITICAL":
            for c in docker_res.get("containers", []):
                if not c["healthy"]:
                    name = c["name"]
                    print(f"AutoHealer: Container '{name}' unhealthy! Opening Incident & Executing Restart...")
                    inc = await global_incident_manager.open_incident(service=name, trigger_reason=f"Container {name} reported unhealthy state: {c['status']}")
                    
                    t0 = time.perf_counter()
                    sub_res = subprocess.run(["docker", "restart", name], capture_output=True, text=True)
                    elapsed = time.perf_counter() - t0

                    if sub_res.returncode == 0:
                        AUTOHEAL_ACTIONS_COUNTER.labels(service=name, action="restart").inc()
                        actions_performed.append(f"restart_{name}")
                        await global_incident_manager.close_incident(
                            incident_id=inc["incident_id"],
                            resolution_summary=f"Successfully restarted container {name} in {round(elapsed, 2)}s."
                        )

        # 3. API Readiness Failure Healing
        if api_res["status"] == "CRITICAL" and not api_res["api_ok"]:
            print("AutoHealer: FastAPI backend unreachable! Attempting backend container restart...")
            inc = await global_incident_manager.open_incident(service="paathshala-backend", trigger_reason="FastAPI /health/ready probe 5xx / timeout failure.")
            subprocess.run(["docker", "restart", "paathshala-backend"], capture_output=True, text=True)
            AUTOHEAL_ACTIONS_COUNTER.labels(service="backend", action="restart").inc()
            actions_performed.append("restart_backend")
            await global_incident_manager.close_incident(inc["incident_id"], "Restarted paathshala-backend container.")

        return {"actions_count": len(actions_performed), "actions": actions_performed}

global_auto_healer = AutoHealerEngine()

if __name__ == "__main__":
    res = asyncio.run(global_auto_healer.run_autoheal_cycle())
    print(f"AutoHeal Cycle Result: {res}")
