import os
import yaml
from typing import Dict, Any

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.yaml")

def load_sre_config() -> Dict[str, Any]:
    """Loads centralized SRE configuration from config.yaml."""
    if not os.path.exists(CONFIG_PATH):
        return {
            "sre_config": {
                "thresholds": {"cpu_warning": 75, "cpu_critical": 90, "ram_warning": 80, "ram_critical": 92, "disk_warning": 80, "disk_critical": 88},
                "slo": {"target_availability_pct": 99.9},
                "auto_heal": {"max_retries_per_hour": 3, "cooldown_seconds": 60}
            }
        }
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

global_sre_config = load_sre_config()
