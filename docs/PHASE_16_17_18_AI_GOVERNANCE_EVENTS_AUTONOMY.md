# Phases 16–18 — AI Governance, Event Orchestration & Bounded Autonomy

## Phase 16 — AI Governance & Audit

The AI decision layer now has a canonical policy service rather than allowing every AI route to invent its own approval rules.

Policy decisions are classified as `allowed`, `approval_required`, or `blocked`, with a versioned policy identifier and an audit record. High-impact operations such as payment release, ledger adjustment, contract change, credit approval, farmer-price override and settlement approval require approval context. Critical actions are blocked.

## Phase 17 — Event-Driven Orchestration

`aiEventOrchestratorService` provides a domain-event contract with event ID, aggregate identity, correlation ID, causation ID, payload, handler dispatch, processing status and replay support.

Events are persisted when PostgreSQL is available. Failed handlers are recorded rather than silently discarded.

## Phase 18 — Bounded Autonomous Operations

`boundedAutonomyService` creates autonomous action proposals with:

- explicit agent identity
- action type
- resource scope
- payload
- risk classification
- policy version
- execution time limit
- retry limit
- approval requirement
- lifecycle status

Only an explicit safe-action allowlist can proceed without human approval. High-impact and unknown actions remain approval-gated.

## Safety boundary

Autonomy is deliberately bounded. The AI layer cannot bypass the governance policy, invent approval, or directly release high-impact financial/contractual operations. Real provider execution remains behind application-controlled handlers and production credentials.

## Files

- `backend/migrations/20260911_phase1618_ai_governance_events_autonomy.sql`
- `backend/src/services/aiGovernanceService.js`
- `backend/src/services/aiEventOrchestratorService.js`
- `backend/src/services/boundedAutonomyService.js`
- `backend/src/routes/aiGovernanceControlRoutes.js`
- `backend/tests/phase1618-ai-governance-events-autonomy.test.js`
