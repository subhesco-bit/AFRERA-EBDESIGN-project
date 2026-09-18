# SUBH / EBDESIGN — MODULE DEVELOPMENT MASTER

**Purpose:** Master execution contract for completing, integrating, hardening and documenting every existing module/system in the repository, including systems that have not yet been touched by the current Village workstream.

**Repository:** `subhesco-bit/AFRERA-EBDESIGN-project`
**Baseline:** `audit/ui-api-fix` at `0830fb716c89f3543e30bfe147acd9c0ebecb110`
**Generated:** 2026-09-11

## 1. Core Rule

This project must not be developed only around the currently active Village, Finance, Logistics, Insurance or Supply Chain work. **Every existing module/system must be audited and brought through the same lifecycle:**

`DISCOVER → MAP → VERIFY → IMPLEMENT → INTEGRATE → TEST → HARDEN → DOCUMENT`

A route, page, service or `module.json` is not by itself evidence of completion.

## 2. Repository Baseline

The repository's existing system map identifies **29 systems**, **192 module manifests**, **207 API route mounts**, **126 domain/platform service files outside legacy**, **183 confirmed-live legacy services**, **115 grouped route files plus 95 top-level route files**, and **387 frontend page files**. These are reconciliation baselines, not production-readiness claims.

## 3. All 29 Systems Are In Scope

| # | System | Development scope |
|---|---|---|
| 1 | Identity, Auth & Security | Identity lifecycle, KYC, RBAC, MFA, SSO, consent, sessions, authorization, audit |
| 2 | Platform Core, Multi-Tenancy & Org Admin | Tenants, organisations, configuration, administration, module lifecycle |
| 3 | AI Orchestration & Copilot Layer | Provider gateway, orchestration, context, agents, decisions, safety, observability |
| 4 | Marketplace & E-Commerce | Catalog, products, orders, B2B, RFQ, pricing, sellers, checkout, fulfilment |
| 5 | Finance, Payments & Ledger | Farmer finance, working capital, project finance, accounting, ledger, GST/TDS, payments, reconciliation |
| 6 | Insurance | Person, farm, asset, operations, product loss, theft, accident, transit and claims |
| 7 | Rural Finance, Govt Schemes & Cooperative | Scheme registry, eligibility, subsidy/grant/credit linkage, cooperative workflows |
| 8 | Logistics & Cold Chain | Road, rail, air, courier, postal, hubs, routing, cold chain, multimodal tracking and cost |
| 9 | Crop & Agronomy Advisory | Crop planning, calendars, production, yield and agronomy |
| 10 | Soil, Nutrient & Land Mapping | Land, soil, nutrient, testing, GIS and plot intelligence |
| 11 | Water & Irrigation Management | Water resources, irrigation, demand and seasonal planning |
| 12 | Climate, Weather & Risk Intelligence | Weather, seasonal scenarios, climate risk and operational decisions |
| 13 | Crop Inputs Supply Chain | Seed, fertilizer, inputs, procurement, inventory, distribution and farmer demand |
| 14 | Livestock & Dairy | Dairy, livestock, feed, health, production, collection and economics |
| 15 | Fisheries & Aquaculture | Fisheries production, feed, water, harvest, cold chain and market |
| 16 | Horticulture & Protected Cultivation | Horticulture, greenhouse/protected cultivation and production economics |
| 17 | Forestry, Sericulture & Minor Produce | Forestry, silk, minor produce, biodiversity and value chains |
| 18 | Nutrition, Food & Consumer Health | Nutrition, food safety, quality and consumer intelligence |
| 19 | ERP Integration | ERP interoperability, master data and financial/operational synchronization |
| 20 | HR & Labour Management | Workforce, payroll, training, attendance, performance and labour allocation |
| 21 | Farmer Identity, Portal & Household | Farmer/family profiles, household economy, services and portal/offline access |
| 22 | Analytics, BI & Reporting | KPIs, dashboards, forecasts, reports and scenario analysis |
| 23 | Compliance, Governance & Audit | Compliance, controls, approvals, audit trail, risk and governance |
| 24 | IoT, Sensors, Realtime & Digital Twin | Devices, telemetry, realtime state, alerts and digital twins |
| 25 | Mobile Experience | Low-bandwidth, voice, offline-first and command-driven operation |
| 26 | Engineering, R&D & Enterprise Knowledge | Design, sizing, BOQ, estimates, DPR, R&D and knowledge |
| 27 | Enterprise Admin & DevOps | Health, deployment, jobs, configuration, observability and operations |
| 28 | Vendor, Procurement & Supply Chain Ops | Vendor master, qualification, sourcing, RFQ, PO, receipt, quality, 3-way match, performance |
| 29 | Machinery, Equipment & Village Ops | Shared equipment, O&M, utilisation, allocation and asset economics |

## 4. Mandatory Cross-Cutting Integration

Where applicable, every module must integrate with:

- identity, tenant and organisation
- roles/permissions and approvals
- master data and unique IDs
- audit trail
- documents/evidence
- notifications
- financial ledger
- AI gateway/backbone
- analytics
- government scheme engine
- geography/location
- seasonal/time scenario engine
- risk and insurance
- supply chain/vendor management
- API contracts
- library/module registry
- observability and health checks.

## 5. Village Operating Model

`Country → State → District → Block → Cluster → Village → Panchayat/Village Council → FPO/Producer Group → Household/Farmer → Plot/Production → Processing/Storage → Logistics → Market`

