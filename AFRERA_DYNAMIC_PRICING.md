# Strategic Dynamic Pricing

**Layer:** Ecommerce only  
**Branch:** `consolidated/final`

## Deep layer stack

1. **Cost floor** — never below cost / min margin  
2. **Mandi search** — commodity modal prices by APMC hub; prefer hubs linked to active **geofence**  
3. **Ecommerce search** — on-platform + competitor reference band  
4. **Geofence adjust** — demand × logistics (+ cold premium)  
5. **Policy guards** — max markup, anti-gouge vs competitor median, mandi premium cap  

## Strategies

| Strategy | Behaviour |
|----------|-----------|
| `balanced` (default) | Blend mandi-derived retail + ecom median × geo |
| `match_comp` | Slightly under competitive median |
| `premium` | +8% after geo |
| `penetration` | −6% after geo |

## Geofences (built-in)

Delhi NCR · Mumbai · Bengaluru · Lucknow · Nagpur · Default India  
Haversine match within `radius_km`.

## API `/api/v1/dynamic-pricing`

```http
POST /price
{ "sku": "TOM-ORG-1KG", "lat": 28.6, "lng": 77.2, "strategy": "balanced" }

POST /basket
{ "lat": 19.08, "lng": 72.88, "lines": [{ "sku": "MILK-A2-1L", "qty": 2 }] }

POST /deep-search
{ "lat": 12.97, "lng": 77.59, "sku": "TOM-ORG-1KG", "commodity": "tomato" }

GET  /geofences
POST /ingest/mandi   { "commodity": "tomato", "mandi": "Azadpur", "modal": 25, ... }
POST /ingest/ecommerce { "sku": "TOM-ORG-1KG", "channel": "bigbasket_proxy", "price": 50 }
```

## Live feeds (next)

- AGMARKNET / state mandi APIs → `ingestMandiFeed`  
- Scheduled competitor fetch → `ingestEcomFeed`  
- Wire `priceBasket` into `checkoutOrchestrator` quote step  

Seed data is explicitly marked; confidence drops when only one layer is present.
