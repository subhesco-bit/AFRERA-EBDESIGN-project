# AFRERA Organism Lattice

**Branch:** `consolidated/final`  
**Date:** 22 September 2026  
**Purpose:** Name the missing **bridge concepts** and the **technical + thoughtful ligaments** that would stop every module looking independent — and mark which joints now actually fire.

This is not a completion certificate. Two truths sit on this branch at once.

## Two integrities (do not confuse them)

| Layer | What it is | Living | Partial | Missing | Weighted integrity |
|---|---|---|---|---|---|
| **GitHub platform** (`backend/src/modules`, `eventBus.js`, 156 concept folders) | Storefront + stubs. Harvest is a portal row. Foreign keys are not a nervous system. | 3 | 13 | 108 / 124 | **7%** |
| **Lattice kernel** (this catalog + `lotKernel.js`) | Ligaments that fire: one lot body, remaining grams, harvest mint, intake, cover, GI mint, FIFO offtake, WAC on declared cost, qty-weighted FPO split, balanced journal, spoilage remainder. | 35 | 17 | 79 / 131 | **33%** |

The 7% diagnosis of the platform is still true. The 33% is tissue this kernel grew — not a claim that MarketplacePage, RECIE, FVIE, GCIP, or Kafka exist.

Living on the kernel today includes `lot.mint`, `harvest.completed` fan-out, `spine` pulses (harvest / intake / settle), `order.settled` → farmgate, FPO member + offtake, GI mint before claim, Langthasa godown cover, spoilage → village ledger, kitchen → next-season contract. Still missing: village energy cloud, scheme blood, weather reflex that moves a muscle, FVIE Food Utility Score, aquifer twin.

## The diagnosis

On `consolidated/final`, concepts were assembled as modules: Marketplace, Farmer, Logistics, Finance, Processing, Warehouse, AI, ERP. DORA already said the unit of design is organ + ligament + blood. The platform still thinks in pages and `farmer_id`.

Two failures remain on the platform:

1. **Missing bridge concepts** — joints whose only job is to bind organs (living lot, event spine, village energy cloud, food knowledge graph, prosperity ledger, hazard reflex, FPO tissue, household, scheme blood, water–energy nexus).
2. **Missing links of two kinds**
   - **Technical:** events, schemas, one-id lots, composed products.
   - **Thoughtful:** farmer is a cell not a role; village is an economy not a pin; GI is livelihood not a flag; a chatbot is not a reflex; time is a dimension.

Until those exist **in the platform**, 156 “implemented” concepts can still be a dead organism. The kernel is the first living walk, not a substitute for wiring the folders.

## Integrity of the lattice kernel

| | Count |
|---|---|
| Organs (existing modules) | 22 |
| Bridge concepts | 11 |
| Ligaments named | 131 |
| Living (runtime path on this kernel) | 35 |
| Partial (files on both sides, thin pulse) | 17 |
| Missing | 79 |
| Technical | 103 |
| Thoughtful | 28 |
| Isolated concepts (no living ligament) | 7 |
| Weak concepts (1–2 living ligaments) | 9 |
| Weighted integrity | **33%** |

## Bridge concepts (the joints)

These are not more modules. They exist to join organs that currently pretend to be complete alone.

| Id | Name | Binds | Kernel | Platform |
|---|---|---|---|---|
| `lot` | Living Lot | crop, warehouse, trace, marketplace, logistics, insurance | **Living.** One `lotId`, `remaining_grams`, mint → inward → offtake → settle. | No lot object. Six modules invent six ids for one sack. |
| `spine` | Event Spine | crop, warehouse, orders, ai, erp, farmer | **Living** on harvest / intake / settle pulses. | `eventBus.js` — in-memory Map, `Math.random` ids. |
| `cloud` | Village Energy Cloud | recie, processing, warehouse, livestock, village | **Missing.** Declared kWh may post. No forecast, no ₹/kWh schedule. | Named in RECIE 1.6. Unbuilt. |
| `foodgraph` | Food Knowledge Graph | gcip, fvie, crop, demand | **Living** as kitchen → Magh memory → next-season offer. No FUS. | GCIP and FVIE unbuilt. |
| `rupee` | Prosperity Ledger | farmer, rcop, finance, ai | **Living.** Double-entry paise, farmgate, village spoilage post. AI cannot write ₹. | Audit counts files. No attribution ink. |
| `reflex` | Hazard Reflex | soil, insurance, finance, logistics, ai | **Partial.** Cover binds on Langthasa godown. Weather still does not move a muscle. | weatherAdvisory is a page. |
| `fpo` | FPO / Cooperative | farmer, contract, finance, marketplace, shared, village | **Living.** Member cells, FIFO pool, qty-weighted split (last cell absorbs remainder). | GAP-0043/0044. FPO is an ACL role. |
| `household` | Household Economy | farmer, fvie, gcip, finance, demand | **Partial.** Cell is the demand unit on the books. No nutrition loop. | REOS layer 7 missing. |
| `scheme` | Government Knowledge | farmer, village, finance, recie, water | **Missing.** | REOS layer 4 missing. Schemes are PDFs. |
| `water` | Water Cost Intelligence | recie, crop, livestock, village, rcop | **Partial.** Declared ₹/litre may post. No aquifer twin. | Named as a cost category. |
| `module` | Module OS | ai, farmer, lot, spine | **Living.** 25 named AIs on one bus. Companion proposes. Clerk declares. | Folders declare WIRED; `isComplete` is false. |

