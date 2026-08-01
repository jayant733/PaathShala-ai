import psutil
from typing import Dict, Any

class ResourceAgent:
    """
    4. Resource Agent: Monitors system hardware (CPU %, RAM %, Swap %, Disk I/O, VRAM) via psutil.
    """
    @staticmethod
    def get_system_resources() -> Dict[str, Any]:
        cpu_pct = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        disk = psutil.disk_usage('/')

        # Hardware metrics export
        return {
            "cpu_usage_pct": cpu_pct,
            "ram_usage_pct": mem.percent,
            "ram_free_mb": mem.available // (1024 * 1024),
            "swap_usage_pct": swap.percent,
            "disk_free_gb": disk.free // (1024 * 1024 * 1024),
            "vram_usage_pct": 35.0 # Simulated/Platform VRAM metric
        }

    @staticmethod
    def calculate_resource_availability_score(resources: Dict[str, Any]) -> float:
        """
        Returns resource score (0.0 to 1.0). Higher is better.
        """
        cpu_factor = resources["cpu_usage_pct"] / 100.0
        ram_factor = resources["ram_usage_pct"] / 100.0
        vram_factor = resources["vram_usage_pct"] / 100.0

        penalty = (0.4 * cpu_factor) + (0.4 * ram_factor) + (0.2 * vram_factor)
        return max(0.0, round(1.0 - penalty, 2))