Shared assets must support both **within-Village** and **between-Village** models and separately track owner, controller, operator, user, utilisation, revenue, cost, maintenance, insurance and financing.

## 6. Seasonal Decision Engine

Operational decisions must be time- and season-aware: monsoon, summer, winter, transition periods, crop/fisheries/livestock seasons, harvest windows, shelf life, road/weather disruption, energy/water demand, market windows, processing capacity, logistics lead time, insurance exposure and financing timing.

The decision objective is **time + total cost + reliability + risk + capacity + product condition + market opportunity**, not simply lowest price.

## 7. Financial Architecture

Finance contains three distinct financing layers:

### Farmer Finance
Production/input/seasonal financing, farmer cash flow, repayment capacity and relevant scheme support.

### Working Capital Finance
Procurement → inventory → processing → storage → logistics → sales → receivables → cash.

### Project Finance
Engineering → BOQ → DPR → eligible cost → subsidy/grant → contribution/equity → debt → expenditure → completion → utilisation.

All three connect to the common accounting/ERP control layer without being collapsed into one generic product.

## 8. Government Scheme Integration

Central, State and department schemes require a versioned/effective-dated registry. AI may discover, interpret and match schemes, while validated scheme records drive financial calculations.

Lifecycle:

`Potentially Eligible → Application → Submitted → Review → Approved → Sanctioned → Released → Received → Utilised → Reconciled`

## 9. Insurance Integration

Risk coverage must be modelled across people, households, farms, livestock/fisheries, shared equipment, processing, cold storage, warehouses, projects, inventory/product, theft, accident, breakdown where covered, business interruption where covered, transit and logistics. Actual coverage always depends on policy terms.

## 10. Supply Chain and Vendor Integration

`Demand → Requisition → Approval → Sourcing/RFQ → Quote → Evaluation → PO/Contract → Dispatch → Logistics → Receipt → Quality → Invoice → 3-Way Match → Payment → Vendor Performance`

Vendor, supplier, procurement, inventory, logistics, finance and project/DPR data must remain linked.

## 11. Engineering / DPR Integration

`Requirement → Site/Location → Design → Capacity → Sizing → BOQ → Estimate → DPR → Scheme Matching → Funding → Procurement → Construction/Installation → Commissioning → O&M`

DPRs may originate at farmer, Village, FPO, project or other authorised levels.

## 12. AI Application Architecture

SUBH is the AI application layer. External/core AI engines such as ChatGPT, Claude, Grok or other supported providers are provider abstractions behind the AI backbone.

AI capabilities include conversational commands, decision support, scheme matching, financial intelligence, logistics intelligence, insurance assistance, engineering/DPR assistance, forecasting, anomaly detection, document intelligence, knowledge retrieval and multilingual/voice interaction.

AI must not silently bypass authorisation, accounting controls, statutory requirements or source-of-truth records.

## 13. Module Definition of Done

A module is `COMPLETE` only when applicable evidence exists for:

- module manifest and ownership
- backend service
- persistence/data model and migrations
- API routes and validation
- authorization
- audit logging
- frontend/UI
- state/data integration
- workflow/error handling
- unit/integration/e2e tests
- documentation
- health/status signal
- AI adapter where applicable
- cross-module contracts/cables
- configuration
- observability
- security review.

Allowed status values:

`COMPLETE | IMPLEMENTED_NEEDS_HARDENING | PARTIAL | BACKEND_ONLY | FRONTEND_ONLY | ROUTES_ONLY | SKELETON | LEGACY | DUPLICATE | DEAD_OR_UNUSED | BLOCKED`

## 14. Untouched Modules Are In Scope

Systems not involved in the latest Village-focused work are explicitly included, particularly IoT/realtime/digital twin, HR/labour, platform administration, compliance/governance/audit, engineering/R&D/knowledge, forestry/sericulture/minor produce, horticulture/protected cultivation, water/irrigation, soil/land, nutrition/food safety, mobile/offline, analytics/BI, enterprise DevOps and ERP interoperability.

## 15. Duplicate and Legacy Control

Legacy services must not be blindly copied. For each candidate implementation:

1. identify the authoritative implementation;
2. map duplicate routes/services;
3. preserve required compatibility;
4. consolidate safely;
5. update imports/mounts/contracts;
6. run regression checks;
7. mark superseded code explicitly.

## 16. Development Waves

### Wave A — Platform Integrity
Identity, tenancy, permissions, module registry, master data, audit, configuration, observability.

### Wave B — Transaction Engines
Finance, accounting, inventory, procurement, vendors, orders, logistics, asset management.

### Wave C — Village and Production Economy
Village, household, farmer, crop, livestock, fisheries, horticulture, water, soil, energy, production and shared infrastructure.

### Wave D — Engineering and Project Economy
Engineering, BOQ, estimates, DPR, scheme matching, project finance, procurement and implementation.

### Wave E — Risk and External World
Insurance, weather, climate, maps, transport hubs, postal/rail/air/courier, route intelligence and integrations.

### Wave F — AI Application Layer
Provider gateway, contextual agents, decision engines, voice/conversational interface, prediction, anomaly detection and cross-domain intelligence.

### Wave G — Hardening
Testing, security, performance, scalability, observability, reconciliation, documentation and production readiness.

## 17. Master Principle

No module is considered "done" merely because it exists. **Every existing system is part of the product and must be made coherent with the common platform, Village operating model, finance, supply chain, risk, engineering, government-scheme and AI layers wherever applicable.**

This document is the master development contract; implementation evidence remains in source code, migrations, tests, API contracts, module manifests and deployment checks.
