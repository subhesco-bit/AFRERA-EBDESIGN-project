# Ecommerce Layer ≠ Farmer Layer

**Branch:** `consolidated/final`  
**Rule:** These are **two different business systems**. Do not merge their models, orders, identities, or workflows.

---

## 1. Boundary definition

| Dimension | **Ecommerce layer** | **Farmer layer** |
|-----------|---------------------|------------------|
| **Primary actor** | Buyer, seller, marketplace operator, logistics partner | Farmer, FPO, extension worker, village operator |
| **Core object** | SKU, cart, commercial order, invoice, shipment, return | Farm, plot, crop cycle, herd, subsidy claim, advisory case |
| **Order tables** | `marketplace_orders` / commerce O2C | Farm input requests, scheme applications — **not** the same as cart checkout |
| **Money** | Payment auth/capture, refund, escrow, GST tax invoice | DBT subsidy, KCC, input credit, household cashbook |
| **Inventory** | Sellable stock reservation for orders | On-farm stock, seed/fertilizer for production |
| **Identity** | Buyer/seller KYC, GSTIN, marketplace reputation | Farmer ID, land record, Aadhaar-seeded bank for schemes |
| **AI role** | Merchandising, pricing, fraud, fulfillment | Disease/crop advisory, subsidy eligibility, herd risk |
| **Success metric** | OTIF, GMV, returns rate, margin | Yield, scheme uptake, animal health, income support |

**From platform baseline:** `orders` (B2C user+address) and `marketplace_orders` (B2B buyer/seller) already model different businesses — same principle extends to Farmer vs Ecommerce.

---

## 2. What must NOT be mixed

- Do **not** put subsidy eligibility on a cart checkout path.
- Do **not** use ecommerce `order_id` as a farm crop-plan id.
- Do **not** score farmer scheme eligibility with marketplace reputation.
- Do **not** treat “farmer listed tomatoes” as the same object as “warehouse SKU TOM-ORG-1KG” without an explicit **listing bridge**.
- Do **not** run O2C compensation steps on a subsidy application state machine.

---

## 3. Allowed bridges (explicit contracts only)

| Bridge | From | To | Contract |
|--------|------|-----|----------|
| **Farm-to-market listing** | Farmer produce lot | Ecommerce catalog SKU | `listing_bridge.create_from_lot` — separate ids, provenance link |
| **Input purchase** | Farmer needs seed/fertilizer | Ecommerce / institutional supply order | Farmer is **buyer** on commerce side; farm layer keeps input plan id |
| **Cold storage handoff** | Commerce fulfillment | Cold bay allocation | Shipment id → bay allocation; farm layer not required |
| **Subsidy on assets** | Farmer scheme (e.g. micro-irrigation) | Optional vendor catalog | Eligibility stays in farmer layer; payment may settle via commerce only if vendor is on-platform |

Every bridge returns **two ids** (farmer-side + commerce-side) and never collapses them.

---

## 4. API namespaces (enforced)

```
/api/v1/ecommerce/*          → catalog, cart, O2C, returns, seller
/api/v1/farmer/*             → profile, land, cycles, advisory hooks, subsidy extract
/api/v1/bridge/farm-commerce/* → listing + input-purchase bridges only
/api/v1/research-grade/ecommerce/*  → O2C state machine (commerce)
/api/v1/research-grade/subsidy/*    → farmer / scheme layer
```

Subsidy engines belong to **Farmer layer**. O2C state machines belong to **Ecommerce layer**.

---

## 5. Module ownership (illustrative)

**Ecommerce:** M826 ECOMMERCE, M251 ECOMMERCEERP, M419 ORDER, M220 marketing, fulfillment engine, ENTERPRISE_ECOMMERCE_10X  
**Farmer:** M722 FARMER, M100 crop, M101 livestock, M386 SUBSIDY, disease/vet/nutrition advisory, ENTERPRISE platform farmer map  
**Bridge:** thin services only — no god-module

---

## 6. Implementation files

- `backend/src/services/layers/layerBoundary.js` — constants + guards
- `backend/src/services/layers/farmerLayerService.js` — farmer domain operate
- `backend/src/services/layers/ecommerceLayerService.js` — commerce domain operate (wraps O2C)
- `backend/src/services/layers/farmCommerceBridge.js` — dual-id bridges
- `backend/src/routes/layerRoutes.js` — `/api/v1/farmer`, `/api/v1/ecommerce`, `/api/v1/bridge/farm-commerce`
