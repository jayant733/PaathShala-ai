from typing import Dict, Any, Optional
import time

class ModelCapabilityCache:
    """
    In-memory TTL Capability Cache.
    Discovery -> Capability Cache -> Providers (on miss) -> SQLite
    """
    def __init__(self, ttl_seconds: int = 86400):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._timestamps: Dict[str, float] = {}
        self.ttl = ttl_seconds

    def get(self, model_name: str) -> Optional[Dict[str, Any]]:
        if model_name in self._cache:
            if time.time() - self._timestamps[model_name] < self.ttl:
                return self._cache[model_name]
        return None

    def set(self, model_name: str, data: Dict[str, Any]):
        self._cache[model_name] = data
        self._timestamps[model_name] = time.time()

global_capability_cache = ModelCapabilityCache()
