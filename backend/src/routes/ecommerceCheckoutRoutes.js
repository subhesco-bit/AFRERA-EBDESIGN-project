/**
 * Full Ecommerce checkout + returns API
 * Mount: /api/v1/ecommerce-checkout
 * Layer: ecommerce only (not farmer)
 */

'use strict';

const express = require('express');
const router = express.Router();
const checkout = require('../services/ecommerce/checkoutOrchestrator');

function ok(res, body) {
  res.json({ success: true, layer: 'ecommerce', ...body });
}
function fail(res, e) {
  const status =
    e.code &&
    [
      'SKU_NOT_FOUND',
      'INSUFFICIENT_STOCK',
      'CART_NOT_FOUND',
      'CART_EMPTY',
      'NO_LINES',
      'ORDER_NOT_FOUND',
      'RMA_NOT_FOUND',
      'CANCEL_NOT_ALLOWED',
      'RETURN_NOT_ALLOWED',
      'INVALID_REASON',
      'INVALID_TRANSITION',
      'INVALID_RMA_TRANSITION',
      'RESERVE_FAILED',
      'PAYMENT_STATE',
    ].includes(e.code)
      ? 400
      : 500;
  res.status(status).json({ success: false, layer: 'ecommerce', error: e.message, code: e.code });
}

router.get('/health', (req, res) => {
  ok(res, {
    status: 'healthy',
    capabilities: [
      'catalog',
      'cart',
      'checkout',
      'o2c_advance',
      'cancel',
      'return_request',
      'rma_advance',
    ],
  });
});

router.get('/catalog', (req, res) => {
  ok(res, checkout.catalog());
});

router.post('/cart/items', (req, res) => {
  try {
    ok(res, checkout.cartAdd(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.get('/cart/:cartId', (req, res) => {
  try {
    ok(res, checkout.operate({ action: 'cart_quote', cart_id: req.params.cartId }));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/checkout', (req, res) => {
  try {
    ok(res, checkout.checkout(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.get('/orders/:orderId', (req, res) => {
  const o = checkout.getOrder(req.params.orderId);
  if (!o) return res.status(404).json({ success: false, error: 'Order not found' });
  ok(res, o);
});

router.post('/orders/:orderId/advance', (req, res) => {
  try {
    ok(res, checkout.advanceOrder(req.params.orderId, req.body?.target || 'completed', req.body?.event));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/orders/:orderId/cancel', (req, res) => {
  try {
    ok(res, checkout.cancelOrder(req.params.orderId, req.body?.actor));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/orders/:orderId/returns', (req, res) => {
  try {
    ok(res, checkout.requestReturn({ ...req.body, order_id: req.params.orderId }));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/rma/:rmaId/advance', (req, res) => {
  try {
    ok(res, checkout.advanceRma(req.params.rmaId, req.body?.to, req.body?.event));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/operate', async (req, res) => {
  try {
    ok(res, await checkout.operate(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
