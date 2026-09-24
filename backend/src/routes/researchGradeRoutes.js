/**
 * Research-grade platform routes — real engines, evidence, no stubs
 * Mount: /api/v1/research-grade
 */

'use strict';

const express = require('express');
const router = express.Router();
const gateway = require('../services/research-grade/aiBackboneEvidenceGateway');
const erp = require('../services/research-grade/erpDoubleEntrySpine');

function ok(res, body) {
  res.json(body);
}
function fail(res, status, err) {
  res.status(status).json({
    success: false,
    error: typeof err === 'string' ? err : err.message,
    code: err.code || undefined,
  });
}

router.get('/health', (req, res) => {
  ok(res, {
    success: true,
    status: 'healthy',
    suite: 'research-grade',
    timestamp: new Date().toISOString(),
  });
});

router.get('/capabilities', async (req, res) => {
  ok(res, await gateway.route('capabilities', {}));
});

router.post('/ai/:capability', async (req, res) => {
  try {
    const out = await gateway.route(req.params.capability, req.body || {});
    if (!out.success && out.error) return fail(res, 400, out.error);
    ok(res, out);
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/subsidy/extract', async (req, res) => {
  try {
    ok(res, await gateway.route('subsidy_extract', req.body || {}));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.get('/subsidy/schemes', async (req, res) => {
  ok(res, await gateway.route('subsidy_list', {}));
});

router.post('/logistics/decide', async (req, res) => {
  try {
    ok(res, await gateway.route('logistics_decide', req.body || {}));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/mep/package', async (req, res) => {
  try {
    ok(res, await gateway.route('mep_package', req.body || {}));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/ecommerce/o2c/transition', async (req, res) => {
  try {
    ok(res, await gateway.route('ecommerce_o2c_transition', req.body || {}));
  } catch (e) {
    fail(res, e.code === 'INVALID_TRANSITION' ? 400 : 500, e);
  }
});

router.post('/ecommerce/o2c/advance', async (req, res) => {
  try {
    ok(res, await gateway.route('ecommerce_o2c_advance', req.body || {}));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.get('/erp/coa', (req, res) => {
  ok(res, { success: true, coa: erp.COA });
});

router.post('/erp/journal', (req, res) => {
  try {
    ok(res, { success: true, ...erp.postJournal(req.body || {}) });
  } catch (e) {
    fail(res, 400, e);
  }
});

router.post('/erp/sale', (req, res) => {
  try {
    ok(res, { success: true, ...erp.postSale(req.body || {}) });
  } catch (e) {
    fail(res, 400, e);
  }
});

router.get('/erp/trial-balance', (req, res) => {
  ok(res, { success: true, ...erp.trialBalance() });
});

module.exports = router;
