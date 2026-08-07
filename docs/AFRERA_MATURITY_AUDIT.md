# AFRERA — agent inventory, layer status, and maturity dashboard

**Date:** 2026-08-04
**Status:** DESCRIPTIVE — every figure counted from the repository
**Companion to:** `MULTIROLE_AUDIT.md` (6 commercial lenses), `MIGRATION_CHAIN_VERIFIED.md`

---

## Scope statement — read this first

Your brief describes **30+ platform families, 200+ modules, 1,500+ submodules,
500+ shared services, 150+ AI agents, 200+ integrations, 1,000+ workflows**, and
asks for 24 registries and 12 architecture volumes.

I am not going to pretend to have delivered that in one session. What follows is
**measured** against the actual files. Where something does not exist I say zero,
not "partial". The single most useful thing I can give you today is an honest
denominator.

---

## 1. AI AGENTS — required vs built

**Built: 15. Described in your brief: ~150. Coverage: ~10%.**

| Domain | Agent ID | What it does |
|---|---|---|
| AF-FI | `finance.cashflow` | Projects shortfall from AR/AP ageing |
| AF-FI | `finance.receivables` | Ranks collections by exposure |
| AF-MM | `procurement.vendor_selection` | MCDA across price/delivery/quality/risk |
| AF-WM | `inventory.replenishment` | 1.65σ safety stock |
| AF-WM | `inventory.slow_moving` | Flags dead stock |
| AF-SD | `sales.demand_forecast` | Holt linear + seasonal indices |
| AF-QM | `quality.ncr_trend` | Non-conformance trend |
| AF-PM | `maintenance.predictive` | Failure-interval projection |
| AF-AGRI | `agri.glut_warning` | Oversupply warning |
| AF-WF | `workflow.sla_breach` | Stalled approvals |
| AF-CRM | `crm.lead_qualification` | MCDA lead scoring |
| AF-LEG | `legal.obligation_watch` | Statutory deadlines |
| AF-RSK | `risk.register_health` | Residual risk + stale reviews |
| AF-EMR | `emergency.incident_command` | Life-safety triage |
| AF-SEC | `compliance.sod` | Segregation of duties |

**Architecturally this is sound.** Every agent proposes and none executes; a
database CHECK makes approval without a named human impossible; each returns
`null` when it has nothing to say. That contract is better than most production
ERP AI layers.

**What does not exist at all:** the "AI Scientist" model from your brief. There
is no Weather Scientist, Market Scientist, Knowledge Scientist, Patent Scientist,
Export Scientist. There is no AI Orchestrator, no Capability Router, no Prompt
Registry, no Model Registry, no Agent Registry as data. `erpAgents.js` is a
JavaScript array — you cannot add an agent without a deploy.

**The gap that matters most:** agents propose into `ai_proposals`, but **nothing
reads the outcome back**. There is no `outcome` table recording whether an
approved proposal actually worked. Without that, no agent can ever improve.
The "Continuous Learning" layer in your brief is at zero.

---

## 2. YOUR NAGALAND / MANIPUR SCENARIO — what happens today

You asked: two communities clash, roads block — what should the system decide?

**Today the system does not notice.** Measured:

| Capability | Services | Migrations |
|---|---|---|
| Blockade / bandh / strike / curfew monitoring | **0** | **0** |
| Disruption handling | **0** | **0** |
| Rerouting | **0** | 1 |
| Route optimisation | 2 | 2 |

A truck departs Dimapur for Ghazipur on the `dim-ncr` lane (2,200 km, in
`freight_lanes`). The road closes. Nothing detects it, nothing reroutes, nothing
tells the farmer their perishable consignment is now sitting still. The consignee
learns when it fails to arrive.

**A caution about one of my own numbers:** a naive grep for "conflict" returns 16
services — but those are *data sync* conflicts (`sync_conflicts`, last-write-wins
resolution), not civil unrest. Reporting that as 16 would be exactly the
name-matching error the governance rules warn about. Civil-disruption capability
is **zero**.

**What the decision chain would need** (none of which exists):

1. **Event sensing** — a `disruption_events` table fed by news/official feeds,
   with `affected_route`, `severity`, `expected_duration`, `confidence`, `source`.
2. **Lane impact mapping** — `freight_lanes` already has origin/destination/km;
   it needs waypoints so a blockade can be matched to affected lanes.
3. **Re-decision trigger** — the signal bus exists (`core/signalBus.js`) and
   already carries `SHIPMENT_DELAYED`. Nothing emits it from an external event.
4. **A routing agent** — MCDA over alternate lane / mode switch / hold / divert
   to processing, weighted by perishability. The MCDA framework already exists
   and is tested; there is no agent using it for routing.
5. **Human escalation** — `emergency_incidents` (993) already models this
   correctly, including life-safety override. It is not wired to logistics.

**Roughly 70% of the machinery for this already exists and is not connected.**
That is the cheapest high-value work available in the project.

---

## 3. ITEMS YOU FLAGGED AS MISSING — confirmed

| Item | Services | Migrations | UI | Verdict |
|---|---|---|---|---|
| FOLU dashboard | 1 | **0** | **0** | effectively absent |
| Organic tracking / traceability | **0** | **0** | **0** | **absent** |
| NE logistics policy | **0** | **0** | **0** | **absent** |
| Enterprise form management | 1 | **0** | **0** | effectively absent |
| Vegetable/fruit logistics subsidy | — | — | — | subsidy exists (12 svc / 4 mig / 3 UI) but **not linked to logistics** |
| Wallet | 4 | 6 | **0** | backend only, **no UI** |
| Tally / accounting export | 1 | 1 | **0** | stub |
| Escrow | 3 | 3 | **0** | backend only, **no UI** |
| GST | 9 | 10 | 2 | present |

