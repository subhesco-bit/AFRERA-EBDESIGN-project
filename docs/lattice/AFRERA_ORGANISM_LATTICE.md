# AFRERA Organism Lattice

**Branch:** `consolidated/final`  
**Date:** 22 September 2026  
**Purpose:** Name the missing **bridge concepts** and the **technical + thoughtful ligaments** that would stop every module looking independent.

This is not another completion certificate. `eventBus.js` is an in-memory stub. Harvest is a portal row. RECIE, FVIE, GCIP, RCOP, the village twin, the household economy, and the government knowledge graph are specified and unbuilt. Foreign keys are not a nervous system.

## The diagnosis

On `consolidated/final`, concepts were assembled as modules: Marketplace, Farmer, Logistics, Finance, Processing, Warehouse, AI, ERP. DORA already said the unit of design is organ + ligament + blood. The code still thinks in pages and `farmer_id`.

Two failures:

1. **Missing bridge concepts** — joints whose only job is to bind organs (living lot, event spine, village energy cloud, food knowledge graph, prosperity ledger, hazard reflex, FPO tissue, household, scheme blood, water–energy nexus).
2. **Missing links of two kinds**
   - **Technical:** events, schemas, one-id lots, composed products.
   - **Thoughtful:** farmer is a cell not a role; village is an economy not a pin; GI is livelihood not a flag; a chatbot is not a reflex; time is a dimension.

Until those exist, 156 “implemented” concepts can still be a dead organism.

## Integrity of `consolidated/final`

| | Count |
|---|---|
| Organs (existing modules) | 22 |
| Bridge concepts | 10 |
| Ligaments named | 124 |
| Living (real runtime path) | 3 |
| Partial (files on both sides, no pulse) | 13 |
| Missing | 108 |
| Technical | 99 |
| Thoughtful | 25 |
| Weighted integrity | **7%** |

Living ligaments today: `product.farmer_id`, cart→order, farmer portal→crop page. That is a storefront with a login, not an organism.

## Bridge concepts (the missing joints)

These are not more modules. They exist to join organs that currently pretend to be complete alone.

| Id | Name | Binds | Today on this branch |
|---|---|---|---|
| `lot` | Living Lot | crop, warehouse, trace, marketplace, logistics, insurance | No lot object. Six modules invent six ids for one sack. |
| `spine` | Event Spine | crop, warehouse, orders, ai, erp, farmer | `backend/src/platform/events/eventBus.js` — in-memory Map, `Math.random` ids, TODO queue, TODO event sourcing. Nothing publishes `harvest.completed`. |
| `cloud` | Village Energy Cloud | recie, processing, warehouse, livestock, village | Named in RECIE 1.6. No forecast, no allocation, no ₹/kWh schedule. |
| `foodgraph` | Food Knowledge Graph | gcip, fvie, crop, demand | GCIP and FVIE are both missing, so there is nothing to join. |
| `rupee` | Prosperity Ledger | farmer, rcop, finance, ai | Master spec requires a rupee path. Audit counts files. No attribution ink. |
| `reflex` | Hazard Reflex | soil, insurance, finance, logistics, ai | weatherAdvisory is a page. Sixteen AI services are not a spinal cord. |
| `fpo` | FPO / Cooperative | farmer, contract, finance, marketplace, shared, village | GAP-0043/0044. FPO is an ACL role. |
| `household` | Household Economy | farmer, fvie, gcip, finance, demand | REOS layer 7 missing. Cart is SKU-in. |
| `scheme` | Government Knowledge | farmer, village, finance, recie, water | REOS layer 4 missing. Schemes are PDFs. |
| `water` | Water Cost Intelligence | recie, crop, livestock, village, rcop | Named as a cost category. No organ, no aquifer twin, no ₹/litre. |

## Technical ligaments that would integrate the body

Priority pulses — if only a few are built, build these:

| Signal | From → To | Why it is the joint |
|---|---|---|
| `spine.publish harvest.completed` | spine → crop | Blood. Without it every later organ retypes the harvest. |
| `lot.mint` | lot → crop | One body of produce. Identity of livelihood. |
| `harvest.completed` fan-out | crop → warehouse / trace / market / insurance | One sack, four organs, no second birth. |
| `order.settled` | orders → finance + demand + rupee | Settlement is one motion: payout, FDI, vein, hours-to-pay. |
| `fdi.updated` | farmer → finance / insurance | Credit and cover metabolise cell health. |
| `weather.alert` → reflex arc | soil → insurance / finance / logistics | A warning that does not move a muscle is gossip. |
| `energy.cloud` | cloud → processing / warehouse / livestock | Mills and chillers run when breath is cheapest. |
| `graph.spike` | foodgraph → demand → contract | Magh is memory, not a residual. Offtake before sowing. |
| `scheme.eligible` composed | scheme → finance / recie / water | Inclusion is a product, not a hunt. |
| `fpo.contract.offer` | fpo → contract | Small farms grow a spine by promising together. |
| `channel.allocate` | demand → processing | Fresh / process / store / export is a revenue OS, not a shop. |
| `water.pumped` | water → recie | Water and energy are one breath. |

Machine-readable list: [`lattice.json`](./lattice.json) (full contracts) and [`lattice-index.json`](./lattice-index.json) (ids and signals).

## Thoughtful ligaments the branch still does not believe

These are not slogans. They change schema and UX.

- **Farmer is a cell, not a role.** RBAC lists farmer next to admin. Roles are doors. Cells are lives.
- **Village is an economy, not a pin.** Every intervention answers: how many rupees per year does this save the village?
- **The lot is one body.** If two organs cannot point at the same `lotId`, they are not in the same organism.
- **Blood is not bone.** ERP may subscribe. It may not invent pulses. `eventBus.js` is not Kafka because it was named Section 23.
- **GI is heritage plus livelihood.** A tag without a kitchen and a rupee split is branding.
- **Energy is lifetime ₹, not MW.** KPIs: ₹/kg, ₹/litre chilled, ₹/hour irrigation.
- **A chatbot is not a reflex.** Sense, decide, act, learn on one event — or hide it.
- **A scheme is blood, not a PDF.** Search is a failure mode.
- **FPO is tissue, not a login.** The nucleus remains the farmer.
- **The household is the demand unit.** A marketplace that sells to “users” will never feed a family it cannot name.
- **Water and energy are one breath.** A solar pump that ignores the aquifer is a lung that does not ask if the blood is left.
- **Time is a dimension.** Lead time to sowing, hours-to-pay, cover window, festival spike. An organism that cannot remember last Magh will plant next Magh as a surprise.

## What “integrated” would mean

A Chakhao harvest in Karbi Anglong:

1. The cell notes kg and variety.
2. A **lot** is minted — one id.
3. The **spine** publishes `harvest.completed`.
4. Warehouse intake, GI marker, cover, draft listing subscribe. Nobody retypes.
5. The **food graph** already knew Magh pulls pithas. Demand revises.
6. An order settles: farmer credit, hours-to-pay, FDI, `demand.observed` — one motion, posted to the **rupee ledger**.
7. If a chiller outage warms 40 kg, **reflex** opens cover, the **energy cloud** books kWh, **RCOP** books village TCO.
8. Before next sowing the **FPO** is offered offtake. The farmer does not guess the city.

Today the walk dies at step 1. The portal stores a row.

## Sources on this branch

- `AFRERA_DIGITAL_ORGANISM_REFERENCE_ARCHITECTURE_DORA.md`
- `AFRERA_BIO_INSPIRED_ENTERPRISE_INTELLIGENCE_ARCHITECTURE_BIEA.md`
- `AFRERA_MISSING_PLATFORMS_ANALYSIS.md` (RECIE, FVIE, GCIP, RCOP)
- `REOS_MISSING_ECONOMIC_LAYERS_SPECIFICATION.md`
- `.ai/audit/MASTER_MISSING_CONCEPT_INDEX.md` (GAP-0041–0048, GAP-0021 event bus)
- `backend/src/platform/events/eventBus.js`
- Deferred schema collisions: `crop_plantings` vs `farms` vs `farm_plots`; IoT `farmer_id` vs `entity_id`

Do not add another independent concept. Add a ligament, or a bridge concept that exists only to carry one.
