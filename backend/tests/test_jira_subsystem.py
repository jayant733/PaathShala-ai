import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

import pytest
import asyncio
from app.integrations.jira.client.jira_client import global_jira_client
from app.integrations.jira.collector.metrics import PrometheusMetricsCollector
from app.integrations.jira.collector.logs import LokiLogsCollector
from app.integrations.jira.collector.rca_packager import RCAPackager
from app.integrations.jira.engine.deduplicator import IncidentDeduplicator
from app.integrations.jira.engine.correlation import IncidentCorrelationEngine
from app.integrations.jira.service.jira_service import global_jira_service

def test_jira_client_mock_status():
    status = global_jira_client.get_connection_status()
    assert "mode" in status
    assert status["connected"] is True

def test_metrics_and_logs_collector():
    metrics = PrometheusMetricsCollector().collect_metrics_snapshot()
    assert "cpu_percent" in metrics
    assert "ram_percent" in metrics

    logs = LokiLogsCollector().collect_recent_error_logs(limit=10)
    assert len(logs) > 0

def test_deduplication_engine():
    dedup = IncidentDeduplicator(window_seconds=10)
    service = "test-backend"
    
    assert dedup.check_duplicate(service) is None
    dedup.register_incident(service, "LOCALAI-999")
    
    dup = dedup.check_duplicate(service)
    assert dup is not None
    assert dup["ticket_key"] == "LOCALAI-999"

def test_correlation_engine():
    corr = IncidentCorrelationEngine(window_seconds=30)
    affected = corr.correlate_incident("redis", "Connection timeout")
    assert "redis" in affected

@pytest.mark.asyncio
async def test_create_incident_ticket():
    res = await global_jira_service.create_incident_ticket(
        service="paathshala-backend",
        trigger_reason="Container health check timeout"
    )
    assert "key" in res
    assert "rca_package_path" in res
    assert os.path.exists(res["rca_package_path"])
