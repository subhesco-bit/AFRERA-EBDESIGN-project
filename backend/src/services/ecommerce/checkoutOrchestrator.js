/**
 * Full Ecommerce checkout orchestrator
 * Cart → quote → place → payment auth → inventory reserve → (optional) advance O2C
 * Commerce layer only — not farmer subsidy / scheme.
 */

'use strict';

const { EcommerceO2CStateMachine } = require('../research-grade/ecommerceO2CStateMachine');
const { ReturnsRmaStateMachine, REASONS } = require('./returnsRmaStateMachine');

const CATALOG = [
  { sku: 'TOM-ORG-1KG', name: 'Organic Tomato 1kg', hsn: '0702', price: 48, stock: 200, reserved: 0, cold: false },
  { sku: 'MILK-A2-1L', name: 'A2 Milk 1L', hsn: '0401', price: 75, stock: 80, reserved: 0, cold: true },
  { sku: 'RICE-BAS-5KG', name: 'Basmati Rice 5kg', hsn: '1006', price: 520, stock: 40, reserved: 0, cold: false },
  { sku: 'SEED-WHEAT-10KG', name: 'Wheat seed 10kg', hsn: '1001', price: 450, stock: 60, reserved: 0, cold: false },
];

const carts = new Map();
const orders = new Map();
const reservations = new Map();
const rmas = new Map();
const payments = new Map();

function available(skuRow) {
  return Math.max(0, (skuRow.stock || 0) - (skuRow.reserved || 0));
}

function getSku(sku) {
  return CATALOG.find((c) => c.sku === sku);
}

function priceLines(lines) {
  const priced = lines.map((l) => {
    const p = getSku(l.sku);
    if (!p) {
      const err = new Error(`Unknown SKU ${l.sku}`);
      err.code = 'SKU_NOT_FOUND';
      throw err;
    }
    const qty = Number(l.qty) || 1;
    const amount = p.price * qty;
    return {
      sku: p.sku,
      name: p.name,
      hsn: p.hsn,
      qty,
      unit_price: p.price,
      amount,
      cold: p.cold,
      available: available(p),
    };
  });
  const subtotal = priced.reduce((s, x) => s + x.amount, 0);
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  return {
    lines: priced,
    subtotal,
    gst_estimate: gst,
    total: subtotal + gst,
    cold_chain_required: priced.some((x) => x.cold),
  };
}

function cartGetOrCreate(cart_id) {
  if (cart_id && carts.has(cart_id)) return carts.get(cart_id);
  const id = cart_id || `CART-${Date.now()}`;
  const cart = { cart_id: id, lines: [], updated_at: new Date().toISOString(), layer: 'ecommerce' };
  carts.set(id, cart);
  return cart;
}

function cartAdd(data = {}) {
  const cart = cartGetOrCreate(data.cart_id);
  const sku = data.sku;
  const qty = Number(data.qty) || 1;
  const p = getSku(sku);
  if (!p) {
    const err = new Error(`Unknown SKU ${sku}`);
    err.code = 'SKU_NOT_FOUND';
    throw err;
  }
  if (qty > available(p)) {
    const err = new Error(`Insufficient stock for ${sku}: need ${qty}, available ${available(p)}`);
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }
  const existing = cart.lines.find((l) => l.sku === sku);
  if (existing) existing.qty += qty;
  else cart.lines.push({ sku, qty });
  cart.updated_at = new Date().toISOString();
  const quote = priceLines(cart.lines);
  return { cart, quote, layer: 'ecommerce', confidence: 0.95 };
}

function cartQuote(cart_id) {
  const cart = carts.get(cart_id);
  if (!cart) {
    const err = new Error('Cart not found');
    err.code = 'CART_NOT_FOUND';
    throw err;
  }
  return { cart, quote: priceLines(cart.lines), layer: 'ecommerce', confidence: 0.95 };
}

