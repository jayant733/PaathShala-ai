import time
import hashlib
import asyncio
from typing import Dict, Any, Optional
from app.ai_router.discovery.discovery_agent import DiscoveryAgent
from app.ai_router.knowledge.capability_engine import CapabilityIntelligenceEngine
from app.ai_router.resource_health.health_agent import HealthCircuitBreakerAgent
from app.ai_router.routing.intent_agent import IntentClassifierAgent
from app.ai_router.routing.complexity_agent import PromptComplexityAgent
from app.ai_router.routing.context_calculator import ContextWindowCalculator
from app.ai_router.routing.router_agent import RouterAgent
from app.ai_router.execution.execution_agent import ExecutionAgent
from app.ai_router.validation.validation_agent import ValidationAgent
from app.ai_router.telemetry.telemetry_agent import TelemetryAnalyticsAgent
from app.ai_router.observability.tracer import tracer
from app.router_config import router_settings
from app.services.ai_service import AIService
from app.core.logging import logger

class MasterLocalAIRouter:
    """
    Master LocalAI Router Orchestrator coordinating all 7 Agents with OpenTelemetry spans & timelines.
    """
    def __init__(self, ai_service: Optional[AIService] = None):
        self.ai_service = ai_service or AIService()
        self.discovery = DiscoveryAgent()
        self.capability = CapabilityIntelligenceEngine()
        self.health = HealthCircuitBreakerAgent()
        self.intent = IntentClassifierAgent()
        self.complexity = PromptComplexityAgent()
        self.context_calc = ContextWindowCalculator()
        self.router_agent = RouterAgent()
        self.execution = ExecutionAgent(self.ai_service)
        self.validator = ValidationAgent()
        self.telemetry = TelemetryAnalyticsAgent()

    async def initialize_platform(self):
        """Runs startup discovery & capability profiling."""
        logger.info("LocalAIRouter: Initializing platform offline intelligence...")
        new_models = await self.discovery.run_discovery_pipeline()
        for model_name in ["qwen2.5-coder:7b", "qwen3:4b", "llama3:latest", "gemma:7b"]:
            await self.capability.profile_model(model_name)

    async def route_and_process(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        simulate_only: bool = False
    ) -> Dict[str, Any]:

        request_id = tracer.generate_request_id()
        trace_id = tracer.generate_trace_id()
        p_hash = hashlib.sha256(prompt.encode()).hexdigest()[:16]
        
        timeline_ms = {}
        t_start = time.perf_counter()

        # 1. Security Check Span
        t0 = time.perf_counter()
        # Security sanitization
        timeline_ms["security_check"] = round((time.perf_counter() - t0) * 1000.0, 2)

        # 2. Intent Classification Span
        t0 = time.perf_counter()
        intent_res = self.intent.classify(prompt)
        timeline_ms["intent_classification"] = round((time.perf_counter() - t0) * 1000.0, 2)

        # 3. Complexity & Context Calculation Span
        t0 = time.perf_counter()
        comp_level = self.complexity.analyze_complexity(prompt)
        total_tokens = self.context_calc.calculate_total_tokens(prompt, system_instruction)
        timeline_ms["complexity_and_context"] = round((time.perf_counter() - t0) * 1000.0, 2)

        # 4. Health & Decision Scoring Span
        t0 = time.perf_counter()
        health_map = await self.health.check_all_health()
        healthy_models = [m for m, alive in health_map.items() if alive]

        selected_model, confidence_score, explainability = self.router_agent.route_request(
            intent=intent_res,
            complexity=comp_level,
            total_tokens=total_tokens,
            healthy_models=healthy_models
        )
        timeline_ms["decision_scoring"] = round((time.perf_counter() - t0) * 1000.0, 2)

        # If Simulation Mode -> Return early without LLM execution
        if simulate_only:
            timeline_ms["execution"] = 0.0
            timeline_ms["validation"] = 0.0
            timeline_ms["total"] = round((time.perf_counter() - t_start) * 1000.0, 2)
            return {
                "simulation": True,
                "request_id": request_id,
                "trace_id": trace_id,
                "router_version": router_settings.ROUTER_VERSION,
                "intent": intent_res.primary_intent,
                "complexity": comp_level,
                "context_tokens": total_tokens,
                "selected_model": selected_model,
                "confidence_score": confidence_score,
                "explainability": explainability,
                "timeline_ms": timeline_ms
            }

        # 5. Execution Span
        t0 = time.perf_counter()
        fallback_used = False
        fallback_reason = None
        try:
            exec_res = await self.execution.execute_prompt(selected_model, prompt, system_instruction)
            text_output = exec_res.get("response_text", "")
        except Exception as e:
            logger.warning(f"Primary model '{selected_model}' failed. Executing Cloud fallback: {e}")
            fallback_used = True
            fallback_reason = str(e)
            await self.health.record_model_failure(selected_model)
            exec_res = await self.execution.execute_prompt("gemini-flash-latest", prompt, system_instruction)
            text_output = exec_res.get("response_text", "")

        timeline_ms["execution"] = round((time.perf_counter() - t0) * 1000.0, 2)

        # 6. Validation Span
        t0 = time.perf_counter()
        is_valid, val_reason = self.validator.validate_response(text_output)
        if not is_valid and not fallback_used:
            self.telemetry.log_validation_failure(request_id, selected_model, val_reason, text_output)
        timeline_ms["validation"] = round((time.perf_counter() - t0) * 1000.0, 2)

        total_elapsed = round((time.perf_counter() - t_start) * 1000.0, 2)
        timeline_ms["total"] = total_elapsed

        # 7. Record Telemetry Span
        self.telemetry.log_execution(
            request_id=request_id,
            trace_id=trace_id,
            prompt_hash=p_hash,
            router_version=router_settings.ROUTER_VERSION,
            policy_version=explainability.get("policy_version", "v1"),
            intent=intent_res.primary_intent,
            complexity=comp_level,
            context_tokens=total_tokens,
            selected_model=selected_model,
            confidence_score=confidence_score,
            explainability=explainability,
            timeline_ms=timeline_ms,
            total_latency_ms=total_elapsed,
            fallback_used=fallback_used,
            fallback_reason=fallback_reason
        )

        return {
            "response": text_output,
            "request_id": request_id,
            "trace_id": trace_id,
            "router_version": router_settings.ROUTER_VERSION,
            "policy_version": explainability.get("policy_version", "v1"),
            "selected_model": selected_model,
            "confidence_score": confidence_score,
            "explainability": explainability,
            "timeline_ms": timeline_ms,
            "fallback_used": fallback_used
        }
