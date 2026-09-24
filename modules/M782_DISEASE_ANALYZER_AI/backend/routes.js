/**
 * M782_DISEASE_ANALYZER_AI Routes — 10/10 Image→Symptoms→Disease→Solution API
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

/** Generic capability processor */
router.post('/process', async (req, res) => {
  try {
    const { capability, data, provider, sessionId } = req.body;
    if (!capability || data === undefined) return fail(res, 400, 'Missing capability or data');
    const result = await service.process({ capability, data, provider, sessionId });
    ok(res, result);
  } catch (error) {
    logger.error('M782 /process error:', error);
    fail(res, 500, error);
  }
});

/**
 * Primary user flow:
 * POST /analyze
 * Body: {
 *   image_base64? | image_url?,
 *   cv_tags?: string[],
 *   model_predictions?: {label, score}[],
 *   description?: string,
 *   domain?: 'plant' | 'animal',
 *   crop?: string,
 *   species?: string,
 *   farming_system?: string,
 *   geo?: object,
 *   organic_preference?: boolean,
 *   sessionId?: string
 * }
 * Returns: symptoms series → disease ID → treatment → discussion prompt
 */
router.post('/analyze', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || randomUUID();
    const result = await service.process({
      capability: 'image_analysis',
      data: req.body,
      provider: req.body.provider,
      sessionId,
    });
    ok(res, { ...result, sessionId });
  } catch (error) {
    logger.error('M782 /analyze error:', error);
    fail(res, 500, error);
  }
});

/** Symptom series only */
router.post('/symptoms', async (req, res) => {
  try {
    const result = await service.process({
      capability: 'symptom_extraction',
      data: req.body,
      provider: req.body.provider,
    });
    ok(res, result);
  } catch (error) {
    fail(res, 500, error);
  }
});

/** Disease identification from symptoms */
router.post('/identify', async (req, res) => {
  try {
    const result = await service.process({
      capability: 'disease_identification',
      data: req.body,
      provider: req.body.provider,
    });
    ok(res, result);
  } catch (error) {
    fail(res, 500, error);
  }
});

/** Multi-turn discussion */
router.post('/discussion', async (req, res) => {
  try {
    const { message, sessionId, domain, provider } = req.body;
    if (!message) return fail(res, 400, 'message required');
    const result = await service.process({
      capability: 'discussion',
      data: { message, domain },
      provider,
      sessionId,
    });
    ok(res, result);
  } catch (error) {
    fail(res, 500, error);
  }
});

/** Treatment / solution */
router.post('/treatment', async (req, res) => {
  try {
    const result = await service.process({
      capability: 'treatment_recommendation',
      data: req.body,
      provider: req.body.provider,
    });
    ok(res, result);
  } catch (error) {
    fail(res, 500, error);
  }
});

/** Farmer support letter */
router.post('/farmer-letter', async (req, res) => {
  try {
    const result = await service.process({
      capability: 'farmer_letter',
      data: req.body,
      provider: req.body.provider,
    });
    ok(res, result);
  } catch (error) {
    fail(res, 500, error);
  }
});

/** One Health / Vet bridge */
router.post('/vet-bridge', async (req, res) => {
  try {
    const result = await service.process({
      capability: 'vet_bridge',
      data: req.body,
      provider: req.body.provider,
    });
    ok(res, result);
  } catch (error) {
    fail(res, 500, error);
  }
});

/** Outcome feedback for confidence calibration */
router.post('/outcome', async (req, res) => {
  try {
    const result = await service.process({
      capability: 'outcome_feedback',
      data: req.body,
      sessionId: req.body.sessionId,
      provider: req.body.provider,
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
    capabilities: svc.capabilities,
    version: '2.0.0-10x',
    primary_flow: 'POST /analyze → symptoms → disease → treatment; then /discussion or /outcome',
  });
});

router.get('/metrics', (req, res) => {
  ok(res, { success: true, metrics: service.getMetrics() });
});

module.exports = router;
