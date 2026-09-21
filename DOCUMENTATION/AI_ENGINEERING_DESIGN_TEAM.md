# AI Engineering Design Team

**Branch:** `consolidated/final`  
**Concept:** A **team of AI engineers** that works for you on agri-infrastructure design — coordinated packages, engineering coding (deterministic formulas), AI only for advisory briefs.

---

## 1. Team roster

| Role ID | Title | Delivers |
|---------|--------|----------|
| `lead_architect` | Lead Design Architect | Coordination sequence, open questions |
| `structural` | Structural Engineer | Load/system checklist, area hint from L×W |
| `mep` | MEP Engineer | M/E/P packages + capacity hints (via MEP layer) |
| `agricultural` | Agricultural Infrastructure Engineer | Process layout checklist |
| `cost_estimator` | Cost Estimator | BOQ categories → Engineering Projects rates |
| `compliance` | Compliance & Approvals Engineer | Permits / codes checklist |

---

## 2. Engineering coding rules

1. **Work packages are catalogs** — not invented drawings.
2. **Numbers only from user inputs + documented formulas** (or DB rates for cost).
3. **AI brief** is optional and advisory — never used as design load or approval.
4. **No FEA / CFD / BIM generation** until a real engine is integrated.

---

## 3. API

```
GET  /api/v1/ai-engineering-team/capabilities
POST /api/v1/ai-engineering-team/plan
POST /api/v1/ai-engineering-team/brief
```

### Plan body

```json
{
  "facilityType": "cold_storage",
  "projectId": "optional-uuid",
  "state": "Maharashtra",
  "structuralInputs": { "lengthM": 30, "widthM": 12 },
  "capacityInputs": {
    "volumeM3": 500,
    "deltaTempC": 20,
    "electricalLoadsKw": [15, 7.5],
    "diversityFactor": 0.9
  }
}
```

---

## 4. UI

- **AI Engineering Design Studio:** `/ai-engineering-design`
- **MEP specialist:** `/mep-design`
- **Projects + BOQ:** `/engineering-projects`

---

## 5. Files

| Path | Role |
|------|------|
| `backend/src/services/legacy/aiEngineeringTeamService.js` | Team orchestrator |
| `backend/src/routes/aiEngineeringTeamRoutes.js` | HTTP |
| `backend/src/services/legacy/mepDesignService.js` | MEP discipline |
| `frontend/src/pages/AIEngineeringDesignPage.jsx` | Team UI |
| `frontend/src/services/aiEngineeringTeamAPI.js` | Client |

---

**AFRERA AI Engineering Team** — specialists that scope, coordinate, and advise; licensed engineers verify.
