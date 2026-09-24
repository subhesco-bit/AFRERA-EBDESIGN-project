/**
 * Industry grade 10 engine API
 * Mount: /api/v1/grade10
 */

'use strict';

const express = require('express');
const router = express.Router();
const pack = require('../engines/industryGradePack');

function ok(res, body) {
  res.json({ success: true, grade: '10x', ...body });
}
function fail(res, e) {
  res.status(400).json({ success: false, error: e.message, code: e.code });
}

router.get('/health', (req, res) => {
  ok(res, { status: 'healthy', standard: 'industry_decision_support_10' });
});

router.get('/capabilities', async (req, res) => {
  ok(res, await pack.operate({ engine: 'capabilities' }));
});

router.post('/pricing', (req, res) => {
  try {
    ok(res, pack.price10x(req.body?.sku, req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/checkout', (req, res) => {
  try {
    ok(res, pack.checkout10x(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/subsidy', (req, res) => {
  try {
    ok(res, pack.subsidy10x(req.body?.farmer || req.body, req.body?.as_of));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/logistics', (req, res) => {
  try {
    ok(res, pack.logistics10x(req.body?.shipment || req.body));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/trust', (req, res) => {
  try {
    ok(res, pack.trust10x(req.body?.actor_id, req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/erp/valuation', (req, res) => {
  try {
    ok(res, pack.erpValuation10x(req.body?.lots || []));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/preseason', (req, res) => {
  try {
    ok(res, pack.preseason10x(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/operate', async (req, res) => {
  try {
    ok(res, await pack.operate(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
