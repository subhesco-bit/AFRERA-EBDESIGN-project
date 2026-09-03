/**
 * Dairy Management Routes (M121 — Livestock domain)
 * Backs frontend/src/pages/DairyManagementPage.jsx — see
 * backend/src/services/dairyService.js and migration
 * 065_dairy_management_schema.sql for the full context.
 */

const express = require('express');
const router = express.Router();
const dairyService = require('../services/legacy/dairyService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');
const { protectLivestockRouter } = require('./livestockRouteSupport');

protectLivestockRouter(router);
router.use(authMiddleware);

router.get('/animals', async (req, res) => {
  try {
    const result = await dairyService.listAnimals({ page: req.query.page, limit: req.query.limit });
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/animals', authMiddleware, async (req, res) => {
  try {
    const animal = await dairyService.createAnimal(req.body);
    res.status(201).json({ success: true, data: animal });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/animals/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const animal = await dairyService.updateAnimal(req.params.id, req.body);
    if (!animal) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: animal });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/animals/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const ok = await dairyService.deleteAnimal(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/milk-records', async (req, res) => {
  try {
    const result = await dairyService.listMilkRecords({ page: req.query.page, limit: req.query.limit });
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/milk-records', authMiddleware, async (req, res) => {
  try {
    const record = await dairyService.recordMilk(req.body);
    
    // Emit signal for milk production recording
    signalBus.emitSignal(SIGNAL.MILK_PRODUCTION_RECORDED, {
      recordId: record.id,
      animalId: record.animal_id,
      quantity: record.quantity,
      quality: record.quality,
      recordingDate: record.recording_date
    }, {
      severity: SEVERITY.INFO,
      source: 'dairy_routes',
      entityId: record.animal_id
    });
    
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    logger.error('dairyRoutes:recordMilk', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

// Real trailing-7-day vs prior-7-day yield comparison per animal.
router.get('/milk-yield-trends', async (req, res) => {
  try {
    const trends = await dairyService.getMilkYieldTrends();
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vaccination-due + breeding/calving-due alerts.
router.get('/health-alerts', async (req, res) => {
  try {
    const alerts = await dairyService.getHealthAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------
// AI-Embedded Routes for Dairy Management
// ---------------------------------------------------------------------

// AI-powered milk production optimization
router.post('/ai/optimize-production/:animalId', async (req, res) => {
  try {
    const result = await dairyService.optimizeMilkProduction(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI-powered health prediction
router.post('/ai/predict-health/:animalId', async (req, res) => {
  try {
    const result = await dairyService.predictHealthRisks(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI-powered feed optimization
router.post('/ai/optimize-feed/:animalId', async (req, res) => {
  try {
    const { productionGoal } = req.body;
    const result = await dairyService.optimizeFeedComposition(req.params.animalId, productionGoal);
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI-powered breeding recommendations
router.post('/ai/recommend-breeding/:animalId', async (req, res) => {
  try {
    const result = await dairyService.recommendBreeding(req.params.animalId);
    res.json({ success: true, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
