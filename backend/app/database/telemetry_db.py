from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

TELEMETRY_DB_PATH = os.path.join(os.path.dirname(__file__), "telemetry.db")
SQLALCHEMY_TELEMETRY_URL = f"sqlite:///{TELEMETRY_DB_PATH}"

engine_telemetry = create_engine(SQLALCHEMY_TELEMETRY_URL, connect_args={"check_same_thread": False})
SessionTelemetry = sessionmaker(autocommit=False, autoflush=False, bind=engine_telemetry)
BaseTelemetry = declarative_base()

class TelemetryRecord(BaseTelemetry):
    __tablename__ = "telemetry_records"

    request_id = Column(String(64), primary_key=True)
    trace_id = Column(String(64), index=True)
    prompt_hash = Column(String(64), index=True)
    router_version = Column(String(20))
    policy_version = Column(String(50))
    
    detected_intent = Column(String(50))
    detected_complexity = Column(String(20))
    context_tokens = Column(Integer)
    
    selected_model = Column(String(100))
    confidence_score = Column(Float)
    score_breakdown = Column(JSON)
    explainability = Column(JSON)
    
    timeline_ms = Column(JSON) # Breakdown: security_check, intent, complexity, decision, execution, validation, total
    total_latency_ms = Column(Float)
    fallback_used = Column(Boolean, default=False)
    fallback_reason = Column(String(255), nullable=True)
    dual_execution_triggered = Column(Boolean, default=False)
    
    user_rating = Column(Integer, nullable=True) # 1 to 5
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ValidationFailureRecord(BaseTelemetry):
    __tablename__ = "validation_failures"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(64), index=True)
    model_name = Column(String(100))
    failure_reason = Column(String(255))
    output_snippet = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_telemetry_db():
    BaseTelemetry.metadata.create_all(bind=engine_telemetry)

def get_telemetry_db():
    db = SessionTelemetry()
    try:
        yield db
    finally:
        db.close()
