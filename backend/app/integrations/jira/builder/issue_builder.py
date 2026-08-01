from typing import Dict, Any, List
from app.integrations.jira.mapper.priority import PriorityMapper
from app.integrations.jira.mapper.labels import LabelMapper
from app.integrations.jira.builder.ai_summary import AIIncidentSummarizer

class IssueBuilder:
    """
    Builds authentic SRE Jira Ticket payloads with AI-suspected root cause, confidence %, timeline, and telemetry snapshots.
    """
    def __init__(self, ai_summarizer: AIIncidentSummarizer = None):
        self.ai_summarizer = ai_summarizer or AIIncidentSummarizer()

    async def build_issue_payload(
        self,
        service: str,
        trigger_reason: str,
        metrics: Dict[str, Any],
        logs: List[str],
        timeline: List[Dict[str, Any]],
        event_type: str = "CONTAINER_UNHEALTHY",
        request_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:

        ai_sum = await self.ai_summarizer.generate_summary(service, trigger_reason)
        priority = PriorityMapper.map_priority(event_type)
        labels = LabelMapper.map_labels(service, trigger_reason)

        description = f"""
*SRE INCIDENT REPORT*
*Service*: {service}
*Trigger Reason*: {trigger_reason}

*AI-SUSPECTED ROOT CAUSE* ({ai_sum['confidence_pct']}% Confidence):
{ai_sum['suspected_root_cause']}

*SYSTEM IMPACT*:
{ai_sum['system_impact']}

*PROMETHEUS HARDWARE SNAPSHOT*:
- CPU Usage: {metrics.get('cpu_percent', 0)}%
- RAM Usage: {metrics.get('ram_percent', 0)}%
- p95 Latency: {metrics.get('p95_latency_ms', 0)} ms

*RECENT LOKI ERROR LOGS*:
{chr(10).join(logs[:5])}

*RECOMMENDED NEXT STEPS*:
{ai_sum['recommended_next_steps']}
"""

        return {
            "summary": f"[{priority}] {service.capitalize()}: {trigger_reason[:60]}",
            "description": description.strip(),
            "priority": priority,
            "labels": labels,
            "services": [service],
            "ai_confidence_pct": ai_sum["confidence_pct"],
            "ai_summary": ai_sum,
            "timeline": timeline,
            "request_context": request_context
        }
