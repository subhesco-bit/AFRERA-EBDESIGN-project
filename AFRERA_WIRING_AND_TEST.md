# Interlinked wiring + testing

## Canonical mounts

In `backend/src/index.js` after Express app creation (near other explicit mounts):

```js
const afreraMounts = require('./routes/afreraCanonicalMounts');
afreraMounts.mount(app);
app.use('/api/v1/afrera', require('./routes/afreraRoutes'));
```

## Unified surface (always prefer)

| Path | Purpose |
|------|---------|
| `/api/v1/afrera/health` | OS health |
| `/api/v1/afrera/interplatform/*` | Bridges + decide + analyze |
| `/api/v1/afrera/grade10/*` | Industry 10x engines |
| `/api/v1/afrera/features/*` | Activated hidden features |
| `/api/v1/afrera/baseline/*` | Trust, events, ERP, AI gov |
| `/api/v1/afrera/dynamic-pricing/*` | Geofence pricing |
| `/api/v1/afrera/modules/:moduleId/*` | Universal runtime |
| `/api/v1/afrera/research-grade/*` | Subsidy, logistics, ERP, MEP, AI |
| `/api/v1/afrera/ecommerce/*` | Checkout + RMA |
| `/api/v1/afrera/layers/*` | Farmer ≠ market boundary |
| `/api/v1/afrera/wiring-test/run` | **Full self-test suite** |
| `/api/v1/afrera/wallet/operate` | Wallet |
| `/api/v1/afrera/preseason/operate` | Preseason |
| `/api/v1/afrera/contract-farming/operate` | CF |

## Run self-test without HTTP

```bash
cd backend && node src/__tests__/afreraWiringSelfTest.js
```

Exercises: pricing, checkout, wallet, GST/escrow, grade10, fabric analyze + bridge, subsidy, logistics, ERP balanced journal, universal FSM.

## Live test

```http
GET /api/v1/afrera/wiring-test/run
```

Expect `pass_rate` high and `failed: 0` when engines load.

## Interlink map

```
Farmer ──bridge──► Market ──► Logistics ──► Insurance
  │                  │            │
  ▼                  ▼            ▼
 Gov/Subsidy      Wallet/ERP    Custody/Cold
  │                  │
  └── AI evidence ◄──┘
```
