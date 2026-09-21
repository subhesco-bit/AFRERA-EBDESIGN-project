# Multi-party trade escrow

**API:** `/api/v1/trade-escrow`  
**Service:** `multiPartyEscrowService.js`  
**Migration:** `20260921_multi_party_escrow.sql`

This module holds **buyer/payer funds under rules**. It is not FPO member payout and not warehouse title.

---

## Escrow types (client requirement matrix)

| Type | Parties | Typical use |
|------|---------|-------------|
| `buyer_seller` | payer → payee | Marketplace order |
| `farmer_farmer` | farmer ↔ farmer | Peer produce trade |
| `client_client` | business ↔ business | B2B / processor deal |
| `fpo_mediated` | buyer → FPO | Collective sale; FPO then pays members |
| `bank_recovery` | buyer → seller + **lender first** | Loan recovery from sale |
| `bank_bank` | bank_from → bank_to | Inter-bank / nodal instruction |

---

## Lifecycle

```
create (awaiting_funds)
  → fund(paymentReference) → funded
  → setCondition(delivery, grade, …)
  → [freeze on dispute / unfreeze]
  → release → pending release lines
  → markReleasePaid(paymentRef) per line
```

Or `refund(reason)` back toward payer.

---

## Waterfall on release

1. **Lender** up to `lenderClaimCap` (if set)
2. **Platform fee** (flat or %)
3. **Residual:** payee | FPO | counterparty bank (by type)

Amounts are computed only from **funded_amount** — never invented.

---

## API summary

| Method | Path | Action |
|--------|------|--------|
| POST | `/` | Create |
| POST | `/:id/fund` | Fund with paymentReference |
| POST | `/:id/conditions` | Set condition true/false |
| POST | `/:id/freeze` | Dispute freeze |
| POST | `/:id/unfreeze` | |
| POST | `/:id/release` | Waterfall (422 if conditions unmet) |
| POST | `/:id/refund` | |
| POST | `/releases/:id/paid` | Settlement confirmation |
| GET | `/:id`, `/:id/events`, `/:id/releases` | |

### Create examples

**Buyer → farmer**
```json
{
  "escrowType": "buyer_seller",
  "payerId": "…",
  "payeeId": "…",
  "orderId": "…",
  "amount": 50000
}
```

**Farmer ↔ farmer**
```json
{
  "escrowType": "farmer_farmer",
  "payerId": "…",
  "payeeId": "…",
  "amount": 12000
}
```

**Client ↔ client with grade**
```json
{
  "escrowType": "client_client",
  "payerId": "…",
  "payeeId": "…",
  "amount": 200000,
  "releaseConditions": [
    { "type": "payment_received", "required": true },
    { "type": "delivery_confirmed", "required": true },
    { "type": "grade_accepted", "required": true },
    { "type": "no_open_dispute", "required": true }
  ]
}
```

**FPO-mediated**
```json
{
  "escrowType": "fpo_mediated",
  "payerId": "buyer-…",
  "fpoId": "fpo-…",
  "amount": 150000,
  "platformFeePct": 1.5
}
```

**Bank recovery from sale**
```json
{
  "escrowType": "bank_recovery",
  "payerId": "buyer-…",
  "payeeId": "farmer-…",
  "lenderId": "bank-…",
  "amount": 80000,
  "lenderClaimCap": 25000,
  "warehouseReceiptId": "optional-pledged-wr"
}
```

**Bank ↔ bank**
```json
{
  "escrowType": "bank_bank",
  "bankFromId": "…",
  "bankToId": "…",
  "amount": 1000000
}
```

---

## Separation of concerns

| Module | Role |
|--------|------|
| **trade-escrow** | Hold & release **payer funds** |
| **fpo-operations** | Split **FPO residual** to members |
| **warehouse-receipts** | Goods title / pledge (can block stock; optional link on escrow) |
| **legacy escrowService** | Older simple order escrow — prefer trade-escrow for new deals |
