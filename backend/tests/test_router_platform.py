import pytest
import asyncio
from app.ai_router.discovery.discovery_agent import DiscoveryAgent
from app.ai_router.routing.intent_agent import IntentClassifierAgent
from app.ai_router.routing.complexity_agent import PromptComplexityAgent
from app.ai_router.routing.policy_engine import global_policy_engine
from app.ai_router.resource_health.resource_agent import ResourceAgent
from app.ai_router.master_platform import MasterLocalAIRouter

def test_intent_classification():
    agent = IntentClassifierAgent()
    res = agent.classify("Write a Python function for binary search")
    assert res.primary_intent == "coding"
    assert res.detected_language == "python"

def test_complexity_analysis():
    agent = PromptComplexityAgent()
    level = agent.analyze_complexity("Design a distributed caching architecture with consistent hashing")
    assert level in ["Hard", "Expert"]

def test_policy_engine_load():
    policy = global_policy_engine.get_policy_for_domain("coding")
    assert policy.get("domain") == "coding"
    assert "weights" in policy

def test_resource_agent():
    resources = ResourceAgent.get_system_resources()
    assert "cpu_usage_pct" in resources
    assert "ram_usage_pct" in resources
    score = ResourceAgent.calculate_resource_availability_score(resources)
    assert 0.0 <= score <= 1.0

@pytest.mark.asyncio
async def test_router_simulation_mode():
    master = MasterLocalAIRouter()
    res = await master.route_and_process(prompt="Calculate the integral of sin(x)", simulate_only=True)
    assert res.get("simulation") is True
    assert "selected_model" in res
    assert "explainability" in res
    assert "timeline_ms" in res
