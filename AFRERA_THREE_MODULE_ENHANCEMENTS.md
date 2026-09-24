# Three-Module Enhancements Only (Vet · Nutrition · Agro)

Each module now has a full enhanced operate path:

| Module | Endpoint |
|--------|----------|
| Veterinary | `POST /api/v1/veterinary-enhanced/enhanced` |
| Nutrition | `POST /api/v1/nutrition-enhanced/enhanced` |
| Agro | `POST /api/v1/agro-farming/enhanced` |

## Per-module payload includes

1. **Core analysis** (panel / conference / multi-AI)
2. **Workflow FSM** history
3. **Decision quality** — fused confidence, escalation band, grade A–D
4. **Inter-module events** (notifiable→legal, zoonotic→nutrition, clinical→pharmacy, crop disease, organic cert)
5. **Interaction** — viz_spec charts + audio TTS (EN/HI) + human cards
6. **Analysis summary** — module-specific metrics

## Algorithms
- Confidence fusion + disagreement
- Escalation scoring
- Package evaluation grade

## Communication
- Vet notifiable → PCICDA bus event
- Zoonotic → human/nutrition awareness event
- Nutrition major drug–food → pharmacy event
- Agro high disease → outbreak event

Safety floors unchanged: licensed vet / clinician / dietitian / CB / extension.
