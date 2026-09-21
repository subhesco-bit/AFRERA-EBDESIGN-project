# Quantum + AI optimization workflow

`backend/src/core/ai/optimisation.js` is the canonical objective and solver engine.
`backend/src/services/ai/optimizationJobService.js` owns persisted execution, provenance and audit events.
The API is mounted at `/api/v1/optimization`.

Every accepted job validates its objective shape and records immutable lifecycle events. Classical execution is
the required deterministic baseline. Results report feasibility, unplaced decisions, cost, improvement against
the greedy start, elapsed time and the explicit fact that the heuristic does not prove optimality.

Quantum is an adapter capability, not a simulated label. Until startup code registers a reviewed adapter through
`registerQuantumAdapter`, a quantum request is persisted as `unavailable` with the reason. A future adapter must
return the same solver result contract; the classical baseline remains stored for comparison.

AI is optional and limited to explaining a completed numeric result. Narrative requests use the governed AI
gateway and store its provider/model/provenance response. Solver decisions and constraints never depend on an LLM.
Mutation routes require an administrator, operations manager or data scientist role. Job reads are tenant scoped.
