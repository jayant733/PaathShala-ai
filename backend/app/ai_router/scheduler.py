import asyncio
from app.ai_router.discovery.discovery_agent import DiscoveryAgent
from app.ai_router.resource_health.health_agent import HealthCircuitBreakerAgent
from app.router_config import router_settings
from app.core.config import settings
from app.core.logging import logger

class BackgroundScheduler:
    """
    10-Minute Async Background Scheduler running Ollama tag polls and 30s health checks,
    plus the adaptive-ML retrain loop (gated on ML_ENABLED).
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
        if settings.ML_ENABLED:
            logger.info("BackgroundScheduler: Starting adaptive-ML retrain loop "
                        "(every %s hours).", settings.ML_RETRAIN_INTERVAL_HOURS)
            asyncio.create_task(self._ml_retrain_loop())

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

    async def _ml_retrain_loop(self):
        """Refit the mastery model + recalibrate item difficulty periodically.

        Only started when ML_ENABLED is true. The model fit (LogisticRegression
        on the observation table) is small and fast, so awaiting it inline is
        fine for a multi-hour background cadence.
        """
        from app.database.session import AsyncSessionLocal
        from app.repositories.ml_repository import MLRepository
        from app.services.ml import KnowledgeMasteryEngine

        while self._running:
            try:
                async with AsyncSessionLocal() as session:
                    engine = KnowledgeMasteryEngine(MLRepository(session))
                    result = await engine.fit_models()
                    logger.info("BackgroundScheduler: ML retrain status=%s observations=%s",
                                result.get("status"), result.get("observations_count"))
            except Exception as e:
                logger.error(f"BackgroundScheduler ML retrain error: {e}")
            await asyncio.sleep(settings.ML_RETRAIN_INTERVAL_HOURS * 3600)

global_scheduler = BackgroundScheduler()
