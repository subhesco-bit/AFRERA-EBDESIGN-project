/**
 * Animal Health + Specialist Panel bridge routes
 * Mounted by DynamicRouteLoader at /api/v1/animal-health-panel
 * Complements legacy animalHealthRoutes CRUD with clinical AI panel.
 */

const express = require('express');
const vet = require('../modules/veterinary');
const { assessSurveillance } = require('../modules/veterinary/onehealth/OneHealthSurveillance');
const { computeHerdRisk } = require('../modules/veterinary/herd/HerdRiskScoring');
const { VETERINARY_CLINICAL_DISCLAIMER } = require('../utils/disclaimers');
const { logger } = require('../utils/logger');

const router = express.Router();

router.get('/status', (_req, res) => {
  res.json({
    success: true,
    panel: true,
    species: vet.SUPPORTED_SPECIES,
    tier: 'grok-highest',
    knowledge_version: vet.knowledge.KNOWLEDGE_VERSION,
  });
});

router.post('/conference', (req, res) => {
  try {
    const report = vet.runConference(req.body || {});
    const surveillance = assessSurveillance({
      species: report.species,
      differentials: report.differentials,
      herd_risk: report.herd_risk,
      history: req.body?.history,
      location: req.body?.location,
      context: req.body?.context,
      lab_confirmed: req.body?.lab_confirmed,
      authority_confirmed: req.body?.authority_confirmed,
    });
    res.json({
      success: true,
      data: { ...report, one_health_surveillance: surveillance },
    });
  } catch (e) {
    logger.error('animalHealthPanelRoutes:conference', { error: e.message });
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

router.post('/herd-screen', (req, res) => {
  try {
    res.json({ success: true, data: vet.runHerdScreen(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

router.post('/herd-risk', (req, res) => {
  try {
    const data = computeHerdRisk(req.body || {});
    res.json({ success: true, data, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/one-health', (req, res) => {
  try {
    res.json({ success: true, data: assessSurveillance(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: VETERINARY_CLINICAL_DISCLAIMER });
  }
});

router.get('/international-stages', (_req, res) => {
  res.json({
    success: true,
    data: vet.INTERNATIONAL_STAGES,
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
  });
});

module.exports = router;
