# EBDESIGN — file alignment and governance

**Date:** 2026-08-04

---

## Your question, answered directly

> *"you are upgrading ebdesign project already created or creating new one"*

**Upgrading. There is exactly one project and it is this folder.**

Nothing in this session created a parallel system. Every change landed inside
the existing tree:

| Added | Where | Relationship to existing code |
|---|---|---|
| `992_v42_recovered_intelligence.sql` | `backend/src/database/migrations/` | 52nd file in the one migration chain |
| `993_enterprise_control_layer.sql` | same | 51st, runs before 994–999 |
| `enterpriseControlService.js` | `backend/src/services/` | 69th service, same Express router pattern |
| `v42IntelligenceService.js` | same | 70th service, same pattern |
| 5 new ERP agents | `backend/src/core/erpAgents.js` | appended to the existing register (10 → 15) |
| 7 new signals | `backend/src/core/signalBus.js` | appended to the existing enum |
| Domain tokens | `frontend/src/index.css` | extends the existing shadcn token layer |
| `AccessibilityProvider` | `frontend/src/components/Accessibility/` | wraps the existing `MultilingualProvider` |

No file was replaced wholesale. No second backend, no second frontend, no
`v2/` directory.

---

## Where the double-work risk actually lives

It is not in the code. It is in **~450 KB of specification documents at the
repository root**, all dated 2026-08-02:

```
AFRERA_DEVELOPMENT_OPERATING_SYSTEM_SPECIFICATION.md      60 KB
AFRERA_INTEGRATED_PLATFORM_ARCHITECTURE.md                62 KB
AFRERA_ENGINEERING_GOVERNANCE_SYSTEM_SPECIFICATION.md     58 KB
COMPREHENSIVE_PROJECT_ANALYSIS.md                         64 KB
AFRERA_MISSING_PLATFORMS_ANALYSIS.md                      44 KB
AFRERA_NEXT_GENERATION_TRANSFORMATION_PROGRAM.md          30 KB
AFRERA_INNOVATION_ARCHITECTURE_SPECIFICATION.md           28 KB
AFRERA_UNIFIED_MULTI_EXPERIENCE_PLATFORM_ARCHITECTURE.md  26 KB
AFRERA_DEVELOPMENT_INFRASTRUCTURE_SPECIFICATION.md        24 KB
AFRERA_MASTER_ARCHITECTURAL_SPECIFICATION.md              21 KB
ARCHITECTURE_ENHANCEMENT_PLAN.md                          16 KB
AFRERA_DEVELOPMENT_STACK_SETUP.md                         13 KB
COMPLETION_REPORT.md                                      11 KB
… and more
```

**These are aspirational, not descriptive.** They describe an intended system.
The code has since moved — in places past them, in places away from them. They
carry no marker saying which.

That is the mechanism by which double work happens: someone (human or agent)
reads `AFRERA_MISSING_PLATFORMS_ANALYSIS.md`, believes a platform is missing,
and builds it — when it was built three weeks ago under a different name. This
already happened once this session in miniature: I concluded "no design tokens"
from a file count and nearly rebuilt a token layer that existed.

### The specific correction that proves the point

`EVGA_PHASE13` claimed 0% implementation of a capability set while 13,724 lines
of it existed in the repo. The report was not lying — it was **stale**, and
nothing in the filename or header said so.

---

## Governance rules

These are the minimum needed to stop the recurrence. They are rules about
*documents*, because that is where the problem is.

### Rule 1 — Every document declares its own status in its first five lines

```markdown
**STATUS:** ASPIRATIONAL | DESCRIPTIVE | HISTORICAL
**VERIFIED AGAINST CODE:** <date> | NEVER
```

- `ASPIRATIONAL` — describes intent. **Do not treat as a gap list.**
- `DESCRIPTIVE` — was true against the code on the stated date.
- `HISTORICAL` — a record of what happened. Never a to-do list.

A document with no status header is `ASPIRATIONAL` by default. That default is
deliberate: assuming a doc describes reality is the expensive mistake.

### Rule 2 — Claims of absence must be re-verified before acting

Before building anything a document says is "missing", grep for the capability
**by behaviour, not by name**. The v42 audit found 136 of 294 constants present
under different names — 46% of everything that looked missing already existed.

Name-matching alone would have caused 136 duplicate builds.

### Rule 3 — Code is the only source of truth for what exists

Where a document and the code disagree, the code wins and the document is
wrong. This mirrors the existing truthpack protocol in `CLAUDE.md` and extends
it to prose specs, which currently have no such rule.

### Rule 4 — One chain, one register, one token layer

- Migrations: one numbered chain in `backend/src/database/migrations/`. Never a
  second migration directory.
- ERP agents: appended to `core/erpAgents.js`. Never a parallel agent service.
- Signals: appended to `core/signalBus.js`. Never a private event emitter.
- Colours: `index.css` tokens. Never a hex literal in a component.

Each of these has exactly one home *because* duplication here is invisible
until it has already diverged — as the two brand greens did.

### Rule 5 — Version archaeology is read-only

`ne (3).zip`, `v42`, `v43`, `v44` are **sources to extract from, never targets
to restore.** Extract the business rule, express it in the current
architecture, record where it came from, and leave the original alone.

---

## What the audit trail now looks like

Each recovery names its source, so the next reader can tell recovered IP from
invented IP:

| Document | Covers |
|---|---|
| `VERSION_MIGRATION_GAP_ANALYSIS.md` | v43 → current, 92 unported routes |
| `FUTURE_WORKFLOW.md` | staged plan from that gap analysis |
| `ENTERPRISE_CONTROL_LAYER.md` | the 6 domains that had zero tables |
| `DESIGN_SYSTEM.md` | token layer, brand-green fix, a11y modes |
| `EBDESIGN_ALIGNMENT.md` | this file |

Migration headers state extraction provenance inline — 992's header records
that 56 of 294 v42 constants already existed verbatim, 136 as concepts, 102
were absent, and *why most of those 102 were correctly left behind* (SPA tab
state that React routing replaces).

---

## Honest status of this session's work

**Built and verified before the shell died:**
- 992 + 993 migrations: parens balanced, no table collisions, FKs self-contained,
  ordering correct
- 2 services, 24 endpoints, mounted and confirmed live (658 total, up from 647)
- 15 ERP agents across 13 domains, all enum references validated
- All 139 backend files parse; ESLint 0 errors

**Built but NOT verified — the workspace shell became unresponsive:**
- Frontend token changes (`index.css`, `tailwind.config.js`)
- `AccessibilityProvider` (mounting confirmed by reading the file; not linted or built)

**Never verified, and still the highest risk in the project:**
- **The now 52-migration chain has never run against a live PostgreSQL.**
  This has been true for the entire engagement. 992 adds 14 tables, 20 CHECK
  constraints and 370 seeded rows; 993 adds 3 generated columns and 45 CHECKs;
  994–996 add triggers and cross-table constraints. `npm run migrate` against a
  scratch database is the one gate none of this work has passed.

**Not started (shell died first):**
- NestJS-pattern module layer — you asked for both the pattern layer *and* a
  path to full migration; the plan was a strangler-fig arrangement where each
  module is independently portable, so migration becomes incremental rather
  than a rewrite.
- CI running the migration chain against a Postgres service container — the
  fix that would close the gap above permanently.
