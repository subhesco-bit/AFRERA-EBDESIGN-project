/**
 * Real backend routes for ERPDashboard.jsx, backed by
 * services/legacy/ecommerceERPService.js. createProductionOrder's real
 * signature takes (productId, demandQuantity) as separate args, unwrapped
 * from the page's single data object below.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/ecommerceERPService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/ecommerce-erp/production-order', wrap((req) => svc.createProductionOrder(req.body.productId, req.body.demandQuantity)));
router.post('/ecommerce-erp/general-ledger', wrap((req) => svc.postToGeneralLedger(req.body)));
router.post('/ecommerce-erp/sync-customer-crm/:userId', wrap((req) => svc.syncCustomerWithCRM(req.params.userId)));
router.get('/ecommerce-erp/gst-invoice/:orderId', wrap((req) => svc.generateGSTInvoice(req.params.orderId)));
router.get('/ecommerce-erp/sync-inventory/:productId', wrap((req) => svc.syncInventoryWithERP(req.params.productId)));

module.exports = router;
