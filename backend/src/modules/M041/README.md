# M041 — Village ERP / Village Operating System

**Domain:** Village / Community Economic Operations  
**Status:** IMPLEMENTED FOUNDATION — enhanced Village ERP, project design, DPR, estimate, funding, subsidy intelligence, accounting, workflow and AI integration

## Purpose

M041 is the canonical village operating layer. It is not only a registry: it is the operational control point linking a village master record to households, enterprises, resources, KPIs, projects, project design, estimates, DPR artefacts, government-scheme intelligence, funding, finance, workflow and AI decision support while remaining compatible with the platform's single ERP and double-entry ledger.

## Capability Stack

- Village master data and stable village business code
- Geographic hierarchy: state, district, block, tehsil, gram panchayat, pincode
- Demographics and household indicators
- Agriculture, fisheries and local economic indicators
- Infrastructure, water, services and community-resource tracking
- Village household and household-member registry
- Village enterprise registry
- Village budgets with committed/spent tracking
- ERP finance dimensions: company, cost centre, profit centre and mapped accounts
- Double-entry village journal posting into the platform ledger
- Operational KPI time series
- Village workflow/task management
- Village dashboard aggregation
- Multi-level project portfolio: farmer, household, village, FPO, cluster, block, district, state
- Project Design records linked to village, farmer/FPO and existing engineering projects
- Versioned BOQ/estimate calculation with contingency and taxes
- DPR linkage to the existing `dpr_documents` foundation
- Central and State government scheme catalogue with validity and verification metadata
- Scheme-to-project matching with eligibility signals, eligible cost base and potential assistance
- Funding-source stack across central subsidy, state subsidy, grant, loan, equity, beneficiary, FPO and CSR
- AI subsidy-analysis context with bounded project/DPR/estimate/funding data
- Persisted AI project review history with human-review status
- District-level economic roll-up
- Authenticated API access
- PostgreSQL persistence; no in-memory business state

## Project Lifecycle

```text
Need / Opportunity
      ↓
Project Design
      ↓
Estimate / BOQ
      ↓
DPR
      ↓
Central + State Scheme Screening
      ↓
Funding Plan
      ↓
Human Eligibility / Technical Review
      ↓
Approval / Sanction
      ↓
ERP Budget + Accounting
      ↓
Procurement / Implementation
      ↓
Progress / Actual Cost
      ↓
Outcome / Impact
      ↓
AI Monitoring & Recommendations
```

## Farmer / Village Scope

A project can be attached to a farmer, household, village, FPO or higher programme level. The canonical `project_id` is the anchor for design data, engineering artefacts, estimates, DPR links, subsidy matches, funding sources and AI reviews. This avoids creating separate disconnected project systems for farmer and village programmes.

## Runtime API

```text
GET    /api/v1/backend-modules/M041/getVillages
GET    /api/v1/backend-modules/M041/getVillage/:villageId
POST   /api/v1/backend-modules/M041/createVillage
PUT    /api/v1/backend-modules/M041/updateVillage/:villageId
DELETE /api/v1/backend-modules/M041/deleteVillage/:villageId
POST   /api/v1/backend-modules/M041/addVillageResource
GET    /api/v1/backend-modules/M041/getVillageAnalytics/:villageId
GET    /api/v1/backend-modules/M041/getVillageFinance/:villageId
POST   /api/v1/backend-modules/M041/initializeFinance/:villageId
POST   /api/v1/backend-modules/M041/postVillageJournal/:villageId
GET    /api/v1/backend-modules/M041/getDashboard/:villageId
POST   /api/v1/backend-modules/M041/upsertKPI/:villageId
POST   /api/v1/backend-modules/M041/createTask/:villageId
PATCH  /api/v1/backend-modules/M041/updateTask/:taskId
POST   /api/v1/backend-modules/M041/generateAI/:villageId
GET    /api/v1/backend-modules/M041/districtSummary/:district

GET    /api/v1/backend-modules/M041/listProjects/:villageId
POST   /api/v1/backend-modules/M041/createProject/:villageId
GET    /api/v1/backend-modules/M041/getProject/:projectId
POST   /api/v1/backend-modules/M041/createEstimate/:projectId
POST   /api/v1/backend-modules/M041/addFundingSource/:projectId
POST   /api/v1/backend-modules/M041/matchSubsidies/:projectId
GET    /api/v1/backend-modules/M041/buildSubsidyAIContext/:projectId
POST   /api/v1/backend-modules/M041/upsertScheme
```

