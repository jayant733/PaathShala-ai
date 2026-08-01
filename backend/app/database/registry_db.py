from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

REGISTRY_DB_PATH = os.path.join(os.path.dirname(__file__), "registry.db")
SQLALCHEMY_REGISTRY_URL = f"sqlite:///{REGISTRY_DB_PATH}"

engine_registry = create_engine(SQLALCHEMY_REGISTRY_URL, connect_args={"check_same_thread": False})
SessionRegistry = sessionmaker(autocommit=False, autoflush=False, bind=engine_registry)
BaseRegistry = declarative_base()

class ModelFamily(BaseRegistry):
    __tablename__ = "model_families"
    
    family_name = Column(String(50), primary_key=True) # e.g. "qwen", "llama"
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    versions = relationship("ModelRegistryVersion", back_populates="family")


class ModelRegistryVersion(BaseRegistry):
    __tablename__ = "model_registry_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    family_name = Column(String(50), ForeignKey("model_families.family_name"))
    model_name = Column(String(100), unique=True, index=True) # e.g. "qwen2.5-coder:7b"
    version_tag = Column(String(50)) # e.g. "2.5-7b"
    provider = Column(String(50), default="ollama")
    parameter_size = Column(String(20))
    quantization = Column(String(20))
    context_window = Column(Integer, default=8192)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    family = relationship("ModelFamily", back_populates="versions")
    capabilities = relationship("ModelCapabilitiesVerified", uselist=False, back_populates="model_rel")
    health = relationship("ModelHealthState", uselist=False, back_populates="model_rel")


class ModelCapabilitiesVerified(BaseRegistry):
    __tablename__ = "model_capabilities_verified"

    model_name = Column(String(100), ForeignKey("model_registry_versions.model_name"), primary_key=True)
    
    # Verified ratings (0.0 to 10.0)
    score_coding = Column(Float, default=5.0)
    score_python = Column(Float, default=5.0)
    score_java = Column(Float, default=5.0)
    score_math = Column(Float, default=5.0)
    score_reasoning = Column(Float, default=5.0)
    score_creative = Column(Float, default=5.0)
    score_summarization = Column(Float, default=5.0)
    
    # Feature Flags & Warmup State
    supports_vision = Column(Boolean, default=False)
    supports_json = Column(Boolean, default=True)
    supports_tool_calling = Column(Boolean, default=False)
    warmup_state = Column(String(20), default="Cold") # "Cold", "Warm", "Hot"
    last_used_at = Column(DateTime, nullable=True)
    
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    verified_at = Column(DateTime, default=datetime.utcnow)

    model_rel = relationship("ModelRegistryVersion", back_populates="capabilities")


class ModelHealthState(BaseRegistry):
    __tablename__ = "model_health_state"

    model_name = Column(String(100), ForeignKey("model_registry_versions.model_name"), primary_key=True)
    lifecycle_state = Column(String(30), default="DISCOVERED") # DISCOVERED, PROFILING, BENCHMARKING, READY, BUSY, COOLDOWN, DISABLED
    is_healthy = Column(Boolean, default=True)
    consecutive_failures = Column(Integer, default=0)
    circuit_breaker_active = Column(Boolean, default=False)
    circuit_cooldown_until = Column(DateTime, nullable=True)
    active_requests = Column(Integer, default=0)
    last_check = Column(DateTime, default=datetime.utcnow)

    model_rel = relationship("ModelRegistryVersion", back_populates="health")


class ModelBenchmarkRecord(BaseRegistry):
    __tablename__ = "model_benchmark_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), ForeignKey("model_registry_versions.model_name"))
    suite_version = Column(String(20), default="v1")
    category = Column(String(50)) # "coding", "math", "reasoning", "json_format"
    total_prompts = Column(Integer)
    passed_prompts = Column(Integer)
    accuracy = Column(Float) # 0.0 to 1.0
    avg_latency_sec = Column(Float)
    avg_tps = Column(Float)
    executed_at = Column(DateTime, default=datetime.utcnow)


def init_registry_db():
    BaseRegistry.metadata.create_all(bind=engine_registry)

def get_registry_db():
    db = SessionRegistry()
    try:
        yield db
    finally:
        db.close()
