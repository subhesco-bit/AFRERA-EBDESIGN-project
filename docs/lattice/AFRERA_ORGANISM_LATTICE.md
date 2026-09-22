# AFRERA Organism Lattice

**Branch:** `consolidated/final`  
**Date:** 22 September 2026  
**Purpose:** Name the missing **bridge concepts** and the **technical + thoughtful ligaments** that would stop every module looking independent — and mark which joints now actually fire.

This is not a completion certificate. Two truths sit on this branch at once.

## Two integrities (do not confuse them)

| Layer | What it is | Living | Partial | Missing | Weighted integrity |
|---|---|---|---|---|---|
| **GitHub platform** (`backend/src/modules`, `eventBus.js`, 156 concept folders) | Storefront + stubs. Harvest is a portal row. Foreign keys are not a nervous system. | 3 | 13 | 108 / 124 | **7%** |
| **Lattice kernel** (this catalog + `lotKernel.js` + OS registry) | Ligaments that fire: one lot body, remaining grams, harvest mint, intake, cover, GI mint, FIFO offtake, WAC on declared cost, qty-weighted FPO split, balanced journal, spoilage remainder, OS classification. | 45 | 22 | 73 / 140 | **39%** |

The 7% diagnosis of the platform is still true. The 39% is tissue this kernel grew — not a claim that MarketplacePage, RECIE, FVIE, GCIP, or Kafka exist. Integrity stays under 40% on purpose: unintegrated joints remain named, not painted living.

Living on the kernel today includes `lot.mint`, `harvest.completed` fan-out, `spine` pulses (harvest / intake / settle), `order.settled` → farmgate, FPO member + offtake, GI mint before claim, Langthasa godown cover, spoilage → village ledger, kitchen → next-season contract, evidence passport, need-based navigation, constitution E1–E8. Still missing: village energy cloud, scheme blood, weather reflex that moves a muscle, FVIE Food Utility Score, aquifer twin, offline queue.

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
| Bridge concepts | 12 |
| Ligaments named | 140 |
| Living (runtime path on this kernel) | 45 |
| Partial (files on both sides, thin pulse) | 22 |
| Missing | 73 |
| Technical | 110 |
| Thoughtful | 30 |
| Weighted integrity | **39%** |

## OS registry (Stage 0 complete)

The assessment of AFRERA as a digital economic operating system is now an executable catalog, not a memo.

| | Count |
|---|---|
| Concepts classified (Stage 0) | 110 / 110 — **100%** |
| Kernel verified | 20 |
| Kernel partial | 62 |
| TODOs done | 42 |
| TODOs open | 60 |
| TODOs blocked | 8 |
| Stage 1 (industry baseline) | 21 / 32 done |
| Stages 5–6 (autonomy / futuristic) | 0 done — named, not claimed |

Canonical files: [`../os/AFRERA_OS_REGISTRY.md`](../os/AFRERA_OS_REGISTRY.md), [`../os/catalog.json`](../os/catalog.json), [`../os/todos.json`](../os/todos.json).

**Principal rule:** do not generate thousands of pages or empty AI services. Preserve everything. Classify. Then enhance accepted concepts at four levels — component, industry, rural-first, futuristic. Plug a ligament.

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
| `os` | Digital Super-Organism Registry | all organs | **Living.** Stage 0 classification, 16-link matrix, constitution, suitability, grievance spine. | Competing registries. Completion certificates without runtime. |

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
| `os.classify` | os → every organ | **living** — Stage 0 complete, dual-truth |
| `os.passport` | lot → trust | **living** — GI, cover, remaining, paymentRef, journal |
| `os.suitability` | finance / insurance / travel | **living** — refuse loan, travel, invented premium |

Machine-readable list: [`lattice.json`](./lattice.json) (full contracts) and [`lattice-index.json`](./lattice-index.json) (ids and signals).

## What must still not be claimed

- GitHub platform integrity is **7%**. Event bus is still a stub.
- Village energy cloud, scheme blood, weather muscle, FVIE Food Utility Score, aquifer twin, offline queue — missing.
- Stages 5–6 (autonomous ecosystem, futuristic platform) are classified and named. Zero done.
- AI still cannot write rupees. Clerk declares kg / ₹ / loss / paymentRef.
- No invented yield, premium, credit score, or emissions.

Next ligament to plug, not next thousand pages: **offline queue**, **scheme blood with effective dates**, **weather reflex that moves remaining grams**.
