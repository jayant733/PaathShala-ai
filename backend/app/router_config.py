from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Dict, Any

class RouterSettings(BaseSettings):
    ROUTER_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "local"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    
    # Feature Flags
    ENABLE_BENCHMARKING: bool = True
    ENABLE_SIMULATION_MODE: bool = True
    ENABLE_CLOUD_FALLBACK: bool = True
    ENABLE_HEALTH_CHECKS: bool = True
    ENABLE_DUAL_EXECUTION_ON_TIE: bool = True
    ENABLE_BACKGROUND_SCHEDULER: bool = True
    
    # Performance Thresholds
    CONFIDENCE_TIE_THRESHOLD: float = 0.02 # If score difference < 0.02, trigger dual execution
    MAX_CONCURRENT_PER_MODEL: int = 3
    CIRCUIT_BREAKER_FAILURES: int = 3
    CIRCUIT_BREAKER_COOLDOWN_SEC: int = 60
    
    # Jira Settings
    JIRA_URL: str = ""
    JIRA_EMAIL: str = ""
    JIRA_API_TOKEN: str = ""
    JIRA_PROJECT_KEY: str = "LOCALAI"
    JIRA_ENABLE_AUTO_TICKETS: bool = True
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

router_settings = RouterSettings()
