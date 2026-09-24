/**
 * MODULE_TEMPLATE Routes — 10/10 operate surface
 */

'use strict';

const express = require('express');
const router = express.Router();
const service = require('./service');
const { logger } = require('../../../backend/src/utils/logger');
const { randomUUID } = require('crypto');

function ok(res, payload) {
  res.json(payload);
}
function fail(res, status, error) {
  res.status(status).json({ success: false, error: typeof error === 'string' ? error : error.message });
}

router.post('/process', async (req, res) => {
  try {
    const { capability, data, provider, sessionId } = req.body;
    if (!capability) return fail(res, 400, 'capability required');
    const result = await service.process({ capability, data, provider, sessionId });
    ok(res, result);
  } catch (error) {
    logger.error('process error:', error);
    fail(res, 500, error);
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || randomUUID();
    const result = await service.process({
      capability: 'analyze',
      data: req.body,
      provider: req.body.provider,
      sessionId,
    });
    ok(res, { ...result, sessionId });
  } catch (error) {
    fail(res, 500, error);
  }
});

router.post('/recommend', async (req, res) => {
  try {
    const result = await service.process({
      capability: 'recommend',
      data: req.body,
      provider: req.body.provider,
    });
    ok(res, result);
  } catch (error) {
    fail(res, 500, error);
  }
});

router.post('/outcome', async (req, res) => {
  try {
    const result = await service.process({
      capability: 'outcome_feedback',
      data: req.body,
      sessionId: req.body.sessionId,
    });
    ok(res, result);
  } catch (error) {
    fail(res, 500, error);
  }
});

router.get('/capabilities', (req, res) => {
  const svc = service.getInstance();
  ok(res, {
    success: true,
    moduleId: svc.moduleId,
    name: svc.name,
    version: svc.version,
    capabilities: svc.capabilities,
  });
});

router.get('/metrics', (req, res) => {
  ok(res, { success: true, metrics: service.getMetrics() });
});

router.get('/health', (req, res) => {
  ok(res, {
    success: true,
    status: 'healthy',
    moduleId: service.getInstance().moduleId,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
