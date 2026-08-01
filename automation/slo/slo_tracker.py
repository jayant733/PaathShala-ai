from prometheus_client import Gauge, Counter

SLO_AVAILABILITY_GAUGE = Gauge('sre_slo_availability', 'Current rolling service availability percentage')
ERROR_BUDGET_GAUGE = Gauge('sre_error_budget', 'Remaining SLO Error Budget percentage')
MTTR_GAUGE = Gauge('sre_mttr_seconds', 'Mean Time To Recovery in seconds')
MTBF_GAUGE = Gauge('sre_mtbf_seconds', 'Mean Time Between Failures in seconds')

class SLOTracker:
    """
    SLO & Error Budget Tracker exporting sre_slo_availability, sre_error_budget, sre_mttr_seconds.
    """
    def __init__(self, target_availability: float = 99.9):
        self.target_availability = target_availability

    def update_slo_metrics(self, current_availability: float, mttr_seconds: float = 24.5, mtbf_seconds: float = 86400.0):
        error_budget_remaining = max(0.0, 100.0 - ((100.0 - current_availability) / (100.0 - self.target_availability) * 100.0))
        
        SLO_AVAILABILITY_GAUGE.set(current_availability)
        ERROR_BUDGET_GAUGE.set(round(error_budget_remaining, 2))
        MTTR_GAUGE.set(mttr_seconds)
        MTBF_GAUGE.set(mtbf_seconds)

        return {
            "slo_target_pct": self.target_availability,
            "current_availability_pct": current_availability,
            "error_budget_remaining_pct": round(error_budget_remaining, 2),
            "mttr_seconds": mttr_seconds,
            "mtbf_seconds": mtbf_seconds
        }

global_slo_tracker = SLOTracker()
