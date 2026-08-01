import os
from typing import Dict, Any

DOCS_INCIDENT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "docs", "incidents")

def generate_postmortem_markdown(incident_data: Dict[str, Any]) -> str:
    """
    Generates formal markdown postmortem report under docs/incidents/.
    """
    os.makedirs(DOCS_INCIDENT_DIR, exist_ok=True)
    inc_id = incident_data.get("incident_id", "INC-UNKNOWN")
    filepath = os.path.join(DOCS_INCIDENT_DIR, f"Postmortem_{inc_id}.md")

    md_content = f"""# Incident Postmortem: {inc_id}

## Executive Summary
- **Incident ID**: `{inc_id}`
- **Service**: `{incident_data.get('service')}`
- **Severity**: `{incident_data.get('severity')}`
- **Status**: `{incident_data.get('status')}`
- **Opened At**: `{incident_data.get('opened_at')}`
- **Closed At**: `{incident_data.get('closed_at')}`

## Root Cause Analysis
- **Trigger**: {incident_data.get('trigger_reason')}
- **Resolution Summary**: {incident_data.get('resolution_summary', 'Automated self-healing recovery completed successfully.')}

## Timeline & SRE Actions Taken
- Opened incident tracking context.
- Executed diagnostic snapshot log collection.
- Triggered automated recovery loop.
- Verified service readiness.

## Action Items & Preventative Measures
1. Adjust warning thresholds in `automation/config/config.yaml`.
2. Monitor auto-healing recovery metrics in Grafana SRE Dashboard.
"""

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md_content)

    return filepath
