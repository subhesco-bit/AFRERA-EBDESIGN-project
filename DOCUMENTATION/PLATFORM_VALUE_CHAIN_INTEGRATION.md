# Platform ↔ Value-Chain Studio integration map

**Branch:** `consolidated/final`  
**Audience:** backend, frontend, ERP, enterprise API, middleware, AI teams

This document is the **system-level wiring guide** for AFRERA’s Value-Chain Studio coordinating layer. It does not replace specialist module docs; it shows how modules connect without inventing numbers.

---

## 1. Non-negotiable rules (all layers)

1. **Deterministic first** — money, risk, compliance, readiness scores come from DB or pure calculation.
2. **Provenance on every field** — `db` | `calculated` | `ai` | `unavailable`.
3. **AI is advisory** — positioning copy + product image only, explicit user action.
4. **No silent defaults** — `unavailable` is not zero.
5. **Read path for plans** — `buildLifecyclePlan` never writes.

---

## 2. Layer map

| Layer | Location | Role vs Studio |
|-------|----------|----------------|
| Domain / product | `products`, `farmers`, `categories` | Identity context |
| Specialist services | `backend/src/services/legacy/*` | Pricing, cold-chain, insurance, subsidies, etc. |
| Coordination | `valueChainStudioService.js` | Assembles lifecycle plan |
| HTTP API | `valueChainStudioRoutes.js` | `/api/v1/value-chain-studio/*` |
| Middleware | `auth`, `requestId`, `rateLimit`, `responseFormatter` | Same stack as rest of platform |
| Frontend pages | `ValueChainStudioPage.jsx` + specialist pages | Studio + deep links |
| Enterprise API | `enterpriseIntegrationRoutes.js` | External systems consume plan JSON |
| ERP agents | `core/erpAgents.js` (propose only) | May **read** plan; must not invent scores |
| AI backbone | `aiBackboneService`, `productMediaAIService` | Positioning + image only |

---

## 3. API contracts (stable)

```
GET  /api/v1/value-chain-studio/capabilities
GET  /api/v1/value-chain-studio/:productId?farmerId=
POST /api/v1/value-chain-studio/:productId/positioning
```

Auth: `authMiddleware` (same as platform).  
Response: `{ success, data }` with `planVersion`, `stages`, `handoffs`, `readiness`, `provenance`.

**Enterprise / ERP consumers:** download or GET the plan JSON; branch on `provenance[path].source`.

---

## 4. Middleware expectations

Studio routes inherit platform middleware:

- `requestId` — correlation for distributed traces
- `auth` — JWT / session
- `rateLimit` — protect plan endpoint under load
- `responseFormatter` / consistent `{ success, data, error }`

No Studio-specific write middleware; plan generation is read-only.

---

## 5. Frontend module surface

| Asset | Purpose |
|-------|---------|
| `pages/ValueChainStudioPage.jsx` | Operator UI |
| `components/StageTimeline.jsx` | Stage strip + `exportPlanJson` |
| `services/valueChainStudioAPI.js` | Thin client |
| Specialist routes (`/dynamic-pricing`, `/cold-storage`, …) | Handoff targets |

---

## 6. AI integration boundary

| Allowed | Forbidden |
|---------|-----------|
| `generatePositioningCopy` | AI prices, premiums, subsidy amounts |
| `generateProductImage` | AI readiness scores |
| Explicit button click | Background AI on every plan load |

ERP agents that call Studio must treat AI fields as **non-authoritative**.

---

## 7. Extension checklist (any team)

1. Add pure-read section builder → `{ data, provenance }`.
2. Isolate errors inside the builder.
3. Register in `Promise.all` inside `buildLifecyclePlan`.
4. Extend `buildHandoffs` / `buildStages` with deterministic status only.
5. Link specialist page in `buildStakeholderLinks`.
6. Document in this file + `VALUE_CHAIN_STUDIO_ARCHITECTURE.md`.

---

## 8. Related docs

- `DOCUMENTATION/VALUE_CHAIN_STUDIO_ARCHITECTURE.md` — studio architecture v2
- Specialist service headers under `backend/src/services/legacy/`

---

**AFRERA** — one product, one farmer, one auditable plan across platform modules.
