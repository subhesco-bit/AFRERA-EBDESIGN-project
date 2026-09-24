# AFRERA Veterinary Specialist Panel — PhD / Multi-Specialist Specification

**Document Version**: 2.0  
**Branch**: `consolidated/final`  
**Status**: Authoritative enhancement over AFRERA_VETERINARY_INTELLIGENCE_PLATFORM_SPECIFICATION.md  
**Scope**: Cow (dairy/beef), Pig, Goat, Poultry  
**Design intent**: Decision-support equivalent to a multi-disciplinary veterinary case conference with ~70 years of cumulative clinical heuristics + current evidence + India ethnoveterinary knowledge — **not a replacement for a licensed veterinarian**.

---

## 0. Non-negotiable safety rules

1. Every clinical output carries a **visible disclaimer** (see `backend/src/utils/disclaimers.js` → `VETERINARY_CLINICAL_DISCLAIMER`).
2. Notifiable / reportable diseases **always** escalate to licensed veterinarian + government reporting path first; complementary therapies are secondary.
3. **Withdrawal periods** (milk, meat, eggs) are safety-critical. Values are versioned, sourced, and never pure LLM generation without a cited authority row.
4. Every therapy / remedy carries `evidence_level`: `strong` | `moderate` | `limited` | `traditional_only` | `insufficient` and `requires_vet_consultation: boolean`.
5. Domain is registered as **SENSITIVE** in AI backbone (`veterinary`). High-impact actions (`diagnose`, `prescribe`) require human approval gates where configured.
6. Confidence scores and provenance are mandatory on differentials and recommendations.

---

## 1. Specialist Panel model ("virtual board")

When a case is submitted, the engine runs a **panel conference**:

| Seat | Role | Responsibility |
|------|------|----------------|
| Chair | Species Lead (Cow / Pig / Goat / Poultry) | Owns species norms, breed notes, production context |
| Seat 2 | Internal Medicine / Infectious Disease | Differentials, urgency, isolation, zoonoses |
| Seat 3 | Reproduction & Obstetrics | Estrus, pregnancy, dystocia, neonatal |
| Seat 4 | Nutrition & Metabolic | Ration, deficiency, ketosis/milk fever/acidosis, FCR |
| Seat 5 | Surgery / Lameness / Hoof-Foot | Trauma, lameness grades, surgical flags |
| Seat 6 | Pathology & Laboratory | Lab panel selection, interpretation ranges |
| Seat 7 | Epidemiology / Herd Health | Outbreak risk, culling, biosecurity |
| Seat 8 | Pharmacology & Food Safety | Drugs, interactions, **withdrawal periods** |
| Seat 9 | Ethnoveterinary & Complementary | Local customary practices with evidence labels |

**Output artefact**: `CaseConferenceReport` (structured JSON + human-readable summary).

---

## 2. Case intake schema

```json
{
  "species": "cow|pig|goat|poultry",
  "animal_id": "optional",
  "signalment": {
    "age_days": 0,
    "sex": "female|male|unknown",
    "breed": "string",
    "weight_kg": 0,
    "production_stage": "calf|growing|lactating|dry|pregnant|finisher|layer|broiler|breeder|..."
  },
  "history": {
    "onset": "acute|subacute|chronic",
    "duration_days": 0,
    "herd_size": 0,
    "affected_count": 0,
    "mortality_count": 0,
    "recent_introductions": false,
    "vaccination_status": "up_to_date|partial|unknown|none",
    "feed_changes": false,
    "weather_notes": "string"
  },
  "clinical": {
    "symptoms": ["string"],
    "body_temperature_c": null,
    "heart_rate_bpm": null,
    "respiratory_rate_bpm": null,
    "rumen_motility": null,
    "body_condition_score": null,
    "faeces": "normal|diarrhea|constipation|blood|mucus",
    "appetite": "normal|reduced|anorexic",
    "milk_yield_change_pct": null,
    "egg_production_change_pct": null
  },
  "lab": {},
  "images": [],
  "location": { "state": "", "district": "", "climate_zone": "" },
  "owner_observations": "string"
}
```

---

## 3. Case conference output schema

