# Geofenced multi-source weather → crop decision

## Question answered
**What to grow, why, when, and what to avoid** — for a farm point (lat/lng), using blended weather sources and agro-climatic geofence.

## Pipeline

```
lat/lng → agro geofence zone (soil + typical rain)
                +
 multi-source weather blend (internal · IMD · Open-Meteo)
                ↓
 crop climate envelopes scored → ranked list
                ↓
 what_to_grow / why / risks / operations / market_hint
```

## Sources (weights normalized)

| Source | Role |
|--------|------|
| Internal forecast | Always on |
| IMD feed | Pass `imd_days` when live |
| Open-Meteo | Pass `open_meteo_days` when live |

Without live feeds, proxies are used and confidence is lower.

## API

```text
POST /api/v1/crop-decision/decide
POST /api/v1/afrera/crop-decision/decide

{
  "lat": 21.15,
  "lng": 79.09,
  "season": "kharif",   // optional — auto from month
  "district": "Nagpur",
  "base_temp_c": 33
}
```

Response includes: `geofence`, `weather.multi_source`, `what_to_grow[]` (score, why, risks), `avoid[]`, `operations`, `confidence`.

## Crops covered
Wheat, rice, cotton, soybean, maize, chickpea, mustard, groundnut, sugarcane, bajra, tomato.
