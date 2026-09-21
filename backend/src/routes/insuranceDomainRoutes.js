/**
 * Real backend routes for InsuranceManagementPage.jsx, backed by
 * services/legacy/insuranceService.js. Exact 1:1 name matches.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/insuranceService');

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

router.post('/insurance/policies', wrap((req) => svc.createPolicy(req.body)));
router.get('/insurance/policies', wrap((req) => svc.getPolicies(req.query, req.query)));
router.post('/insurance/claim', wrap((req) => svc.submitClaim(req.body)));
router.get('/insurance/claims', wrap((req) => svc.getClaims(req.query, req.query)));
router.get('/insurance/products', wrap((req) => svc.getInsuranceProducts(req.query)));

module.exports = router;
