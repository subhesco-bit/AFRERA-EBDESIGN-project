# AFRERA — open items, consolidated

**Date:** 2026-08-04
**Status:** DESCRIPTIVE — every figure re-measured after the closing pass.

You asked for every identified error, bug and gap to reach zero. Some of that
is now true. The rest is listed here honestly, with why, because a register
that claims zero when it isn't is the failure mode this project already had
once (`EVGA_PHASE13` reported 0% against 13,724 lines of existing code).

---

## Closed this pass — verified at zero

| Item | Was | Now |
|---|---|---|
| Migration syntax errors | 7 blocking | **0** — 51/51 parse under real PostgreSQL grammar |
| Migration execution failures | 32 files, ~400 errors | **1** (sandbox-only `pgcrypto`) |
| MySQL inline `INDEX` in CREATE TABLE | 102 | **0** |
| FK type mismatches (INTEGER→UUID) | 68 | **0** |
| Tables referenced but never created | 5 | **0** |
| Broken `signalBus.emit({...})` calls | 4 | **0** |
| Services building their own `Pool` | 42 | **0** |
| Fabricated `Math.random()` in AI output | 2 confirmed | **0** |
| **Critical boundary violations** | **44** | **0** |
| Unguarded write endpoints | 2 modules | **0** |
| JS parse failures | — | **0** of 145 files |
| Boot | — | clean: 58 routers, 672 endpoints, 9 effectors |

### The connection-pool fix, specifically

42 services each ran `new Pool()`. Only one set `max`, so the rest took pg's
default of 10 — **~420 connections against a PostgreSQL default
`max_connections` of 100**. It worked in development because nothing was
concurrent. Under load the 101st request would fail and 42 services would each
report a different symptom, none of them the cause.

---

## Open — and why each is not zero

### 1. BR-08 — 44 modules with multi-statement writes and no transaction

**High severity. Real risk.** Two INSERTs without BEGIN/COMMIT can half-succeed.
In accounting or inventory that leaves the books wrong with no error raised.

**Why not fixed:** each of the 44 needs its transaction boundary chosen by
someone who knows which statements must succeed together. A regex that wraps
everything in BEGIN/COMMIT would produce code that *looks* correct and holds
locks across unrelated work — worse than the current state because it would
stop the audit flagging it.

### 2. BR-05 — SQL inside `routes/gstRoutes.js` (9 statements)

Business logic sitting in the HTTP layer. `gstService` already exists and is
imported by that file, so the destination is obvious — but moving 9 statements
without tests to verify behaviour is how a working tax module breaks.

### 3. ERP domains with no module: AF-CO, AF-AA, AF-PS

- **AF-CO** Controlling / cost centres — notable for a platform optimising
  farmer profit: no cost attribution exists
- **AF-AA** Asset accounting / depreciation
- **AF-PS** Project systems

These are new modules, not fixes. Each needs schema, service, endpoints and a
decision about scope.

### 4. AI learning loop — CLOSED, recording

`core/effectors.js` exposed `setOutcomeSink()` and nothing supplied one, so
reactions were logged and then forgotten. The design was never missing; one
wire was never connected.

Built: `990_ai_outcomes.sql` (`ai_outcomes`, `ai_prediction_log`,
`ai_agent_scorecard`, three views) and `core/outcomeSink.js`, installed at
boot. Verified end to end against real PostgreSQL:

| Check | Result |
|---|---|
| Effector reaction persists | pending queue = 1 |
| Accuracy before any judgement | `NULL`, not 100% |
| `harmed` recorded without notes | rejected by CHECK constraint |
| After a named human judges | 100% helpful, 6.00h to judge |
| Calibration on a 90%-confident, 40%-wrong forecast | **gap +56.67, overconfident** |

Two properties worth keeping. An actor with no judged outcomes reports
`null` with the note *"accuracy is unknown, not good"* — reporting null as
100% is how a system convinces itself it is working. And only a named human
may set `outcome_status`; an agent grading its own homework is a mirror, not
a feedback loop.

**Caveat:** the loop now *records*. Nothing yet *reads* the scorecard to
change behaviour. Calibration gates on agent output are the next step, and
until then this is measurement, not learning.

#### The bug this shipped with, and the guard that now exists

`990` originally named its table `ai_predictions` — a name
`000_base_schema.sql` had already taken for a different concept (ML model
inference: `model_type`, `features_used`). `CREATE TABLE IF NOT EXISTS`
skipped it **silently**, the migration reported success, and the failure
surfaced later as `column "actor_id" does not exist` pointing at
`v_ai_calibration` rather than at the collision. Renamed to
`ai_prediction_log`.

That was the 19th instance of this pattern here. It is now checked:

- `tools/schema-collisions.js` — fails CI on any undecided collision. Knows
  which collisions the chain already repairs by `ALTER`, and reads
  `backend/src/database/schema-decisions.json` for ones a human has ruled on.
  Verified to catch a deliberately planted collision.
- `backend/src/database/schema-decisions.json` — the four rulings, each with
  reasoning: `gst_invoices` and `gst_invoice_items` (synonyms, 028 wins),
  `smart_contracts` (merged — one artifact seen from two sides),
  `ai_predictions` (renamed — genuinely unrelated concepts).

