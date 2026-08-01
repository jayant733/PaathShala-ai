from typing import Dict, Any, Optional, List
from app.integrations.jira.client.jira_client import global_jira_client
from app.integrations.jira.collector.metrics import PrometheusMetricsCollector
from app.integrations.jira.collector.logs import LokiLogsCollector
from app.integrations.jira.collector.traces import TraceCollector
from app.integrations.jira.collector.timeline import IncidentTimelineBuilder
from app.integrations.jira.collector.rca_packager import RCAPackager
from app.integrations.jira.builder.issue_builder import IssueBuilder
from app.integrations.jira.builder.postmortem_builder import AIPostmortemBuilder
from app.integrations.jira.engine.deduplicator import IncidentDeduplicator
from app.integrations.jira.engine.correlation import IncidentCorrelationEngine
from app.integrations.jira.engine.rate_limiter import IncidentRateLimiter
from app.ai_router.event_bus import global_event_bus
from app.ai_router.events import RouterEventType
from app.core.logging import logger

class JiraIncidentService:
    """
    Master SRE Jira Subsystem Facade: Subscribes to Event Bus, coordinates metrics/logs/traces collectors, handles deduplication, builds AI tickets & postmortems.
    """
    def __init__(self):
        self.jira_client = global_jira_client
        self.metrics_collector = PrometheusMetricsCollector()
        self.logs_collector = LokiLogsCollector()
        self.trace_collector = TraceCollector()
        self.timeline_builder = IncidentTimelineBuilder()
        self.rca_packager = RCAPackager()
        self.issue_builder = IssueBuilder()
        self.postmortem_builder = AIPostmortemBuilder()
        self.deduplicator = IncidentDeduplicator()
        self.correlation_engine = IncidentCorrelationEngine()
        self.rate_limiter = IncidentRateLimiter()

        self._register_event_subscribers()

    def _register_event_subscribers(self):
        global_event_bus.subscribe(RouterEventType.MODEL_HEALTH_CHANGED, self._handle_model_health_event)
        global_event_bus.subscribe(RouterEventType.VALIDATION_FAILED, self._handle_validation_failed_event)
        logger.info("JiraIncidentService: Registered subscribers on EventBus.")

    async def _handle_model_health_event(self, data: Dict[str, Any]):
        model_name = data.get("model_name", "unknown_model")
        await self.create_incident_ticket(
            service=model_name,
            trigger_reason=f"Model '{model_name}' entered COOLDOWN state via Health Circuit Breaker.",
            event_type="MODEL_HEALTH_CHANGED"
        )

    async def _handle_validation_failed_event(self, data: Dict[str, Any]):
        model_name = data.get("model_name", "unknown_model")
        reason = data.get("reason", "Malformed JSON")
        await self.create_incident_ticket(
            service=model_name,
            trigger_reason=f"Quality Validation Failed on {model_name}: {reason}",
            event_type="VALIDATION_FAILED"
        )

    async def create_incident_ticket(
        self,
        service: str,
        trigger_reason: str,
        event_type: str = "CONTAINER_UNHEALTHY",
        request_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:

        # Rate Limiting Check
        if self.rate_limiter.is_rate_limited(service):
            logger.warning(f"JiraIncidentService: Rate limited ticket creation for service '{service}'")
            return {"status": "RATE_LIMITED", "reason": "Max tickets per minute exceeded"}

        # Deduplication Check
        dup = self.deduplicator.check_duplicate(service)
        if dup:
            ticket_key = dup["ticket_key"]
            comment_msg = f"⚡ Incident Recurred! Occurrence #{dup['count']}.\nTrigger: {trigger_reason}"
            await self.jira_client.add_comment(ticket_key, comment_msg)
            logger.info(f"JiraIncidentService: Deduplicated event for {service}. Appended comment to {ticket_key}")
            return {"status": "DEDUPLICATED", "ticket_key": ticket_key, "count": dup["count"]}

        # Cross-Service Correlation
        affected_services = self.correlation_engine.correlate_incident(service, trigger_reason)

        # Collect Telemetry
        metrics_snap = self.metrics_collector.collect_metrics_snapshot()
        error_logs = self.logs_collector.collect_recent_error_logs(limit=50)
        trace_snap = self.trace_collector.collect_trace_snapshot()
        timeline_data = self.timeline_builder.build_timeline(service, trigger_reason)

        # Build Ticket Payload
        payload = await self.issue_builder.build_issue_payload(
            service=service,
            trigger_reason=trigger_reason,
            metrics=metrics_snap,
            logs=error_logs,
            timeline=timeline_data,
            event_type=event_type,
            request_context=request_context
        )
        payload["services"] = affected_services

        # Post Ticket via Jira Client
        result = await self.jira_client.create_issue(payload)
        ticket_key = result.get("key", "LOCALAI-101")
        self.deduplicator.register_incident(service, ticket_key)

        # Build RCA Zip Package
        rca_zip_path = self.rca_packager.create_rca_package(
            incident_id=ticket_key,
            metrics=metrics_snap,
            logs=error_logs,
            traces=trace_snap,
            timeline=timeline_data,
            request_context=request_context
        )
        result["rca_package_path"] = rca_zip_path

        # Generate AI Postmortem Draft
        self.postmortem_builder.generate_postmortem_draft(ticket_key, payload)

        logger.info(f"JiraIncidentService: Created ticket {ticket_key} for {service}")
        return result

global_jira_service = JiraIncidentService()
