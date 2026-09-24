/**
 * M777_VETERINARY_AI Routes — 10/10
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

router.post('/diagnose', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || randomUUID();
    ok(
      res,
      await service.process({
        capability: 'animal_diagnosis',
        data: req.body,
        provider: req.body.provider,
        sessionId,
      })
    );
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/herd-risk', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'herd_risk', data: req.body }));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/panel', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'specialist_panel', data: req.body, provider: req.body.provider }));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/one-health', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'one_health', data: req.body }));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/treatment', async (req, res) => {
  try {
    ok(res, await service.process({ capability: 'treatment_recommendation', data: req.body }));
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
    moduleId: 'M777_VETERINARY_AI',
    timestamp: new Date().toISOString(),
  })
);

module.exports = router;
