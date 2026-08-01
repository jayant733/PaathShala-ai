from typing import List, Dict, Any, Tuple
from app.database.registry_db import SessionRegistry, ModelRegistryVersion, ModelCapabilitiesVerified, ModelBenchmarkRecord, ModelHealthState
from app.ai_router.routing.intent_agent import IntentResult
from app.ai_router.routing.policy_engine import global_policy_engine
from app.ai_router.resource_health.resource_agent import ResourceAgent
from app.core.logging import logger

class RouterAgent:
    """
    Deterministic XAI Router Agent: Evaluates candidate models and outputs percentage breakdowns.
    """
    def route_request(
        self,
        intent: IntentResult,
        complexity: str,
        total_tokens: int,
        healthy_models: List[str]
    ) -> Tuple[str, float, Dict[str, Any]]:

        policy = global_policy_engine.get_policy_for_domain(intent.primary_intent)
        weights = policy.get("weights", {"capability": 0.40, "benchmark": 0.30, "speed": 0.15, "resource": 0.15})
        
        resources = ResourceAgent.get_system_resources()
        res_score = ResourceAgent.calculate_resource_availability_score(resources)

        db = SessionRegistry()
        try:
            versions = db.query(ModelRegistryVersion).filter(ModelRegistryVersion.model_name.in_(healthy_models)).all()
            if not versions:
                # Default fallback
                return "gemini-flash-latest", 1.0, {"reason": "No healthy local models in registry."}

            scored_candidates = []
            for v in versions:
                if total_tokens > v.context_window:
                    continue

                caps = db.query(ModelCapabilitiesVerified).filter_by(model_name=v.model_name).first()
                bm = db.query(ModelBenchmarkRecord).filter_by(model_name=v.model_name, category=intent.primary_intent).first()
                
                cap_score = (getattr(caps, f"score_{intent.primary_intent}", 5.0) / 10.0) if caps else 0.5
                if intent.detected_language != "general" and caps:
                    lang_score = getattr(caps, f"score_{intent.detected_language}", cap_score * 10.0) / 10.0
                    cap_score = (cap_score + lang_score) / 2.0

                bm_score = bm.accuracy if bm else 0.70
                speed_score = min(1.0, (bm.avg_tps / 50.0)) if bm else 0.60

                # Scoring Formula
                final_score = (
                    (weights["capability"] * cap_score) +
                    (weights["benchmark"] * bm_score) +
                    (weights["speed"] * speed_score) +
                    (weights["resource"] * res_score)
                ) * 10.0

                # Complexity Boost
                if complexity in ["Hard", "Expert"] and "coder" in v.model_name:
                    final_score += 1.0

                scored_candidates.append({
                    "model_name": v.model_name,
                    "final_score": round(final_score, 2),
                    "cap_score": round(cap_score * 10.0, 1),
                    "bm_score": round(bm_score * 10.0, 1),
                    "speed_score": round(speed_score * 10.0, 1),
                    "res_score": round(res_score * 10.0, 1)
                })

            scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)
            if not scored_candidates:
                return "gemini-flash-latest", 1.0, {"reason": "All models filtered out by context limits."}

            winner = scored_candidates[0]
            winner_model = winner["model_name"]
            
            second_score = scored_candidates[1]["final_score"] if len(scored_candidates) > 1 else 0.0
            margin = winner["final_score"] - second_score
            confidence_pct = min(99.0, max(50.0, 70.0 + (margin * 10.0)))

            explainability = {
                "selected_model": winner_model,
                "policy_used": policy.get("policy_name", "default"),
                "policy_version": policy.get("version", "v1"),
                "confidence_pct": round(confidence_pct, 1),
                "score_contributions": {
                    "capability": f"{round(weights['capability'] * 100)}% (Rating: {winner['cap_score']}/10)",
                    "benchmark": f"{round(weights['benchmark'] * 100)}% (Pass Rate: {winner['bm_score']}/10)",
                    "speed": f"{round(weights['speed'] * 100)}% (Speed: {winner['speed_score']}/10)",
                    "resources": f"{round(weights['resource'] * 100)}% (Hardware: {winner['res_score']}/10)"
                },
                "candidate_scores": [{c["model_name"]: c["final_score"]} for c in scored_candidates]
            }

            return winner_model, round(confidence_pct / 100.0, 2), explainability
        finally:
            db.close()
