# AFRERA Agro — Full India crop / soil / disease / organic / microbiome

## Catalogue
- Cereals, pulses, oilseeds, vegetables (fruiting + leafy), fruits, herbs/spices, commercial, fodder
- Extensible JSON: `india_crops_catalogue.json`

## Disease cards
Organic **and** inorganic management paths (label law). Extensible: `crop_diseases_india.json`

## Soil & microbiome
Alluvial, black vertisol, red/laterite, desert sandy, mountain  
Inoculants: Rhizobium, Azotobacter, PSB, AMF, Trichoderma, Pseudomonas  
Modes: **organic | inorganic | integrated**

## APK feature parity
`GET /api/v1/agro-farming/apk-features` — matrix vs typical India farm apps

## APIs
```http
GET  /api/v1/agro-farming/crops
GET  /api/v1/agro-farming/crops/search?q=tomato
GET  /api/v1/agro-farming/crops/tomato/diseases
POST /api/v1/agro-farming/crops/analyze
POST /api/v1/agro-farming/soil/analyze
POST /api/v1/agro-farming/intelligence
POST /api/v1/agro-farming/vision/analyze
```

Not every landrace or every pesticide brand — structure supports continuous JSON growth without missing *system* layers.
