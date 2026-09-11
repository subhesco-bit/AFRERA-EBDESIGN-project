# M041 — Village ERP / Village Operating System

**Domain:** Village / Community Economic Operations  
**Status:** IMPLEMENTED FOUNDATION — hardened ERP, accounting, workflow and AI integration

## Purpose

M041 is the canonical village operating layer. It is not only a registry: it is the
operational control point linking a village master record to households, enterprises,
resources, KPIs, workflow, finance and AI decision support while remaining compatible
with the platform's single ERP and double-entry ledger.

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
- AI operational analysis with persisted insight/audit snapshots
- District-level economic roll-up
- Authenticated API access
- PostgreSQL persistence; no in-memory business state

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
```

## Data Model

`060_village_erp_operating_system.sql` adds the village operating spine:

- `village_households`
- `village_household_members`
- `village_enterprises`
- `village_budgets`
- `village_finance_dimensions`
- `village_operational_kpis`
- `village_workflow_tasks`
- `village_ai_insights`

The canonical village record remains the existing `villages` table, extended by
`053_village_registry_completion.sql`. Community resources remain in
`village_resources`.

## Accounting / ERP Integration

Each village can be initialized against the platform's `AFRERA` company and mapped
to:

- cost centre `VIL-{village_id}`
- profit centre `VIL-{village_id}`
- cash account `1110`
- revenue account `4100`
- expense account `5200`
- receivable account `1200`
- payable account `2100`

Village journal posting writes to the platform's `journal_entries` and
`journal_lines` tables, preserving the single-ledger architecture and database-level
double-entry controls.

## AI Integration

Village AI consumes a controlled dashboard snapshot rather than unrestricted database
access. When Claude coordination is enabled it uses the existing
`claudeAICoordinator`; otherwise the service uses a deterministic operational fallback.
Every generated insight is persisted in `village_ai_insights` together with provider,
model and source snapshot metadata.

AI recommendations do not directly bypass authorization or mutate core business data.
They produce an auditable recommendation layer that can feed human-controlled workflow.

## Operational Workflow

```text
Village Master Data
      ↓
Households / Enterprises / Resources
      ↓
KPI + Production + Procurement + Sales Signals
      ↓
Budget / Finance / ERP Ledger
      ↓
AI Risk & Opportunity Analysis
      ↓
Prioritized Workflow Tasks
      ↓
Human Action / Approval
      ↓
Updated KPI / Financial / Operational Outcome
```

## Hardening Principles

1. PostgreSQL is the system of record.
2. Village operations are authenticated.
3. Money uses `NUMERIC`, not floating point.
4. Financial posting is double-entry.
5. Posted journals are governed by the platform ledger controls.
6. Village finance is dimensioned through the existing ERP rather than a second ledger.
7. AI receives a bounded operational snapshot and persists its output for auditability.
8. Village deletion is archival rather than destructive.
9. Dynamic SQL is restricted to validated field allowlists.
10. Business operations must be verified end-to-end before being classified production-ready.

## Frontend

Canonical application page:

`frontend/src/pages/VillageRegistryPage.jsx`

API client:

`frontend/src/services/villageAPI.js`

The API client exposes registry, analytics, finance, dashboard, KPI, workflow and AI
operations through the existing backend-module bridge.
