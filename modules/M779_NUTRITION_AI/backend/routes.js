/**
 * M779_NUTRITION_AI Routes — clinical protocols + Rituraj
 */

'use strict';

const express = require('express');
const router = express.Router();
const service = require('./service');
const { logger } = require('../../../backend/src/utils/logger');
const { randomUUID } = require('crypto');

function ok(res, p) {
  res.json(p);
}
function fail(res, s, e) {
  res.status(s).json({ success: false, error: typeof e === 'string' ? e : e.message });
}

router.post('/process', async (req, res) => {
  try {
    const { capability, data, provider, sessionId } = req.body;
    if (!capability) return fail(res, 400, 'capability required');
    ok(res, await service.process({ capability, data, provider, sessionId }));
  } catch (e) {
    logger.error(e);
    fail(res, 500, e);
  }
});

router.post('/assess', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'health_assessment', data: req.body }));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/plan', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || randomUUID();
    ok(
      res,
      await service.process({
        capability: 'nutrition_planning',
        data: req.body,
        provider: req.body.provider,
        sessionId,
      })
    );
  } catch (e) {
    fail(res, 500, e);
  }
});

router.get('/protocols', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'clinical_protocols_list', data: {} }));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/protocol', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'clinical_protocol', data: req.body }));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/ritu', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'ritu_conference', data: req.body, provider: req.body.provider }));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/drug-food', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'drug_food_flags', data: req.body }));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/outcome', async (req, res) => {
  try {
    ok(
      res,
      await service.process({
        capability: 'outcome_feedback',
        data: req.body,
        sessionId: req.body.sessionId,
      })
    );
  } catch (e) {
    fail(res, 500, e);
  }
});

router.get('/capabilities', (req, res) => {
  const s = service.getInstance();
  ok(res, {
    success: true,
    moduleId: s.moduleId,
    name: s.name,
    version: s.version,
    capabilities: s.capabilities,
  });
});

router.get('/metrics', (req, res) => ok(res, { success: true, metrics: service.getMetrics() }));

router.get('/health', (req, res) =>
  ok(res, {
    success: true,
    status: 'healthy',
    moduleId: 'M779_NUTRITION_AI',
    timestamp: new Date().toISOString(),
  })
);

module.exports = router;
