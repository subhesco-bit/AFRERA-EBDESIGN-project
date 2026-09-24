# Village Contract Labour — UrbanClap for Farming

**Model:** Urban Company / UrbanClap-style booking for **farm & rural labour**  
**Layer:** Farmer

## UX flow (same shape as UrbanClap)

```
Categories → Service → Package → Slot → Book
    → Provider assigned → En route → Started → Completed → Rate
```

## Categories

| Category | Examples |
|----------|----------|
| Field operations | Ploughing, sowing, weeding, harvesting |
| Plant protection | Spraying |
| Irrigation | Drip setup/repair |
| Livestock | Dairy shift, vet aide |
| Post-harvest | Packing, cold-store helper |
| Machinery | Tractor + operator |

Each service has **fixed packages** (price + duration) like UrbanClap packs.

## Booking states

`cart → scheduled → assigned → en_route → started → completed → rated → closed`

## Integration

- **Village Freelancer** match engine for provider assignment  
- **Escrow** hold on schedule, release on complete  
- **Trust / ratings** on provider  
- **Events** for scheduled / assigned / completed  

## API

```text
/api/v1/village-contract-labour
/api/v1/afrera/village-contract-labour

GET  /catalog
GET  /catalog/:categoryId
GET  /slots?date=2026-09-25
POST /providers
POST /bookings/book-now     ← one-shot UrbanClap book
POST /bookings/:id/schedule|assign|en-route|start|complete|rate
```

## book-now example

```http
POST /bookings/book-now
{
  "package_id": "plough_1acre",
  "customer_id": "F1",
  "slot": "2026-09-25T06:00",
  "village": "Kheda",
  "lat": 22.5,
  "lng": 72.9,
  "auto_credit": true
}
```
