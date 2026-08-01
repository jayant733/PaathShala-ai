import subprocess
import time
from automation.auto_heal.audit_logger import global_audit_logger

class DockerCleaner:
    """
    Safely prunes dangling images, stopped containers, unused networks, and build cache.
    """
    def run_cleanup(self) -> dict:
        t0 = time.perf_counter()
        try:
            cmd = ["docker", "system", "prune", "-f"]
            res = subprocess.run(cmd, capture_output=True, text=True, check=False)
            elapsed = time.perf_counter() - t0
            
            global_audit_logger.log_action(
                action="Docker System Prune",
                reason="Scheduled Maintenance / High Disk Usage",
                result="SUCCESS" if res.returncode == 0 else "FAILED",
                duration_sec=elapsed
            )
            return {"status": "SUCCESS" if res.returncode == 0 else "FAILED", "output": res.stdout}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

if __name__ == "__main__":
    res = DockerCleaner().run_cleanup()
    print(f"Docker Prune Status: {res['status']}")
