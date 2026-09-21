# Value-Chain Studio — Architecture Specification (v2)

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
6. Exposes a **lifecycle stage timeline** so operators see where the product sits and what is blocked.

AI is used **only** when the user explicitly requests:
- Concise product positioning copy
- A product studio image

---

## 2. Lifecycle stages (deterministic)

Stages are derived only from verified section data — never guessed.

| Stage | Meaning | Advances when |
|-------|---------|----------------|
| `identity` | Product exists in catalog | Product row loaded |
| `pricing` | Market / lot price signal | Floor benchmark or active lot |
| `cold_chain` | Storage/network readiness | Cold-chain system status available |
| `compliance` | Regulatory gates | No open compliance gates (or gates present and clear) |
| `insurance` | Risk cover | At least one policy on file |
| `funding` | Capital readiness | Loan applications present (optional) |
| `logistics` | Movement | Shipments linked (optional) |
| `market` | Ready to transact | Pricing + compliance clear |

Each stage in the API has: `id`, `label`, `status` (`complete` | `in_progress` | `blocked` | `optional` | `unknown`), `detail`, `href`.

---

## 3. Architecture layering

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPERIENCE LAYER                                                │
│  frontend/src/pages/ValueChainStudioPage.jsx                     │
│  - Product + Farmer inputs · stage timeline · section grid       │
│  - Provenance badges · handoffs · export JSON                    │
│  - On-demand AI positioning + image (advisory only)              │
└────────────────────────────┬────────────────────────────────────┘
                             │ GET  /api/v1/value-chain-studio/capabilities
                             │ GET  /api/v1/value-chain-studio/:productId
                             │ POST /api/v1/value-chain-studio/:productId/positioning
┌────────────────────────────▼────────────────────────────────────┐
│  COORDINATION LAYER                                              │
│  backend/src/services/valueChainStudioService.js                 │
│  buildLifecyclePlan() — pure read orchestrator                   │
│  stages · handoffs · readiness · plan meta · provenance map      │
└────────────────────────────┬────────────────────────────────────┘
                             │ Real service / table reads only
┌────────────────────────────▼────────────────────────────────────┐
│  SPECIALIST MICROSERVICES (existing, unchanged contracts)        │
│  pricing · cold-chain · insurance · subsidies · compliance       │
│  farmer value · engineering · shared infra · equipment           │
│  funding (loans) · logistics (shipments)                         │
└─────────────────────────────────────────────────────────────────┘
```

**Design rules:**

1. Nothing numeric is invented. Missing → `null` + `source: 'unavailable'`.
2. AI is isolated to `generatePositioningCopy` and `generateProductImage`.
3. `buildLifecyclePlan` is a **read path** — no writes.

---

## 4. Data contract (response shape)

```json
{
  "productId": "uuid",
  "farmerId": "uuid|null",
  "generatedAt": "ISO-8601",
  "planVersion": "2.0",
  "product": { "id", "name", "category", "basePrice", "isActive" },
  "pricing": { "floorBenchmark", "activeLot", "transparency" },
  "valueScore": { "score" },
  "coldChain": { "systemStatus", "facilities", "requirements" },
  "insurance": { "policies" },
  "subsidies": { "schemeEligibility", "unclaimed" },
  "compliance": { "gates" },
  "farmerValue": { "fvi" },
  "engineering": { "projects" },
  "sharedInfrastructure": { "availableAssets" },
  "equipmentRental": { "availableListings" },
  "funding": { "applications", "summary" },
  "logistics": { "shipments" },
  "stages": [ { "id", "label", "status", "detail", "href" } ],
  "handoffs": [ { "section", "label", "href", "status", "detail" } ],
  "stakeholderLinks": [ { "section", "label", "href" } ],
  "readiness": { "score", "label", "verifiedFields", "unavailableFields", "..." },
  "provenance": { "<path>": { "source", "verified", "asOf", "note" } }
}
```

Consumers **must** branch on `provenance[path].source`, never treat `unavailable` as zero.

---

## 5. API surface

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/value-chain-studio/capabilities` | Section list, design rules, no product required |
| `GET` | `/api/v1/value-chain-studio/:productId?farmerId=` | Full lifecycle plan (deterministic) |
| `POST` | `/api/v1/value-chain-studio/:productId/positioning` | AI positioning (explicit action) |

Routes auto-mount via `dynamicRouteLoader`.

---

## 6. Integration guide (for other teams)

1. Call `GET .../capabilities` to discover sections and rules.
2. Call `GET .../:productId` for the plan; inspect `stages` and `handoffs` before deep-linking.
3. Never invent defaults for `unavailable` fields.
4. To extend: pure-read section builder → `{ data, provenance }` → `Promise.all` → document in handoffs/stages.
5. Do not call write-on-read services (`calculateValueBasedPrice`, `trackCompliance`).

---

## 7. File map

| Path | Role |
|------|------|
| `backend/src/services/valueChainStudioService.js` | Orchestrator |
| `backend/src/routes/valueChainStudioRoutes.js` | HTTP surface |
| `frontend/src/pages/ValueChainStudioPage.jsx` | UI |
| `frontend/src/services/valueChainStudioAPI.js` | API client |
| `DOCUMENTATION/VALUE_CHAIN_STUDIO_ARCHITECTURE.md` | This document |

---

## 8. Non-goals

- AI-estimated prices, premiums, or subsidy amounts
- Silent fallbacks that hide missing data
- Write side-effects during plan generation
- Guessing village / geo joins without schema support

---

**AFRERA Value-Chain Studio** — one product, one farmer, the whole connected lifecycle plan. Every number sourced. Every gap visible.
