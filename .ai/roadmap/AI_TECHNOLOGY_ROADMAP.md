# AI Technology Roadmap — mapped onto the real codebase

**Created:** 13 September 2026
**Basis:** measured state, not aspiration. Every "exists" claim below names a file.
**Status of the substrate:** the decision layer went live in commit `7bddabca` — signals now reach rules, rules produce decisions, effectors act.

---

## Why this document is shaped this way

Each technology below is placed against a **platform layer**, and each layer is
marked with what already exists in the tree. A roadmap that ignores the 645
services already present would restate work that is done; one that assumes
they work would restate the mistake this project has been correcting all along.

Three states are used, and they mean exactly this:

| State | Meaning |
|---|---|
| **LIVE** | Running and verified in this session |
| **BUILT** | Code exists and is substantive, but is not wired or not proven |
| **ABSENT** | No implementation exists |

---

## The layers

| Layer | Substrate that exists today | State |
|---|---|---|
| **Signal / nervous** | `core/signalBus.js` (55 signal constants, exact + `domain.*` + `*` fan-out) | **LIVE** |
| **Decision** | `core/decisionEngine.js` — 6 correlation rules, windowed context, reentrancy guard | **LIVE** |
| **Reflex** | `core/reflexEngine.js` — synchronous, budgeted, 1 default reflex | **LIVE** |
| **Effector** | `core/effectors.js` — 9 registered reactions | **LIVE** |
| **Optimisation** | `core/mcda.js` — multi-criteria decision analysis | **BUILT**, not wired to decisions |
| **Agent** | `core/erpAgents.js` (47 KB), `core/aiOrchestrator.js` (45 KB), `disruptionRoutingAgent` | **BUILT**; only the disruption agent is wired |
| **Outcome / audit** | `core/outcomeResolver.js`, `core/outcomeSink.js` | **BUILT** |
| **Business cell** | `core/businessCell.js` — rule + context + explainability contract | **BUILT** |
| **E-commerce** | 56 services, 31 route files, complete chain (only domain that scores complete) | **LIVE** |
| **DPE / DPR** | `routes/dprGenerationRoutes*`, village DPR + subsidy migrations | **BUILT**, unproven |
| **Subsidy research** | `services/subsidyService`, `governmentSchemeService`, subsidy intelligence migration | **BUILT**, unproven |
| **Generative AI** | — | **ABSENT** (no `generativ*` implementation exists) |

**The gap that matters most right now** (runtime-measured, after the fix): all
55 signal types now reach a listener, because decisionEngine subscribes to `*`.
But only **11 of 55 (20%) produce a concrete action** — 5 have a decision rule,
9 an effector, 1 a reflex. The other 44 arrive at the engine and match nothing:
livestock 11, platform 10, agronomy 5, control 5, commerce 4, logistics 4,
operations 3, risk 1, fisheries 1. The bus is wired; the rules are thin.

---

## 1. Frontier AI Models → Subsidy, DPR, Engineering layer

**Horizon:** short-term · **Risks:** bias, energy use

Reasoning over long, messy, multi-source documents is exactly what subsidy
schemes and DPRs are. This is the strongest near-term fit because the corpus
already exists: 1,532 indexed library items including 830 raw library files.

| # | Task | Depends on | State |
|---|---|---|---|
| 1.1 | Provider-neutral model gateway with cost + token accounting | — | `services/aiGatewayService` **BUILT**, no key configured |
| 1.2 | Ground DPR generation in the library index rather than free text | `M645100` search — **LIVE** | **ABSENT** |
| 1.3 | Subsidy eligibility extraction from scheme documents → structured claims | 1.1, library index | **ABSENT** |
| 1.4 | Engineering-design assistant over the variety + cold-chain corpus | 1.1 | **ABSENT** |
| 1.5 | Citation enforcement — no generated clause without a library reference | 1.2 | **ABSENT** |

**Blocker:** no model API key is configured. `aiOperationIntelligenceService`
currently throws `OPENAI_API_KEY not configured` on a timer, every cycle.

**Do first:** 1.1, then 1.5 before 1.2. Ungrounded DPR text is a liability, not a feature.

---

## 2. Agentic AI → Commerce, software dev, workflows

**Horizon:** short–medium · **Risks:** governance, reliability

**This layer is now live** — it is the one thing in this table that already works.

| # | Task | State |
|---|---|---|
| 2.1 | Attach decision + reflex + effectors to the bus | **DONE** — `7bddabca` |
| 2.2 | Author decision rules for the 44 signals that arrive but match nothing (livestock 11, platform 10, agronomy 5, control 5, commerce 4, logistics 4, operations 3) | **TODO** |
| 2.3 | Promote `erpAgents` (47 KB) from built to wired | **TODO** |
| 2.4 | Feed `mcda` into decisions so actions are ranked, not just listed | **TODO** |
| 2.5 | Human-in-the-loop queue for `requiresHuman: true` decisions | **TODO** — the flag is already produced |
| 2.6 | Replay harness: re-run recorded signal windows against rule changes | **TODO** |
| 2.7 | Per-agent authority limits — what an agent may do without approval | **TODO** — governance gate |

**Proven today:** three module signals (shelf-life, delay, temperature breach)
correlate into one decision carrying four actions, a confidence score, a
rationale and a human-review flag.

**Do first:** 2.5 and 2.7 before 2.3. An agent that can act without an
authority boundary is the governance risk in the table, not a hypothetical one.

