# Diet Culture (Medical Branch) + Agro Knowledge

**Branch**: `consolidated/final`  
**Commits**: nutrition culture + agro engine on Grok-tier benchmark

---

## A. Nutrition medical branch — culture layer

### Regional India superfoods
Moringa, amla, millets (ragi/jowar/bajra), alsi, til, jackfruit, banana stem, methi, karela, greens, curd, measured ghee, coconut, small fish, NE ferments, horse gram, makhana, sattu, jamun, bael — with nutrient tags and medical notes.

### Religious calendars (opt-in)
Hindu vrata/Navratri/Ekadashi · Jain · Sikh langar · Islamic Ramadan · Christian Lent · Buddhist vegetarian optional · Parsi patterns — each with nutrition tips + medical cautions (e.g. diabetes on vrat foods, Ramadan + physician protocol).

### Customary community foodways
**Ethics rule**: never infer caste. Optional self-described patterns only (vegetarian household, coastal fish–rice, arid millet–pulse, NE rice–ferment).

### GenZ diets
High-protein gym · urban vegan · intermittent fasting · cloud-kitchen default · Ayurveda-aesthetic · millet/climate plate — balance tips + risks.

### Medical diet branches
Diabetes · hypertension · lipids · thyroid · anemia · PCOS · geriatric · pediatric · **renal alert** · pregnancy/lactation.

### API additions (`/api/v1/rituraj-nutrition`)
```
GET  /superfoods?region=&q=
GET  /religious-calendars?tradition=
GET  /genz-patterns
GET  /medical-branches
POST /culture-seat
POST /conference   # now includes culture_faith_genz_medical seat
```

---

## B. Agro Knowledge module (separate)

**Path**: `backend/src/modules/agro/`  
**Routes**: `/api/v1/agro-knowledge`

| Seat | Role |
|------|------|
| Agronomist Chair | Kharif / Rabi / Zaid |
| Soil & Fertility | Test-first doctrine |
| Crop Calendar | Seasonal crop lists |
| Regional Systems | Rice–wheat, arid millet, Deccan cotton-soy, coastal, NE hills, southern millet |
| IPM + Traditional | Neem, rotation, FYM, mixed cropping, lunar folklore graded |
| Water & Irrigation | Scheduling over hardware-only |
| Market & Risk | Diversification |

```
GET  /api/v1/agro-knowledge/health
GET  /api/v1/agro-knowledge/season
GET  /api/v1/agro-knowledge/regions
GET  /api/v1/agro-knowledge/traditional
POST /api/v1/agro-knowledge/conference
```

Works **alongside** existing `agricultural-intelligence` predict routes — this module is the multi-seat **knowledge conference**, not a duplicate of ML stubs.

---

*Ethics: faith/community diets are voluntary context. Medical branches escalate to clinicians. Agro follows label law and soil science.*