/** Reserve inventory under FOR UPDATE semantics (in-memory lock simulation) */
function reserveInventory(order_id, lines) {
  const holds = [];
  for (const l of lines) {
    const p = getSku(l.sku);
    if (!p) {
      releaseHolds(holds);
      const err = new Error(`SKU ${l.sku} missing`);
      err.code = 'SKU_NOT_FOUND';
      throw err;
    }
    if (available(p) < l.qty) {
      releaseHolds(holds);
      const err = new Error(`Cannot reserve ${l.qty} of ${l.sku}; available ${available(p)}`);
      err.code = 'RESERVE_FAILED';
      throw err;
    }
    p.reserved += l.qty;
    holds.push({ sku: l.sku, qty: l.qty });
  }
  const reservation_id = `RSV-${Date.now()}`;
  reservations.set(reservation_id, { reservation_id, order_id, holds, status: 'held', at: new Date().toISOString() });
  return { reservation_id, holds, status: 'held' };
}

function releaseHolds(holds) {
  for (const h of holds || []) {
    const p = getSku(h.sku);
    if (p) p.reserved = Math.max(0, p.reserved - h.qty);
  }
}

function releaseReservation(reservation_id) {
  const r = reservations.get(reservation_id);
  if (!r || r.status !== 'held') return { released: false, reservation_id };
  releaseHolds(r.holds);
  r.status = 'released';
  return { released: true, reservation_id };
}

function commitReservation(reservation_id) {
  const r = reservations.get(reservation_id);
  if (!r || r.status !== 'held') return { committed: false };
  for (const h of r.holds) {
    const p = getSku(h.sku);
    if (p) {
      p.stock = Math.max(0, p.stock - h.qty);
      p.reserved = Math.max(0, p.reserved - h.qty);
    }
  }
  r.status = 'committed';
  return { committed: true, reservation_id };
}

function authorizePayment(order_id, amount) {
  const payment_id = `PAY-${Date.now()}`;
  const payment = {
    payment_id,
    order_id,
    amount,
    status: 'authorized',
    method: 'simulated_pg',
    at: new Date().toISOString(),
    layer: 'ecommerce',
  };
  payments.set(payment_id, payment);
  return payment;
}

function capturePayment(payment_id) {
  const p = payments.get(payment_id);
  if (!p) {
    const err = new Error('Payment not found');
    err.code = 'PAYMENT_NOT_FOUND';
    throw err;
  }
  if (p.status !== 'authorized') {
    const err = new Error(`Cannot capture payment in status ${p.status}`);
    err.code = 'PAYMENT_STATE';
    throw err;
  }
  p.status = 'captured';
  p.captured_at = new Date().toISOString();
  return p;
}

function voidOrRefundPayment(payment_id, mode = 'void') {
  const p = payments.get(payment_id);
  if (!p) return { ok: false };
  if (p.status === 'authorized' && mode === 'void') {
    p.status = 'voided';
  } else if (p.status === 'captured' || mode === 'refund') {
    p.status = 'refunded';
    p.refunded_at = new Date().toISOString();
  }
  return p;
}

/**
 * Full checkout: cart → order placed → payment auth → inventory reserve
 */
function checkout(data = {}) {
  let lines = data.lines;
  if (data.cart_id) {
    const cart = carts.get(data.cart_id);
    if (!cart || !cart.lines.length) {
      const err = new Error('Cart empty or missing');
      err.code = 'CART_EMPTY';
      throw err;
    }
    lines = cart.lines;
  }
  if (!lines || !lines.length) {
    const err = new Error('No lines to checkout');
    err.code = 'NO_LINES';
    throw err;
  }

  const quote = priceLines(lines);
  for (const l of quote.lines) {
    if (l.qty > l.available) {
      const err = new Error(`Insufficient stock for ${l.sku}`);
      err.code = 'INSUFFICIENT_STOCK';
      throw err;
    }
  }

  const order_id = `MKT-${Date.now()}`;
  const sm = new EcommerceO2CStateMachine({ id: order_id, state: 'draft' });
  sm.transition('placed', { type: 'checkout', actor: data.actor || 'buyer' });

  const payment = authorizePayment(order_id, quote.total);
  sm.transition('payment_authorized', { type: 'payment_auth', evidence: payment.payment_id });

  let reservation;
  try {
    reservation = reserveInventory(order_id, quote.lines);
    sm.transition('inventory_reserved', { type: 'reserve', evidence: reservation.reservation_id });
  } catch (e) {
    voidOrRefundPayment(payment.payment_id, 'void');
    sm.transition('failed', { type: 'reserve_failed', note: e.message });
    orders.set(order_id, {
      order_id,
      sm,
      quote,
      payment_id: payment.payment_id,
      reservation_id: null,
      status: 'failed',
      layer: 'ecommerce',
    });
    throw e;
  }

  const record = {
    order_id,
    sm,
    quote,
    payment_id: payment.payment_id,
    reservation_id: reservation.reservation_id,
    buyer_id: data.buyer_id || null,
    address: data.address || null,
    status: sm.state,
    layer: 'ecommerce',
    created_at: new Date().toISOString(),
  };
  orders.set(order_id, record);

  if (data.cart_id && carts.has(data.cart_id)) {
    carts.get(data.cart_id).lines = [];
  }

  return {
    layer: 'ecommerce',
    order_id,
    state: sm.state,
    quote,
    payment,
    reservation,
    snapshot: sm.snapshot(),
    next: ['picking', 'or cancel_requested'],
    confidence: 0.92,
    safety_floor: 'Payment is simulated PG; production requires real gateway + maker controls.',
    note: 'Ecommerce checkout only — not farmer scheme or subsidy.',
  };
}

