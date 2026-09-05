/**
 * Poultry Routes — REST API endpoints for M123 Poultry Management.
 *
 * Provides flock management, egg production tracking, feed consumption,
 * mortality tracking, and vaccination records for poultry operations.
 */

const express = require('express');
const {
  listFlocks,
  createFlock,
  updateFlock,
  deleteFlock,
  listEggProduction,
  recordEggProduction,
  listFeedConsumption,
  recordFeedConsumption,
  listMortality,
  recordMortality,
  listVaccinationRecords,
  recordVaccination,
  getFlockPerformance,
  getVaccinationAlerts,
  // AI-embedded functions
  optimizeEggProduction,
  monitorFlockHealth,
  optimizePoultryFeed,
  predictMortalityRisk,
} = require('../services/legacy/poultryService');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');
const { protectLivestockRouter } = require('./livestockRouteSupport');

const router = express.Router();

router.use(authMiddleware);
router.use(rateLimiter);
protectLivestockRouter(router);

/**
 * GET /api/v1/poultry/flocks
 * List all flocks with optional status filter.
 */
router.get('/flocks', async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await listFlocks({ page, limit, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('poultryRoutes:listFlocks', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/poultry/flocks
 * Create a new flock.
 */
router.post('/flocks', async (req, res, next) => {
  try {
    const flock = await createFlock(req.body);
    res.json({ success: true, data: flock });
  } catch (error) {
    logger.error('poultryRoutes:createFlock', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/poultry/flocks/:id
 * Get a specific flock by ID.
 */
router.get('/flocks/:id', async (req, res, next) => {
  try {
    // For now, we'll use listFlocks and filter, or add a getFlockById function later
    let result = await listFlocks({});
    let flock = result.items.find((f) => f.id === req.params.id);
    if (!flock) {
      return res.status(404).json({ success: false, error: 'Flock not found' });
    }
    res.json({ success: true, data: flock });
  } catch (error) {
    logger.error('poultryRoutes:getFlock', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/poultry/flocks/:id
 * Update a flock.
 */
router.put('/flocks/:id', async (req, res, next) => {
  try {
    let flock = await updateFlock(req.params.id, req.body);
    if (!flock) {
      return res.status(404).json({ success: false, error: 'Flock not found' });
    }
    res.json({ success: true, data: flock });
  } catch (error) {
    logger.error('poultryRoutes:updateFlock', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/poultry/flocks/:id
 * Delete a flock.
 */
router.delete('/flocks/:id', async (req, res, next) => {
  try {
    const deleted = await deleteFlock(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Flock not found' });
    }
    res.json({ success: true, message: 'Flock deleted' });
  } catch (error) {
    logger.error('poultryRoutes:deleteFlock', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/poultry/flocks/:flockId/egg-production
 * List egg production records for a flock.
 */
router.get('/flocks/:flockId/egg-production', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    let result = await listEggProduction(req.params.flockId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('poultryRoutes:listEggProduction', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/poultry/flocks/:flockId/egg-production
 * Record egg production for a flock.
 */
router.post('/flocks/:flockId/egg-production', async (req, res, next) => {
  try {
    const record = await recordEggProduction({ ...req.body, flock_id: req.params.flockId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('poultryRoutes:recordEggProduction', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/poultry/flocks/:flockId/feed-consumption
 * List feed consumption records for a flock.
 */
router.get('/flocks/:flockId/feed-consumption', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    let result = await listFeedConsumption(req.params.flockId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('poultryRoutes:listFeedConsumption', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/poultry/flocks/:flockId/feed-consumption
 * Record feed consumption for a flock.
 */
router.post('/flocks/:flockId/feed-consumption', async (req, res, next) => {
  try {
    let record = await recordFeedConsumption({ ...req.body, flock_id: req.params.flockId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('poultryRoutes:recordFeedConsumption', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/poultry/flocks/:flockId/mortality
 * List mortality records for a flock.
 */
router.get('/flocks/:flockId/mortality', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    let result = await listMortality(req.params.flockId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('poultryRoutes:listMortality', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/poultry/flocks/:flockId/mortality
 * Record mortality for a flock.
 */
router.post('/flocks/:flockId/mortality', async (req, res, next) => {
  try {
    let record = await recordMortality({ ...req.body, flock_id: req.params.flockId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('poultryRoutes:recordMortality', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/poultry/flocks/:flockId/vaccinations
 * List vaccination records for a flock.
 */
router.get('/flocks/:flockId/vaccinations', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    let result = await listVaccinationRecords(req.params.flockId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('poultryRoutes:listVaccinationRecords', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/poultry/flocks/:flockId/vaccinations
 * Record a vaccination for a flock.
 */
router.post('/flocks/:flockId/vaccinations', async (req, res, next) => {
  try {
    let record = await recordVaccination({ ...req.body, flock_id: req.params.flockId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('poultryRoutes:recordVaccination', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/poultry/flocks/:flockId/performance
 * Get computed performance metrics for a flock.
 */
router.get('/flocks/:flockId/performance', async (req, res, next) => {
  try {
    const performance = await getFlockPerformance(req.params.flockId);
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('poultryRoutes:getFlockPerformance', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/poultry/vaccination-alerts
 * Get vaccination due-date alerts across all active flocks.
 */
router.get('/vaccination-alerts', async (req, res, next) => {
  try {
    const alerts = await getVaccinationAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('poultryRoutes:getVaccinationAlerts', { error: error.message });
    next(error);
  }
});

// ---------------------------------------------------------------------
// AI-Embedded Routes for Poultry Management
// ---------------------------------------------------------------------

/**
 * POST /api/v1/poultry/ai/optimize-production/:flockId
 * AI-powered egg production optimization
 */
router.post('/ai/optimize-production/:flockId', async (req, res, next) => {
  try {
    let result = await optimizeEggProduction(req.params.flockId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('poultryRoutes:optimizeEggProduction', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/poultry/ai/monitor-health/:flockId
 * AI-powered flock health monitoring
 */
router.post('/ai/monitor-health/:flockId', async (req, res, next) => {
  try {
    let result = await monitorFlockHealth(req.params.flockId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('poultryRoutes:monitorFlockHealth', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/poultry/ai/optimize-feed/:flockId
 * AI-powered feed optimization
 */
router.post('/ai/optimize-feed/:flockId', async (req, res, next) => {
  try {
    const { productionGoal } = req.body;
    let result = await optimizePoultryFeed(req.params.flockId, productionGoal);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('poultryRoutes:optimizePoultryFeed', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/poultry/ai/predict-mortality/:flockId
 * AI-powered mortality prediction
 */
router.post('/ai/predict-mortality/:flockId', async (req, res, next) => {
  try {
    let result = await predictMortalityRisk(req.params.flockId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('poultryRoutes:predictMortalityRisk', { error: error.message });
    next(error);
  }
});

module.exports = router;
