/**
 * Real backend routes for B2BMarketplace.jsx, backed by
 * services/legacy/ecommerceBusinessSalesService.js. buyerId args the page
 * doesn't pass are filled from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/ecommerceBusinessSalesService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/ecommerce-business-sales/bulk-order', wrap((req) => svc.createBulkOrder(req.user.id, req.body)));
router.post('/ecommerce-business-sales/contract-farming', wrap((req) => svc.createContractFarming(req.user.id, req.body)));
router.post('/ecommerce-business-sales/quotation/:quotationId/accept', wrap((req) => svc.acceptQuotation(req.params.quotationId, req.user.id)));
router.get('/ecommerce-business-sales/b2b-conversion-metrics', wrap((req) => svc.getB2BConversionMetrics(req.query.periodDays)));
router.get('/ecommerce-business-sales/sales-analytics', wrap((req) => svc.getSalesAnalytics(req.query)));

module.exports = router;
