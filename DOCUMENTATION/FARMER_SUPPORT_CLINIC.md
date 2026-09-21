# Farmer Support Clinic — AI doctors & scientists

**Branch:** `consolidated/final` · **Plan version:** 1.1  
**Separate from:** AI Engineering Design Team (`/ai-engineering-design`) — engineers design infrastructure; this clinic supports plant/animal/soil health.

---

## Specialists

| Specialist | Covers |
|------------|--------|
| Plant Doctor | Crops, leaves, trees |
| Soil Scientist | Soil appearance |
| Livestock Vet Advisor | Cow, buffalo, goat, sheep, pig, horse |
| Poultry Health Advisor | Chicken, duck |
| Fish Advisor | Pond / RAS |
| Design Engineer | Handoff only → engineering layer |

---

## Upgrades (v1.1)

### 1. Deep species packs

| Pack ID | Species | Focus |
|---------|---------|--------|
| `dairy_mastitis` | cow, buffalo | Udder / milk triage |
| `livestock_fmd_suspect` | cow, buffalo, goat, sheep, pig | Observation + notify officer |
| `poultry_nd_suspect` | poultry | High mortality / ND-like signs |
| `fish_do_stress` | fish | DO / surface gasping |
| `leaf_blight_suspect` | plant, tree | Leaf spot / blight observation |

### 2. Multi-turn chat

- Pass `sessionId` on consult; server returns same id + `history[]`.
- In-memory sessions (TTL ~2h). Scale later with Redis.

### 3. Leaf / animal image vision hook

```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=sk-...
# optional:
OPENAI_VISION_MODEL=gpt-4o
```

`POST /consult` with `imageUrl` → vision describes features only (not a disease certificate).

---

## API

```
GET  /api/v1/farmer-support-clinic/capabilities
POST /api/v1/farmer-support-clinic/triage    { species, packId? }
POST /api/v1/farmer-support-clinic/consult   { species, symptoms?, photoDescription?, imageUrl?, packId?, sessionId?, state?, notes? }
GET  /api/v1/farmer-support-clinic/session/:sessionId
POST /api/v1/farmer-support-clinic/vision    { imageUrl, species?, context? }
```

---

## UI

`/farmer-support-clinic` — register via `DOCUMENTATION/FARMER_CLINIC_ROUTE_REGISTRATION.md`.

---

## Honesty

- Not a diagnosis or prescription
- No drug/pesticide doses from AI
- Vision = description, not lab confirmation
- Red flags → licensed professional
