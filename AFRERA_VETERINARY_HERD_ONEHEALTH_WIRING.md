# Veterinary Herd Scoring · One Health · Wiring

**Branch**: `consolidated/final`  
**Date**: 2026-09-24

---

## 1. Herd risk algorithm (`HerdRiskScoring.js`)

Weighted composite **0–100** with transparent factors:

| Factor | Max weight | Trigger |
|--------|------------|--------|
| Mortality | 28 | deaths > 0 (scaled by count) |
| Multi-animal | 18 | affected > 1 |
| Attack rate | 16 | affected/herd_size tiers |
| Notifiable differential | 22 | notifiable × confidence |
| Recent introductions | 12 | flag |
| Vaccination gap | 10 | none / partial / unknown |
| Biosecurity weak | 10 | shared water, mixed species, open boundary, no quarantine |
| Environmental stress | 8 | heat/flood/monsoon context |
| Zoonotic tag | 12 | differential tags |
| Young-stock wave | 8 | calf/piglet/kid/chick multi-animal |

**Bands**: low 0–24 · moderate 25–44 · high 45–69 · critical 70–100

Version: `weighted_composite_herd_risk_v2`

---

## 2. One Health + international stages

| Stage ID | Label |
|----------|--------|
| STAGE_0_PEACE | Peace / free or undetected |
| STAGE_1_ALERT | Alert / early signal |
| STAGE_2_SUSPECT | Suspect outbreak |
| STAGE_3_CONFIRMED_LOCAL | Confirmed (lab / authority) |
| STAGE_4_SPREAD_CONTROL | Spread control / zoning |
| STAGE_5_RECOVERY | Recovery / freedom pathway |

Derived from herd risk + notifiable confidence + lab/authority flags.  
**Does not** auto-submit WOAH/WAHIS reports — competent authority only.

National path steps target **India state veterinary services / DAHD** frameworks.

---

## 3. Wired endpoints (DynamicRouteLoader)

| Mount (auto) | Role |
|--------------|------|
| `/api/v1/veterinary-specialist/*` | Full panel + herd + one-health |
| `/api/v1/animal-health-panel/*` | Bridge for animal-health UI |
| `/api/v1/animal-health/*` | Existing CRUD (exams, treatments, outbreaks, quarantine) |

### Key POSTs

```
POST /api/v1/veterinary-specialist/panel/conference
POST /api/v1/veterinary-specialist/herd/risk-score
POST /api/v1/veterinary-specialist/one-health/assess
POST /api/v1/animal-health-panel/conference
POST /api/v1/animal-health-panel/herd-risk
POST /api/v1/animal-health-panel/one-health
GET  /api/v1/veterinary-specialist/international-stages
GET  /api/v1/animal-health-panel/international-stages
```

Conference responses now include `one_health_surveillance` with international stage + national escalation path.

---

## 4. Module paths

- `backend/src/modules/veterinary/herd/HerdRiskScoring.js`
- `backend/src/modules/veterinary/onehealth/OneHealthSurveillance.js`
- `backend/src/routes/veterinarySpecialistRoutes.js`
- `backend/src/routes/animalHealthPanelRoutes.js`
- Panel: `backend/src/modules/veterinary/panel/VeterinarySpecialistPanel.js` (uses herd v2)

---

*Wiring complete via route auto-discovery under `backend/src/routes/`.*
