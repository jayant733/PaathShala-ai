import os
import json
import zipfile
import datetime
from typing import Dict, Any

RCA_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "automation", "rca_packages")

class RCAPackager:
    """
    Bundles diagnostic telemetry into an incident_package.zip (logs, metrics, timeline, trace, request).
    """
    def __init__(self):
        os.makedirs(RCA_OUTPUT_DIR, exist_ok=True)

    def create_rca_package(
        self,
        incident_id: str,
        metrics: Dict[str, Any],
        logs: list,
        traces: Dict[str, Any],
        timeline: list,
        request_context: Dict[str, Any] = None
    ) -> str:
        stamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        zip_name = f"rca_package_{incident_id}_{stamp}.zip"
        zip_path = os.path.join(RCA_OUTPUT_DIR, zip_name)

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr("metrics.json", json.dumps(metrics, indent=2))
            zipf.writestr("logs.json", json.dumps(logs, indent=2))
            zipf.writestr("trace.json", json.dumps(traces, indent=2))
            zipf.writestr("timeline.json", json.dumps(timeline, indent=2))
            if request_context:
                zipf.writestr("request.json", json.dumps(request_context, indent=2))

        return zip_path
