import asyncio
import collections
from typing import Dict, List, Callable, Any
from app.ai_router.events import RouterEventType
from app.core.logging import logger

class EventBus:
    """
    Decoupled In-Memory Asyncio EventBus using asyncio.create_task.
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = collections.defaultdict(list)

    def subscribe(self, event_type: RouterEventType, handler: Callable):
        self._subscribers[event_type.value].append(handler)
        logger.info(f"EventBus: Registered subscriber for {event_type.value}")

    def publish(self, event_type: RouterEventType, data: Dict[str, Any]):
        handlers = self._subscribers.get(event_type.value, [])
        for handler in handlers:
            asyncio.create_task(self._safe_execute(handler, event_type.value, data))

    async def _safe_execute(self, handler: Callable, event_name: str, data: Dict[str, Any]):
        try:
            if asyncio.iscoroutinefunction(handler):
                await handler(data)
            else:
                handler(data)
        except Exception as e:
            logger.error(f"Error handling event {event_name}: {e}")

global_event_bus = EventBus()
