# Enterprise Control Layer — build record

**Date:** 2026-08-04
**Migration:** `993_enterprise_control_layer.sql`
**Service:** `backend/src/services/enterpriseControlService.js`
**Mount:** `/api/v1/control`

---

## Why this layer was built

An audit of the twelve domains named in the brief found six with **zero tables**
in a 468-table schema. They were not partially built — they did not exist.

| Domain | Before | After |
|---|---|---|
| Workflow engine | 0 tables | 4 |
| Order flow | present | 12 |
| Payment flow | present | 14 |
| Accounting | partial | 4 |
| Supply chain | present | 12 |
| **CRM** | **0 tables** | 3 |
| Vendor management | present | 1 |
| **Client management** | **0 tables** | 2 |
| Compliance | present | 21 |
| **Legal management** | **0 tables** | 3 |
| **Risk management** | **0 tables** | 7 |
| **Emergency management** | **0 tables** | 5 |

Schema total: 468 → **490 tables** across **50 migrations**.

---

## The design decision worth knowing about

These six are **one service, not six**. They are not unrelated features; they
are a single governance layer answering the same question — *who decides, by
when, and what happens if nobody does.*

Six separate services would duplicate escalation logic six times and let it
drift. That drift is the exact failure the workflow engine exists to prevent,
so building it into the structure would have been self-defeating.

Equally, the workflow engine is **generic on purpose**. Per-module approval
logic is how five modules end up with five different definitions of "approved",
none of which can be audited together.

---

## Constraints that encode business rules

The schema refuses to record decisions that cannot be reviewed later. 45 CHECK
constraints, of which these carry real weight:

- **A rejection must state a reason.** `wf_rejection_needs_reason`,
  `wf_action_rejection_reason` — a refusal with no reason is unappealable.
- **A lost deal must state why.** `opp_lost_needs_reason` — otherwise the
  business learns nothing from losing.
- **Accepting a risk requires a named person.** `risk_acceptance_needs_owner` —
  accepted risk with no owner is unowned risk.
- **A high/critical incident cannot be closed without a root cause.**
  `incident_closure_needs_review` — quiet closure is how failures recur.
- **A workflow step that escalates must name who it escalates to.**
  `wf_timeout_escalation` — and `auto_approve` on timeout must be chosen
  deliberately, never inherited as a default.
- **Putting a client on hold or blacklisting requires a reason.**
  `client_hold_needs_reason` — both have commercial and legal consequences.

Three generated columns keep derived figures from drifting from their inputs:
`weighted_value` (pipeline), `inherent_score` and `residual_score` (risk).

---

## The life-safety override

`raiseIncident()` contains one deliberate override:

> If `peopleAtRisk` is true, severity is forced to `critical` regardless of what
> the caller supplied — and the response says so explicitly via `severityNote`.

A mis-typed severity field must never be the reason help arrived slowly. The
same ordering governs triage in `listActiveIncidents()`: life safety, then
severity, then age.

`raiseIncident()` also returns the **standing instruction in the same response**
as the incident record. Under pressure nobody opens a policy PDF. Where no
standing instruction exists for that incident type, the response names that gap
rather than returning silence.

Raising an incident is authenticated but **not** admin-gated: the person who
sees the problem first is rarely the person with the highest privilege.

---

## AI decision layer

Five agents added to `core/erpAgents.js` (10 → **15 agents**, 8 → **13 domains**),
each on its own domain code rather than a shared catch-all:

| Agent | Domain | Behaviour |
|---|---|---|
| `workflow.sla_breach` | AF-WF | Reports the **oldest** breach, not the first found |
| `crm.lead_qualification` | AF-CRM | MCDA-scored; **silent on mid-scoring leads** |
| `legal.obligation_watch` | AF-LEG | Distinguishes "due soon" from "already breached" |
| `risk.register_health` | AF-RSK | Treats a **stale review as its own risk** |
| `emergency.incident_command` | AF-EMR | Life safety stated first, before all else |

Every agent obeys the platform's existing contract: it **proposes**, never
executes. Each returns `status: 'proposed'`, `approved_by: null`,
`requires_human: true`, and the DB CHECK constraint makes approval without a
named human impossible. Each also returns `null` when it has nothing to say —
an agent that always fires is noise, and noise gets ignored.

Seven new signal types registered on the bus (`control.*`).

---

## Two bugs found and fixed during the build

1. **`SEVERITY.HIGH` does not exist.** The enum is
   `INFO / NOTICE / WARNING / CRITICAL / EMERGENCY`. Emergency signals would
   have emitted `severity: undefined` — silently unroutable. A regression test
   now asserts `SEVERITY.HIGH === undefined`.
2. **`SIGNAL.COMPLIANCE_BREACH` does not exist.** A `??` fallback would have
   emitted an unregistered signal type that no subscriber matches. Fixed by
   registering the seven `control.*` signals properly rather than papering over
   it at the call site.

---

## Verification status

| Check | Result |
|---|---|
| SQL parens / quotes balanced | pass (288/288) |
| Table-name collisions vs other 49 migrations | **none** |
| Foreign keys self-contained | **none unresolved** |
| Migration ordering (993 before 994–999) | correct |
| ESLint (new + touched files) | **0 errors** |
| All 139 backend files parse | **0 failures** |
| Server boot | clean — 56 routers, **647 endpoints**, 13 new |
| Enum references valid | all |
| Decision logic assertions | **14/14 pass** (plain node) |

### Not verified — and why

- **Jest could not complete in this environment.** Module loading off the
  mounted volume costs ~25 s before a single test runs (`mongodb` alone 8.1 s,
  `express` 4.5 s); jest produced zero output in 3+ minutes and was killed. The
  test file `src/tests/enterpriseControl.test.js` (22 tests, 42 assertions) is
  written and parses; the same assertions were executed successfully under plain
  node. **Run `npx jest src/tests/enterpriseControl.test.js` locally to confirm.**
- **A correction:** I initially reported that requiring `database/connection.js`
  leaks handles and auto-connects under test. That was wrong. The
  `NODE_ENV !== 'test'` guard works correctly; the delay is filesystem latency,
  and the two open sockets appear from loading npm packages alone, before any
  application code runs.
- **The 50-migration chain has still never run against a live PostgreSQL.**
  This remains the single highest-risk unverified item in the project. 993 adds
  3 generated columns and 45 CHECK constraints; 994–996 add triggers and
  cross-table constraints. `npm run migrate` against a scratch database is the
  one gate that cannot be cleared from this sandbox.
