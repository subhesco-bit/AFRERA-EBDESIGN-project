# Hidden / Untouched Features — Activated

Many services existed as thin wrappers or unmounted logic. The **Feature Activation Hub** brings them online with real operate paths and ERP/trust/event hooks.

## Activated (14)

| Feature | Endpoint feature id | Real behaviour |
|---------|---------------------|----------------|
| Escrow | `escrow` | Hold / release / refund + ERP journal on release |
| GST | `gst` | CGST/SGST/IGST estimate by HSN/rate |
| Offline sync | `offline_sync` | Queue + flush |
| Cold chain | `cold_chain` | Temp ingest + excursion alerts + events |
| Shelf life | `shelf_life` | Lot register + markdown signal (floor-safe) |
| Freight pool | `freight_pool` | Create pool / join / fill + cost share |
| RFQ | `rfq` | Create / bid / award lowest |
| GI + trace | `gi_trace` | Digital product passport issue/verify |
| Custody | `custody` | Append chain-of-custody + trust signal |
| Glut warning | `glut_warning` | Supply/demand ratio → actions |
| Equipment rental | `equipment_rental` | Fleet catalog + book |
| Seller rank | `seller_rank` | Trust + fulfillment + quality tier |
| Return load | `return_load` | Post / backhaul match |
| Bulk order | `bulk_order` | Volume discount via dynamic pricing |

## API

```text
GET  /api/v1/features
POST /api/v1/features/:feature
POST /api/v1/features/operate   { "feature": "escrow", "action": "hold", ... }
```

```js
app.use('/api/v1/features', require('./routes/featureActivationRoutes'));
```

## Integration

- Emits `businessEventBus` where relevant  
- Trust updates on custody  
- ERP journals on escrow release  
- Dynamic pricing used for bulk discounts  

Legacy thin files are **not deleted** (baseline rule); hub supersedes them for runtime.
