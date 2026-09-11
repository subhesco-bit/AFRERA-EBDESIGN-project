# Village External Needs & SUBH Supply Operating Model

## Purpose

The Village Operating System now distinguishes three demand layers and connects them to the SUBH supply platform:

1. **Household** — goods and services required by village families.
2. **Village** — common/institutional/community requirements.
3. **Agro OS** — production inputs, machinery, services and infrastructure required to produce agricultural/livestock/fisheries output.

The village records what it produces and consumes locally; this layer records what must be sourced from outside and what SUBH can coordinate as supply.

## Economic logic

`External requirement = total requirement - available local supply - confirmed internal fulfilment`

Demand is aggregated by item, layer, village and required period. The resulting supply plan is used for sourcing, ordering, delivery and reconciliation.

## Supply lifecycle

`Need → Demand Record → Aggregation → SUBH Supply Plan → Order → Sourcing → In Transit → Delivery → Fulfilment → ERP Reconciliation`

## Household layer

Typical categories include food, household essentials, LPG/energy, health, education, communications, banking and services. Household IDs may be attached to individual demand records while the village-level plan aggregates demand for efficient procurement.

## Village layer

Typical categories include construction material, electrical equipment, transformers, solar/BESS components, water-system material, waste-management equipment, institutional supplies, maintenance material, fuel, packaging and professional services.

## Agro OS layer

Typical categories include seed, fertiliser, bio-inputs, crop-protection inputs, feed, veterinary/fisheries inputs, machinery, drones, irrigation, soil testing, repair, storage, cold chain, processing, packaging, insurance, credit and specialist services.

## SUBH supply control

The supply order defaults to `subh_network` as the supplier type. The architecture supports approved suppliers/supplier IDs without coupling the Village module to a single procurement implementation. Orders are authenticated through M041 and carry a complete status and financial trail.

## AI

`GET /api/m041/villages/:villageId/ai/supply-context` provides the external-supply plan plus the Village logistics profile to the AI layer. AI must identify gaps and propose sourcing actions without inventing prices, suppliers, availability or government eligibility.

## Relationship to production

External supply is deliberately separate from production output. The Village Economy layer answers **what the village produces and consumes**; this layer answers **what the village must obtain from outside**. SUBH can then use the difference to identify procurement, localisation, shared-service and project opportunities.

## Relationship to Agro OS

Agro OS remains a separate production-operating layer. Its external requirements use the `agro` demand layer and can later be connected to crop calendars, livestock/fisheries cycles, farm plots, machinery capacity, engineering sizing, project design, DPR, subsidy matching and ERP.
