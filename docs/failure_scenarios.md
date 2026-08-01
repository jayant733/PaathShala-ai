# SRE Failure Scenarios & Resilience Matrix

This document outlines 10 critical failure scenarios handled autonomously by the **LocalAI Router Platform**.

| Scenario ID | Failure Trigger | Resilience Mechanism | System Behavior |
| :--- | :--- | :--- | :--- |
| **FAIL-001** | Ollama Daemon Down / Unreachable | Readiness Check (`/health/ready`) & Circuit Breaker | `/health/ready` returns 503; requests route to Gemini Cloud fallback if enabled. |
| **FAIL-002** | Target Model Times Out (> 30s) | Execution Agent Timeout Handler | Increments model failure counter; triggers secondary model fallback. |
| **FAIL-003** | Model Crashes 3 Consecutive Times | Circuit Breaker State Machine | Model marked `DISABLED`; entered into 60s cooldown; masked out of Decision Engine. |
| **FAIL-004** | Invalid JSON Output Generated | Validation Agent Inspection | Retries once or routes prompt to secondary candidate; records `VALIDATION_FAILED` event. |
| **FAIL-005** | High System RAM Pressure (> 90%) | Resource Agent Hardware Check | Applies severe resource penalty (-5.0) to local candidate scores; prefers lightweight models. |
| **FAIL-006** | Cold Model Loaded in VRAM | Dynamic Warmup Tracker | Calculates +12s latency penalty for `Cold` state; selects `Hot` in-memory models if score margin is close. |
| **FAIL-007** | Registry SQLite Lock / Corruption | Readiness Health Probe | Fails `/health/ready`; fallback to read-only memory cache. |
| **FAIL-008** | Prompt Injection Attack Detected | Security Guardrails Agent | Immediately blocks execution with 400 Bad Request; logs injection attempt event. |
| **FAIL-009** | Total Context Length > Model Window | Context Window Calculator | Rejects candidate model before scoring phase; routes to Cloud or high-context model. |
| **FAIL-010** | Concurrent Model Request Limit Reached | Model Queue Manager | Deducts queue penalty per active request; routes overflow traffic to alternative candidate. |
