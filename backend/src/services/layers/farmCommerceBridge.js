/**
 * Explicit bridges only — never collapse farmer ids into commerce ids
 */

'use strict';

const { LAYERS, assertLayerCapability, rejectCrossContamination } = require('./layerBoundary');
const farmerLayer = require('./farmerLayerService');
const ecommerceLayer = require('./ecommerceLayerService');

/**
 * Farmer produce lot → commerce listing (two ids retained)
 */
async function listingFromLot(data = {}) {
  assertLayerCapability(LAYERS.BRIDGE, 'listing_from_lot');
  const farmer_id = data.farmer_id || 'F-DEMO';
  const lot = {
    lot_id: data.lot_id || `LOT-${Date.now()}`,
    farmer_id,
    commodity: data.commodity || 'tomato',
    qty_kg: Number(data.qty_kg) || 100,
    organic: !!data.organic,
    layer: LAYERS.FARMER,
  };
  const sku = data.sku || `FARM-${lot.lot_id}`;
  const listing = {
    listing_id: `LST-${Date.now()}`,
    sku,
    source_lot_id: lot.lot_id,
    source_farmer_id: farmer_id,
    price: Number(data.price) || 40,
    stock: lot.qty_kg,
    layer: LAYERS.ECOMMERCE,
  };
  return {
    bridge: 'listing_from_lot',
    farmer_side: lot,
    ecommerce_side: listing,
    link: { lot_id: lot.lot_id, listing_id: listing.listing_id, sku },
    rule: 'Two identities — do not use lot_id as order_id or listing_id as subsidy_claim_id',
    confidence: 0.9,
  };
}

/**
 * Farmer input plan → commerce purchase intent (farmer is buyer)
 */
async function inputPurchaseLink(data = {}) {
  assertLayerCapability(LAYERS.BRIDGE, 'input_purchase_link');
  const plan = (
    await farmerLayer.operate({
      action: 'input_plan',
      farmer_id: data.farmer_id,
      items: data.items,
    })
  ).plan;
  const quote = await ecommerceLayer.operate({
    action: 'quote',
    lines: (data.lines || [{ sku: 'RICE-BAS-5KG', qty: 1 }]).map((l) => ({
      sku: l.sku,
      qty: l.qty,
    })),
  });
  return {
    bridge: 'input_purchase_link',
    farmer_side: { input_plan_id: plan.input_plan_id, farmer_id: plan.farmer_id },
    ecommerce_side: { quote, role: 'farmer_as_buyer' },
    link: { input_plan_id: plan.input_plan_id, commerce_quote_total: quote.total },
    rule: 'Farmer remains farmer_id; commerce creates its own order_id on checkout',
    confidence: 0.88,
  };
}

async function resolveContext(data = {}) {
  assertLayerCapability(LAYERS.BRIDGE, 'resolve_context');
  rejectCrossContamination({ ...data, bridge_explicit: true });
  if (data.order_id || data.sku || data.listing_id) {
    return { layer_detected: LAYERS.ECOMMERCE, ref: data.order_id || data.sku || data.listing_id };
  }
  if (data.farmer_id || data.lot_id || data.scheme_application_id || data.input_plan_id) {
    return {
      layer_detected: LAYERS.FARMER,
      ref: data.farmer_id || data.lot_id || data.scheme_application_id || data.input_plan_id,
    };
  }
  return { layer_detected: null, message: 'No layer-specific id provided' };
}

async function operate(data = {}) {
  const action = data.action || 'resolve_context';
  if (action === 'listing_from_lot') return listingFromLot(data);
  if (action === 'input_purchase_link') return inputPurchaseLink(data);
  if (action === 'resolve_context') return resolveContext(data);
  assertLayerCapability(LAYERS.BRIDGE, action);
  return { error: 'Unknown bridge action' };
}

module.exports = {
  listingFromLot,
  inputPurchaseLink,
  resolveContext,
  operate,
};
