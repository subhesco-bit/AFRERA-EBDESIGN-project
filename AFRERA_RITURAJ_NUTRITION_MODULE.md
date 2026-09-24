# Rituraj Doctor · Master Chef · Nutrition Module

**Branch**: `consolidated/final`  
**Benchmark**: Veterinary Specialist Panel (equal or higher)  
**Engine**: `backend/src/modules/nutrition/RiturajNutritionEngine.js`

---

## Design parity with Veterinary Grok-tier module

| Veterinary capability | Nutrition equivalent |
|----------------------|----------------------|
| 9-seat specialist panel | 7-seat: Rituraj chair, Clinical Nutritionist, Dietitian, Ritu/Ayurveda, Natural Therapy, Master Chef, Geo-Local |
| Herd risk score | BMI + clinical flags + calorie safety clamps |
| Species packs | Goal modes: lose / maintain / gain / pregnancy / lactation / athletic |
| Ethnovet evidence grades | Natural therapy evidence grades (strong → traditional_only) |
| Geo-fenced ancestral care | Geo-local Indian food systems + chef notes |
| One Health stages | Clinical flags (glycemic, renal, pregnancy, ED) |
| Disease knowledge packs | Ritu calendar + regional staples |
| Conference report | Full `runNutritionConference` payload |

---

## Features

1. **Nutrition calculator** — Mifflin–St Jeor BMR → TDEE → goal-adjusted calories → macros → illustrative micros  
2. **Ritu (seasonal)** — Shishira → Hemanta with preferred rasas, foods, agni notes  
3. **Natural therapy** — hydration, fibre, sleep timing, culinary spices, millets, mindful eating  
4. **Master Chef** — 3-meal plate method, regional staples, technique notes  
5. **Geo foods** — North wheat-dairy, South rice-coconut, East rice-fish, West millet, Northeast fermented  
6. **Clinical safety** — flags for diabetes, CKD, pregnancy, eating disorders; calorie floor 1200  

---

## API (`/api/v1/rituraj-nutrition`)

```http
GET  /health
GET  /ritus
GET  /natural-therapies
GET  /geo-regions
POST /calculate
POST /conference
POST /chef-plate
```

### Example conference body

```json
{
  "profile": {
    "sex": "female",
    "age_years": 34,
    "weight_kg": 62,
    "height_cm": 160,
    "activity_level": "moderate",
    "goal": "maintain",
    "conditions": [],
    "cuisine_pref": "home_indian"
  },
  "location": { "state": "Kerala" }
}
```

---

## Disclaimer

Educational decision-support only. Not medical advice, diagnosis, or prescription.

---

*Engine tier: grok-highest · benchmark: veterinary_specialist_panel_parity_or_higher*
