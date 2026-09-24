/**
 * Hard boundary: Ecommerce layer vs Farmer layer
 * Guards prevent accidental mixing of order ids, subsidy, and farm objects.
 */

'use strict';

const LAYERS = {
  ECOMMERCE: 'ecommerce',
  FARMER: 'farmer',
  BRIDGE: 'farm_commerce_bridge',
};

const ECOMMERCE_CAPABILITIES = new Set([
  'catalog',
  'quote',
  'cart',
  'cart_add',
  'cart_quote',
  'order',
  'checkout',
  'o2c_transition',
  'o2c_advance',
  'transition',
  'advance',
  'cancel',
  'return',
  'return_request',
  'rma_advance',
  'get_order',
  'refund',
  'seller_rank',
  'payment',
]);

const FARMER_CAPABILITIES = new Set([
  'profile',
  'land',
  'crop_cycle',
  'herd',
  'subsidy_extract',
  'subsidy_list',
  'subsidy',
  'advisory',
  'input_plan',
  'scheme_application',
]);

const BRIDGE_CAPABILITIES = new Set([
  'listing_from_lot',
  'input_purchase_link',
  'resolve_context',
]);

function assertLayerCapability(layer, capability) {
  const set =
    layer === LAYERS.ECOMMERCE
      ? ECOMMERCE_CAPABILITIES
      : layer === LAYERS.FARMER
        ? FARMER_CAPABILITIES
        : BRIDGE_CAPABILITIES;
  if (!set.has(capability)) {
    const err = new Error(
      `Capability '${capability}' is not valid on layer '${layer}'. Ecommerce and Farmer layers are separate.`,
    );
    err.code = 'LAYER_BOUNDARY_VIOLATION';
    err.layer = layer;
    err.capability = capability;
    throw err;
  }
}

/** Reject payloads that try to treat a commerce order as a farm object */
function rejectCrossContamination(payload = {}) {
  const hasCommerce =
    payload.order_id != null ||
    payload.cart_id != null ||
    payload.sku != null ||
    payload.marketplace_order_id != null ||
    payload.rma_id != null;
  const hasFarmerCore =
    payload.scheme_application_id != null ||
    payload.crop_cycle_id != null ||
    payload.subsidy_claim_id != null;
  if (hasCommerce && hasFarmerCore && !payload.bridge_explicit) {
    const err = new Error(
      'Cannot mix commerce order/cart/sku/rma with scheme/crop_cycle/subsidy ids without bridge_explicit: true',
    );
    err.code = 'LAYER_CROSS_CONTAMINATION';
    throw err;
  }
}

module.exports = {
  LAYERS,
  ECOMMERCE_CAPABILITIES,
  FARMER_CAPABILITIES,
  BRIDGE_CAPABILITIES,
  assertLayerCapability,
  rejectCrossContamination,
};
