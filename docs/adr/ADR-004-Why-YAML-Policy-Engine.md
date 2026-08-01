# ADR-004: Declarative Routing via In-Memory YAML Policy Engine

## Context & Problem Statement
In production AI gateways, updating routing rules, capability score thresholds, or model preference chains should not require modifying and re-deploying application code.

## Decision
We implement a declarative **YAML Policy Engine** (`app/ai_router/routing/policy_engine.py`) that loads routing rules dynamically from `policies/*.yaml`.

## Key Capabilities
- Domain-specific policy definitions (`coding_policy_v1.yaml`, `reasoning_policy_v1.yaml`).
- Dynamic weight adjustments (Capability vs Speed vs Hardware Resources).
- Live policy reload via `/api/router/admin/policies/reload` without server restart.
