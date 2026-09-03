/**
 * Pig Farming Routes — REST API endpoints for M126 Pig Farming Management.
 *
 * Provides herd management, weight tracking, feed consumption,
 * breeding records, and vaccination records for pig farming operations.
 */

const express = require('express');
const {
  listHerd,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  listWeightRecords,
  recordWeight,
  listFeedConsumption,
  recordFeedConsumption,
  listBreedingRecords,
  recordBreeding,
  updateFarrowingOutcome,
  listVaccinationRecords,
  recordVaccination,
  getHerdPerformance,
  getBreedingAlerts,
  getVaccinationAlerts,
  // AI-embedded functions
  optimizeMeatProduction,
  monitorPigHealth,
  optimizePigFeed,
  recommendPigBreeding,
} = require('../services/legacy/pigService');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');
const { protectLivestockRouter } = require('./livestockRouteSupport');

const router = express.Router();
protectLivestockRouter(router);

router.use(authMiddleware);
router.use(rateLimiter);

/**
 * GET /api/v1/pig/herd
 * List all herd animals with optional status and sex filters.
 */
router.get('/herd', async (req, res, next) => {
  try {
    const { page, limit, status, sex } = req.query;
    const result = await listHerd({ page, limit, status, sex });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('pigRoutes:listHerd', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/pig/herd
 * Create a new herd animal.
 */
router.post('/herd', async (req, res, next) => {
  try {
    const animal = await createAnimal(req.body);
    res.json({ success: true, data: animal });
  } catch (error) {
    logger.error('pigRoutes:createAnimal', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/herd/:id
 * Get a specific herd animal by ID.
 */
router.get('/herd/:id', async (req, res, next) => {
  try {
    const result = await listHerd({});
    const animal = result.items.find((a) => a.id === req.params.id);
    if (!animal) {
      return res.status(404).json({ success: false, error: 'Animal not found' });
    }
    res.json({ success: true, data: animal });
  } catch (error) {
    logger.error('pigRoutes:getAnimal', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/pig/herd/:id
 * Update a herd animal.
 */
router.put('/herd/:id', async (req, res, next) => {
  try {
    const animal = await updateAnimal(req.params.id, req.body);
    if (!animal) {
      return res.status(404).json({ success: false, error: 'Animal not found' });
    }
    res.json({ success: true, data: animal });
  } catch (error) {
    logger.error('pigRoutes:updateAnimal', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/pig/herd/:id
 * Delete a herd animal.
 */
router.delete('/herd/:id', async (req, res, next) => {
  try {
    const deleted = await deleteAnimal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Animal not found' });
    }
    res.json({ success: true, message: 'Animal deleted' });
  } catch (error) {
    logger.error('pigRoutes:deleteAnimal', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/herd/:animalId/weight-records
 * List weight records for an animal.
 */
router.get('/herd/:animalId/weight-records', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listWeightRecords(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('pigRoutes:listWeightRecords', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/pig/herd/:animalId/weight-records
 * Record weight for an animal.
 */
router.post('/herd/:animalId/weight-records', async (req, res, next) => {
  try {
    const record = await recordWeight({ ...req.body, animal_id: req.params.animalId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('pigRoutes:recordWeight', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/herd/:animalId/feed-consumption
 * List feed consumption records for an animal.
 */
router.get('/herd/:animalId/feed-consumption', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listFeedConsumption(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('pigRoutes:listFeedConsumption', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/pig/herd/:animalId/feed-consumption
 * Record feed consumption for an animal.
 */
router.post('/herd/:animalId/feed-consumption', async (req, res, next) => {
  try {
    const record = await recordFeedConsumption({ ...req.body, animal_id: req.params.animalId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('pigRoutes:recordFeedConsumption', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/herd/:sowId/breeding
 * List breeding records for a sow.
 */
router.get('/herd/:sowId/breeding', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listBreedingRecords(req.params.sowId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('pigRoutes:listBreedingRecords', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/pig/herd/:sowId/breeding
 * Record a breeding event for a sow.
 */
router.post('/herd/:sowId/breeding', async (req, res, next) => {
  try {
    const record = await recordBreeding({ ...req.body, sow_id: req.params.sowId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('pigRoutes:recordBreeding', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/pig/breeding/:id
 * PUT /api/v1/pig/breeding/:id/farrowing-outcome
 * Update farrowing outcome for a breeding record.
 *
 * F3 fix (2026-08-30): frontend (frontend/src/services/api.js:610,
 * updateFarrowingOutcome) calls the `/farrowing-outcome` suffixed path;
 * both paths now delegate to the same handler - no behavior change for the
 * bare path's existing callers.
 */
router.put(['/breeding/:id', '/breeding/:id/farrowing-outcome'], async (req, res, next) => {
  try {
    const record = await updateFarrowingOutcome(req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Breeding record not found' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('pigRoutes:updateFarrowingOutcome', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/herd/:animalId/vaccinations
 * List vaccination records for an animal.
 */
router.get('/herd/:animalId/vaccinations', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listVaccinationRecords(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('pigRoutes:listVaccinationRecords', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/pig/herd/:animalId/vaccinations
 * Record a vaccination for an animal.
 */
router.post('/herd/:animalId/vaccinations', async (req, res, next) => {
  try {
    const record = await recordVaccination({ ...req.body, animal_id: req.params.animalId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('pigRoutes:recordVaccination', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/herd/:animalId/performance
 * Get computed performance metrics for an animal.
 */
router.get('/herd/:animalId/performance', async (req, res, next) => {
  try {
    const performance = await getHerdPerformance(req.params.animalId);
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('pigRoutes:getHerdPerformance', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/herd/:animalId/fcr
 * Get feed-conversion-ratio for an animal.
 *
 * F4 fix (2026-08-30): frontend (frontend/src/services/api.js:617,
 * getFeedConversionRatio) calls this dedicated path; no route previously
 * existed. Reuses getHerdPerformance() (real FCR calc, feed consumed /
 * weight gained over the trailing 30 days from pig_feed_consumption /
 * pig_weight_records - see that function, ~line 393) rather than
 * duplicating the query, and returns just the FCR-relevant subset.
 */
router.get('/herd/:animalId/fcr', async (req, res, next) => {
  try {
    const performance = await getHerdPerformance(req.params.animalId);
    res.json({
      success: true,
      data: {
        animalId: performance.animalId,
        tagId: performance.tagId,
        period: performance.period,
        feedConversionRatio: performance.metrics.feedConversionRatio,
        fcrStatus: performance.metrics.fcrStatus,
        targetFCR: performance.metrics.targetFCR,
        dailyFeedAvgKg: performance.metrics.dailyFeedAvgKg,
        avgWeightKg: performance.metrics.avgWeightKg,
        dataQuality: performance.dataQuality,
        assumptions: performance.assumptions,
      },
    });
  } catch (error) {
    logger.error('pigRoutes:getFeedConversionRatio', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/breeding-alerts
 * Get farrowing due-date alerts across all active sows.
 */
router.get('/breeding-alerts', async (req, res, next) => {
  try {
    const alerts = await getBreedingAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('pigRoutes:getBreedingAlerts', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/pig/vaccination-alerts
 * Get vaccination due-date alerts across all active animals.
 */
router.get('/vaccination-alerts', async (req, res, next) => {
  try {
    const alerts = await getVaccinationAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('pigRoutes:getVaccinationAlerts', { error: error.message });
    next(error);
  }
});

// ---------------------------------------------------------------------
// AI-Embedded Routes for Pig Management
// ---------------------------------------------------------------------

/**
 * POST /api/v1/pig/ai/optimize-meat/:animalId
 * AI-powered meat production optimization
 */
router.post('/ai/optimize-meat/:animalId', async (req, res, next) => {
  try {
    const result = await optimizeMeatProduction(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('pigRoutes:optimizeMeatProduction', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/pig/ai/monitor-health/:animalId
 * AI-powered health monitoring
 */
router.post('/ai/monitor-health/:animalId', async (req, res, next) => {
  try {
    const result = await monitorPigHealth(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('pigRoutes:monitorPigHealth', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/pig/ai/optimize-feed/:animalId
 * AI-powered feed optimization
 */
router.post('/ai/optimize-feed/:animalId', async (req, res, next) => {
  try {
    const { productionGoal } = req.body;
    const result = await optimizePigFeed(req.params.animalId, productionGoal);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('pigRoutes:optimizePigFeed', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/pig/ai/recommend-breeding/:animalId
 * AI-powered breeding recommendations
 */
router.post('/ai/recommend-breeding/:animalId', async (req, res, next) => {
  try {
    const result = await recommendPigBreeding(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('pigRoutes:recommendPigBreeding', { error: error.message });
    next(error);
  }
});

module.exports = router;
