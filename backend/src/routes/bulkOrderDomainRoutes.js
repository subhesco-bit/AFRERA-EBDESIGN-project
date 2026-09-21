/**
 * Real backend routes for BulkOrderPage.jsx, backed by
 * services/legacy/bulkOrderService.js. userId is always taken from the
 * authenticated request (req.user.id), never trusted from the client body,
 * even though the page happens to include it - this prevents a user
 * querying/acting on another user's bulk orders. createBulkOrder ->
 * createBulkOrderRequest, getBulkOrderQuotations -> getQuotationsForOrder
 * (name differences). cancelBulkOrder's real signature has no "reason"
 * parameter - the page's reason field isn't persisted, a real limitation
 * of the underlying service, not something invented here.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/bulkOrderService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/bulk-order', wrap((req) => svc.createBulkOrderRequest(req.user.id, req.body)));
router.get('/bulk-order/:orderId', wrap((req) => svc.getBulkOrder(req.params.orderId, req.user.id)));
router.get('/bulk-order/:orderId/quotations', wrap((req) => svc.getQuotationsForOrder(req.params.orderId)));
router.post('/bulk-order/quotation/:quotationId/accept', wrap((req) => svc.acceptQuotation(req.params.quotationId, req.user.id)));
router.post('/bulk-order/:orderId/cancel', wrap((req) => svc.cancelBulkOrder(req.params.orderId, req.user.id)));
router.get('/bulk-orders', wrap((req) => svc.getUserBulkOrders(req.user.id, req.query)));

module.exports = router;
