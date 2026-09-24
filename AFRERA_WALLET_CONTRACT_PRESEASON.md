# Wallet · Contract Farming · Preseason Purchase

**ERP + AI integrated** on `consolidated/final`

## Flow

```
Preseason sales analysis (YoY booked + fill rate)
        ↓ price_bias
Dynamic pricing (mandi + ecom + geofence) × bias × early-bird
        ↓
Preseason order (PSO)
        ↓ deposit %
Wallet HOLD → on confirm CAPTURE
        ↓ optional
Contract farming agreement (farmer layer) active
        ↓
ERP journal: DR Cash / CR Advances (deposit)
        ↓
AI evidence passport on order
```

## APIs

### Wallet `/api/v1/wallet`
- `POST /credit` `{ owner_id, amount }`
- `GET /:ownerId`
- `POST /operate` actions: credit, hold, capture, release_hold, refund, snapshot, history

### Contract farming `/api/v1/contract-farming` (Farmer layer)
- `POST /` create agreement
- `POST /:id/transition` `{ to }`
- States: draft → offered → accepted → active → delivery_pending → delivered → settled

### Preseason `/api/v1/preseason` (Ecommerce layer)
- `POST /analyze` `{ commodity, season }`
- `POST /price` `{ sku, lat, lng, season, months_ahead }`
- `POST /orders` create priced PSO
- `POST /orders/:id/hold` wallet deposit hold
- `POST /orders/:id/confirm` `{ create_contract?: true, farmer_id }`

## Mount

```js
require('./routes/walletContractPreseasonRoutes').mount(app);
```

## Honesty
- Wallet is platform ledger, not regulated PPI/bank
- Sales history is seed until analytics warehouse feeds `SALES_HISTORY`
- ERP uses research-grade double-entry spine (in-memory until Postgres)
