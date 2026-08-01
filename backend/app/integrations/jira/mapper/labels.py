from typing import List

class LabelMapper:
    """
    Generates dynamic labels (backend, gateway, performance, llm, docker, redis, postgres).
    """
    @staticmethod
    def map_labels(service: str, trigger_reason: str) -> List[str]:
        labels = ["sre", "localai"]
        svc_lower = service.lower()
        reason_lower = trigger_reason.lower()

        if "backend" in svc_lower or "api" in reason_lower: labels.append("backend")
        if "gateway" in svc_lower or "nginx" in reason_lower: labels.append("gateway")
        if "redis" in svc_lower: labels.append("redis")
        if "postgres" in svc_lower or "database" in reason_lower: labels.append("postgres")
        if "model" in reason_lower or "qwen" in reason_lower or "llama" in reason_lower: labels.append("llm")
        if "latency" in reason_lower or "performance" in reason_lower: labels.append("performance")
        if "container" in reason_lower or "docker" in reason_lower: labels.append("docker")

        return list(set(labels))
