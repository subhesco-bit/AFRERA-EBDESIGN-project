/**
 * Corporate insurance platform routes
 * Mount: /api/v1/insurance-corporate
 */

'use strict';

const express = require('express');
const router = express.Router();
const platform = require('../services/insurance/corporateInsurancePlatform');

function ok(res, body) {
  res.json({ success: true, positioning: 'corporate_ecosystem_support_not_retail_sales', ...body });
}
function fail(res, e) {
  res.status(400).json({ success: false, error: e.message || String(e) });
}

router.get('/health', (req, res) => {
  ok(res, {
    status: 'healthy',
    model: 'corporate_risk_and_support',
    not: 'retail_insurance_sales',
    safety_floor: platform.safetyFloor(),
  });
});

router.get('/covers', (req, res) => {
  ok(res, platform.listCovers(req.query));
});

router.post('/compare', (req, res) => {
  try {
    ok(res, platform.compare(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/policies', (req, res) => {
  try {
    ok(res, platform.registerPolicy(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.get('/policies', (req, res) => {
  ok(res, platform.listPolicies(req.query));
});

router.post('/claims', (req, res) => {
  try {
    ok(res, platform.claimIntake(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.get('/claims/:claimId', (req, res) => {
  ok(res, platform.claimStatus(req.params.claimId));
});

router.post('/claims/:claimId/advance', (req, res) => {
  try {
    ok(res, platform.advanceClaim(req.params.claimId, req.body?.status, req.body?.note));
  } catch (e) {
    fail(res, e);
  }
});

router.get('/renewals', (req, res) => {
  ok(res, platform.renewals(Number(req.query.within_days) || 60));
});

router.post('/suggest', (req, res) => {
  try {
    ok(res, platform.suggestForContext(req.body?.context || 'logistics', req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/operate', async (req, res) => {
  try {
    ok(res, await platform.operate(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
