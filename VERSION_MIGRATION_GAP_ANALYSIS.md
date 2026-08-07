# AFRERA — Version Migration Gap Analysis

**Date:** 2026-08-04
**Question answered:** *"Is everything from every version migrated into the current project?"*
**Short answer:** **No. Roughly 94% of the prototype's user-facing surface never made it into the React application.**

---

## 1. What version artefacts actually exist

Before anything else, an honest inventory — because a migration audit against files that
do not exist would be worthless.

| Artefact | Location | Size | Status |
| --- | --- | --- | --- |
| `afrera_platform_v43.html` | EBDESIGN repo (local) | 1.2 MB / 13,020 lines | **The working prototype.** 98 routes, 445 functions |
| `AFRERA_Complete_Project_Report_v44` | Google Drive | 64 KB | Narrative history: concept → v44 |
| `AFRERA_Ultra_Comprehensive_Module_Specification` | Google Drive | 54 KB | Module-by-module spec |
| `DEVIN_PROMPT_AFRERA_FULL_BUILDOUT.md` | Google Drive | 6 KB | Build instruction set |
| `COMPLETE_AUDIT_requested_vs_delivered.md` | Google Drive | 9 KB | Prior delivery audit |
| `afrera_platform_v42.html` | GitHub `subhesco-bit/deepakne` | — | Older prototype snapshot |

### Versions v1–v42 do not exist as files

Searched: the EBDESIGN repo, all subdirectories, git history (no commits), and the
connected Google Drive. **No individual v1…v42 files exist anywhere reachable.**

The evolution from first design to v44 survives **only as narrative** inside
`AFRERA_Complete_Project_Report_v44`. That narrative has been mined and is summarised in
§2. Anything more granular — the actual code of v17, say — is not recoverable from any
source available to me. If those files exist in a Claude.ai Project, they are not
reachable from this environment; they would need to be placed in the repo or Drive.

---

## 2. The evolution, as recorded in the v44 report

Four phases, each of which left something behind that matters:

**Phase One — Core Commerce Foundation.** Established the rule the whole platform still
runs on: **MAP-A**, the farmer's private floor price, is never shown to a buyer — held
structurally off the product object, not hidden by styling. Also produced the bug class
internally named *"fix one, drop ten"*, which led to the discipline of full role×route
crawls before every release.

**Phase Two — The Full ERP Build-Out.** Added eight SAP-equivalent modules: Asset
Accounting, Plant Maintenance, Production Planning, Field Operations, Controlling,
Logistics Execution, Master Data Governance, and Security/GRC.

**Phase Three — Discoverability Correction.** A recurring failure: *"modules were built
and fully tested, then discovered to be effectively invisible because they were never
wired into any role's navigation."* Named instances: `/rideshare`, `/bankpassport`,
`/selltimingv2`, `/riskscoring`.

**Phase Four — The AI Decision Discipline.** A critique that the platform's AI features
were *"inconsistent, ungrounded heuristics dressed in AI language"* led to the single
`mcda()` engine — weights summing to 1.0, honest confidence, sensitivity analysis.

> **Note the convergence.** Phases Three and Four describe exactly the two defects found
> independently by code inspection in this session — 60 unreachable endpoints plus 20
> orphaned services, and `Math.random()` behind a hardcoded "94% accuracy". Two separate
> audits, arriving at the same findings, is good evidence both were reading reality.

---

## 3. The migration gap, measured

### 3.1 Routes — the headline number

| Measure | Count |
| --- | --- |
| Routes registered in v43 prototype | **98** |
| Routes present in React `App.jsx` | 15 |
| v43 routes actually reachable in React | **6** |
| **v43 routes with no React equivalent** | **92 (94%)** |

The 92 missing routes, grouped by domain:

- **Farmer-facing:** `/farmer`, `/farmerhome`, `/farmersell`, `/farmerfield`,
  `/farmerdoors`, `/farmerconsumer`, `/farmershared`, `/farmadvisor`, `/harvestplan`,
  `/harvestscore`, `/whatgrow`, `/seedvault`, `/organic`, `/organictrace`
- **Commerce & pricing:** `/market`, `/pricebuild`, `/pricecheck`, `/pricemodel`,
  `/dynamicpricing`, `/selltiming`, `/compare`, `/discover`, `/preorder`, `/preseason`,
  `/gifting`, `/familybasket`
