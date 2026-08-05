from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.routes import health_router, auth_router, users_router, ai_router, documents_router, agent_router, memory_router, dashboard_router, activity_router, chat_router, ai_providers_router, quizzes_router
from app.api.routes.routing_rules import router as routing_rules_router
from app.core.exceptions import AITimeoutException, AIRateLimitException, AIConfigurationException, AIBadRequestException


# pyrefly: ignore [missing-import]
from prometheus_fastapi_instrumentator import Instrumentator



from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PaathShal AI API",
    version="0.1.0",
    description="Agentic AI Learning Platform Backend"
)

# Prometheus metrics
Instrumentator().instrument(app).expose(
    app,
    endpoint="/metrics"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.database.registry_db import init_registry_db
from app.database.telemetry_db import init_telemetry_db
from app.ai_router.scheduler import global_scheduler
from app.ai_router.master_platform import MasterLocalAIRouter

from app.api.routes.health_routes import router as sre_health_router
from app.api.routes.router_routes import router as router_catalog_router
from app.api.routes.playground_routes import router as playground_router
from app.api.routes.admin_routes import router as admin_router

from app.api.routes.jira_routes import router as jira_router

init_registry_db()
init_telemetry_db()

app.include_router(sre_health_router)
app.include_router(router_catalog_router, prefix="/api/v1")
app.include_router(playground_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(jira_router, prefix="/api/v1")

app.include_router(health_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(agent_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(activity_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(ai_providers_router, prefix="/api/v1/ai")
app.include_router(routing_rules_router, prefix="/api/v1")
app.include_router(quizzes_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    await global_scheduler.start()
    try:
        master = MasterLocalAIRouter()
        await master.initialize_platform()
    except Exception as e:
        print(f"Platform startup notice: {e}")

@app.exception_handler(AITimeoutException)


async def ai_timeout_handler(request: Request, exc: AITimeoutException):
    return JSONResponse(status_code=504, content={"detail": exc.message})

@app.exception_handler(AIRateLimitException)
async def ai_ratelimit_handler(request: Request, exc: AIRateLimitException):
    return JSONResponse(status_code=429, content={"detail": exc.message})

@app.exception_handler(AIConfigurationException)
async def ai_config_handler(request: Request, exc: AIConfigurationException):
    return JSONResponse(status_code=500, content={"detail": exc.message})

@app.exception_handler(AIBadRequestException)
async def ai_badrequest_handler(request: Request, exc: AIBadRequestException):
    return JSONResponse(status_code=400, content={"detail": exc.message})


