# AFRERA Research-Grade Implementation

**Branch:** `consolidated/final`  
**Date:** 2026-09-24  
**Principle (from PLATFORM_BASELINE_TODO):** Do not scaffold. Real logic, evidence, live endpoints. Nothing removed — only added.

---

## Delivered engines

| Engine | Path | What is real |
|--------|------|----------------|
| **Subsidy eligibility** | `services/research-grade/subsidyEligibilityEngine.js` | Effective-dated schemes, computable rules, quantum, missing docs, protected-attribute ban |
| **Ecommerce O2C** | `ecommerceO2CStateMachine.js` | Full state graph, illegal transition errors, compensation map, advance-to-target |
| **Logistics decision** | `logisticsDecisionEngine.js` | Mode choice by weight/SLA/cost/CO₂/cold-chain |
| **MEP engineering** | `mepEngineeringEngine.js` | HVAC W/m², electrical demand, fixture units — advisory + basis |
| **AI Backbone gateway** | `aiBackboneEvidenceGateway.js` | Routes to engines + **evidence records** (provenance, policy version, confidence, action boundary) |
| **ERP double-entry spine** | `erpDoubleEntrySpine.js` | COA, balanced JE enforcement, sale+COGS post, trial balance |

## API (`/api/v1/research-grade`)

```
GET  /health
GET  /capabilities
POST /ai/:capability
POST /subsidy/extract
GET  /subsidy/schemes
POST /logistics/decide
POST /mep/package
POST /ecommerce/o2c/transition
POST /ecommerce/o2c/advance
GET  /erp/coa
POST /erp/journal
POST /erp/sale
GET  /erp/trial-balance
```

**Mount:** `app.use('/api/v1/research-grade', require('./routes/researchGradeRoutes'))`

## AI Backbone parallel architecture

```
Enterprise domains (ENTERPRISE_10X)
        ↕
AI Backbone Evidence Gateway  ← policy_version, evidence_id
        ↕
Real engines: subsidy | logistics | MEP | O2C | (existing engineering structural/solar)
```

Every decision returns `evidence` — not a bare LLM string.

## Maps to baseline TODO

| TODO theme | This delivery |
|------------|----------------|
| P1-6 State-driven workflows | Ecommerce O2C full graph |
| P1-7 ERP accounting spine | COA + double-entry + trial balance |
| P2-10 India-first schemes | Subsidy computable rules |
| P3-13 AI governance evidence | Gateway evidence records |
| Engineering / MEP | MEP package + existing structural/solar |
| Logistics platform | Mode decision engine |

## Still honest gaps

- Live DB persistence for JE/O2C (in-memory spine for logic verification)
- Live carrier rates, GSTN, DBT rails
- CFD / full IS 456 / certified design stamps
- Full Jest suite for these engines (add next)

## Example subsidy extract

```json
POST /api/v1/research-grade/subsidy/extract
{
  "farmer": {
    "id": "F1",
    "landholder": true,
    "income_tax_payer": false,
    "area_ha": 1.2,
    "category": "marginal",
    "documents": ["land_record", "aadhaar_seeded_bank"],
    "organic_intent": true
  }
}
```
