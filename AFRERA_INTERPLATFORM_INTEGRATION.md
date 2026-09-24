# Complete Interplatform Integration

**Single-domain OS** — all platforms bridged for cross-decision making.

## Decision layers

| Level | Role |
|-------|------|
| L0 | Platform health scores |
| L1 | Domain engines (checkout, subsidy, pricing, …) |
| L2 | **Bridges** (18 directed integrations) |
| L3 | **Scenarios** (sell_produce, checkout_settle, …) |
| L4 | ERP postings + AI evidence passport |

## Bridges (full catalog)

| ID | From → To |
|----|-----------|
| farmer_to_market_listing | Farmer → Market |
| farmer_to_market_inputs | Farmer → Market |
| market_to_logistics | Market → Logistics |
| market_to_wallet | Market → Wallet |
| market_to_erp | Market → ERP |
| market_to_insurance_transit | Market → Insurance |
| logistics_to_insurance | Logistics → Insurance |
| farmer_to_gov_subsidy | Farmer → Gov |
| preseason_full_chain | Market ↔ Farmer (+ wallet/ERP) |
| pricing_geo | Market internal |
| order_to_trust | Market → Trust/AI |
| wrap_evidence | AI |
| erp_period_guard | ERP |
| premium_to_erp | Insurance → ERP |
| health_to_farmer | Health → Farmer |
| gov_to_finance | Gov → Finance |
| freight_to_erp | Logistics → ERP |

## Scenarios (`POST /decide`)

- `sell_produce` — list + geo price + optional logistics + transit cover  
- `buy_inputs` — input plan ↔ commerce quote  
- `preseason_book` — price → wallet → contract → ERP  
- `checkout_settle` — checkout → wallet → ERP → trust  
- `farmer_support_pack` — subsidy rank → finance note → advisory  
- `analyze_os` — full deep analysis  

## API

```text
GET  /api/v1/interplatform/analyze
GET  /api/v1/interplatform/platforms
GET  /api/v1/interplatform/bridges
POST /api/v1/interplatform/bridges/:bridgeId
POST /api/v1/interplatform/decide
POST /api/v1/interplatform/operate
```

```js
app.use('/api/v1/interplatform', require('./routes/interplatformRoutes'));
```

## Rule
Farmer ids and commerce ids are **never collapsed**; bridges always return dual references where both sides exist.
