/**
 * Animal Health Routes — REST API endpoints for M127 Animal Health Management.
 *
 * Cross-cutting health management for all livestock types (dairy, poultry,
 * goat, sheep, pig). Provides health examinations, treatments, disease
 * outbreak tracking, and quarantine management.
 */

const express = require('express');
const {
  listExaminations,
  createExamination,
  updateExamination,
  deleteExamination,
  listTreatments,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  listOutbreaks,
  createOutbreak,
  updateOutbreak,
  deleteOutbreak,
  listQuarantines,
  createQuarantine,
  updateQuarantine,
  deleteQuarantine,
  getHealthOverview,
  getActiveOutbreaks,
  getActiveQuarantines,
} = require('../services/legacy/animalHealthService');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { protectLivestockRouter } = require('./livestockRouteSupport');

const router = express.Router();
protectLivestockRouter(router);

router.use(authMiddleware);
router.use(apiLimiter);

/**
 * GET /api/v1/animal-health/examinations
 * List health examinations with optional filters.
 */
router.get('/examinations', async (req, res, next) => {
  try {
    const { page, limit, animal_type, health_status } = req.query;
    const result = await listExaminations({ page, limit, animal_type, health_status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('animalHealthRoutes:listExaminations', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/animal-health/examinations
 * Create a new health examination.
 */
router.post('/examinations', async (req, res, next) => {
  try {
    const examination = await createExamination(req.body);
    
    // Emit signal for animal health check
    signalBus.emitSignal(SIGNAL.ANIMAL_HEALTH_CHECK, {
      examinationId: examination.id,
      animalId: examination.animal_id,
      animalType: examination.animal_type,
      healthStatus: examination.health_status,
      examinationDate: examination.examination_date
    }, {
      severity: examination.health_status === 'critical' ? SEVERITY.WARNING : SEVERITY.INFO,
      source: 'animal_health_routes',
      entityId: examination.animal_id
    });
    
    res.json({ success: true, data: examination });
  } catch (error) {
    logger.error('animalHealthRoutes:createExamination', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/animal-health/examinations/:id
 * Update a health examination.
 */
router.put('/examinations/:id', async (req, res, next) => {
  try {
    let examination = await updateExamination(req.params.id, req.body);
    if (!examination) {
      return res.status(404).json({ success: false, error: 'Examination not found' });
    }
    res.json({ success: true, data: examination });
  } catch (error) {
    logger.error('animalHealthRoutes:updateExamination', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/animal-health/examinations/:id
 * Delete a health examination.
 */
router.delete('/examinations/:id', async (req, res, next) => {
  try {
    const deleted = await deleteExamination(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Examination not found' });
    }
    res.json({ success: true, data: deleted });
  } catch (error) {
    logger.error('animalHealthRoutes:deleteExamination', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/animal-health/treatments
 * List treatments with optional animal type filter.
 */
router.get('/treatments', async (req, res, next) => {
  try {
    const { page, limit, animal_type } = req.query;
    let result = await listTreatments({ page, limit, animal_type });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('animalHealthRoutes:listTreatments', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/animal-health/treatments
 * Create a new treatment record.
 */
router.post('/treatments', async (req, res, next) => {
  try {
    const treatment = await createTreatment(req.body);
    
    // Emit signal for animal treatment
    signalBus.emitSignal(SIGNAL.ANIMAL_TREATMENT, {
      treatmentId: treatment.id,
      animalId: treatment.animal_id,
      animalType: treatment.animal_type,
      treatmentType: treatment.treatment_type,
      medication: treatment.medication,
      treatmentDate: treatment.treatment_date
    }, {
      severity: SEVERITY.INFO,
      source: 'animal_health_routes',
      entityId: treatment.animal_id
    });
    
    res.json({ success: true, data: treatment });
  } catch (error) {
    logger.error('animalHealthRoutes:createTreatment', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/animal-health/treatments/:id
 * Update a treatment record.
 */
router.put('/treatments/:id', async (req, res, next) => {
  try {
    let treatment = await updateTreatment(req.params.id, req.body);
    if (!treatment) {
      return res.status(404).json({ success: false, error: 'Treatment not found' });
    }
    res.json({ success: true, data: treatment });
  } catch (error) {
    logger.error('animalHealthRoutes:updateTreatment', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/animal-health/treatments/:id
 * Delete a treatment record.
 */
router.delete('/treatments/:id', async (req, res, next) => {
  try {
    let deleted = await deleteTreatment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Treatment not found' });
    }
    res.json({ success: true, data: deleted });
  } catch (error) {
    logger.error('animalHealthRoutes:deleteTreatment', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/animal-health/outbreaks
 * List disease outbreaks with optional filters.
 */
router.get('/outbreaks', async (req, res, next) => {
  try {
    const { page, limit, status, affected_animal_type } = req.query;
    let result = await listOutbreaks({ page, limit, status, affected_animal_type });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('animalHealthRoutes:listOutbreaks', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/animal-health/outbreaks
 * Create a new disease outbreak record.
 */
router.post('/outbreaks', async (req, res, next) => {
  try {
    const outbreak = await createOutbreak(req.body);
    
    // Emit signal for disease outbreak
    signalBus.emitSignal(SIGNAL.DISEASE_OUTBREAK, {
      outbreakId: outbreak.id,
      diseaseType: outbreak.disease_type,
      affectedAnimalType: outbreak.affected_animal_type,
      location: outbreak.location,
      severity: outbreak.severity,
      startDate: outbreak.start_date
    }, {
      severity: outbreak.severity === 'critical' ? SEVERITY.CRITICAL : SEVERITY.WARNING,
      source: 'animal_health_routes',
      entityId: outbreak.id
    });
    
    res.json({ success: true, data: outbreak });
  } catch (error) {
    logger.error('animalHealthRoutes:createOutbreak', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/animal-health/outbreaks/:id
 * Update a disease outbreak record.
 */
router.put('/outbreaks/:id', async (req, res, next) => {
  try {
    let outbreak = await updateOutbreak(req.params.id, req.body);
    if (!outbreak) {
      return res.status(404).json({ success: false, error: 'Outbreak not found' });
    }
    res.json({ success: true, data: outbreak });
  } catch (error) {
    logger.error('animalHealthRoutes:updateOutbreak', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/animal-health/outbreaks/:id
 * Delete a disease outbreak record.
 */
router.delete('/outbreaks/:id', async (req, res, next) => {
  try {
    let deleted = await deleteOutbreak(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Outbreak not found' });
    }
    res.json({ success: true, data: deleted });
  } catch (error) {
    logger.error('animalHealthRoutes:deleteOutbreak', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/animal-health/quarantines
 * List quarantine records with optional filters.
 */
router.get('/quarantines', async (req, res, next) => {
  try {
    const { page, limit, status, animal_type } = req.query;
    let result = await listQuarantines({ page, limit, status, animal_type });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('animalHealthRoutes:listQuarantines', { error: error.message });
    next(error);
  }
});

/**
 * POST /api/v1/animal-health/quarantines
 * Create a new quarantine record.
 */
router.post('/quarantines', async (req, res, next) => {
  try {
    const quarantine = await createQuarantine(req.body);
    
    // Emit signal for quarantine establishment
    signalBus.emitSignal(SIGNAL.QUARANTINE_ESTABLISHED, {
      quarantineId: quarantine.id,
      animalId: quarantine.animal_id,
      animalType: quarantine.animal_type,
      reason: quarantine.reason,
      startDate: quarantine.start_date,
      expectedEndDate: quarantine.expected_end_date
    }, {
      severity: SEVERITY.WARNING,
      source: 'animal_health_routes',
      entityId: quarantine.animal_id
    });
    
    res.json({ success: true, data: quarantine });
  } catch (error) {
    logger.error('animalHealthRoutes:createQuarantine', { error: error.message });
    next(error);
  }
});

/**
 * PUT /api/v1/animal-health/quarantines/:id
 * Update a quarantine record.
 */
router.put('/quarantines/:id', async (req, res, next) => {
  try {
    let quarantine = await updateQuarantine(req.params.id, req.body);
    if (!quarantine) {
      return res.status(404).json({ success: false, error: 'Quarantine not found' });
    }
    res.json({ success: true, data: quarantine });
  } catch (error) {
    logger.error('animalHealthRoutes:updateQuarantine', { error: error.message });
    next(error);
  }
});

/**
 * DELETE /api/v1/animal-health/quarantines/:id
 * Delete a quarantine record.
 */
router.delete('/quarantines/:id', async (req, res, next) => {
  try {
    let deleted = await deleteQuarantine(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Quarantine record not found' });
    }
    res.json({ success: true, data: deleted });
  } catch (error) {
    logger.error('animalHealthRoutes:deleteQuarantine', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/animal-health/overview
 * Get aggregate health overview across all animal types.
 */
router.get('/overview', async (req, res, next) => {
  try {
    const overview = await getHealthOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    logger.error('animalHealthRoutes:getHealthOverview', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/animal-health/active-outbreaks
 * Get currently active disease outbreaks.
 */
router.get('/active-outbreaks', async (req, res, next) => {
  try {
    const outbreaks = await getActiveOutbreaks();
    res.json({ success: true, data: outbreaks });
  } catch (error) {
    logger.error('animalHealthRoutes:getActiveOutbreaks', { error: error.message });
    next(error);
  }
});

/**
 * GET /api/v1/animal-health/active-quarantines
 * Get animals currently under quarantine.
 */
router.get('/active-quarantines', async (req, res, next) => {
  try {
    const quarantines = await getActiveQuarantines();
    res.json({ success: true, data: quarantines });
  } catch (error) {
    logger.error('animalHealthRoutes:getActiveQuarantines', { error: error.message });
    next(error);
  }
});

module.exports = router;
