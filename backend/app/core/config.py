from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import dotenv_values
import os

# Force load from .env and override os.environ BEFORE Settings is instantiated
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
env_dict = dotenv_values(env_path)
for k, v in env_dict.items():
    if v is not None:
        os.environ[k] = v

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    REDIS_URL: str
    GEMINI_API_KEY: str
    
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    GEMINI_MODEL: str = "gemini-flash-latest"
    
    # --------------------------------------------------------- Usage Limits
    # Maximum conversations a user can create (protects Gemini API quota).
    MAX_CONVERSATIONS_PER_USER: int = 2
    # Maximum quizzes a user can generate.
    MAX_QUIZZES_PER_USER: int = 2
    # Maximum characters per message/prompt (~500 words at avg 6 chars/word).
    MAX_MESSAGE_LENGTH: int = 3000
    
    DEFAULT_AI_PROVIDER: str = "gemini"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    GEMINI_ENABLED: bool = True
    OLLAMA_ENABLED: bool = True

    # ------------------------------------------------------------------ ML
    # Adaptive learning engine (knowledge tracing / IRT / spaced repetition).
    ML_ENABLED: bool = True
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
