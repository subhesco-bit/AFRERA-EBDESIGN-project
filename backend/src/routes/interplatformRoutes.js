/**
 * Interplatform fabric API
 * Mount: /api/v1/interplatform
 */

'use strict';

const express = require('express');
const router = express.Router();
const fabric = require('../os/interplatformFabric');

function ok(res, body) {
  res.json({ success: true, ...body });
}
function fail(res, e) {
  res.status(e.code ? 400 : 500).json({ success: false, error: e.message, code: e.code });
}

router.get('/health', (req, res) => {
  ok(res, { status: 'healthy', service: 'interplatform_fabric' });
});

router.get('/analyze', (req, res) => {
  ok(res, fabric.deepAnalysis());
});

router.get('/platforms', (req, res) => {
  ok(res, { platforms: fabric.PLATFORM_IDS.map((id) => fabric.analyzePlatform(id)) });
});

router.get('/bridges', (req, res) => {
  ok(res, {
    bridges: fabric.BRIDGE_DEFS,
    recent: fabric.bridgeLog.slice(-30),
  });
});

router.post('/bridges/:bridgeId', async (req, res) => {
  try {
    ok(res, await fabric.runBridge(req.params.bridgeId, req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/decide', async (req, res) => {
  try {
    ok(res, await fabric.decide(req.body?.scenario, req.body?.context || req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/operate', async (req, res) => {
  try {
    ok(res, await fabric.operate(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
