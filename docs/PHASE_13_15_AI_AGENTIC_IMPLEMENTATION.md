# Phases 13–15 — AI Intelligence, Agentic Orchestration & Autonomous Decision Controls

## Scope

This batch connects the existing EBDESIGN AI backbone to an executable, policy-aware control layer without creating a second AI provider stack.

### Phase 13 — AI-driven ERP intelligence

`aiOperationIntelligenceService` now provides deterministic operational assessment for supply gaps, low stock, overdue work and ledger variance. Assessments return findings, prioritized recommendations, confidence and risk and can persist to `ai_intelligence_runs`.

### Phase 14 — Agentic workflow orchestration

`aiAgentService` now provides a registry, agent metadata, bounded plans, persisted runs/steps and optional handlers. Agents cannot execute unknown actions; every plan passes through the policy-aware brain first.

### Phase 15 — Autonomous Village/ERP decision and approval controls

`aiBrainService` classifies action risk and enforces approval boundaries. High-impact actions such as payment approval, ledger modification, contract changes, credit approval and farmer-price changes require approval context before execution. Critical actions are blocked by policy.

## API

The new route module is auto-discoverable by the existing DynamicRouteLoader:

- `GET /api/ai-agentic-control/agents`
- `POST /api/ai-agentic-control/intelligence/assess`
- `POST /api/ai-agentic-control/decision/plan`
- `POST /api/ai-agentic-control/agents/:name/run`

## Persistence

- `ai_intelligence_runs`
- `ai_agent_runs`
- `ai_agent_steps`
- `ai_decision_controls`

## Safety boundary

AI recommends and orchestrates within explicit policy. Financial, contractual, ledger, credit and farmer-price actions remain approval-gated. This batch does not claim autonomous movement of real money or irreversible production changes.

## Verification

`backend/tests/phase1315-ai-agentic-controls.test.js` covers intelligence detection, approval gating and bounded agent execution.

The existing DynamicRouteLoader recursively discovers routes from the backend route tree, so the new route module follows the repository's established discovery architecture rather than introducing a parallel router.