function advanceOrder(order_id, target = 'completed', event = {}) {
  const rec = orders.get(order_id);
  if (!rec) {
    const err = new Error('Order not found');
    err.code = 'ORDER_NOT_FOUND';
    throw err;
  }
  const result = rec.sm.advanceTo(target, event);
  rec.status = rec.sm.state;

  // Commit stock when leaving warehouse (shipped)
  if (['shipped', 'delivered', 'completed'].includes(rec.sm.state) && rec.reservation_id) {
    const r = reservations.get(rec.reservation_id);
    if (r && r.status === 'held') commitReservation(rec.reservation_id);
  }
  // Capture payment on ship or complete
  if (['shipped', 'delivered', 'completed'].includes(rec.sm.state) && rec.payment_id) {
    const pay = payments.get(rec.payment_id);
    if (pay && pay.status === 'authorized') capturePayment(rec.payment_id);
  }

  return {
    layer: 'ecommerce',
    ...result,
    payment: payments.get(rec.payment_id),
    reservation: reservations.get(rec.reservation_id),
    confidence: 1,
  };
}

function cancelOrder(order_id, actor = 'system') {
  const rec = orders.get(order_id);
  if (!rec) {
    const err = new Error('Order not found');
    err.code = 'ORDER_NOT_FOUND';
    throw err;
  }
  const sm = rec.sm;
  if (['shipped', 'delivered', 'completed', 'refunded', 'returned'].includes(sm.state)) {
    const err = new Error(`Cannot cancel in state ${sm.state}; use returns flow`);
    err.code = 'CANCEL_NOT_ALLOWED';
    throw err;
  }
  if (sm.canTransition('cancel_requested')) {
    sm.transition('cancel_requested', { type: 'cancel', actor });
  }
  if (sm.canTransition('cancelled')) {
    sm.transition('cancelled', { type: 'cancel_confirm', actor });
  }
  if (rec.reservation_id) releaseReservation(rec.reservation_id);
  if (rec.payment_id) voidOrRefundPayment(rec.payment_id, 'void');
  rec.status = sm.state;
  return {
    layer: 'ecommerce',
    order_id,
    state: sm.state,
    compensation: ['release_reservation', 'void_payment'],
    snapshot: sm.snapshot(),
    confidence: 1,
  };
}

function requestReturn(data = {}) {
  const order_id = data.order_id;
  const rec = orders.get(order_id);
  if (!rec) {
    const err = new Error('Order not found');
    err.code = 'ORDER_NOT_FOUND';
    throw err;
  }
  const allowedFrom = ['shipped', 'delivered', 'completed'];
  if (!allowedFrom.includes(rec.sm.state) && rec.sm.state !== 'return_requested') {
    const err = new Error(`Return not allowed from order state ${rec.sm.state}`);
    err.code = 'RETURN_NOT_ALLOWED';
    throw err;
  }
  if (rec.sm.canTransition('return_requested')) {
    rec.sm.transition('return_requested', { type: 'return_request', actor: data.actor || 'buyer' });
  }
  const reason = data.reason || 'other';
  if (!REASONS.includes(reason)) {
    const err = new Error(`Invalid reason; allowed: ${REASONS.join(', ')}`);
    err.code = 'INVALID_REASON';
    throw err;
  }
  const lines = data.lines || rec.quote.lines;
  const refund_amount =
    data.refund_amount != null
      ? Number(data.refund_amount)
      : lines.reduce((s, l) => s + (l.amount || l.unit_price * l.qty || 0), 0);
  const rma = new ReturnsRmaStateMachine({
    order_id,
    reason,
    lines,
    refund_amount,
  });
  rmas.set(rma.rmaId, { rma, order_id });
  rec.status = rec.sm.state;
  return {
    layer: 'ecommerce',
    rma: rma.snapshot(),
    order_state: rec.sm.state,
    confidence: 0.95,
    safety_floor: 'RMA support workflow — refund posts only after qc_pass → refunded.',
  };
}

