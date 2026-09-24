# Veterinary Module — Ancestral · Natural · Dietary · Geo-fenced Care

**Scope**: This module only (`backend/src/modules/veterinary/**`)  
**Branch**: `consolidated/final`

---

## What was added (beyond a general module)

### 1. Ancestral / customary medicine (lineage-tagged)
Practices carried as **ancestral farm and community knowledge**, not generic herb lists:

- Indo-Gangetic: neem, haldi, gur-ajwain, mustard oil winter care  
- Rajasthan arid: khejri fodder, alum topical, shade-water discipline  
- Western Ghats / Konkan: tulsi, coconut oil, rice gruel convalescent  
- Northeast hills: bamboo leaf fodder, pig swill **biosecurity caution**, herbal steam folklore  
- Deccan: local digestive herb folklore (ID caution), linseed mucilage  
- Tamil Nadu: Siddha-influenced external oils, buttermilk digestive folklore  
- Pan-India: moringa, giloy, ashwagandha, garlic (limited), electrolytes  

Every item has: `lineage`, `evidence_level`, `requires_vet_consultation`, `cautions`.

### 2. Natural care pillars
Rest/isolation · hydration · thermal comfort · wound hygiene · stress reduction — evidence-graded.

### 3. Dietary care (species-specific)
Cow transition/rumen rules · pig phase feed + swill ban in ASF zones · goat late-pregnancy energy · poultry heat & mould rules · convalescent soft-feed paths.

### 4. Geo-fencing (veterinary module only)
Match on `location.state` / `district` / optional `geofence_region_id`:

| Region ID | Example states |
|-----------|----------------|
| indo_gangetic_plain | UP, Bihar, Punjab, Haryana, WB… |
| rajasthan_arid | Rajasthan |
| western_ghats_konkan | Kerala, Karnataka, Goa, MH |
| northeast_hills | Assam, Meghalaya, Nagaland… |
| deccan_central | MP, TS, AP, CG, Odisha |
| tamil_sri_lanka_style_south | TN, PY |

No match → pan-India ancestral fallback still returned.

---

## API

```http
POST /api/v1/veterinary-specialist/panel/conference
# body includes location: { state, district, geofence_region_id? }
# response includes local_care, ancestral_therapies, natural_care, dietary_care

POST /api/v1/veterinary-specialist/local-care
POST /api/v1/animal-health-panel/local-care
GET  /api/v1/veterinary-specialist/local-care/regions
```

Example location:
```json
{
  "species": "cow",
  "location": { "state": "Rajasthan", "district": "Jodhpur" },
  "clinical": { "symptoms": ["heat", "panting"], "body_temperature_c": 40.0 },
  "history": { "weather_notes": "summer heat" }
}
```

---

## Safety (unchanged, non-negotiable)

- Ancestral ≠ prescription  
- `traditional_only` never leads notifiable disease response  
- Licensed veterinarian remains final authority  
- Geo knowledge is **advisory** cultural/clinical context, not legal instruction  

---

*Files: `geo_ethnovet_india.json`, `natural_dietary_care.json`, `geo/GeoFencedCare.js`*
