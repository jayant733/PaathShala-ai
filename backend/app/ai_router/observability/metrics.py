from prometheus_client import Counter, Histogram, Gauge

ROUTER_REQUESTS_TOTAL = Counter('router_requests_total', 'Total prompt requests processed by AI Router', ['intent', 'selected_model'])
ROUTER_LATENCY_SECONDS = Histogram('router_latency_seconds', 'Request latency in seconds', ['selected_model'])
ROUTER_FALLBACK_TOTAL = Counter('router_fallback_total', 'Total fallback executions triggered', ['primary_model', 'fallback_model'])
ROUTER_VALIDATION_FAILURES = Counter('router_response_validation_failures', 'Total quality validation failures', ['model_name', 'reason'])
ROUTER_CONFIDENCE = Histogram('router_confidence', 'Confidence score distribution of routing decisions')

SYSTEM_CPU_USAGE = Gauge('router_cpu_usage', 'System CPU usage percentage')
SYSTEM_RAM_USAGE = Gauge('router_ram_usage', 'System RAM usage percentage')
SYSTEM_GPU_VRAM_USAGE = Gauge('router_vram_usage', 'GPU VRAM usage percentage')
MODEL_HEALTH_STATUS = Gauge('model_health', 'Health status of registered models (1=Healthy, 0=Unhealthy)', ['model_name'])
