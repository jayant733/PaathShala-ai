import os
import yaml
from typing import Dict, Any
from app.core.logging import logger

POLICIES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "policies")

class YAMLPolicyEngine:
    """
    In-Memory YAML Policy Engine: Loads routing rules dynamically from policies/*.yaml.
    """
    def __init__(self):
        self._policies: Dict[str, Dict[str, Any]] = {}
        self.reload_policies()

    def reload_policies(self):
        self._policies.clear()
        if not os.path.exists(POLICIES_DIR):
            return

        for fname in os.listdir(POLICIES_DIR):
            if fname.endswith(".yaml") or fname.endswith(".yml"):
                filepath = os.path.join(POLICIES_DIR, fname)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        data = yaml.safe_load(f)
                        domain = data.get("domain", "default")
                        self._policies[domain] = data
                        logger.info(f"YAMLPolicyEngine: Loaded policy '{data.get('policy_name')}' for domain '{domain}'")
                except Exception as e:
                    logger.error(f"YAMLPolicyEngine: Failed loading policy {fname}: {e}")

    def get_policy_for_domain(self, domain: str) -> Dict[str, Any]:
        return self._policies.get(domain, self._policies.get("default", {
            "policy_name": "default_fallback",
            "version": "v1",
            "weights": {"capability": 0.40, "benchmark": 0.30, "speed": 0.15, "resource": 0.15}
        }))

global_policy_engine = YAMLPolicyEngine()
