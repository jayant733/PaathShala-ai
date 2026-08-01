class PriorityMapper:
    """
    Maps SRE event types to Jira priority ratings (P1 Critical, P2 High, P3 Medium, P4 Low).
    """
    @staticmethod
    def map_priority(event_type: str, severity: str = "HIGH") -> str:
        evt = event_type.upper()
        if "CRASH" in evt or "CIRCUIT_BREAKER" in evt or severity == "CRITICAL":
            return "P1 Critical"
        elif "VALIDATION" in evt or "LATENCY" in evt or severity == "HIGH":
            return "P2 High"
        elif "BENCHMARK" in evt:
            return "P3 Medium"
        else:
            return "P4 Low"
