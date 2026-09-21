# Value-Chain Studio — Architecture Specification

**Branch:** `consolidated/final`  
**Status:** Production-facing coordinating layer  
**Principle:** Every calculable field is deterministic and auditable. AI is reserved for concise product positioning and image creation only.

---

## 1. Concept

AFRERA’s specialist systems (pricing, cold-chain, insurance, subsidies, compliance, logistics, finance, shared infrastructure, equipment) historically operated in isolation. A farmer or operator had to visit multiple pages and mentally stitch a plan.

**Value-Chain Studio** is the single production-facing surface that:

1. Accepts **one product** and optionally **one farmer**.
2. Assembles a **transparent lifecycle plan** from real, live services and tables.
3. Tags every field with **data provenance** (`db` | `calculated` | `ai` | `unavailable`) and a **verified** flag.
4. Surfaces **stakeholder handoffs** with direct links into existing specialist pages.
5. Never invents numbers. Missing data is explicit (`unavailable`), never estimated.

AI is used **only** when the user explicitly requests:
- Concise product positioning copy
- A product studio image

All pricing math, readiness scores, subsidy totals, utilization rates, and compliance statuses remain deterministic.

---

## 2. Architecture Layering

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPERIENCE LAYER                                                │
│  frontend/src/pages/ValueChainStudioPage.jsx                     │
│  - Product + Farmer inputs                                       │
│  - Lifecycle plan sections with provenance badges                │
│  - Links into specialist workspaces                              │
│  - On-demand AI positioning + image (advisory only)              │
└────────────────────────────┬────────────────────────────────────┘
                             │ GET /api/v1/value-chain-studio/:productId
                             │ POST .../positioning (AI only)
┌────────────────────────────▼────────────────────────────────────┐
│  COORDINATION LAYER (this service)                               │
│  backend/src/services/valueChainStudioService.js                 │
│  buildLifecyclePlan() — pure read orchestrator                   │
│  - Parallel section builders                                     │
│  - Provenance map                                                │
│  - Stakeholder handoffs + readiness summary                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ Real service / table reads only
┌────────────────────────────▼────────────────────────────────────┐
│  SPECIALIST MICROSERVICES (existing, unchanged)                  │
│  pricing · cold-chain · insurance · subsidies · compliance       │
│  farmer value · engineering · shared infra · equipment           │
│  funding (loans) · logistics (shipments)                         │
└─────────────────────────────────────────────────────────────────┘
```

**Design rules enforced in code comments and implementation:**

1. Nothing numeric is invented. Missing → `null` + `source: 'unavailable'`.
2. AI is isolated to `generatePositioningCopy` and `generateProductImage`.
3. `buildLifecyclePlan` is a **read path** — no writes (avoids flooding pricing/compliance tables on every page load).

---

## 3. Lifecycle Plan Sections

| Section | Source | Deterministic? | Specialist page |
|---------|--------|----------------|-----------------|
| Product context | `products` + `categories` | Yes | Marketplace / Product detail |
| Pricing | `dynamicPricingService.floorBenchmark`, `priceForLot` | Yes | `/dynamic-pricing` |
| Value score | `valueCommerceService.getProductValueScore` | Yes | Value commerce |
| Cold-chain | `coldStorageService.getSystemStatus` / facilities | Yes | `/cold-storage` |
| Insurance readiness | `insurancePolicyIssuanceService.getUserPolicies` | Yes | `/insurance` |
| Subsidies | `governmentSchemeService` + `farmerValueService.detectUnclaimedSubsidy` | Yes | `/government-subsidy` |
| Compliance gates | `compliance_records` (direct SQL) | Yes | `/compliance` |
| Farmer Value Index | `farmerValueService.computeFVI` | Yes (calculated) | Farmer portal |
| Engineering | `engineeringProjectService.listProjects` | Yes | `/engineering-projects` |
| Shared infrastructure | `assets` / `asset_types` | Yes | `/shared-infra` |
| Equipment rental | `equipmentExchangeService.listAvailable` | Yes | `/equipment-rental` |
| Funding readiness | Loan applications / credit context (read-only) | Yes | `/loan-management` |
| Logistics | Shipments linked to product/farmer | Yes | `/logistics` |
| Stakeholder handoffs | Derived from section readiness | Yes | (links above) |
| Readiness summary | Deterministic aggregation of verified sections | Yes | — |
| AI positioning | On-demand only | Advisory | — |
| AI image | On-demand only | Advisory | — |

---

## 4. Provenance Contract

Every field path in the response has a provenance entry:

```json
{
  "source": "db" | "calculated" | "ai" | "unavailable",
  "verified": true | false,
  "asOf": "ISO-8601",
  "note": "optional human-readable reason"
}
```

UI badges:
- **Verified · DB** — live table row
- **Calculated** — deterministic formula over verified inputs
- **AI · advisory only** — never used for money/risk/compliance numbers
- **Unavailable** — data does not exist; no guess

---

## 5. API Surface

```
GET  /api/v1/value-chain-studio/:productId?farmerId=
     → full lifecycle plan (deterministic, no AI)

POST /api/v1/value-chain-studio/:productId/positioning
     → AI positioning copy (explicit user action)
```

Routes auto-mount via `dynamicRouteLoader` from `valueChainStudioRoutes.js`.

Frontend client: `frontend/src/services/valueChainStudioAPI.js`.

---

## 6. Integration Guide (for other teams)

1. **Consume the plan**  
   `GET /api/v1/value-chain-studio/{productId}?farmerId={optional}`  
   Auth required. Response shape is stable; always check `provenance[path].source`.

2. **Never treat `unavailable` as zero**  
   Downstream systems must branch on provenance, not invent defaults.

3. **Link into specialist pages**  
   Use `stakeholderLinks` / `handoffs` array; do not hardcode paths if the studio already provides them.

4. **Extend a section**  
   - Add a pure-read section builder that returns `{ data, provenance }`  
   - Catch errors inside the builder (one failure must not kill the plan)  
   - Register in `Promise.all` inside `buildLifecyclePlan`  
   - Document the specialist page link in `buildStakeholderLinks` / handoffs

5. **Do not call write-on-read services**  
   See service file header for excluded functions (`calculateValueBasedPrice`, `trackCompliance`).

---

## 7. Readiness Summary (deterministic)

The studio computes a simple readiness score:

- Count of sections with at least one **verified** provenance entry
- Count of open compliance gates (status ≠ completed)
- Presence of active insurance policy
- Presence of claimable subsidy amount
- Presence of pricing floor or active lot

All inputs are already-verified fields. The score itself is marked `source: 'calculated'`.

---

## 8. File Map

| Path | Role |
|------|------|
| `backend/src/services/valueChainStudioService.js` | Orchestrator |
| `backend/src/routes/valueChainStudioRoutes.js` | HTTP surface |
| `frontend/src/pages/ValueChainStudioPage.jsx` | UI |
| `frontend/src/services/valueChainStudioAPI.js` | API client |
| `DOCUMENTATION/VALUE_CHAIN_STUDIO_ARCHITECTURE.md` | This document |

---

## 9. Non-goals

- AI-estimated prices, premiums, or subsidy amounts
- Silent fallbacks that hide missing data
- Write side-effects during plan generation
- Village-scoped machinery access without a verified village join (would require guessing)

---

**AFRERA Value-Chain Studio** — one product, one farmer, the whole connected lifecycle plan. Every number sourced. Every gap visible.
