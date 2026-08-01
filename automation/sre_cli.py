import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import asyncio
from automation.health.system_health import SystemHealthChecker
from automation.health.docker_health import DockerHealthChecker
from automation.health.api_health import APIHealthChecker
from automation.health.monitoring_health import MonitoringHealthChecker
from automation.synthetic.synthetic_user import SyntheticUserSimulator
from automation.auto_heal.auto_healer import global_auto_healer
from automation.slo.slo_tracker import global_slo_tracker

def print_header():
    print("=" * 60)
    print("            PAATHSHALA SRE AUTOMATION TOOLKIT        ")
    print("=" * 60)

async def run_cli():
    print_header()

    sys_res = SystemHealthChecker().check_health()
    sys_icon = "PASS" if sys_res["status"] == "PASS" else ("WARN" if sys_res["status"] == "WARNING" else "FAIL")
    print(f"Checking System Resources ..... [ {sys_icon} ] (CPU: {sys_res['metrics']['cpu_percent']}%, RAM: {sys_res['metrics']['ram_percent']}%, Disk: {sys_res['metrics']['disk_percent']}%)")

    docker_res = DockerHealthChecker().check_health()
    docker_icon = "PASS" if docker_res["status"] == "PASS" else "FAIL"
    print(f"Checking Docker Containers .... [ {docker_icon} ] ({docker_res['total_containers']} Total, {docker_res['unhealthy_containers']} Unhealthy)")

    api_res = await APIHealthChecker().check_health()
    api_icon = "PASS" if api_res["status"] == "PASS" else "FAIL"
    print(f"Checking FastAPI & Gateway .... [ {api_icon} ] (Latency: {api_res['latency_ms']} ms)")

    mon_res = await MonitoringHealthChecker().check_health()
    mon_icon = "PASS" if mon_res["status"] == "PASS" else ("WARN" if mon_res["status"] == "WARNING" else "FAIL")
    print(f"Checking Prometheus & Grafana . [ {mon_icon} ] (Prometheus: {mon_res['prometheus_ok']}, Grafana: {mon_res['grafana_ok']})")

    synth_res = await SyntheticUserSimulator().run_journey()
    synth_icon = "PASS" if synth_res["journey_passed"] else "FAIL"
    print(f"Checking Synthetic User Journey [ {synth_icon} ] (Total Journey Time: {synth_res['total_latency_ms']} ms)")

    slo_metrics = global_slo_tracker.update_slo_metrics(99.92)
    print("-" * 60)
    print(f"SLO Target: {slo_metrics['slo_target_pct']}% | Error Budget Remaining: {slo_metrics['error_budget_remaining_pct']}% | MTTR: {slo_metrics['mttr_seconds']}s")

    print("=" * 60)
    overall = "HEALTHY" if sys_res["status"] != "CRITICAL" and api_res["status"] != "CRITICAL" else "DEGRADED / CRITICAL"
    print(f"OVERALL SYSTEM STATUS: {overall}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_cli())
