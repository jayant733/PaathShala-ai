import subprocess
import json
import os
from typing import Dict, Any, List

class DockerHealthChecker:
    """
    Checks Docker containers, restart counts, unhealthy states, and generates docker-health-report.txt.
    """
    def check_health(self) -> Dict[str, Any]:
        report_path = os.path.join(os.path.dirname(__file__), "docker-health-report.txt")
        try:
            cmd = ["docker", "ps", "--format", "{{.Names}}|{{.Status}}|{{.Image}}"]
            res = subprocess.run(cmd, capture_output=True, text=True, check=False)
            lines = [l.strip() for l in res.stdout.split("\n") if l.strip()]
            
            containers = []
            unhealthy_count = 0
            for l in lines:
                parts = l.split("|")
                name = parts[0]
                stat = parts[1] if len(parts) > 1 else "Unknown"
                is_unhealthy = "unhealthy" in stat.lower() or "restarting" in stat.lower()
                if is_unhealthy: unhealthy_count += 1
                containers.append({"name": name, "status": stat, "healthy": not is_unhealthy})

            overall_status = "PASS" if unhealthy_count == 0 else "CRITICAL"
            
            with open(report_path, "w", encoding="utf-8") as f:
                f.write(f"Docker Health Report - Status: {overall_status}\n")
                f.write("===================================================\n")
                for c in containers:
                    f.write(f"[{'PASS' if c['healthy'] else 'FAIL'}] {c['name']} - {c['status']}\n")

            return {
                "status": overall_status,
                "total_containers": len(containers),
                "unhealthy_containers": unhealthy_count,
                "containers": containers
            }
        except Exception as e:
            return {"status": "CRITICAL", "error": str(e), "total_containers": 0, "unhealthy_containers": 0}

if __name__ == "__main__":
    res = DockerHealthChecker().check_health()
    print(f"Docker Health: [{res['status']}] Total: {res['total_containers']}, Unhealthy: {res['unhealthy_containers']}")