---

## 3. Humanoid Robots → Logistics, healthcare, manufacturing

**Horizon:** medium-term · **Risks:** safety, scaling

Nothing robotic exists, and nothing should be built yet. What *is* useful now
is making the platform able to accept a physical actor later without redesign.

| # | Task | State |
|---|---|---|
| 3.1 | Treat a robot as an effector with a physical-safety budget | **ABSENT** — effector contract exists |
| 3.2 | Extend IoT telemetry (`iot.*` signals are already wired) to actuator state | `iot` domain **100% wired** |
| 3.3 | Two-key confirmation for any signal that moves physical mass | **ABSENT** |
| 3.4 | Warehouse task allocation model | overlaps 6.3 |

**Honest position:** this is the least appropriate item on the list for a
platform whose test suite is 93% stubs. Deferred deliberately.

---

## 4. AI Security & Trust → Finance, healthcare, compliance

**Horizon:** short-term · **Risks:** deepfakes, misuse

| # | Task | State |
|---|---|---|
| 4.1 | Fraud reflex — instant freeze | **BUILT and LIVE** (`reflexEngine`, `risk.fraud.suspected`) |
| 4.2 | Emit `risk.fraud.suspected` from payment paths | **TODO** — the reflex exists; 2 risk signals are orphaned |
| 4.3 | Decision provenance — every decision already carries `causedBy` + rationale | **LIVE** |
| 4.4 | Tamper-evident audit chain over `outcomeSink` | **TODO** |
| 4.5 | PII boundary enforcement in AI prompts | **TODO** — GDPR tables exist |
| 4.6 | Model-output validation before any financial effector fires | **TODO** |

**Do first:** 4.2. The freeze reflex is wired and armed but nothing currently
emits the signal that triggers it — a security control that cannot fire.

---

## 5. Artificial Scientists → Subsidy, DPR, engineering design

**Horizon:** medium-term · **Risks:** validation, ethics

| # | Task | State |
|---|---|---|
| 5.1 | Hypothesis register over variety/agronomy data | **ABSENT** |
| 5.2 | Trial design for NE variety yield claims | data exists (`NE_Varieties`), tooling **ABSENT** |
| 5.3 | Automated counterfactual for cold-chain interventions | FOLU MRV spec exists — **ABSENT** |
| 5.4 | Independent validation gate before a finding enters the library | **ABSENT** |

**Note:** the cold-storage module's own MRV design (baseline → impact vs
counterfactual → bankability) is already the right scientific frame. This item
is about executing it, not inventing it.

---

## 6. Quantum + AI → Finance workflow, cost & order optimisation

**Horizon:** long-term · **Risks:** hardware limits

Treat quantum as a *solver swap*, not an architecture. The value is in
formulating the problems now so the solver is replaceable later.

| # | Task | State |
|---|---|---|
| 6.1 | Express cost optimisation as an explicit objective + constraints | `mcda` **BUILT** |
| 6.2 | Order/route optimisation over the corridor network (8×50T → 2×100T → 2×80T) | **ABSENT** |
| 6.3 | Warehouse/consignment allocation as a solvable assignment problem | **ABSENT** |
| 6.4 | Classical solver first, behind a solver interface | **ABSENT** |
| 6.5 | Quantum backend swap | **defer** — no action this year |

**Do first:** 6.1 and 6.4. A clean objective function with a classical solver
delivers the cost saving now and makes 6.5 a configuration change.

---

## Sequenced backlog

Ordered by value per unit of risk, given what is already live.

| Order | Item | Why now |
|---|---|---|
| 1 | **2.2** author rules for the 44 unmatched signals | The bus is live and reaches everything; rules are now the only thing between a signal and an action |
| 2 | **4.2** emit fraud signals from payment paths | The freeze reflex and its effector are both armed; nothing emits the trigger |
| 3 | **2.5** human-in-the-loop queue | `requiresHuman` is already produced and currently goes nowhere |
| 4 | **1.1** model gateway + key | Unblocks every generative item; also stops the recurring error |
| 5 | **2.7** agent authority limits | Must precede 2.3 |
| 6 | **2.4** MCDA into decisions | Turns action lists into ranked plans |
| 7 | **6.1 / 6.4** objective + classical solver | Real cost saving, quantum-ready |
| 8 | **1.5 → 1.2 → 1.3** grounded DPR and subsidy | Highest business value, needs 1.1 and citation discipline first |
| 9 | **2.3** wire erpAgents | 47 KB of built capability, gated on 2.7 |
| 10 | **5.x** artificial scientist | After the test suite is real |
| — | **3.x** robotics | Deferred |

---

## Preconditions that gate everything above

These are not AI work, and none of the above should be trusted until they are done.

1. **Test suite is 93% stubs** — 1,040 of 1,122 files assert nothing. No agentic capability should be extended on that foundation.
2. **Truthpack is empty** — `.vibecheck/truthpack/` has 0 of 13 files, so the project's own Rule 6 cannot be satisfied.
3. **Disk at 98%** — 773 MB of verified-safe reclaim is pending.
4. **No model API key** — blocks every generative item and throws on a timer today.

---

*Verified against: `.audit/signal-graph.json`, `.audit/domain-chain.json`, `.ai/inventory/inventory.db`.*
*Regenerate with `node tools/signal-graph-audit.js` and `node tools/domain-chain-audit.js`.*