## Technical ligaments that fire on this kernel

Priority pulses — these are no longer names:

| Signal | From → To | Status |
|---|---|---|
| `lot.mint` | lot → crop | **living** — one body of produce |
| `spine.publish harvest.completed` | spine → crop | **living** on the kernel bus |
| `harvest.completed` fan-out | crop → warehouse / trace / market / insurance | **living** — same `lotId` |
| `storage.covered` | warehouse → insurance | **living** — Langthasa master policy, premium never invented |
| `trace.mint` | crop → trace | **living** — GI claim blocked without mint |
| `order.settled` | orders → finance + demand + rupee | **living** — cash / farmgate / freight, `paymentRef` required |
| `fpo.contract.offer` | fpo → contract | **living** — next Magh kg, price blank until declared |
| `spoilage.event` | logistics → rcop | **living** — remaining grams cut, village fever posted |
| `fifo.allocate` | warehouse → orders | **living** — oldest remaining first; refuse oversell |
| `wac.cost` | warehouse → rupee | **living** — blend only declared remaining cost; issue at WAC, mass still FIFO |
| `qty.weighted.split` | fpo → farmer | **living** — last cell absorbs paise remainder |

Still named, still missing on both layers: `energy.cloud`, `weather.alert` → muscle, `scheme.eligible`, `water.pumped`, FUS rank, FDI metabolising credit.

Machine-readable list: [`lattice.json`](./lattice.json) (full contracts) and [`lattice-index.json`](./lattice-index.json) (ids and signals).

Kernel bone (grams, paise, no invented ₹): [`backend/src/value-chain-control/lotKernel.js`](../../backend/src/value-chain-control/lotKernel.js).

## Thoughtful ligaments the branch still must believe

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
- **WAC blends the rupee, not the sack.** FIFO keeps identity of remaining grams. Weighted average cost only runs on declared remaining cost. Missing cost → silent, never invented.

## What “integrated” would mean

A Chakhao harvest in Karbi Anglong:

1. The cell notes kg and variety.
2. A **lot** is minted — one id. Remaining = grams.
3. The **spine** publishes `harvest.completed`.
4. Warehouse intake, GI marker, cover, draft listing subscribe. Nobody retypes.
5. The **food graph** already knew Magh pulls pithas. Demand revises.
6. An order settles: FIFO mass, WAC only if cost was declared, farmer credit, hours-to-pay, `demand.observed` — one motion, posted to the **rupee ledger**.
7. If a chiller outage warms 40 kg, remaining is cut, **reflex** opens cover, the **energy cloud** would book kWh, **RCOP** books village TCO.
8. Before next sowing the **FPO** is offered offtake at last Magh kilograms, price blank.

On this kernel the walk lives through step 6 and the spoilage / next-season offer. It still dies at energy cloud, scheme blood, and weather muscle. On the GitHub platform the walk still dies at step 1.

## Sources on this branch

- `AFRERA_DIGITAL_ORGANISM_REFERENCE_ARCHITECTURE_DORA.md`
- `AFRERA_BIO_INSPIRED_ENTERPRISE_INTELLIGENCE_ARCHITECTURE_BIEA.md`
- `AFRERA_MISSING_PLATFORMS_ANALYSIS.md` (RECIE, FVIE, GCIP, RCOP)
- `REOS_MISSING_ECONOMIC_LAYERS_SPECIFICATION.md`
- `.ai/audit/MASTER_MISSING_CONCEPT_INDEX.md` (GAP-0041–0048, GAP-0021 event bus)
- `backend/src/platform/events/eventBus.js`
- `backend/src/value-chain-control/lotKernel.js` — remaining grams, FIFO, WAC, journal, FPO split
- Deferred schema collisions: `crop_plantings` vs `farms` vs `farm_plots`; IoT `farmer_id` vs `entity_id`

Do not add another independent concept. Add a ligament, or a bridge concept that exists only to carry one. Do not report 33% as if the platform folders woke up.
