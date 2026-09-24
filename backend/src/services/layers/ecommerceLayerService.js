/**
 * Ecommerce layer — catalog, quote, O2C, returns
 * NOT farmer schemes, land, or subsidy.
 */

'use strict';

const { assertLayerCapability, LAYERS, rejectCrossContamination } = require('./layerBoundary');
const { EcommerceO2CStateMachine } = require('../research-grade/ecommerceO2CStateMachine');

const catalog = [
  {
    sku: 'TOM-ORG-1KG',
    name: 'Organic Tomato 1kg',
    hsn: '0702',
    price: 48,
    stock: 200,
    cold: false,
    layer: LAYERS.ECOMMERCE,
  },
  {
    sku: 'MILK-A2-1L',
    name: 'A2 Milk 1L',
    hsn: '0401',
    price: 75,
    stock: 80,
    cold: true,
    layer: LAYERS.ECOMMERCE,
  },
  {
    sku: 'RICE-BAS-5KG',
    name: 'Basmati Rice 5kg',
    hsn: '1006',
    price: 520,
    stock: 40,
    cold: false,
    layer: LAYERS.ECOMMERCE,
  },
];

const orders = new Map();

async function operate(data = {}) {
  rejectCrossContamination(data);
  const action = data.action || 'catalog';
  const cap =
    action === 'o2c_transition' || action === 'transition'
      ? 'o2c_transition'
      : action === 'o2c_advance' || action === 'advance'
        ? 'o2c_advance'
        : action;
  assertLayerCapability(LAYERS.ECOMMERCE, cap);

  if (action === 'catalog') {
    return { layer: LAYERS.ECOMMERCE, items: catalog, confidence: 0.95 };
  }

  if (action === 'quote') {
    const lines = (data.lines || [{ sku: 'TOM-ORG-1KG', qty: 1 }]).map((l) => {
      const p = catalog.find((c) => c.sku === l.sku) || { price: 0, hsn: '0000', name: l.sku };
      const amount = (p.price || 0) * (l.qty || 1);
      return { ...l, name: p.name, unit_price: p.price, amount, hsn: p.hsn, cold: p.cold };
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

  if (action === 'order') {
    const quote = await operate({ ...data, action: 'quote' });
    const order_id = `MKT-${Date.now()}`;
    const sm = new EcommerceO2CStateMachine({ id: order_id, state: 'placed' });
    orders.set(order_id, sm);
    return {
      layer: LAYERS.ECOMMERCE,
      order_id,
      state: sm.state,
      ...quote,
      note: 'Marketplace/commerce order — not a farmer scheme application id',
      confidence: 0.88,
    };
  }

  if (action === 'o2c_transition' || action === 'transition') {
    const order_id = data.order_id;
    let sm = orders.get(order_id);
    if (!sm) sm = new EcommerceO2CStateMachine({ id: order_id, state: data.state || 'draft' });
    const result = sm.transition(data.to, data.event || {});
    orders.set(order_id, sm);
    return { layer: LAYERS.ECOMMERCE, ...result, snapshot: sm.snapshot() };
  }

  if (action === 'o2c_advance' || action === 'advance') {
    const order_id = data.order_id || `MKT-${Date.now()}`;
    let sm = orders.get(order_id) || new EcommerceO2CStateMachine({ id: order_id, state: data.state || 'draft' });
    const result = sm.advanceTo(data.target || 'completed', data.event || {});
    orders.set(order_id, sm);
    return { layer: LAYERS.ECOMMERCE, ...result };
  }

  return { layer: LAYERS.ECOMMERCE, error: 'Unknown ecommerce action', confidence: 0.2 };
}

module.exports = { operate, catalog, LAYERS };
