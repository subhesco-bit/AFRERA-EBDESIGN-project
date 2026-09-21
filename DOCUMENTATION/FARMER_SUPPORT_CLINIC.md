# Farmer Support Clinic — AI doctors & scientists

**Branch:** `consolidated/final`  
**Purpose:** One place for farmers to get **triage support** across plants, soil, livestock, poultry, fish, and design engineers.

---

## Specialists

| Specialist | Covers |
|------------|--------|
| Plant Doctor | Crops, leaves, trees, orchards |
| Soil Scientist | Soil appearance, drainage, crusts |
| Livestock Vet Advisor | Cow, buffalo, goat, sheep, pig, horse |
| Poultry Health Advisor | Chicken, duck flocks |
| Fish / Aquaculture Advisor | Pond, biofloc, RAS |
| Design Engineer | Handoff to AI Engineering Design Team |

---

## Honesty rules

1. **Not a diagnosis or prescription** — educational triage only.
2. **No drug/pesticide brand doses** from AI.
3. **Photos:** farmer describes what they see (leaf spots, soil colour, animal lesions). No fake CNN accuracy scores without a real vision model.
4. **Red flags** → seek licensed vet / agriculture officer immediately.
5. **Design** questions go to `/ai-engineering-design`.

---

## API

```
GET  /api/v1/farmer-support-clinic/capabilities
POST /api/v1/farmer-support-clinic/triage   { "species": "cow" }
POST /api/v1/farmer-support-clinic/consult  { "species", "symptoms", "photoDescription?", "state?", "notes?" }
```

Species keys: `cow`, `buffalo`, `goat`, `sheep`, `pig`, `horse`, `poultry`, `fish`, `plant`, `tree`, `soil`, `design`.

---

## UI

- `/farmer-support-clinic` — main clinic page
- Related: `/animal-health`, `/poultry-management`, `/soil-management`, `/crop-monitoring`, `/ai-engineering-design`

---

## Route registration

See `DOCUMENTATION/FARMER_CLINIC_ROUTE_REGISTRATION.md`.
