from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    REDIS_URL: str
    GEMINI_API_KEY: str
    
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    GEMINI_MODEL: str = "gemini-flash-latest"
    
    DEFAULT_AI_PROVIDER: str = "gemini"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    GEMINI_ENABLED: bool = True
    OLLAMA_ENABLED: bool = True

    # ------------------------------------------------------------------ ML
    # Adaptive learning engine (knowledge tracing / IRT / spaced repetition).
    # Default OFF so existing behavior and tests are untouched until enabled.
    ML_ENABLED: bool = False
    # Optional deep-learning frameworks (torch/tf/jax) — used when available.
    ML_DL_ENABLED: bool = True
    # Which trainer backend to use: sklearn | xgboost | lightgbm | torch | tensorflow | jax
    ML_BACKEND: str = "sklearn"
    ML_RETRAIN_INTERVAL_HOURS: int = 24
    # Directory (relative to backend/) for persisted model artifacts.
    ML_MODEL_DIR: str = "models"
    # Ebbinghaus forgetting decay rate (per day) for spaced-repetition display.
    ML_FORGETTING_LAMBDA: float = 0.1
    # Elo: initial rating and K-factor.
    ML_ELO_START: float = 1500.0
    ML_ELO_K: float = 32.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
