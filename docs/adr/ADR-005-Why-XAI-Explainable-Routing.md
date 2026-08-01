# ADR-005: Explainable Routing Decisions via XAI Score Contribution Breakdowns

## Context & Problem Statement
Black-box AI routers hide why a specific model was chosen, making debugging, auditing, and performance tuning difficult.

## Decision
We enforce **XAI (Explainable AI)** outputs for every routing decision. Responses include:
- Percentage contribution of Capability vs Benchmark vs Speed vs Hardware Resources.
- Confidence rating ($0-100\%$).
- Ranked candidate score list.
- Explicit rejection reasons for alternative models.

## Consequences
- Enables full visibility for AI Infrastructure engineers and SREs.
- Powers the interactive **Routing Playground** (`/admin/playground`).
