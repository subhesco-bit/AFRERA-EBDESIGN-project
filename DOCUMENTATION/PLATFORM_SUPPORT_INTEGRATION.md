# Platform Support Integration — highest level

**Branch:** `consolidated/final`

This document is the integration contract between the four support pillars.

---

## Pillars (do not collapse into one generic chatbot)

| Pillar | Responsibility | API | UI |
|--------|----------------|-----|-----|
| **Farmer Support Clinic** | Plant, soil, livestock, poultry, fish triage + vision + multi-turn | `/api/v1/farmer-support-clinic` | `/farmer-support-clinic` |
| **AI Engineering Design Team** | Structural, MEP, agri, cost, compliance design packages | `/api/v1/ai-engineering-team` | `/ai-engineering-design` |
| **MEP Design Studio** | M/E/P capacity hints | `/api/v1/mep-design` | `/mep-design` |
| **Value-Chain Studio** | Lifecycle plan, pricing, cold-chain, funding, compliance | `/api/v1/value-chain-studio` | `/value-chain-studio` |
| **Orchestrator** | Intent routing + cross-module context | `/api/v1/platform-support` | `/platform-support` |

---

## Integration flows

```
Farmer query
    │
    ▼
Platform Support Orchestrator  (POST /desk or /execute)
    │
    ├─ plant/animal/soil keywords ──► Farmer Support Clinic (+ deep packs)
    │                                      └─► Animal Health records (read)
    ├─ cold storage / polyhouse ────► AI Engineering Team (+ MEP)
    │                                      └─► Engineering Projects BOQ
    └─ price / subsidy / insurance ─► Value-Chain Studio (needs productId)
```

---

## Cross-links (bidirectional)

- Value-Chain handoffs include **AI Engineering Design** and **MEP** and should also surface **Farmer Support Clinic**.
- Clinic specialist links include Animal Health, Poultry, Soil, Crop monitoring, Engineering.
- Engineering specialist links include Value-Chain, Cold Storage, Compliance, MEP.

---

## Orchestrator API

```http
GET  /api/v1/platform-support/capabilities
POST /api/v1/platform-support/desk     { query?, productId?, farmerId? }
POST /api/v1/platform-support/execute  { query?, species?, symptoms?, facilityType?, ... }
```

---

## Env for vision (clinic)

```
OPENAI_ENABLED=true
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-4o
```

---

## Quality bar

- No generic “AI can do everything” claims
- Clinic ≠ Engineering (health vs design)
- Every calculable field stays deterministic where applicable
- AI is advisory; licensed professionals decide treatment and signed designs
