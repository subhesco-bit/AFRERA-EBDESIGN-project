# FPO Operations Hub + Warehouse Receipt System

**Branch:** `consolidated/final`  
**Priority 1 modules** — real transactional services, not catalogs.

---

## 1. FPO Operations Hub

### Tables
`fpo_organizations`, `fpo_members`, `fpo_pool_lots`, `fpo_pool_contributions`, `fpo_payout_entries`

### API (`/api/v1/fpo-operations`)

| Method | Path | Action |
|--------|------|--------|
| GET | `/capabilities` | Rules |
| POST | `/` | Create FPO |
| GET | `/` | List FPOs |
| GET | `/:fpoId` | Get FPO |
| POST | `/:fpoId/members` | Add member |
| GET | `/:fpoId/members` | List members |
| POST | `/:fpoId/lots` | Open pool lot |
| POST | `/lots/:lotId/contribute` | Contribute qty |
| POST | `/lots/:lotId/sell` | Sell + create pending payouts |
| GET | `/:fpoId/payouts` | Payout ledger |
| POST | `/payouts/:payoutId/paid` | Mark paid (requires paymentRef) |

### Rules
- Lot contribution uses `FOR UPDATE` on lot row
- `salePricePerUnit` required on sell — **never invented**
- Default split: **qty_weighted**; optional `equal_share`
- Payouts start `pending` until settlement provides `paymentRef`

### Flow
```
Create FPO → Add members → Open lot → Contributions → Sell @ price → Pending payouts → Mark paid
```

---

## 2. Warehouse Receipt (WRS)

### Tables
`warehouse_receipts`, `warehouse_receipt_events`

### API (`/api/v1/warehouse-receipts`)

| Method | Path | Action |
|--------|------|--------|
| POST | `/` | Inward receipt |
| GET | `/` | List |
| GET | `/:id` | Get |
| GET | `/:id/events` | Audit trail |
| POST | `/:id/pledge` | Lien for credit |
| POST | `/:id/release-lien` | Clear lien |
| POST | `/:id/release-stock` | Physical out |

### Rules
- Optional `facility_id` → capacity check vs `cold_storage_facilities` + existing active stock
- **Pledged** receipts cannot release stock until lien cleared
- Every change appends an event row

### Flow
```
Inward (qty, grade, commodity) → optional Pledge (lender) → Release lien → Release stock
```

---

## 3. Migration

```
backend/src/database/migrations/20260921_fpo_and_warehouse_receipt.sql
```

Run with your normal migration runner before using the APIs.

---

## 4. Files

| Path | Role |
|------|------|
| `fpoOperationsService.js` | FPO domain |
| `warehouseReceiptService.js` | WRS domain |
| `fpoOperationsRoutes.js` | HTTP |
| `warehouseReceiptRoutes.js` | HTTP |

---

## 5. Next P1 (not in this commit)

Settlement UPI rail, grading certificates, contract farming, dispute desk, scheme cases — same style: transactional, no invented money.
