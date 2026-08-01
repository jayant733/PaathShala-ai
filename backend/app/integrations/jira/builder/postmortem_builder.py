import os
import datetime
from typing import Dict, Any

POSTMORTEM_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), "docs", "incidents")

class AIPostmortemBuilder:
    """
    Drafts structured Markdown Incident Postmortems under docs/incidents/.
    """
    def __init__(self):
        os.makedirs(POSTMORTEM_DIR, exist_ok=True)

    def generate_postmortem_draft(self, issue_key: str, ticket_data: Dict[str, Any], recovery_duration_sec: float = 12.4) -> str:
        filepath = os.path.join(POSTMORTEM_DIR, f"Postmortem_{issue_key}.md")
        now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        md_content = f"""# SRE Incident Postmortem: {issue_key}

## Executive Summary
- **Ticket Key**: `{issue_key}`
- **Generated At**: `{now}`
- **Affected Services**: `{', '.join(ticket_data.get('services', ['backend']))}`
- **Priority**: `{ticket_data.get('priority', 'P1 Critical')}`
- **Recovery Duration**: `{recovery_duration_sec}s`

## Suspected Root Cause (AI Confidence: {ticket_data.get('ai_confidence_pct', 85.0)}%)
{ticket_data.get('ai_summary', {}).get('suspected_root_cause', 'Container health check failure.')}

## System Impact
{ticket_data.get('ai_summary', {}).get('system_impact', 'Temporary API status 504 / high latency.')}

## Auto-Healing Remediation Executed
{ticket_data.get('ai_summary', {}).get('auto_remediation_attempted', 'Container restarted and log cache cleared.')}

## Recommendations & Next Steps
{ticket_data.get('ai_summary', {}).get('recommended_next_steps', 'Review database connection pool and resource allocations.')}
"""

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(md_content)

        return filepath
