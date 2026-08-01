from typing import Dict
import asyncio
from app.router_config import router_settings

class ModelQueueManager:
    """
    Tracks concurrency limits per model to prevent hardware overload.
    """
    def __init__(self):
        self._active_counts: Dict[str, int] = {}
        self._max_limit = router_settings.MAX_CONCURRENT_PER_MODEL

    def is_model_busy(self, model_name: str) -> bool:
        return self._active_counts.get(model_name, 0) >= self._max_limit

    def acquire(self, model_name: str):
        self._active_counts[model_name] = self._active_counts.get(model_name, 0) + 1

    def release(self, model_name: str):
        if model_name in self._active_counts and self._active_counts[model_name] > 0:
            self._active_counts[model_name] -= 1

global_queue_manager = ModelQueueManager()