Two columns were genuinely missing and have been added: `gst_invoices.
eway_bill_number` (legally required above ₹50,000 inter-state) and
`gst_invoice_items.taxable_value` (the assessable base GSTR filings and
e-invoice IRN payloads require). The other eight differences are spellings of
columns 028 already has; adding them would have left two columns holding one
number, free to drift.

Measured against a live database rather than by reading files: **0 declared
columns absent** outside the documented decisions.

### 5. Nervous system — 5 afferent, 0 efferent, 53 denervated

The 0 efferent is a **measurement artefact**: effectors subscribe from
`core/effectors.js`, which the module audit scans as a module rather than as
the bus itself. Nine subscribers are live and verified firing 4/4 in test.

Of the 53 denervated, most should stay that way — reference-data readers with
no state change worth broadcasting. Worth wiring: `foodSafetyService`
(QUALITY_FAILED, RECALL_ISSUED), `logisticsEnhancements` (SHIPMENT_DELAYED),
`insuranceEnhancements` (CLAIM_SUBMITTED).

### 6. Module completeness — 46 "Complete with gaps", 5 "Skeleton"

Per-module reasons are in `docs/registry/18_MODULE_COMPLETENESS.md`. The
dominant gaps are *no test file* and *writes without validation*. Neither is a
bug today; both are how bugs arrive later.

### 7. Frontend — 0 ARIA, 0 error boundaries

Unchanged. 71 components. The accessibility modes built earlier are CSS-deep
only; a screen reader still meets unlabelled controls. For a platform shipping
a "voice" mode this is a functional failure, not a compliance checkbox.

### 8. Not started

- Volumes 1–12, NKOII knowledge infrastructure
- Mobile and desktop platforms
- 92 unported v43 routes
- NestJS strangler layer
- Security audit (OWASP, PCI DSS)
- DPI integrations (ONDC, Aadhaar, DigiLocker, Agmarknet, IMD, ISRO) — all zero

---

## On "gaps should be zero"

Categories 1–7 are finishable and I would work through them in that order.
Category 8 is not a gap in the same sense — it is unbuilt scope measured in
weeks to months, and calling it a gap that can be zeroed would misrepresent it.

The honest position: **every defect found has been fixed or is listed above
with its reason.** Nothing has been quietly closed. The three generators
(`engineering-registry`, `module-audit`, `wireframe-boundaries`) run in CI, so
this document can be re-derived rather than trusted.

---

## Autonomous learning — corrective action (2026-08-04, second pass)

The first pass required a named human to judge every outcome. That was too
strict and it kept the loop shut. Corrected: resolution is now automatic
wherever ground truth exists in the platform's own tables.

**6 of 9 prediction types resolve with no human at all** — yield against
`yield_actuals.quantity_harvested_kg`, revenue against `farmer_revenue.
gross_amount`, order value, delivery date, quality status, transaction status.

Three are disabled, each with the reason recorded in the row rather than
deleted:

| Rule | Why not autonomous |
|---|---|
| `coldchain_spoilage_prevented` | `quality_checks` has no batch/lot key, so a quarantined batch cannot be followed to its later result. Also counterfactual. |
| `fraud_flag` | A held transaction cannot complete, so the fraud it would have caused is unobservable. Scoring a fraud model on its own blocks is a self-confirming loop — it reports excellent accuracy forever while learning nothing. Needs an external chargeback feed. |
| `conflict_route_risk` | Rerouting means the original road was never driven. Being wrong in the unsafe direction can put a driver in danger. |

This is not a limit of the AI. It is that a prevented outcome leaves no
evidence — there is one timeline. Proxies are allowed but carry reduced
`verdict_weight`, and a DB constraint forbids a proxy claiming weight 1.00,
so a counterfactual guess can never be recorded as verified fact.

### The gate — the loop now changes behaviour

`v_ai_agent_gate` derives authority from each agent's own record. Verified
against real PostgreSQL:

| Agent | Claims | Actual | Gap | Gate | Authority |
|---|---|---|---|---|---|
| forecasting.agent | 92% | 18.2% | +73.8 | `advisory_only` | **×0.25** |
| pricing.agent | 88% | 91.3% | −3.3 | `trusted` | ×1.00 |

A 92%-confidence recommendation from the overconfident agent becomes 23% and
`mayAutoExecute: false`. No human involved in that demotion. An unmeasured
agent gets ×0.50, not ×1.00 — unknown is not the same as trustworthy.

### KNOWN BROKEN — do not wire into CI yet

`tools/validate-resolution-rules.js` is **not working**. Its SQL tuple parser
miscounts parentheses across the multi-line string concatenation in the
`rationale` column: it finds 4 rules instead of 9 and emits a false error about
an empty `truth_table`. It is deliberately NOT referenced in `.github/workflows/
ci.yml`.

The check it performs is still needed — the first seed of these rules named
`gross_revenue`, `checked_at`, `batch_id` and `actual_delivery_hours`, none of
which exist, and each would have failed silently at resolution time looking
exactly like "ground truth has not arrived yet". Those four are now fixed
against the real schema, but nothing prevents the next one.

**Fix approach:** drop the text parsing and query `information_schema` after
migrations apply. CI already provisions PostgreSQL, so the live schema is
available and is ground truth — parsing SQL text to check SQL was the wrong
idea to begin with.