## Data Model

The Village project enhancement adds:

- `village_projects` — canonical Village project portfolio and Project Design anchor
- `village_project_estimates` — versioned BOQ and financial estimates
- `village_project_dpr_links` — links to existing DPR/engineering artefacts and readiness review
- `village_scheme_catalogue` — Central/State scheme rule and verification catalogue
- `village_project_subsidy_matches` — project-to-scheme screening results
- `village_project_funding_sources` — complete project funding stack
- `village_project_ai_reviews` — persisted AI review/audit history

Existing platform entities remain authoritative where they already exist: `engineering_projects`, `dpr_documents`, ERP ledger tables and the canonical `villages` table.

## Estimate / BOQ Controls

Estimate creation validates every BOQ quantity and rate, calculates line amounts, subtotal, contingency, taxes and total cost using server-side arithmetic. Estimate versions are immutable by sequence (`project_id + version`) and the latest estimate drives the Village project's estimated cost.

## Subsidy Intelligence

The scheme catalogue is data-driven and supports both `central` and `state` government levels. Scheme records carry:

- ministry/department
- state
- sector
- beneficiary types
- geography
- eligibility rules
- assistance rules
- eligible cost heads
- required documents
- official source URL
- notification reference
- effective dates
- verification status
- last verification timestamp

The matching engine ranks potential schemes using project geography, sector, beneficiary level, project type and scheme verification state. It calculates potential assistance only from configured assistance rules. It does not claim government approval or invent scheme eligibility.

## AI Integration

AI is used as an enhancement layer over structured project data. `buildSubsidyAIContext()` produces a bounded context containing project, village, latest estimate, DPR linkage, funding sources and current scheme matches, together with explicit instructions not to invent eligibility or subsidy rates. The context can be handed to the existing platform AI/Claude orchestration layer. AI review records support findings, recommendations, confidence and human acceptance/rejection.

AI is advisory and auditable. It does not bypass authentication, authorization, official-source verification or human approval.

## Accounting / ERP Integration

Each village can be initialized against the platform's `AFRERA` company and mapped to:

- cost centre `VIL-{village_id}`
- profit centre `VIL-{village_id}`
- cash account `1110`
- revenue account `4100`
- expense account `5200`
- receivable account `1200`
- payable account `2100`

Village journal posting writes to the platform's `journal_entries` and `journal_lines` tables, preserving the single-ledger architecture and database-level double-entry controls. Project funding and subsidy records are kept as project funding dimensions and can subsequently be posted through the existing accounting workflow; the Village module does not create a second ledger.

## Hardening Principles

1. PostgreSQL is the system of record.
2. Village operations are authenticated.
3. Money uses `NUMERIC`, not floating point, for persisted financial values.
4. Financial posting is double-entry.
5. Project estimates are versioned and server-calculated.
6. Scheme matching is evidence-driven and distinguishes potential eligibility from verified entitlement.
7. Central and State schemes use one data-driven catalogue.
8. AI receives a bounded project context and produces advisory output rather than bypassing controls.
9. Village deletion is archival rather than destructive.
10. Dynamic SQL is restricted to validated field allowlists.
11. Existing engineering/DPR/ERP tables are reused rather than duplicated.
12. Business operations must be verified end-to-end before being classified production-ready.

## Frontend

Canonical application page:

`frontend/src/pages/VillageRegistryPage.jsx`

API client:

`frontend/src/services/villageAPI.js`

The API client exposes registry, analytics, finance, dashboard, KPI, workflow, project, estimate, funding and AI operations through the existing backend-module bridge.
