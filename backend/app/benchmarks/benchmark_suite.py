import os
import json
import time
import httpx
from typing import Dict, Any, List
from app.database.registry_db import SessionRegistry, ModelBenchmarkRecord, ModelRegistryVersion
from app.router_config import router_settings
from app.core.logging import logger

BENCHMARK_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

class BenchmarkSuiteRunner:
    """
    Suite v1: Loads structured JSON benchmark prompt datasets and executes benchmarks on local Ollama models.
    """
    def __init__(self, ollama_url: str = None):
        self.ollama_url = ollama_url or router_settings.OLLAMA_BASE_URL

    def load_dataset(self, category: str) -> List[Dict[str, Any]]:
        file_path = os.path.join(BENCHMARK_DATA_DIR, f"{category}.json")
        if not os.path.exists(file_path):
            return []
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    async def run_benchmark_for_model(self, model_name: str, category: str = "coding") -> Dict[str, Any]:
        prompts = self.load_dataset(category)
        if not prompts:
            return {"status": "no_prompts_found"}

        passed_count = 0
        total_latency = 0.0
        total_tokens = 0

        async with httpx.AsyncClient(timeout=30.0) as client:
            for test in prompts:
                start_t = time.perf_counter()
                try:
                    payload = {
                        "model": model_name,
                        "prompt": test["prompt"],
                        "stream": False
                    }
                    res = await client.post(f"{self.ollama_url}/api/generate", json=payload)
                    elapsed = time.perf_counter() - start_t
                    
                    if res.status_code == 200:
                        body = res.json()
                        output = body.get("response", "")
                        eval_count = body.get("eval_count", len(output.split()))
                        
                        passed = test["expected_substring"].lower() in output.lower()
                        if test.get("validation_rule") == "valid_json":
                            try:
                                json.loads(output.strip())
                                passed = True
                            except Exception:
                                passed = False

                        if passed: passed_count += 1
                        total_latency += elapsed
                        total_tokens += eval_count
                except Exception as e:
                    logger.error(f"Benchmark error on {model_name} ({category}): {e}")

        total_prompts = len(prompts)
        accuracy = passed_count / total_prompts if total_prompts > 0 else 0.0
        avg_latency = total_latency / total_prompts if total_prompts > 0 else 1.0
        avg_tps = (total_tokens / total_latency) if total_latency > 0 else 20.0

        # Save to SQLite registry.db
        db = SessionRegistry()
        try:
            bm = ModelBenchmarkRecord(
                model_name=model_name,
                suite_version="v1",
                category=category,
                total_prompts=total_prompts,
                passed_prompts=passed_count,
                accuracy=accuracy,
                avg_latency_sec=avg_latency,
                avg_tps=avg_tps
            )
            db.add(bm)
            db.commit()
        finally:
            db.close()

        return {
            "model_name": model_name,
            "category": category,
            "total": total_prompts,
            "passed": passed_count,
            "accuracy": round(accuracy, 2),
            "avg_latency_sec": round(avg_latency, 2),
            "avg_tps": round(avg_tps, 2)
        }
