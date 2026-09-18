# AI and ERP capability evidence — 2026-09-15

This document records executable evidence, not roadmap intent. The attached design conversations are inputs only; repository code, tests, migrations, and configured infrastructure determine operational status.

## Platform boundary

AI Backbone is an independently governed platform service. ERP modules call it through `/api/v1/ai-gateway`; they do not embed provider credentials or call a model vendor directly. The gateway authenticates callers, rate limits requests, grounds prompts with library context, selects an enabled provider, applies bounded timeouts, records provider statistics, and returns provenance. The UI renders actual provider output and reports provider failure without generating a substitute answer.

OpenAI configuration was created locally in the ignored root `.env.local`. Credential discovery and the provider model catalogue work. A real generation request currently returns `credit_balance_exhausted`, so live OpenAI generation requires account credits before it can be called operational.

## Evidence matrix

| Capability | Current evidence | Status |
|---|---|---|
| Frontier model access | Governed provider adapters for OpenAI, Anthropic, Gemini, Azure, Hugging Face, and Ollama; OpenAI Responses API; model and provider endpoints | Implemented gateway; live OpenAI generation blocked by account credit |
| ERP AI application | Module and capability context is sent through the canonical gateway and grounded by the library service | Implemented shared contract; individual domain quality still requires domain-specific acceptance tests |
| Agentic AI | Decision engine, ERP agents, outcome calibration, and an agentic companion module exist | Partial; a repository-wide durable autonomous workflow acceptance suite is not present |
| AI security and trust | Authentication, role checks, rate limits, provider allow-listing, secret-safe responses, provenance, timeout bounds, and honest unavailable states | Implemented for the canonical gateway |
| Next-generation generative AI | Real provider-backed chat and SSE response contract | Implemented for text generation; multimodal and long-running generation are not proven by this change |
| Artificial scientists | Persisted hypotheses, protocols, experiments, idempotent runs, checksummed artifacts, formal reviews, reproducibility metadata, governed AI assistance, and operator UI | Software workflow implemented; live database execution and scientific instrument integration remain deployment work |
| Quantum + AI | Persisted optimization jobs, validated objectives/constraints, classical baseline, adapter contract, feasibility verification, provenance, and immutable events | Control plane implemented; no quantum provider is installed, so quantum jobs honestly remain unavailable |
| Humanoid robots and robotics | Persisted devices/missions/telemetry, simulator, certification, two-person approval, safety interlocks, emergency stop, audit, governed AI advisory, and operator UI | Software control plane implemented; physical drivers and hardware-in-loop certification require selected equipment |
| GST taxation | Effective-date HSN rates, GSTIN checksum/state validation, intra/inter-state components, exemptions, reverse charge, filing/payment transitions, and canonical ledger posting | Implemented production foundation; statutory rates must be maintained from authoritative notifications |
| Enterprise accounting | Exact four-decimal double entry, fiscal periods, idempotent posting, reversals, immutable audit, CoA controls, trial balance, P&L, and balance sheet | Implemented production foundation; live PostgreSQL migration validation remains environment-dependent |

## Verification

- Backend focused suites: 11 suites and 136 tests passed.
- GST/accounting integration suites after canonical ledger wiring: 19 tests passed.
- Frontend AI chat: 3 tests passed.
- Targeted backend and frontend lint passed.
- Frontend production build passed.
- Existing repository-wide production audit remains a separate release blocker: 390 broken imports and 1,624 placeholder detections are currently reported; the total includes audit false positives that must be classified before removal.

No unimplemented research, quantum, or robotics capability should be marketed as production-ready until its runtime integration and end-to-end acceptance evidence are added.
