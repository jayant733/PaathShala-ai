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
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
