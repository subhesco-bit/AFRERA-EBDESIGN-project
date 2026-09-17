/**
 * dairy Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'dairyRoutes',
    message: 'Route operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'dairyRoutes'
  });
});

// 2026-09-17: found while auditing DairyManagementPage.jsx's dairyAIAPI
// (optimizeMilkProduction/predictHealthRisks/optimizeFeedComposition/
// recommendBreeding) against api.js - none of those methods existed.
// Traced the real backend: services/legacy/dairyService.js is a genuine,
// DB-backed (dairy_animals/dairy_milk_records, migration
// 065_dairy_management_schema.sql) service that computes real yield/fat-
// content trends from real historical records and calls a real AI backbone
// (services/legacy/aiBackboneService.js's optimizeLivestock -> a real LLM
// call via callAI(), not Math.random()) - it just had no route file at all
// (this file, already mounted at /api/dairy, was the "Route operational"
// scaffold in front of it).
//
// FLAGGED, not silently fixed: optimizeMilkProduction/predictHealthRisks
// embed a feed-consumption ESTIMATE (avgYield * 0.05, commented "Sample
// data" in the service itself) into the AI prompt rather than a measured
// reading - no real feed-consumption table exists to query instead.
// optimizeFeedComposition/recommendBreeding go further: their
// "currentComposition" feed numbers (dry_matter_kg/protein_percentage/
// energy_mj/etc.) are 100% hardcoded constants, identical for every
// animal, not derived from any real column - the closest thing to the
// "calculateFDI" fabrication pattern this session watches for. None of
// these numbers are returned to the frontend directly (they're internal
// AI-prompt inputs only - the response is the AI's free-text analysis plus
// the real yield/fat-content stats), so wiring the endpoints themselves
// doesn't put fabricated numbers in front of a user, but the AI's
// recommendations are partly informed by this fake baseline - a
// pre-existing gap in the service worth a dedicated follow-up, not
// introduced or fixed here.
const dairyService = require('../services/legacy/dairyService.js');

router.post('/ai/optimize-milk-production', async (req, res) => {
  try {
    const result = await dairyService.optimizeMilkProduction(req.body.animalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/predict-health-risks', async (req, res) => {
  try {
    const result = await dairyService.predictHealthRisks(req.body.animalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/optimize-feed-composition', async (req, res) => {
  try {
    const result = await dairyService.optimizeFeedComposition(req.body.animalId, req.body.productionGoal);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/recommend-breeding', async (req, res) => {
  try {
    const result = await dairyService.recommendBreeding(req.body.animalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
