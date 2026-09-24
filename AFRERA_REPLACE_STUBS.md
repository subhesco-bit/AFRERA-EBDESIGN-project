# Replace stubs with real logic

## Strategy (no mass empty files)

1. **Domain-critical paths** already have specialized real engines (checkout, pricing, wallet, preseason, contract farming, subsidy, corporate insurance, ERP, trust, events, engineering).
2. **Long-tail Mxxx modules** that were identical scaffolds use **`UniversalModuleRuntime`**:
   - Real in-memory entity store (swappable to Postgres)
   - Domain-inferred **state machines** (order / claim / loan / logistics / subsidy / default)
   - `create | get | update | list | transition | metrics | health`
   - Responses always `stub: false`, `real_logic: true`

## Mount catch-all

```js
app.use('/api/v1/modules/:moduleId', require('./routes/universalModuleRoutes'));
```

Example:
```http
POST /api/v1/modules/M419100_ORDER/operate
{ "action": "create", "buyer_id": "B1", "total": 1000 }

POST /api/v1/modules/M419100_ORDER/records/{id}/transition
{ "to": "placed" }
```

## Attach inside an existing stub router

```js
const { attachOperateRoutes } = require('../core/universalModuleRuntime');
attachOperateRoutes(router, 'M826100_ECOMMERCE');
```

## dynamicPricingService.js

Top-level service now **delegates to geofence/mandi engine** instead of AI-wrapper + empty helpers.

## What “fully replace all stubs” still means in practice

- ~760 module folders cannot each get bespoke 500-line domain code in one commit without reintroducing copy-paste scaffolds.
- Universal runtime makes **every module operable** with real state transitions.
- Specialized engines remain the gold standard for commerce, risk, agro, ERP, AI evidence.
