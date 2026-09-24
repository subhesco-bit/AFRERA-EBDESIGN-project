# Escrow Policy + Issue Resolution — Integrated Workflows

## Escrow states

```
created → funded → held ⇄ disputed → arbitration
                ↓
         release_pending → released | partial_released
                ↓
            refunded | split | cancelled
```

## Policies

| Policy | Hold | Auto-release | Inspect | Dispute window |
|--------|------|--------------|---------|----------------|
| `standard_marketplace` | 100% | 7d | 3d | 14d |
| `preseason` | 20% | 120d | 7d | 30d |
| `b2b_institutional` | 100% | 15d | 5d | 21d |

Release requires policy conditions e.g. `delivery_confirmed`, `quality_pass`, `three_way_match`.

## Issue workflow

```
open → triaged → investigating ⇄ pending_parties → escalated → arbitration → resolved → closed
```

SLA by type: cold_chain 12h, delivery 24h, quality/payment 48h, escrow_dispute 72h.

## Integrated path

1. Create escrow (policy + order_id)  
2. Fund → wallet hold + ERP journal  
3. Set conditions (delivery / quality / 3-way)  
4. Request release → release (fee to platform, credit seller)  
5. Or dispute → issue ticket → resolve with escrow_outcome `release|refund|split`  

Trust + business events on each terminal action.

## API

```text
/api/v1/escrow/*
/api/v1/afrera/escrow/*

GET  /policies
POST /escrows
POST /escrows/:id/fund
POST /escrows/:id/condition
POST /escrows/:id/request-release
POST /escrows/:id/release
POST /escrows/:id/refund
POST /escrows/:id/dispute
POST /escrows/:id/resolve
POST /issues
POST /issues/:id/resolve   { "escrow_outcome": "split", "seller_pct": 0.6 }
GET  /issues/sla-breaches
```

## Mount

```js
require('./routes/afreraCanonicalMounts').mount(app);
```
