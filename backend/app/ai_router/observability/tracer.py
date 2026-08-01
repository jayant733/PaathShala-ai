import uuid
import time
from contextlib import contextmanager
from typing import Dict, Any

class SimpleSpan:
    def __init__(self, name: str, trace_id: str):
        self.name = name
        self.trace_id = trace_id
        self.start_time = 0.0
        self.end_time = 0.0
        self.elapsed_ms = 0.0
        self.attributes: Dict[str, Any] = {}

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.perf_counter()
        self.elapsed_ms = round((self.end_time - self.start_time) * 1000.0, 2)

    def set_attribute(self, key: str, value: Any):
        self.attributes[key] = value

class RouterTracer:
    """
    OpenTelemetry-compatible tracer context for request timeline spans.
    """
    @staticmethod
    def generate_trace_id() -> str:
        return f"trace_{uuid.uuid4().hex[:16]}"

    @staticmethod
    def generate_request_id() -> str:
        return f"req_{uuid.uuid4().hex[:12]}"

    @contextmanager
    def start_span(self, name: str, trace_id: str):
        span = SimpleSpan(name, trace_id)
        with span:
            yield span

tracer = RouterTracer()
