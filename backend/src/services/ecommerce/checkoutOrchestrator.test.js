/**
 * Unit tests — checkout + returns (no DB required)
 */

'use strict';

const checkout = require('./checkoutOrchestrator');

describe('ecommerce checkout orchestrator', () => {
  test('catalog lists available stock', () => {
    const c = checkout.catalog();
    expect(c.layer).toBe('ecommerce');
    expect(c.items.length).toBeGreaterThan(0);
  });

  test('checkout reserves stock and authorizes payment', () => {
    const result = checkout.checkout({
      lines: [{ sku: 'TOM-ORG-1KG', qty: 2 }],
      buyer_id: 'B1',
    });
    expect(result.order_id).toMatch(/^MKT-/);
    expect(result.state).toBe('inventory_reserved');
    expect(result.payment.status).toBe('authorized');
    expect(result.reservation.status).toBe('held');
  });

  test('oversell is refused', () => {
    expect(() =>
      checkout.checkout({
        lines: [{ sku: 'MILK-A2-1L', qty: 99999 }],
      }),
    ).toThrow(/Insufficient|reserve/i);
  });

  test('advance to completed captures payment', () => {
    const placed = checkout.checkout({
      lines: [{ sku: 'RICE-BAS-5KG', qty: 1 }],
    });
    const adv = checkout.advanceOrder(placed.order_id, 'completed');
    expect(adv.reached).toBe(true);
    expect(adv.state).toBe('completed');
    expect(adv.payment.status).toBe('captured');
  });

  test('cancel releases reservation and voids payment', () => {
    const placed = checkout.checkout({
      lines: [{ sku: 'TOM-ORG-1KG', qty: 1 }],
    });
    const cancel = checkout.cancelOrder(placed.order_id);
    expect(cancel.state).toBe('cancelled');
    expect(cancel.compensation).toContain('release_reservation');
  });

  test('return RMA path to refunded', () => {
    const placed = checkout.checkout({
      lines: [{ sku: 'TOM-ORG-1KG', qty: 1 }],
    });
    checkout.advanceOrder(placed.order_id, 'delivered');
    const ret = checkout.requestReturn({
      order_id: placed.order_id,
      reason: 'damaged',
    });
    expect(ret.rma.state).toBe('requested');
    const rmaId = ret.rma.rma_id;
    checkout.advanceRma(rmaId, 'approved');
    checkout.advanceRma(rmaId, 'label_issued');
    checkout.advanceRma(rmaId, 'in_transit_back');
    checkout.advanceRma(rmaId, 'received');
    checkout.advanceRma(rmaId, 'qc_pass');
    checkout.advanceRma(rmaId, 'refund_pending');
    const done = checkout.advanceRma(rmaId, 'refunded');
    expect(done.state).toBe('refunded');
  });
});
