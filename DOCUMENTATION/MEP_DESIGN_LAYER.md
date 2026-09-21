# MEP Design Layer — AI Engineer support

**Branch:** `consolidated/final`  
**Scope:** Mechanical · Electrical · Plumbing design **support** for agricultural infrastructure  
**Principle:** Deterministic packages and formulas first; AI only for advisory briefs.

---

## 1. Role

The **AI MEP Engineer** layer helps farmers, FPOs, and EPC teams scope building services for:

- Cold storage, polyhouse/greenhouse, warehouse, dairy, food processing
- Grain storage, fisheries, solar, water infrastructure

It does **not** replace licensed engineers, FEA, CFD, or BIM authoring tools.

---

## 2. What is deterministic vs AI

| Capability | Type | Notes |
|------------|------|--------|
| Design package checklists by facility type | Deterministic catalog | Mechanical / Electrical / Plumbing lists |
| Rough TR / CMH / kW hints | Calculated | Only if user supplies inputs; formulas exposed |
| Design brief narrative | AI advisory | Explicit POST; never used as load numbers |
| Structural analysis, CFD, BIM generation | Out of scope | Same honesty bar as `engineeringProjectService` |

---

## 3. API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/mep-design/capabilities` | Facility types + rules |
| `POST` | `/api/v1/mep-design/plan` | Package + capacity hints + stages |
| `POST` | `/api/v1/mep-design/brief` | AI design brief |

### Plan body example

```json
{
  "facilityType": "cold_storage",
  "projectId": "optional-uuid",
  "capacityInputs": {
    "volumeM3": 500,
    "deltaTempC": 20,
    "airChangesPerHour": 2,
    "electricalLoadsKw": [15, 7.5, 2],
    "diversityFactor": 0.9
  }
}
```

Missing capacity inputs → field `null` + provenance `unavailable`.

---

## 4. Formulas (auditable)

- **Refrigeration (planning only):** `TR ≈ (volume_m3 × ΔT_C × 0.04) / 3.517`
- **Ventilation:** `CMH = volume_m3 × ACH`
- **Electrical:** `Demand_kW = sum(loads) × diversity`

These are **not** code-compliant heat-load or short-circuit studies.

---

## 5. Integration

- Engineering projects: optional `projectId` ownership check via `engineering_projects`
- Value-Chain Studio / Cold Storage / Energy pages: specialist links in plan response
- Frontend: `/mep-design` studio page

---

## 6. Files

| Path | Role |
|------|------|
| `backend/src/services/legacy/mepDesignService.js` | Orchestrator |
| `backend/src/routes/mepDesignRoutes.js` | HTTP |
| `frontend/src/pages/MEPDesignStudioPage.jsx` | UI |
| `frontend/src/services/mepDesignAPI.js` | Client |
| `DOCUMENTATION/MEP_DESIGN_LAYER.md` | This doc |

---

**AFRERA MEP Design Layer** — scope support for M/E/P, numbers only when you provide inputs, AI only for the brief.
