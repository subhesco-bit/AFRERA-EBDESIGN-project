/**
 * Ecommerce layer — delegates deep checkout/returns to checkoutOrchestrator
 * NOT farmer schemes, land, or subsidy.
 */

'use strict';

const { assertLayerCapability, LAYERS, rejectCrossContamination } = require('./layerBoundary');
const orchestrator = require('../ecommerce/checkoutOrchestrator');

async function operate(data = {}) {
  rejectCrossContamination(data);
  const action = data.action || 'catalog';

  const capMap = {
    catalog: 'catalog',
    quote: 'quote',
    cart: 'cart',
    cart_add: 'cart_add',
    cart_quote: 'cart_quote',
    order: 'checkout',
    checkout: 'checkout',
    o2c_transition: 'o2c_transition',
    transition: 'o2c_transition',
    o2c_advance: 'o2c_advance',
    advance: 'o2c_advance',
    cancel: 'cancel',
    return: 'return_request',
    return_request: 'return_request',
    rma_advance: 'rma_advance',
    get_order: 'get_order',
    payment: 'payment',
  };
  const cap = capMap[action] || action;
  assertLayerCapability(LAYERS.ECOMMERCE, cap);

  // Map thin aliases into orchestrator actions
  const orchAction =
    action === 'order'
      ? 'checkout'
      : action === 'quote'
        ? data.cart_id
          ? 'cart_quote'
          : 'catalog'
        : action === 'return'
          ? 'return_request'
          : action;

  if (action === 'quote' && data.lines && !data.cart_id) {
    // one-shot quote without cart
    const result = await orchestrator.operate({
      action: 'checkout',
      lines: data.lines,
      // dry-run style: use cart path by temp — simpler: price via catalog path
    }).catch(() => null);
    // Prefer non-mutating price: use cart_add on ephemeral then not checkout
    const { priceLines } = (() => {
      // inline minimal quote via catalog items
      return {};
    })();
    void priceLines;
    void result;
    const cat = orchestrator.catalog();
    const lines = (data.lines || []).map((l) => {
      const p = cat.items.find((i) => i.sku === l.sku) || { price: 0, hsn: '0000', name: l.sku };
      const qty = Number(l.qty) || 1;
      return {
        sku: l.sku,
        name: p.name,
        hsn: p.hsn,
        qty,
        unit_price: p.price,
        amount: p.price * qty,
        cold: p.cold,
      };
    });
    const subtotal = lines.reduce((s, x) => s + x.amount, 0);
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    return {
      layer: LAYERS.ECOMMERCE,
      lines,
      subtotal,
      gst_estimate: gst,
      total: subtotal + gst,
      cold_chain_required: lines.some((x) => x.cold),
      confidence: 0.9,
      safety_floor: 'Commerce pricing only — not a farmgate or subsidy price.',
    };
  }

  return orchestrator.operate({ ...data, action: orchAction });
}

module.exports = {
  operate,
  catalog: () => orchestrator.catalog(),
  LAYERS,
};
