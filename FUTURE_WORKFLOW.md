# AFRERA — Future Work Plan

**Date:** 2026-08-04
**Basis:** `VERSION_MIGRATION_GAP_ANALYSIS.md` (92 of 98 prototype routes unported; 13 of
14 sampled business rules lost) plus the session's code findings.

---

## The governing insight

The React rewrite reproduced the **plumbing** and lost the **product**. Every plan below
follows from that one fact, so the sequencing is deliberate: recover logic before
screens, and make the database real before building more on top of it.

---

## Stage 0 — Prove the foundation runs (blocking, ~1 day)

Nothing below is safe until this passes. The 48-file migration chain has **never been
executed end to end**, and it now contains triggers, generated columns and constraints —
the things most likely to fail on first contact with a real database.

| # | Task | Done when |
| --- | --- | --- |
| 0.1 | `npm run migrate` against a scratch Postgres | 48 migrations apply, 0 errors |
| 0.2 | Inspect `995`/`996` triggers actually fire | unbalanced journal rejected; single-document dispatch rejected |
| 0.3 | `npm test` | suite completes (statistics, geo, decisionEngine, decisionSupport green) |
| 0.4 | `npm run build` (frontend) | build succeeds — could not be verified in sandbox |
| 0.5 | `npm run dev` both halves, hit `/health` | server boots, health reports each subsystem |
| 0.6 | Commit + push to `subhesco-bit/deepakne` | a rollback point finally exists |

**Do not begin Stage 1 until 0.1–0.5 pass.** If a migration fails, fix it before adding
more schema — a broken chain compounds.

---

## Stage 1 — Recover the remaining lost logic (~1 week)

Business rules are the differentiator; markup is not. Recover logic **before** porting
the screens that display it.

**Still lost in `afrera_platform_v43.html`:**

| Function | Domain | Why it matters |
| --- | --- | --- |
| `corpCreditEligible` | Finance | Corporate credit gating |
| `floorBenchmark` | Pricing | Peer floor-price comparison — feeds `benchmarkVerdict` |
| `ecoLogisticsMiles` | Logistics | Emissions/ESG per lane |
| `harvestPoints` | Farmer | Loyalty / incentive economics |
| `allocScore` | Orders | Order-to-farmer allocation |
| `compostPlan` | Circular | Residue → compost planning |
| `schemeExpiryStatus` | Subsidy | Scheme deadline exposure |
| `complianceGaps` | Governance | Compliance readiness |

Method: extract from v43 (and the older `ne_harvest_*` lineage — see Stage 1b), port to
`backend/src/services/`, unit-test against known values, expose via
`/api/v1/decision-support`, register in OpenAPI.

**Stage 1b — mine the full version lineage.** The `ne (3).zip` archive contains 65 HTML
builds (`neia_platform` → v4 → v5 → master → v7 → v8 ×23 → v9). Later versions do not
strictly supersede earlier ones — features get dropped between iterations. Diff function
inventories across the lineage and recover anything that existed once and vanished.

---

## Stage 2 — Restore the user-facing surface (~4–8 weeks)

92 routes to port. Sequence by business value, not alphabetically.

**Wave 1 — Farmer (revenue origin).** `/farmerhome`, `/farmersell`, `/farmerfield`,
`/harvestplan`, `/harvestscore`, `/whatgrow`, `/seedvault`, `/farmadvisor`
→ *Depends on:* MAP-A privacy (built), `benchmarkVerdict` (built), `harvestPoints` (Stage 1)

**Wave 2 — Pricing & commerce.** `/market`, `/pricebuild`, `/pricemodel`,
`/dynamicpricing`, `/selltiming`, `/pricecheck`, `/compare`, `/preorder`, `/preseason`
→ *Depends on:* `floorBenchmark`, `moqPrice` (built)

**Wave 3 — ERP operations.** `/erp`, `/procurement`, `/inventory`, `/warehouse`,
`/maintenance`, `/contract`, `/billing`, `/ops`
→ *Depends on:* `995_erp_process_layer` (built), `996_enterprise_foundation` (built)

