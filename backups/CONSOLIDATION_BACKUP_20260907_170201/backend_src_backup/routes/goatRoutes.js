/**
 * Goat Farming Routes — REST API endpoints for M124 Goat Farming Management.
 *
 * Provides herd management, milk production tracking, feed consumption,
 * breeding records, and vaccination records for goat farming operations.
 */

const express = require('express');
const {
  listHerd,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  listMilkProduction,
  recordMilkProduction,
  listFeedConsumption,
  recordFeedConsumption,
  listBreedingRecords,
  recordBreeding,
  updateKiddingOutcome,
  listVaccinationRecords,
  recordVaccination,
  getHerdPerformance,
  getBreedingAlerts,
  getVaccinationAlerts,
  // AI-embedded functions
  optimizeGoatMilkProduction,
  monitorGoatHealth,
  optimizeGoatFeed,
  recommendGoatBreeding,
} = require('../services/legacy/goatService');
const { authMiddleware } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');

const router = express.Router();

router.use(authMiddleware);
router.use(rateLimiter);

/**
 * GET /api/v1/goat/herd
 * List all herd animals with optional status and sex filters.
 */
router.get('/herd', async (req, res, next) => {
  try {
    const { page, limit, status, sex } = req.query;
    const result = await listHerd({ page, limit, status, sex });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('goatRoutes:listHerd', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/goat/herd
 * Create a new herd animal.
 */
router.post('/herd', async (req, res, next) => {
  try {
    const animal = await createAnimal(req.body);
    res.json({ success: true, data: animal });
  } catch (error) {
    logger.error('goatRoutes:createAnimal', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/goat/herd/:id
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
    logger.error('goatRoutes:getAnimal', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/goat/herd/:id
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
    logger.error('goatRoutes:updateAnimal', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/goat/herd/:id
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
    logger.error('goatRoutes:deleteAnimal', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/goat/herd/:animalId/milk-production
 * List milk production records for an animal.
 */
router.get('/herd/:animalId/milk-production', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listMilkProduction(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('goatRoutes:listMilkProduction', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/goat/herd/:animalId/milk-production
 * Record milk production for an animal.
 */
router.post('/herd/:animalId/milk-production', async (req, res, next) => {
  try {
    const record = await recordMilkProduction({ ...req.body, animal_id: req.params.animalId });
    
    // Emit signal for milk production recording
    signalBus.emitSignal(SIGNAL.MILK_PRODUCTION_RECORDED, {
      recordId: record.id,
      animalId: req.params.animalId,
      animalType: 'goat',
      quantity: record.quantity,
      quality: record.quality,
      recordingDate: record.recording_date
    }, {
      severity: SEVERITY.INFO,
      source: 'goat_routes',
      entityId: req.params.animalId
    });
    
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('goatRoutes:recordMilkProduction', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/goat/herd/:animalId/feed-consumption
 * List feed consumption records for an animal.
 */
router.get('/herd/:animalId/feed-consumption', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listFeedConsumption(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('goatRoutes:listFeedConsumption', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/goat/herd/:animalId/feed-consumption
 * Record feed consumption for an animal.
 */
router.post('/herd/:animalId/feed-consumption', async (req, res, next) => {
  try {
    const record = await recordFeedConsumption({ ...req.body, animal_id: req.params.animalId });
    
    // Emit signal for feed consumption recording
    signalBus.emitSignal(SIGNAL.FEED_CONSUMPTION_RECORDED, {
      recordId: record.id,
      animalId: req.params.animalId,
      animalType: 'goat',
      feedType: record.feed_type,
      quantity: record.quantity,
      recordingDate: record.recording_date
    }, {
      severity: SEVERITY.INFO,
      source: 'goat_routes',
      entityId: req.params.animalId
    });
    
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('goatRoutes:recordFeedConsumption', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/goat/herd/:femaleId/breeding
 * List breeding records for a female animal.
 */
router.get('/herd/:femaleId/breeding', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listBreedingRecords(req.params.femaleId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('goatRoutes:listBreedingRecords', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/goat/herd/:femaleId/breeding
 * Record a breeding event for a female animal.
 */
router.post('/herd/:femaleId/breeding', async (req, res, next) => {
  try {
    const record = await recordBreeding({ ...req.body, female_id: req.params.femaleId });
    
    // Emit signal for breeding recording
    signalBus.emitSignal(SIGNAL.BREEDING_RECORDED, {
      recordId: record.id,
      femaleId: req.params.femaleId,
      animalType: 'goat',
      maleId: record.male_id,
      breedingDate: record.breeding_date,
      expectedKiddingDate: record.expected_kidding_date
    }, {
      severity: SEVERITY.INFO,
      source: 'goat_routes',
      entityId: req.params.femaleId
    });
    
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('goatRoutes:recordBreeding', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/goat/breeding/:id
 * PUT /api/v1/goat/breeding/:id/kidding-outcome
 * Update kidding outcome for a breeding record.
 *
 * F3 fix (2026-08-30): frontend (frontend/src/services/api.js:567,
 * updateKiddingOutcome) calls the `/kidding-outcome` suffixed path; the
 * bare `/breeding/:id` route below was the only one registered. Both paths
 * now delegate to the same handler/service call - same body shape, no
 * behavior change for existing callers of the bare path.
 */
router.put(['/breeding/:id', '/breeding/:id/kidding-outcome'], async (req, res, next) => {
  try {
    const record = await updateKiddingOutcome(req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Breeding record not found' });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('goatRoutes:updateKiddingOutcome', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/goat/herd/:animalId/vaccinations
 * List vaccination records for an animal.
 */
router.get('/herd/:animalId/vaccinations', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await listVaccinationRecords(req.params.animalId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('goatRoutes:listVaccinationRecords', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/goat/herd/:animalId/vaccinations
 * Record a vaccination for an animal.
 */
router.post('/herd/:animalId/vaccinations', async (req, res, next) => {
  try {
    const record = await recordVaccination({ ...req.body, animal_id: req.params.animalId });
    
    // Emit signal for vaccination administration
    signalBus.emitSignal(SIGNAL.VACCINATION_ADMINISTERED, {
      recordId: record.id,
      animalId: req.params.animalId,
      animalType: 'goat',
      vaccineType: record.vaccine_type,
      vaccinationDate: record.vaccination_date,
      nextDueDate: record.next_due_date
    }, {
      severity: SEVERITY.INFO,
      source: 'goat_routes',
      entityId: req.params.animalId
    });
    
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('goatRoutes:recordVaccination', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/goat/herd/:animalId/performance
 * Get computed performance metrics for an animal.
 */
router.get('/herd/:animalId/performance', async (req, res, next) => {
  try {
    const performance = await getHerdPerformance(req.params.animalId);
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('goatRoutes:getHerdPerformance', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/goat/breeding-alerts
 * Get kidding due-date alerts across all active females.
 */
router.get('/breeding-alerts', async (req, res, next) => {
  try {
    const alerts = await getBreedingAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('goatRoutes:getBreedingAlerts', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/goat/vaccination-alerts
 * Get vaccination due-date alerts across all active animals.
 */
router.get('/vaccination-alerts', async (req, res, next) => {
  try {
    const alerts = await getVaccinationAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('goatRoutes:getVaccinationAlerts', { error: error.message });
    next(error);
  }
});

// ---------------------------------------------------------------------
// AI-Embedded Routes for Goat Management
// ---------------------------------------------------------------------

/**
 * POST /api/v1/goat/ai/optimize-milk/:animalId
 * AI-powered milk production optimization
 */
router.post('/ai/optimize-milk/:animalId', async (req, res, next) => {
  try {
    const result = await optimizeGoatMilkProduction(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('goatRoutes:optimizeGoatMilkProduction', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/goat/ai/monitor-health/:animalId
 * AI-powered health monitoring
 */
router.post('/ai/monitor-health/:animalId', async (req, res, next) => {
  try {
    const result = await monitorGoatHealth(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('goatRoutes:monitorGoatHealth', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/goat/ai/optimize-feed/:animalId
 * AI-powered feed optimization
 */
router.post('/ai/optimize-feed/:animalId', async (req, res, next) => {
  try {
    const { productionGoal } = req.body;
    const result = await optimizeGoatFeed(req.params.animalId, productionGoal);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('goatRoutes:optimizeGoatFeed', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/goat/ai/recommend-breeding/:animalId
 * AI-powered breeding recommendations
 */
router.post('/ai/recommend-breeding/:animalId', async (req, res, next) => {
  try {
    const result = await recommendGoatBreeding(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('goatRoutes:recommendGoatBreeding', { error: error.message });
    next(error);
  }
});

module.exports = router;