```json
{
  "case_id": "uuid",
  "species": "cow",
  "urgency": "emergency|urgent|soon|routine",
  "isolation_recommended": true,
  "notifiable_suspect": false,
  "differentials": [
    {
      "disease_id": "fmd",
      "name": "Foot-and-Mouth Disease",
      "confidence": 0.72,
      "supporting": ["vesicles", "salivation", "lameness"],
      "against": ["single animal only"],
      "specialist_notes": { "infectious": "...", "herd": "..." }
    }
  ],
  "recommended_diagnostics": [],
  "treatment_options": [
    {
      "modality": "allopathic|supportive|ethnoveterinary|nutritional",
      "name": "string",
      "evidence_level": "strong|moderate|limited|traditional_only|insufficient",
      "requires_vet_consultation": true,
      "withdrawal": { "milk_days": null, "meat_days": null, "eggs_days": null, "source": "string" },
      "notes": "string"
    }
  ],
  "preventive_actions": [],
  "herd_implications": "string",
  "local_customary_notes": [],
  "panel_summary": "Chair synthesis paragraph",
  "disclaimer": "VETERINARY_CLINICAL_DISCLAIMER",
  "provenance": { "knowledge_version": "2026.09", "rules_fired": [] },
  "confidence_overall": 0.0
}
```

---

## 4. Species disease intelligence (core lists)

### 4.1 Cow (Bos taurus / indicus — dairy & beef)

**Infectious / notifiable (India-relevant)**  
FMD · Haemorrhagic Septicaemia (HS) · Black Quarter (BQ) · Anthrax · Brucellosis · Tuberculosis · Theileriosis · Babesiosis · Anaplasmosis · Lumpy Skin Disease (LSD) · Rabies · Johne's disease · Mastitis complex (contagious + environmental) · Calf scours complex · Pneumonia complex

**Metabolic / production**  
Milk fever (hypocalcaemia) · Ketosis · Displaced abomasum · Ruminal acidosis · Bloat · Fatty liver · Hypomagnesaemia (grass tetany)

**Reproduction**  
Anestrus · Repeat breeding · Metritis / endometritis · Retained placenta · Dystocia · Prolapse

**Other**  
Lameness / hoof disease · Heat stress · Parasitism (ticks, GI nematodes, liver fluke)

### 4.2 Pig

**Infectious**  
African Swine Fever (ASF) · Classical Swine Fever (CSF) · PRRS-like respiratory/reproductive syndromes · Swine erysipelas · Pasteurellosis · Salmonellosis · Colibacillosis · Clostridial disease · Porcine circovirus-associated disease · Foot-and-mouth (susceptible) · Swine influenza

**Production / management**  
Poor FCR · MMA syndrome (mastitis-metritis-agalactia) · Neonatal diarrhoea · Iron deficiency anaemia · Heat stress · Tail biting / vice behaviours

**Reproduction**  
Farrowing complications · Stillbirths · Low litter size · Weaning-to-service interval issues

### 4.3 Goat

**Infectious**  
PPR (Peste des Petits Ruminants) · Contagious Caprine Pleuropneumonia (CCPP) · Goat pox · Enterotoxaemia · Tetanus · Brucellosis · Caseous lymphadenitis · Orf (contagious ecthyma) · Coccidiosis · Haemonchosis / GI parasites · Pneumonia complex

**Production**  
Pregnancy toxaemia · Kid mortality · Poor growth · Mastitis · Urolithiasis (males, especially)

### 4.4 Poultry (chicken focus; extendable to duck/turkey)

**Infectious**  
Newcastle Disease · Avian Influenza · Infectious Bursal Disease (IBD/Gumboro) · Marek's disease · Infectious Bronchitis · Chronic Respiratory Disease (CRD / Mycoplasma) · Coccidiosis · Fowl cholera · Fowl pox · Salmonellosis · Colibacillosis · Infectious Coryza

**Management**  
Heat stress · Ascites · Fatty liver haemorrhage syndrome · Cannibalism / pecking · Nutritional deficiencies (Ca, P, vitamins A/D/E, riboflavin)

---

## 5. Ethnoveterinary & local customary knowledge (India)

Presented **only** as complementary, each with evidence grade. Serious/infectious disease → escalate to vet first.