**Wave 4 — Finance & risk.** `/finance`, `/banking`, `/fdi`, `/subsidy`, `/claims`,
`/disputes`, `/dpr`
→ *Depends on:* accounting spine (built), `corpCreditEligible`, `schemeExpiryStatus`

**Wave 5 — Intelligence & governance.** `/bi`, `/copilot`, `/advisory`, `/knowledge`,
`/scenario`, `/governance`, `/security`, `/trust`
→ *Depends on:* MCDA (built), signal bus + decision engine (built)

**Definition of done for every ported route** — learned from the v44 report's "Phase
Three: Discoverability Correction", and confirmed by the 60 unreachable endpoints found
in the Express backend this session:

1. Route renders for every entitled role
2. Reachable by clicking from that role's navigation — *not merely registered in the router*
3. Backed by a live API endpoint (present in `openapi.json`)
4. At least one test
5. Works on mobile viewport (PWA shell is in place)

---

## Stage 3 — Make the AI real (~2–4 weeks, needs production data)

Current state: `advancedAIService` mocks are replaced with genuine statistics
(`src/utils/statistics.js`, Holt forecasting, real MAPE-derived accuracy), and the MCDA
framework provides explainable multi-criteria decisions. Remaining work needs **real
historical volume**, which is why it follows Stage 0.

| Task | Note |
| --- | --- |
| Train demand forecasting on real order history | Holt is a sound baseline; revisit ML only if data justifies it |
| Replace simulated SAP/Oracle in `erpService` | Currently `// Simulate SAP response` |
| Wire remaining signal emitters | `shelfLifeService`, `foodSafetyService`, `logisticsService` delays |
| Add domain agents on the decision engine | The 100+ agent vision — each is a rule, not a service |
| Ground `aiCopilotService` in a real model | Presently no provider call |

---

## Stage 4 — Platform reach (~2–3 weeks)

- **Web:** the React SPA (Stage 2 output)
- **Mobile:** PWA shell exists (manifest + service worker + `useGeolocation`). Needs
  mobile-first layouts for Wave 1–2 routes and an offline write queue reconciled with
  `offlineSyncService`
- **Desktop:** wrap the same build (Electron/Tauri) — no separate codebase. All three
  share one rule set because decisions live server-side in `/api/v1/decision-support`

---

## Stage 5 — Decisions only you can make

These are blocked on judgement, not effort. Each is cheap to answer and expensive to guess.

| # | Decision | Consequence of leaving it |
| --- | --- | --- |
| 5.1 | Which `/api/v1/insurance/policies` implementation is canonical? | Two routers collide; `insuranceService` silently shadows the richer one |
| 5.2 | Normalise 19 JSONB location columns to typed lat/lng or PostGIS? | Radius search stays a table scan platform-wide |
| 5.3 | Which of 19 duplicate table definitions is authoritative? | First-applied silently wins; ~44 columns still unreconciled |
| 5.4 | Import third-party ERP code? | ERPNext is GPL-3, Odoo LGPL/OEEL — incompatible with your `PROPRIETARY` licence. Needs counsel, not an engineer |
| 5.5 | Real AI provider + budget? | Blocks Stage 3 |
| 5.6 | Keep v43 as the reference build? | Recommended — it remains the most complete expression of the product |

---

## Sequencing rationale

```
Stage 0 (foundation) ──► Stage 1 (logic) ──► Stage 2 (screens) ──► Stage 4 (reach)
                                  │
                                  └──► Stage 3 (AI, needs live data)
```

Logic precedes screens because a ported screen without its rule is a shell that must be
rebuilt. Stage 0 precedes everything because schema defects are cheapest to fix before
anything depends on them, and this chain has never run.

---

## What "done" looks like

- 48 migrations applied cleanly against a real database
- 98 prototype routes either ported **or** explicitly declined (the v44 report already
  declined 9 by design — that is a legitimate outcome)
- Every business rule from every version either recovered or consciously retired
- Zero mocked AI presented as real
- One rule set serving web, mobile and desktop