You were right on every one you named.

**The pattern worth seeing:** wallet, escrow, subsidy and Tally all have backend
and schema but **zero frontend**. This is not "partially implemented" — it is
*Backend Complete / Frontend Missing*, which is a different and more tractable
problem than starting from nothing.

---

## 4. DIGITAL PUBLIC INFRASTRUCTURE — all zero

| Integration | Services | Migrations |
|---|---|---|
| ONDC | **0** | **0** |
| Aadhaar | **0** | **0** |
| DigiLocker | **0** | **0** |
| Account Aggregator | **0** | **0** |
| Agmarknet (mandi prices) | **0** | **0** |
| IMD (weather) | **0** | **0** |
| ISRO / NavIC | **0** | **0** |
| UPI | 1 | 1 |

Every India-stack integration in your brief is unbuilt. **Agmarknet is the one
I would do first** — it is free, public, requires no partnership, and it is the
only way the platform's "fair price" claim can be substantiated with an external
reference rather than asserted.

---

## 5. LAYER STATUS

Using your own layer model, measured:

| Layer | Evidence | Status |
|---|---|---|
| Vision | 450 KB of specs | documented, aspirational |
| Architecture | signal bus + decision engine + agent register in `core/` | **real and sound** |
| Data | 506 tables, 525 FKs, 2,058 indexes, chain verified | **strongest layer** |
| Backend services | 70 services, 658 endpoints, boots clean | substantial |
| APIs | OpenAPI generated from live routes | present |
| Workflow | `workflow_*` tables + engine (993) | built, **zero definitions seeded** |
| AI integration | 15 agents, but **37 `Math.random()`** remain in services | **partly fabricated** |
| Knowledge | no knowledge objects, no graph, no ontology | **zero** |
| Decision intelligence | MCDA + decision engine exist; not wired to operations | **framework only** |
| Experience (UX) | 45 components, 159 breakpoints, **0 ARIA**, **0 error boundaries** | shallow |
| Mobile | PWA manifest + service worker only | **near zero** |
| Desktop | none | **zero** |
| Security | auth + RBAC + 78 endpoints protected; no PCI DSS, no pen test | partial |
| Monitoring | logger only; no metrics, tracing, alerting | **near zero** |
| Testing | 22 test files / 70 services | **thin** |

---

## 6. MATURITY DASHBOARD

Format you requested. **Implementation** percentages only — architecture maturity
is consistently higher, which is the central finding.

| Dimension | Implementation |
|---|---|
| Vision | 95% |
| Architecture (design) | 85% |
| Database | **90%** |
| Enterprise objects | 70% |
| Backend services | 60% |
| APIs | 60% |
| Workflow engine | 45% (built, unseeded) |
| ERP core (FI/MM/WM/SD) | 55% |
| Accounting / double-entry | 65% |
| AI framework | 55% |
| **AI real (non-fabricated)** | **20%** |
| Decision intelligence (wired to ops) | 15% |
| Knowledge acquisition | **0%** |
| Knowledge graph | **0%** |
| Opportunity intelligence | **0%** |
| Government / DPI integration | **2%** |
| Operational intelligence (disruption) | **0%** |
| UX / accessibility | 25% |
| Mobile | 5% |
| Desktop | **0%** |
| Testing | 20% |
| Security | 35% |
| Monitoring / observability | 5% |
| Documentation | 60% |
| Production readiness | 20% |

**Weighted overall implementation: ~35–40%.** Architecture maturity is roughly
double implementation maturity throughout. That ratio *is* the project's risk
profile — it is designed far ahead of where it is built, which is safer than the
reverse but means specs read as descriptions of things that do not exist.

---

## 7. WHAT I WOULD DO NEXT, RANKED

Ranked by value per unit of effort, using what already exists:

1. **Replace the 37 `Math.random()` calls.** Fabricated AI output is worse than
   no AI output. Either compute it or return "insufficient data".
2. **Wire the disruption chain.** ~70% exists (signal bus, MCDA, emergency
   incidents, freight lanes). Needs one table, one emitter, one routing agent.
3. **Agmarknet integration.** Free, public, substantiates the core promise.
4. **Frontend for wallet / escrow / subsidy.** Backend and schema already done;
   this is the largest ready-to-harvest value in the repo.
5. **Seed workflow definitions.** The engine works and has nothing to run.
6. **ARIA across 45 components.** The accessibility modes I built are
   CSS-deep only; a screen reader still finds unlabelled controls.
7. **Outcome table + feedback loop.** Without it no agent can ever learn.

---

## 8. NOT DELIVERED

Explicitly, so this is not mistaken for complete:

- 24 registries (Requirement, Architecture, API, Module, AI, Evidence, …)
- 12 architecture volumes
- Requirement traceability matrix
- Full module/submodule inventory against the 1,500 you describe
- ERP form inventory
- Security audit (OWASP, PCI DSS)
- Complete algorithm documentation per module
- NestJS strangler layer
- Knowledge/NKOII specification

These are weeks of work, not one session. Sequencing them is a separate
conversation worth having before any of them starts.
