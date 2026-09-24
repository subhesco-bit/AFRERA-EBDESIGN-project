# Ecommerce deep-fill — Checkout + Returns

**Layer:** Ecommerce only (not Farmer)  
**Branch:** `consolidated/final`

## Flows

### Checkout
```
cart_add → cart_quote → checkout
  → placed
  → payment_authorized (simulated PG)
  → inventory_reserved (hold = stock − reserved)
  → advance → picking → packed → shipped → delivered → completed
       (capture payment + commit stock on ship/complete)
```

### Cancel (pre-ship)
```
cancel_requested → cancelled
  + release_reservation
  + void payment
```

### Returns / RMA
```
return_requested (order must be shipped|delivered|completed)
RMA: requested → approved → label_issued → in_transit_back
   → received → qc_pass → refund_pending → refunded → closed
              ↘ qc_fail → closed | refund_pending
On refunded: payment refunded + stock restocked + order → returned → refunded
```

## API `/api/v1/ecommerce-checkout`

| Method | Path | Action |
|--------|------|--------|
| GET | `/catalog` | Sellable SKUs + available |
| POST | `/cart/items` | Add line `{ cart_id?, sku, qty }` |
| GET | `/cart/:cartId` | Quote cart |
| POST | `/checkout` | `{ lines }` or `{ cart_id }` → order |
| GET | `/orders/:orderId` | Snapshot |
| POST | `/orders/:orderId/advance` | `{ target }` |
| POST | `/orders/:orderId/cancel` | Pre-ship cancel + compensation |
| POST | `/orders/:orderId/returns` | `{ reason, lines? }` → RMA |
| POST | `/rma/:rmaId/advance` | `{ to }` |
| POST | `/operate` | Generic action router |

## Files

- `services/ecommerce/checkoutOrchestrator.js`
- `services/ecommerce/returnsRmaStateMachine.js`
- `services/ecommerce/checkoutOrchestrator.test.js`
- `routes/ecommerceCheckoutRoutes.js`

## Mount

```js
app.use('/api/v1/ecommerce-checkout', require('./routes/ecommerceCheckoutRoutes'));
```

## Honesty

- Payment gateway is **simulated**
- Stock holds are **in-memory** (wire to `inventoryReservationService` + Postgres for production)
- Not farmer subsidy; not insurance product sales
