# Village Comprehensive Gap & Operating Model

## Purpose

The Village is treated as a complete socio-economic, production, infrastructure, service, resilience and project operating unit. Existing domain modules remain authoritative for their specialist ledgers; the Village layer aggregates them through the canonical `village_id`.

## Already present in the repository

- Village registry/profile and household/family records
- Agriculture, crop planning, soil/land and irrigation domains
- Livestock, dairy, poultry, pig, goat and sheep domains
- Fisheries/aquaculture domains
- Horticulture, forestry, sericulture, mushroom, vermicompost and apiculture
- Nutrition and food intelligence
- ERP, accounting, budgets, cost centres, project systems and finance
- Government schemes/subsidy, rural finance, cooperative and SHG capabilities
- Marketplace, demand, pricing, procurement and institutional sales
- Logistics, cold chain, freight pooling, geofencing and traceability
- Climate/weather/risk, drought/flood and disease intelligence
- AI orchestration, decision support, knowledge and predictive intelligence
- GIS/land mapping, village geo-location and nearest logistics facilities
- Village production, consumption, processing, storage, waste/loss and market-flow accounting
- Production-per-acre and benchmark-based potential analysis
- Project Design/DPR/Estimate/BOQ and funding/subsidy linkage
- Energy/resource planning including solar/wind/storage and village backup concepts

## Gaps that must be represented at Village level

### 1. Local governance

Panchayat/local institution records, meeting/resolution history, responsibility ownership, village grievances and implementation tracking.

### 2. Public/community asset register

Schools, health facilities, water assets, roads/bridges, electrical assets, community buildings, storage, processing, markets and other public/community assets with condition, capacity, operational state and maintenance/replacement lifecycle.

### 3. Service coverage

Village-level coverage and quality of essential services, access distance and served-vs-target population. This is an aggregation layer; it does not replace specialist service systems.

### 4. Livelihood and employment structure

Primary/secondary livelihoods, worker counts, seasonal employment and household livelihood dependency. This is required to understand where village income actually originates.

### 5. Skills and workforce gaps

Available workers vs required workers, training capacity and priority skill gaps linked to enterprises and future projects.

### 6. Financial inclusion

Village access points for banking, payments and financial services, digital capability and service distance. Transactional accounting remains in the ERP/ledger.

### 7. Disaster and climate resilience

Hazard profiles, exposure/vulnerability, risk scoring, mitigation status and emergency resources. This should feed project design and AI recommendations.

### 8. Emergency readiness

Shelter/resource capacity, emergency contacts, equipment/resources, availability and verification.

### 9. Digital connectivity

Mobile/broadband coverage, network availability, internet quality, public Wi-Fi and digital service access.

### 10. Natural-resource and environmental accounting

Water bodies, forests/common resources, biodiversity and other natural assets with use, sustainable-use estimates, condition and protection status.

### 11. Environmental indicators

Village-level measurable environmental indicators with date, unit and source so trends can be monitored rather than storing only static descriptions.

### 12. Readiness / development index

A dated evidence-backed snapshot across governance, economy, infrastructure, services, connectivity, resilience, environment and livelihoods.

## Village operating model

```text
Village Identity
    -> Households / Farmers / FPOs / Enterprises
    -> Land / Water / Natural Resources
    -> Production
    -> Household & Village Consumption
    -> Marketable Surplus
    -> Markets / Buyers / Logistics
    -> Income / Finance / ERP
    -> Infrastructure & Public Services
    -> Risks / Resilience / Emergency
    -> Project Design / DPR / Estimate
    -> Central + State Scheme Matching
    -> Funding / Procurement / Implementation
    -> Outcomes / Impact
    -> AI continuous analysis
```

## Canonical design rule

Do not create duplicate specialist ledgers when an existing module already owns the domain. The Village layer should link and aggregate through stable IDs, while adding village-level gaps, context and decision intelligence.

## New implementation in 9994

The migration `9994_village_completeness_operating_layer.sql` adds the Village-level records for governance, grievances, institutions, assets, service coverage, livelihoods, skills, financial access, hazards, emergency resources, digital connectivity, natural resources, environmental indicators and readiness snapshots.

The M041 API now exposes:

- `GET /api/m041/villages/:villageId/completeness`
- `GET /api/m041/villages/:villageId/infrastructure-profile`
- `GET /api/m041/villages/:villageId/readiness`

These endpoints are authenticated through the existing M041 route protection.

## What the Village AI should ultimately answer

1. What does the village have?
2. What does it produce?
3. What does it consume at household/family level?
4. What does the village consume collectively?
5. What is imported from outside?
6. What surplus can be marketed?
7. What can be produced more efficiently per acre/unit of capacity?
8. What infrastructure is missing or underutilised?
9. What services are below target coverage?
10. What skills and jobs are missing?
11. What energy, water, waste and natural-resource opportunities exist?
12. What risks could disrupt production or livelihoods?
13. What project should be designed?
14. What DPR/estimate is required?
15. Which Central and State schemes may potentially support it?
16. What funding gap remains?
17. What implementation actions are required?
18. What measurable economic, social and environmental outcome is expected?

## Critical distinction

A Village record is not the same as a Village project. The village is the persistent geographic/economic context; projects are interventions against identified gaps/opportunities. A project may belong to a farmer, household, village, FPO, cluster, block, district or state while still retaining its Village relationship when applicable.