- **ERP & operations:** `/erp`, `/procurement`, `/procurementorchestrator`,
  `/corpprocurement`, `/inventory`, `/warehouse`, `/maintenance`, `/facilities`,
  `/ops`, `/orderrouting`, `/contract`, `/billing`
- **Logistics:** `/track`, `/corridor`, `/truckwindow`, `/transportmode`,
  `/logisticsengines`, `/rideshare`, `/book`
- **Finance:** `/finance`, `/banking`, `/fdi`, `/subsidy`, `/subsidypassthrough`,
  `/claims`, `/disputes`, `/dpr`
- **Intelligence:** `/bi`, `/copilot`, `/advisory`, `/knowledge`, `/scenario`,
  `/glutwatch`, `/agentapp`
- **Governance & trust:** `/governance`, `/security`, `/privacy`, `/trust`, `/terms`,
  `/users`, `/console`, `/modulestatus`
- **Agri specialist:** `/agrimachinery`, `/equipment`, `/infra`, `/lab`, `/labreport`,
  `/folu`, `/mpu`, `/wellness`, `/care`, `/learn`
- **Platform:** `/account`, `/myprofile`, `/kyc`, `/register`, `/offline`,
  `/accessibility`, `/sitemap`, `/contact`, `/export`, `/crm`, `/day`, `/producers`,
  `/addproduct`, `/smsgateway`

### 3.2 Business logic

| Measure | Count |
| --- | --- |
| Functions in v43 | 445 |
| High-value decision functions checked against backend + frontend | 14 |
| **Found to exist ONLY in v43** | **13** |

Recovered and implemented in this session (see §4): `mcda`, `buyVsRentDecision`,
`farmerSelectionDecision`, `claimFraudScore`, `moqPrice`, `benchmarkVerdict`.

Still **not** recovered — logic exists in v43, no equivalent in the current system:
`corpCreditEligible`, `floorBenchmark`, `ecoLogisticsMiles`, `harvestPoints`,
`allocScore`, `compostPlan`, `schemeExpiryStatus`, `complianceGaps`.

---

## 4. What HAS been migrated (this session)

| Item | Source | Now in |
| --- | --- | --- |
| MCDA decision framework | v43 | `backend/src/core/mcda.js` (tested) |
| 5 business decision rules | v43 | `backend/src/services/decisionSupportService.js` |
| AF-* ERP process layer (24 tables) | v44 report | `migrations/995_erp_process_layer.sql` |
| MAP-A privacy rule | v43/v44 | `listing_floor_private` table (structural) |
| "AI proposes, human approves" | v44 | `ai_proposals` CHECK constraint |
| Two-document dispatch + SoD | v44 | `dispatch_events` trigger |
| Accounting spine (18 tables) | ERP spec | `migrations/996_enterprise_foundation.sql` |

---

## 5. What this means

The React + Express rewrite reproduced the **plumbing** — auth, catalogue, orders,
services, database — but not the **product**. 92 of 98 screens a real user would touch,
and 13 of 14 business rules that made those screens intelligent, exist only in a
13,020-line HTML file that is not deployed.

This is not a small porting backlog. On the current evidence, `afrera_platform_v43.html`
is closer to the intended product than the React application is.

### Recommended sequence

1. **Do not delete or overwrite `afrera_platform_v43.html`.** It is currently the most
   complete expression of the product and the only source for the 92 missing screens.
2. **Port by business value, not by file order.** The farmer-facing and pricing routes
   carry the rules that differentiate the platform.
3. **Recover the remaining 8 decision functions** before porting their screens — the
   logic is the valuable part; the markup is not.
4. **Treat each ported route as done only when it is reachable by an entitled role.**
   This is the exact failure Phase Three documented, and it recurred in the Express
   backend (60 unreachable endpoints found this session).

---

## 6. Honest limits of this analysis

- Route comparison is by path string. A React page could implement a v43 screen under a
  different path and be counted as missing. Spot-checks did not find such cases, but the
  count should be read as "approximately 92", not exactly.
- v1–v42 were not analysed **because no such files exist** in any location available to
  me. Their content is represented only by the v44 report's four-phase narrative.
- Function comparison covered 14 named high-value functions, not all 445. The true count
  of lost logic is likely higher than 13.
