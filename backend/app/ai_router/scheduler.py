import asyncio
from app.ai_router.discovery.discovery_agent import DiscoveryAgent
from app.ai_router.resource_health.health_agent import HealthCircuitBreakerAgent
from app.router_config import router_settings
from app.core.logging import logger

class BackgroundScheduler:
    """
    10-Minute Async Background Scheduler running Ollama tag polls and 30s health checks.
    """
    def __init__(self):
        self.discovery_agent = DiscoveryAgent()
        self.health_agent = HealthCircuitBreakerAgent()
        self._running = False

    async def start(self):
        if not router_settings.ENABLE_BACKGROUND_SCHEDULER:
            logger.info("BackgroundScheduler disabled in settings.")
            return

        self._running = True
        logger.info("BackgroundScheduler: Started background discovery & health loops.")
        asyncio.create_task(self._discovery_loop())
        asyncio.create_task(self._health_loop())

    async def _discovery_loop(self):
        while self._running:
            try:
                logger.info("BackgroundScheduler: Running 10-min Ollama discovery check...")
                await self.discovery_agent.run_discovery_pipeline()
            except Exception as e:
                logger.error(f"BackgroundScheduler discovery error: {e}")
            await asyncio.sleep(600) # 10 minutes

    async def _health_loop(self):
        while self._running:
            try:
                await self.health_agent.check_all_health()
            except Exception as e:
                logger.error(f"BackgroundScheduler health error: {e}")
            await asyncio.sleep(30) # 30 seconds

global_scheduler = BackgroundScheduler()
