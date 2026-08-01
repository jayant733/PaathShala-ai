# ADR-001: Separation of Registry & Telemetry via Dual SQLite Databases

## Context & Problem Statement
The LocalAI Router Platform requires persisting two distinct types of data:
1. **Model Catalog Registry**: Low-frequency write, high-frequency read (specs, capability vectors, benchmark scores, health state).
2. **Execution Telemetry**: High-frequency write (request timelines, OpenTelemetry span traces, latency histograms, validation logs).

Combining both into a single database file introduces write-lock contention under concurrent load.

## Decision
We separate runtime storage into two distinct SQLite databases:
- `registry.db`: Stores catalog, capabilities, policies, and health states.
- `telemetry.db`: Stores request timeline logs and execution metrics.

## Consequences
- Eliminates database write lock contention during high throughput.
- Simplifies telemetry log rotation and backup procedures.
- Maintains zero-dependency local execution footprint.
