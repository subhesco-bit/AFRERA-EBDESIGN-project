/**
 * Baseline platform routes — registry scan, trust, events, ERP controls, AI gov, thermal
 * Mount: /api/v1/baseline
 */

'use strict';

const express = require('express');
const router = express.Router();
const scanner = require('../os/registryCodeScanner');
const registry = require('../os/conceptRuntimeRegistry');
const trust = require('../services/trust/trustReputationEngine');
const events = require('../services/analytics/businessEventBus');
const erpExt = require('../services/research-grade/erpControlsExtended');
const aiGov = require('../services/ai/modelRegistryGovernance');
const thermal = require('../services/engineering/thermalEngine');

function ok(res, body) {
  res.json({ success: true, ...body });
}
function fail(res, e) {
  res.status(400).json({ success: false, error: e.message, code: e.code });
}

router.get('/health', (req, res) => {
  ok(res, {
    status: 'healthy',
    implements: [
      'registry_scan',
      'trust',
      'business_events',
      'erp_three_way_period',
      'ai_model_registry',
      'thermal_first_pass',
    ],
  });
});

router.get('/registry', (req, res) => {
  ok(res, registry.list({ status: req.query.status, layer: req.query.layer }));
});

router.get('/registry/scan', (req, res) => {
  ok(res, scanner.fullScan({ limit: Number(req.query.limit) || 80 }));
});

router.post('/trust/record', async (req, res) => {
  try {
    ok(res, await trust.operate({ ...req.body, action: 'record' }));
  } catch (e) {
    fail(res, e);
  }
});

router.get('/trust/:actorId', async (req, res) => {
  ok(res, await trust.operate({ action: 'score', actor_id: req.params.actorId }));
});

router.post('/events/emit', async (req, res) => {
  try {
    ok(res, events.emit(req.body?.type, req.body?.payload, req.body?.meta));
  } catch (e) {
    fail(res, e);
  }
});

router.get('/events', (req, res) => {
  ok(res, { events: events.query(req.query) });
});

router.get('/metrics/:metricId', (req, res) => {
  ok(res, events.metric(req.params.metricId));
});

router.get('/metrics', (req, res) => {
  ok(res, events.listMetrics());
});

router.post('/erp/three-way-match', async (req, res) => {
  try {
    ok(res, await erpExt.operate({ ...req.body, action: 'three_way_match' }));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/erp/period/close', async (req, res) => {
  try {
    ok(res, await erpExt.operate({ ...req.body, action: 'close_period' }));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/erp/journal', async (req, res) => {
  try {
    ok(res, await erpExt.operate({ ...req.body, action: 'post_journal' }));
  } catch (e) {
    fail(res, e);
  }
});

router.get('/ai/models', async (req, res) => {
  ok(res, await aiGov.operate({ action: 'list' }));
});

router.get('/ai/governance', async (req, res) => {
  ok(res, await aiGov.operate({ action: 'governance' }));
});

router.post('/engineering/thermal/cold-room', (req, res) => {
  try {
    ok(res, thermal.coldRoomLoad(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/engineering/thermal/insulation', (req, res) => {
  try {
    ok(res, thermal.insulationThickness(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
