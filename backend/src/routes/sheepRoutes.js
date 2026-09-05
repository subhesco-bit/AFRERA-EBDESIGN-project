/**
 * Sheep Farming Routes — REST API endpoints for M125 Sheep Farming Management.
 *
 * Provides flock management, wool production tracking, feed consumption,
 * breeding records, and vaccination records for sheep farming operations.
 */

const express = require('express');
const {
  listFlock,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  listWoolProduction,
  recordWoolProduction,
  listFeedConsumption,
  recordFeedConsumption,
  listBreedingRecords,
  recordBreeding,
  updateLambingOutcome,
  listVaccinationRecords,
  recordVaccination,
  getFlockPerformance,
  getBreedingAlerts,
  getVaccinationAlerts,
  getShearingAlerts,
  // AI-embedded functions
  optimizeWoolProduction,
  monitorSheepHealth,
  optimizeSheepFeed,
  recommendSheepBreeding,
} = require('../services/legacy/sheepService');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');
const { protectLivestockRouter } = require('./livestockRouteSupport');

const router = express.Router();
protectLivestockRouter(router);

router.use(authMiddleware);
router.use(rateLimiter);

/**
 * GET /api/v1/sheep/flock
 * List all flock animals with optional status and sex filters.
 */
router.get('/flock', async (req, res, next) => {
  try {
    const { page, limit, status, sex } = req.query;
    const result = await listFlock({ page, limit, status, sex });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('sheepRoutes:listFlock', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/sheep/flock
 * Create a new flock animal.
 */
router.post('/flock', async (req, res, next) => {
  try {
    const animal = await createAnimal(req.body);
    res.json({ success: true, data: animal });
  } catch (error) {
    logger.error('sheepRoutes:createAnimal', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/flock/:id
 * Get a specific flock animal by ID.
 */
router.get('/flock/:id', async (req, res, next) => {
  try {
    let result = await listFlock({});
    let animal = result.items.find((a) => a.id === req.params.id);
    if (!animal) {
      return res.status(404).json({ success: false, error: 'Animal not found' });
    }
    res.json({ success: true, data: animal });
  } catch (error) {
    logger.error('sheepRoutes:getAnimal', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/sheep/flock/:id
 * Update a flock animal.
 */
router.put('/flock/:id', async (req, res, next) => {
  try {
    let animal = await updateAnimal(req.params.id, req.body);
    if (!animal) {
      return res.status(404).json({ success: false, error: 'Animal not found' });
    }
    res.json({ success: true, data: animal });
  } catch (error) {
    logger.error('sheepRoutes:updateAnimal', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/sheep/flock/:id
 * Delete a flock animal.
 */
router.delete('/flock/:id', async (req, res, next) => {
  try {
    const deleted = await deleteAnimal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Animal not found' });
    }
    res.json({ success: true, message: 'Animal deleted' });
  } catch (error) {
    logger.error('sheepRoutes:deleteAnimal', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/flock/:animalId/wool-production
 * List wool production records for an animal.
 */
router.get('/flock/:animalId/wool-production', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    let result = await listWoolProduction(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('sheepRoutes:listWoolProduction', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/sheep/flock/:animalId/wool-production
 * Record wool production for an animal.
 */
router.post('/flock/:animalId/wool-production', async (req, res, next) => {
  try {
    const record = await recordWoolProduction({ ...req.body, animal_id: req.params.animalId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('sheepRoutes:recordWoolProduction', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/flock/:animalId/feed-consumption
 * List feed consumption records for an animal.
 */
router.get('/flock/:animalId/feed-consumption', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    let result = await listFeedConsumption(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('sheepRoutes:listFeedConsumption', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/sheep/flock/:animalId/register-feed-consumption
 * Record feed consumption for an animal.
 */
router.post('/flock/:animalId/feed-consumption', async (req, res, next) => {
  try {
    let record = await recordFeedConsumption({ ...req.body, animal_id: req.params.animalId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('sheepRoutes:recordFeedConsumption', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/flock/:femaleId/breeding
 * List breeding records for a female animal.
 */
router.get('/flock/:femaleId/breeding', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    let result = await listBreedingRecords(req.params.femaleId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('sheepRoutes:listBreedingRecords', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/sheep/flock/:femaleId/breeding
 * Record a breeding event for a female animal.
 */
router.post('/flock/:femaleId/breeding', async (req, res, next) => {
  try {
    let record = await recordBreeding({ ...req.body, female_id: req.params.femaleId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('sheepRoutes:recordBreeding', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/sheep/breeding/:id
 * PUT /api/v1/sheep/breeding/:id/lambing-outcome
 * Update lambing outcome for a breeding record.
 *
 * F3 fix (2026-08-30): frontend (frontend/src/services/api.js:588,
 * updateLambingOutcome) calls the `/lambing-outcome` suffixed path; both
 * paths now delegate to the same handler - no behavior change for the bare
 * path's existing callers.
 */
router.put(['/breeding/:id', '/breeding/:id/lambing-outcome'], async (req, res, next) => {
  try {
    let record = await updateLambingOutcome(req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Breeding record not found' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('sheepRoutes:updateLambingOutcome', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/flock/:animalId/vaccinations
 * List vaccination records for an animal.
 */
router.get('/flock/:animalId/vaccinations', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    let result = await listVaccinationRecords(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('sheepRoutes:listVaccinationRecords', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/sheep/flock/:animalId/vaccinations
 * Record a vaccination for an animal.
 */
router.post('/flock/:animalId/vaccinations', async (req, res, next) => {
  try {
    let record = await recordVaccination({ ...req.body, animal_id: req.params.animalId });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('sheepRoutes:recordVaccination', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/flock/:animalId/performance
 * Get computed performance metrics for an animal.
 */
router.get('/flock/:animalId/performance', async (req, res, next) => {
  try {
    const performance = await getFlockPerformance(req.params.animalId);
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('sheepRoutes:getFlockPerformance', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/breeding-alerts
 * Get lambing due-date alerts across all active females.
 */
router.get('/breeding-alerts', async (req, res, next) => {
  try {
    const alerts = await getBreedingAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('sheepRoutes:getBreedingAlerts', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/vaccination-alerts
 * Get vaccination due-date alerts across all active animals.
 */
router.get('/vaccination-alerts', async (req, res, next) => {
  try {
    let alerts = await getVaccinationAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('sheepRoutes:getVaccinationAlerts', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/sheep/shearing-alerts
 * Get shearing due-date alerts across all active animals.
 */
router.get('/shearing-alerts', async (req, res, next) => {
  try {
    let alerts = await getShearingAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('sheepRoutes:getShearingAlerts', { error: error.message });
    next(error);
  }
});

// ---------------------------------------------------------------------
// AI-Embedded Routes for Sheep Management
// ---------------------------------------------------------------------

/**
 * POST /api/v1/sheep/ai/optimize-wool/:animalId
 * AI-powered wool production optimization
 */
router.post('/ai/optimize-wool/:animalId', async (req, res, next) => {
  try {
    let result = await optimizeWoolProduction(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('sheepRoutes:optimizeWoolProduction', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/sheep/ai/monitor-health/:animalId
 * AI-powered health monitoring
 */
router.post('/ai/monitor-health/:animalId', async (req, res, next) => {
  try {
    let result = await monitorSheepHealth(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('sheepRoutes:monitorSheepHealth', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/sheep/ai/optimize-feed/:animalId
 * AI-powered feed optimization
 */
router.post('/ai/optimize-feed/:animalId', async (req, res, next) => {
  try {
    const { productionGoal } = req.body;
    let result = await optimizeSheepFeed(req.params.animalId, productionGoal);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('sheepRoutes:optimizeSheepFeed', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/sheep/ai/recommend-breeding/:animalId
 * AI-powered breeding recommendations
 */
router.post('/ai/recommend-breeding/:animalId', async (req, res, next) => {
  try {
    let result = await recommendSheepBreeding(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('sheepRoutes:recommendSheepBreeding', { error: error.message });
    next(error);
  }
});

module.exports = router;