| Remedy | Typical traditional use | Species notes | Evidence posture |
|--------|------------------------|---------------|------------------|
| Neem (Azadirachta indica) | External parasites, wounds, general tonic | All; avoid excessive internal in high dose | traditional_only → limited for some external uses |
| Turmeric (Curcuma longa) | Wound care, anti-inflammatory folklore | All | limited–moderate for topical; not a substitute for antimicrobials |
| Tulsi (Ocimum sanctum) | Respiratory support folklore | Poultry, small ruminants | traditional_only |
| Garlic | Antiparasitic folklore, appetite | Caution: high dose toxicity risk in some species | limited; dose-critical |
| Aloe vera | Topical wounds/burns | External only primarily | limited topical |
| Ashwagandha | Stress / tonic folklore | Large ruminants | traditional_only |
| Giloy (Tinospora) | Fever folklore | Ruminants | traditional_only |
| Moringa | Nutrition supplement | All | moderate as feed supplement nutrient density |
| Fenugreek | Lactation folklore | Dairy | traditional_only–limited |
| Common salt / ORS-style electrolytes | Dehydration support | All | supportive care — moderate as supportive |
| Warm rice gruel / soft feed | Convalescent feeding | Ruminants, pigs | supportive |

**Mandatory UI rule**: evidence level shown next to every remedy, not in a footnote.

---

## 6. Normal clinical ranges (reference — species packs own authoritative tables)

| Parameter | Adult cow | Adult pig | Adult goat | Adult chicken |
|-----------|-----------|-----------|------------|---------------|
| Rectal temp °C | 38.0–39.3 | 38.5–40.0 | 38.5–40.5 | 40.5–42.0 |
| Heart rate /min | 40–80 | 60–100 | 70–90 | 250–300 |
| Resp rate /min | 10–30 | 10–30 | 12–30 | 15–30 |
| BCS scale | 1–5 (dairy often 1–5) | 1–5 | 1–5 | — |

Fever thresholds used by panel rules are species-pack constants (see knowledge JSON).

---

## 7. Vaccination & prevention calendars (high-level)

**Cow (illustrative India programmes — always confirm local state schedule)**  
FMD (as per national/state schedule) · HS · BQ · Brucella (policy-dependent) · Theileria where endemic · LSD where indicated · Deworming & tick control seasonal

**Pig**  
CSF (where permitted/available) · FMD · Erysipelas · Parvo/leptospira breeding stock · Iron for piglets · Deworming

**Goat**  
PPR · Enterotoxaemia · FMD · Goat pox (regional) · Deworming strategic

**Poultry**  
Marek's (hatchery) · ND + IBD programmes · Fowl pox · IB · Layer/breeder extended schedules · Coccidiosis control (vaccine or ionophores per system)

Exact schedules live in species pack JSON and must be versioned.

---

## 8. Withdrawal period discipline

Table `vet_withdrawal_periods` (or JSON seed) columns:

- `drug_id`, `species`, `product_matrix` (milk|meat|eggs|honey)
- `withdrawal_days`, `source`, `source_url_or_ref`, `version`, `country_scope`

Panel **must not invent** withdrawal days. If unknown → `requires_vet_consultation: true` and explicit "unknown — verify label/VFD".

---

## 9. Implementation map (this delivery)

| Artefact | Path |
|----------|------|
| This specification | `AFRERA_VETERINARY_SPECIALIST_PANEL_SPECIFICATION.md` |
| Disclaimers | `backend/src/utils/disclaimers.js` |
| Panel engine | `backend/src/modules/veterinary/panel/VeterinarySpecialistPanel.js` |
| Knowledge index | `backend/src/modules/veterinary/knowledge/index.js` |
| Disease + ethnovet seeds | `backend/src/modules/veterinary/knowledge/*.json` |
| Species packs | `backend/src/modules/veterinary/species/{cow,pig,goat,poultry}/index.js` |
| M127 service fix | `backend/src/modules/M127/service.js` |
| Schema extension | `backend/src/modules/M127/model_panel.sql` |
| Module entry | `backend/src/modules/veterinary/index.js` |

---

## 10. Definition of done for this enhancement

- [x] Multi-specialist panel produces structured CaseConferenceReport
- [x] Four species packs with disease heuristics and local customary notes
- [x] Evidence grades on complementary therapies
- [x] Withdrawal-aware treatment options (unknown → escalate)
- [x] M127 no longer bound to unrelated `sales_pipeline`
- [x] Disclaimer on every clinical response
- [ ] Live lab/LIS and imaging hooks (extend existing laboratoryERPService — next iteration)
- [ ] Outcome registration in `outcomeResolver` for panel confidence calibration (next iteration)

---

*End of specification v2.0*
