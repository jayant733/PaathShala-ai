import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

import pytest
import asyncio
from automation.config.config_loader import global_sre_config
from automation.health.system_health import SystemHealthChecker
from automation.health.docker_health import DockerHealthChecker
from automation.slo.slo_tracker import global_slo_tracker
from automation.maintenance.database_backup import DatabaseBackupEngine
from automation.recovery.restore_database import DisasterRecoveryEngine
from automation.synthetic.synthetic_user import SyntheticUserSimulator

def test_sre_config_load():
    cfg = global_sre_config.get("sre_config", {})
    assert "thresholds" in cfg
    assert "slo" in cfg

def test_system_health_checker():
    res = SystemHealthChecker().check_health()
    assert res["status"] in ["PASS", "WARNING", "CRITICAL"]

def test_docker_health_checker():
    res = DockerHealthChecker().check_health()
    assert "status" in res

def test_slo_tracker():
    metrics = global_slo_tracker.update_slo_metrics(99.95)
    assert metrics["slo_target_pct"] == 99.9
    assert metrics["current_availability_pct"] == 99.95

def test_backup_and_recovery():
    backup_res = DatabaseBackupEngine().run_backup()
    assert backup_res["status"] == "SUCCESS"

    restore_res = DisasterRecoveryEngine().restore_latest_backup()
    assert restore_res["status"] == "SUCCESS"

@pytest.mark.asyncio
async def test_synthetic_user():
    res = await SyntheticUserSimulator().run_journey()
    assert "journey_passed" in res
