# Intelligence surface — pages integration

**Base:** `/api/v1/intelligence` · `/api/v1/afrera/intelligence`

## 1. Nutrient calculator (nutrition page)
`POST /nutrient/calculate` `{ "foods": [{ "name": "dal", "grams": 150 }] }`

## 2. Dietitian advise
`POST /dietitian/advise` `{ "profile": { "weight_kg": 70, "height_cm": 165, "age": 40 }, "goals": { "mode": "maintain", "activity": "light" } }`  
Includes **cartoon storyboard** for plate guidance.

## 3. Veterinary panel (RTC-style)
`POST /veterinary/panel` `{ "case": { "species": "cattle", "symptoms": ["reduced appetite"], "severity": "moderate", "prescription": { "drug": "...", "dose": "..." } } }`  
If prescription present → **vet cartoon** (what/how/why/withdrawal/alert).

## 4. Prescription cartoon (nutrition or vet)
`POST /prescription/cartoon` `{ "domain": "veterinary", "prescription": { ... } }`  
Returns scenes + **image_prompts** for Grok Imagine / video slideshow.

## 5. Product add → AI enrich + image
`POST /product/enrich` `{ "name": "Organic Tomato 1kg" }`  
Auto description, nutrients, HSN hint, tags + **catalog image prompt**.

## 6. Farmer training cartoons
`GET /training/modules`  
`POST /training/cartoon` `{ "module_id": "soil_testing" }`  
Modules: soil_testing, safe_pesticide, calf_care, market_link.

## 7. Weather forecast + alerts
`POST /weather/alerts` `{ "location": { "district": "Anand", "base_temp_c": 34 }, "farm": { "crop": "cotton" } }`  
Alerts: heavy_rain, high_wind, heat_stress, spray_window + operations avoid list.

## Honesty
- Cartoons = storyboards + prompts (render via image API)
- Product web search = seed knowledge until live feed job
- Weather = heuristic until IMD/Open-Meteo job
- Clinical: licensed dietitian/vet authority floor always set
