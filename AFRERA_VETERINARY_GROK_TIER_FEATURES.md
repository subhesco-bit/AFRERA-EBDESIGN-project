# AFRERA Veterinary — Grok-Tier Feature Catalogue

**Branch**: `consolidated/final`  
**Engine**: `VeterinarySpecialistPanel` (`engine_tier: grok-highest`)  
**Species**: cow · pig · goat · poultry  

This layer is intentionally **richer than a typical farm-app vet module**: multi-seat reasoning, herd epidemiology, vitals physiology, vaccination gap analysis, food-safety withdrawal discipline, ethnoveterinary evidence grades, and One Health flags.

---

## Feature matrix

| Feature | Status | Notes |
|---------|--------|--------|
| Multi-specialist panel (9 seats) | ✅ | Species lead, IM/ID, repro, nutrition, surgery, pathology, epi, pharmacology, ethnovet |
| Structured CaseConferenceReport | ✅ | Differentials, urgency, isolation, notifiable, treatments, provenance |
| Vital signs interpretation | ✅ | Temp / HR / RR / BCS / appetite vs species norms |
| Production-stage modifiers | ✅ | Fresh, lactating, pregnant, neonatal priors |
| Herd risk score (0–100) | ✅ | Mortality, attack rate, introductions, notifiable, vax gap |
| Vaccination calendar gap analysis | ✅ | India-oriented anchors; label/authority override required |
| Evidence-graded ethnovet | ✅ | traditional_only → moderate; never replaces notifiable path |
| Withdrawal fail-closed | ✅ | Unknown drug/matrix → requires_vet_consultation |
| Notifiable disease gate | ✅ | Forces regulatory option + One Health note |
| Herd / multi-animal screen | ✅ | `runHerdScreen` batch API |
| HTTP routes | ✅ | `/panel/conference`, `/herd-screen`, `/vitals`, `/diseases`, `/ethnovet` |
| M127 integration | ✅ | `runSpecialistPanel`, `createWithPanel` |
| Disclaimer on every clinical payload | ✅ | `VETERINARY_CLINICAL_DISCLAIMER` |
| Species packs (norms, focus) | ✅ | cow, pig, goat, poultry |
| Disease knowledge seeds | ✅ | Expandable JSON packs |
| Lab/LIS deep integration | ⏳ | Extend laboratoryERPService next |
| Imaging AI | ⏳ | Hook vision pipeline next |
| Outcome calibration | ⏳ | Register with outcomeResolver next |
| Label-complete withdrawal DB | ⏳ | Seeds refuse invention until curated |

---

## API surface

```
GET  /api/veterinary/health
GET  /api/veterinary/species
GET  /api/veterinary/diseases/:species
GET  /api/veterinary/ethnovet/:species
POST /api/veterinary/panel/conference
POST /api/veterinary/panel/herd-screen
POST /api/veterinary/panel/vitals
POST /api/veterinary/panel/vaccination-gaps
```

Mount: `app.use('/api/veterinary', require('./modules/veterinary').createVeterinaryRouter());`

---

## Example conference body

```json
{
  "species": "cow",
  "signalment": {
    "age_days": 1500,
    "sex": "female",
    "breed": "Sahiwal",
    "weight_kg": 380,
    "production_stage": "lactating"
  },
  "history": {
    "onset": "acute",
    "duration_days": 2,
    "herd_size": 40,
    "affected_count": 6,
    "mortality_count": 1,
    "recent_introductions": true,
    "vaccination_status": "partial",
    "weather_notes": "humid monsoon"
  },
  "clinical": {
    "symptoms": ["fever", "salivation", "lameness", "drop in milk"],
    "body_temperature_c": 40.4,
    "heart_rate_bpm": 96,
    "respiratory_rate_bpm": 42,
    "appetite": "reduced",
    "body_condition_score": 2.5
  },
  "location": { "state": "Uttar Pradesh", "district": "" },
  "owner_observations": "mouth froth, not eating concentrate"
}
```

---

## Safety doctrine (non-negotiable)

1. Decision support ≠ diagnosis or prescription.  
2. Notifiable suspects escalate first.  
3. No invented withdrawal periods.  
4. Evidence grade visible on every complementary remedy.  
5. Licensed veterinarian remains final authority.

---

*Catalogue version 2026.09 — aligned with engine_tier grok-highest*
