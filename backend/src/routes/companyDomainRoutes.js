/**
 * Real backend routes for AssetAccountingPage.jsx / CostControlPage.jsx /
 * ProjectSystemsPage.jsx's company dropdown/context, backed by
 * services/legacy/companyService.js. Exact 1:1 name matches.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/companyService');

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

router.get('/companies', wrap(() => svc.listCompanies()));
router.get('/company/:id', wrap((req) => svc.getCompanyById(req.params.id)));
router.get('/company/:id/fiscal-years', wrap((req) => svc.getFiscalYears(req.params.id)));
router.get('/company/:id/chart-of-accounts', wrap((req) => svc.getChartOfAccounts(req.params.id)));

module.exports = router;
