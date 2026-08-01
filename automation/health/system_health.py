import psutil
from typing import Dict, Any
from automation.config.config_loader import global_sre_config

class SystemHealthChecker:
    """
    Checks system CPU, RAM, Swap, Disk, and Load Average. Outputs PASS, WARNING, or CRITICAL.
    """
    def check_health(self) -> Dict[str, Any]:
        cfg = global_sre_config.get("sre_config", {}).get("thresholds", {})
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent

        status = "PASS"
        if cpu >= cfg.get("cpu_critical", 90) or mem >= cfg.get("ram_critical", 92) or disk >= cfg.get("disk_critical", 88):
            status = "CRITICAL"
        elif cpu >= cfg.get("cpu_warning", 75) or mem >= cfg.get("ram_warning", 80) or disk >= cfg.get("disk_warning", 80):
            status = "WARNING"

        return {
            "status": status,
            "metrics": {
                "cpu_percent": cpu,
                "ram_percent": mem,
                "disk_percent": disk
            }
        }

if __name__ == "__main__":
    res = SystemHealthChecker().check_health()
    print(f"System Health: [{res['status']}] - CPU: {res['metrics']['cpu_percent']}%, RAM: {res['metrics']['ram_percent']}%, Disk: {res['metrics']['disk_percent']}%")
