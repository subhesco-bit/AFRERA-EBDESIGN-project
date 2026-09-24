# Agro Farming Systems + Vision AI

**Branch**: `consolidated/final`

## Systems (parity depth with vet modules)

| System | Use |
|--------|-----|
| `home_garden` | Kitchen / backyard |
| `roof_garden` | Terrace — load, waterproof, wind, heat |
| `greenhouse` | Polyhouse targets, RH/fungal risk |
| `climate_controlled` | Pad-fan/HVAC loops, sensors, fertigation |
| `open_farming` | Field kharif/rabi, rainfed/irrigated |

## Vision / APK picture path

`POST /api/v1/agro-farming/vision/analyze`

Accepts:
- `cv_tags[]` from on-device CV
- `description` free text
- `model_predictions[{label,score}]` from cloud/TF model
- `image_meta`

Ontology: yellowing, spots, powdery, wilt, chew holes, honeydew, mosaic, BER, damping-off, purple leaves…

## Full intelligence

`POST /api/v1/agro-farming/intelligence` — seasonal knowledge + farming system + vision + decision actions.

## Other

```http
GET  /api/v1/agro-farming/systems
POST /api/v1/agro-farming/systems/conference
POST /api/v1/agro-farming/climate/advise
POST /api/v1/agro-farming/knowledge/conference
```

Structural roof safety and pesticide labels remain user/extension responsibility.
