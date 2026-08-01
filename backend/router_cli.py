import sys
import argparse
import asyncio
import json
from app.ai_router.master_platform import MasterLocalAIRouter
from app.ai_router.resource_health.health_agent import HealthCircuitBreakerAgent
from app.benchmarks.benchmark_suite import BenchmarkSuiteRunner
from app.database.registry_db import init_registry_db, SessionRegistry, ModelRegistryVersion
from app.database.telemetry_db import init_telemetry_db

init_registry_db()
init_telemetry_db()

def main():
    parser = argparse.ArgumentParser(description="LocalAI Router Platform CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: health
    health_parser = subparsers.add_parser("health", help="Check router and system health")

    # Command: models
    models_parser = subparsers.add_parser("models", help="List registered models in catalog")

    # Command: simulate
    sim_parser = subparsers.add_parser("simulate", help="Simulate routing decision for a prompt")
    sim_parser.add_argument("--prompt", type=str, required=True, help="Input prompt string")

    # Command: benchmark
    bm_parser = subparsers.add_parser("benchmark", help="Run benchmark suite on a model")
    bm_parser.add_argument("--model", type=str, required=True, help="Model name (e.g. qwen2.5-coder:7b)")
    bm_parser.add_argument("--category", type=str, default="coding", help="Benchmark category")

    args = parser.parse_args()

    if args.command == "health":
        agent = HealthCircuitBreakerAgent()
        res = asyncio.run(agent.check_all_health())
        print(json.dumps({"healthy_models": res}, indent=2))

    elif args.command == "models":
        db = SessionRegistry()
        models = db.query(ModelRegistryVersion).all()
        for m in models:
            print(f"- {m.model_name} (Family: {m.family_name}, Size: {m.parameter_size})")
        db.close()

    elif args.command == "simulate":
        master = MasterLocalAIRouter()
        res = asyncio.run(master.route_and_process(prompt=args.prompt, simulate_only=True))
        print(json.dumps(res, indent=2))

    elif args.command == "benchmark":
        runner = BenchmarkSuiteRunner()
        res = asyncio.run(runner.run_benchmark_for_model(args.model, args.category))
        print(json.dumps(res, indent=2))

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
