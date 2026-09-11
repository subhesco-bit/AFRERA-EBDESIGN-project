'use strict';

const express = require('express');
const accounting = require('../services/indiaErpAccountingService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { protectRouter, requireHumanAuthorization } = require('./enterpriseRouteSupport');

const router = express.Router();
router.use(authMiddleware);
protectRouter(router, { signal: 'enterprise.erp.accounting.changed' });

// Reads are available to authenticated users; mutations require explicit human
// authorization and the existing enterprise admin/superadmin policy.
router.use((req, res, next) => {
  if (req.method === 'GET') return next();
  return requireRole('admin', 'superadmin')(req, res, () => requireHumanAuthorization(req, res, next));
});

function ok(res, data, status = 200) { return res.status(status).json({ success: true, data }); }
function fail(res, error) {
  const status = /required|invalid|must be|unsupported|cannot be/i.test(error.message) ? 400 : 500;
  return res.status(status).json({ success: false, error: status === 500 ? 'Internal accounting operation failed' : error.message });
}
function handler(fn, status = 200) {
  return async (req, res) => {
    try { return ok(res, await fn(req), status); } catch (error) { return fail(res, error); }
  };
}

router.post('/ap/invoices', handler(req => accounting.createAPInvoice(req.body), 201));
router.post('/ar/invoices', handler(req => accounting.createARInvoice(req.body), 201));
router.post('/payments', handler(req => accounting.recordPayment(req.body), 201));
router.post('/tax/transactions', handler(req => accounting.recordTaxTransaction(req.body), 201));
router.post('/budgets', handler(req => accounting.createBudget(req.body), 201));
router.post('/bank-reconciliation', handler(req => accounting.reconcileBank(req.body), 200));
router.post('/period-close', handler(req => accounting.closePeriod(req.body), 200));
router.get('/control-dashboard', handler(req => accounting.financialControlDashboard(req.query)));

module.exports = router;
