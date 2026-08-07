# Economic Layer — Enhancement Mapping

## Purpose
High-level enhancement mapping for the missing Economic Layers (REOS). This document maps the missing OS-level systems to concrete modules, API routes, backend integration points, data stores, and recommended UI wireframes.

## Summary (top priorities)
- Revenue Operating System (`/api/v1/revenue`) — highest priority
- Demand Intelligence (`/api/v1/demand`) — forecasting & heatmaps
- Cost Intelligence (`/api/v1/costs`) — cost breakup & interventions
- Government Knowledge (`/api/v1/gov`) — schemes knowledge graph
- Rural Economics Platform (`/api/v1/economics`) — district/village DB

## Module catalog (short)
- revenueService: channel-allocation, subscription, corporate, export
- demandService: demandForecast, heatmap, festival projections
- costService: costBreakupEngine, driverAnalysis
- govKnowledgeService: schemeGraph, eligibilityEngine, ROI
- ruralEconomicsService: districtDB, villageDB, costBenchmarks
- contractFarmingService: microContracts, FPOContracts, escrow
- preSeasonService: buyerCommitment, farmerCommitment, escrow

## API route mapping (suggested)
- GET /api/v1/revenue/overview — revenue OS dashboard
- POST /api/v1/revenue/allocate — channel allocation decision
- GET /api/v1/demand/forecast?product=X&region=Y — demand projection
- GET /api/v1/demand/heatmap?date=YYYY-MM-DD — demand heatmap data
- GET /api/v1/costs/breakup?productId= — cost breakdown
- POST /api/v1/gov/eligibility-check — check schemes for user
- GET /api/v1/economics/village/:id — village economic twin data

## Integration mapping
- Primary DB: PostgreSQL (existing schema + new tables/migrations)
  - migrations: src/database/migrations/9xx_revenue_and_economics.sql
- Secondary stores: MongoDB (for document-oriented scheme graph), Redis (caching forecasts)
- Events: emit `demand.updated`, `revenue.prediction`, `subsidy.applied` on signalBus
- Decision layer: feed Channel Allocation into `decisionSupportService` for approvals

## Data model notes (high level)
- revenue_contracts (contract_id, buyer_id, seller_group, product_set, qty_committed, start_date, end_date, escrow_account)
- demand_forecasts (product_id, region_id, date, forecast_qty, confidence)
- cost_breakups (product_id, region_id, component, amount, period)
- gov_schemes (scheme_id, jurisdiction, eligibility_predicate, benefits, docs)
- village_profiles (village_id, population, avg_income, assets_json)

## Wireframe index (see docs/wireframes/economic_layer_wireframes.md)
- Dashboard: economic layer overview with KPI cards (Revenue, Forecast accuracy, Cost savings)
- Revenue OS screens: Contracts list, Channel Allocation planner, Subscription manager
- Demand screens: Forecast explorer, Heatmap choropleth, Scenario run modal
- Government screens: Scheme search, Eligibility checker, Application tracker
- Village twin: village summary, scenario planner, top-20 recommended projects

## Priorities & Estimates (top 5)
- Revenue OS: 48 weeks (phase-split; MVP 12 weeks for core contracts & subscription)
- Demand Intelligence: 20 weeks (MVP 6 weeks — basic forecast API)
- Cost Intelligence: 18 weeks (MVP 6 weeks — cost breakup API)
- Government Knowledge: 24 weeks (MVP 8 weeks — scheme ingestion + search)
- Rural Economics Platform: 20 weeks (MVP 8 weeks — village profile + costs)

## Next engineering actions
1. Create migrations and seed data for village_profiles and demand_forecasts.
2. Add route stubs under `backend/src/routes` and corresponding service skeletons under `backend/src/services`.
3. Add OpenAPI paths to `backend/openapi.json` for the new modules.
4. Draft frontend pages (React) under `frontend/src/pages/economic/*`.

## Notes
- Keep decision-making steps auditable (store proposals, approvals, timestamps).
- Use Redis to cache demand forecasts for low-latency dashboards.
- Government scheme data should be versioned and immutable once applied.

---
Generated: 2026-08-05