function advanceRma(rma_id, to, event = {}) {
  const entry = rmas.get(rma_id);
  if (!entry) {
    const err = new Error('RMA not found');
    err.code = 'RMA_NOT_FOUND';
    throw err;
  }
  const result = entry.rma.transition(to, event);
  // On refunded: refund payment + restock if qc_pass path
  if (to === 'refunded') {
    const rec = orders.get(entry.order_id);
    if (rec && rec.payment_id) voidOrRefundPayment(rec.payment_id, 'refund');
    if (rec) {
      if (rec.sm.canTransition('returned')) rec.sm.transition('returned', { type: 'rma_returned' });
      if (rec.sm.canTransition('refunded')) rec.sm.transition('refunded', { type: 'rma_refunded' });
      rec.status = rec.sm.state;
    }
    // Restock lines
    for (const l of entry.rma.lines || []) {
      const p = getSku(l.sku);
      if (p) p.stock += Number(l.qty) || 0;
    }
  }
  return {
    layer: 'ecommerce',
    ...result,
    rma: entry.rma.snapshot(),
    order: orders.get(entry.order_id)
      ? { order_id: entry.order_id, state: orders.get(entry.order_id).sm.state }
      : null,
    confidence: 1,
  };
}

function getOrder(order_id) {
  const rec = orders.get(order_id);
  if (!rec) return null;
  return {
    layer: 'ecommerce',
    order_id,
    state: rec.sm.state,
    quote: rec.quote,
    payment: payments.get(rec.payment_id),
    reservation: reservations.get(rec.reservation_id),
    snapshot: rec.sm.snapshot(),
    buyer_id: rec.buyer_id,
  };
}

function catalog() {
  return {
    layer: 'ecommerce',
    items: CATALOG.map((c) => ({
      sku: c.sku,
      name: c.name,
      hsn: c.hsn,
      price: c.price,
      available: available(c),
      cold: c.cold,
    })),
    confidence: 1,
  };
}

async function operate(data = {}) {
  const action = data.action || 'catalog';
  switch (action) {
    case 'catalog':
      return catalog();
    case 'cart_add':
      return cartAdd(data);
    case 'cart_quote':
      return cartQuote(data.cart_id);
    case 'checkout':
      return checkout(data);
    case 'advance':
    case 'o2c_advance':
      return advanceOrder(data.order_id, data.target || 'completed', data.event || {});
    case 'cancel':
      return cancelOrder(data.order_id, data.actor);
    case 'return_request':
      return requestReturn(data);
    case 'rma_advance':
      return advanceRma(data.rma_id, data.to, data.event || {});
    case 'get_order':
      return getOrder(data.order_id) || { error: 'not_found', order_id: data.order_id };
    case 'transition':
    case 'o2c_transition': {
      const rec = orders.get(data.order_id);
      if (!rec) {
        const err = new Error('Order not found');
        err.code = 'ORDER_NOT_FOUND';
        throw err;
      }
      const result = rec.sm.transition(data.to, data.event || {});
      rec.status = rec.sm.state;
      return { layer: 'ecommerce', ...result, snapshot: rec.sm.snapshot() };
    }
    default:
      return { layer: 'ecommerce', error: 'Unknown action', action, confidence: 0.2 };
  }
}

module.exports = {
  operate,
  catalog,
  cartAdd,
  checkout,
  advanceOrder,
  cancelOrder,
  requestReturn,
  advanceRma,
  getOrder,
  CATALOG,
  // test hooks
  _orders: orders,
  _reservations: reservations,
  _payments: payments,
  _rmas: rmas,
};
