const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Crop Variety CRUD
router.post('/varieties', authMiddleware, requireRole('admin'), controller.createVariety);
router.get('/varieties', authMiddleware, controller.listVarieties);
router.get('/varieties/:varietyId', authMiddleware, controller.getVariety);
router.put('/varieties/:varietyId', authMiddleware, requireRole('admin'), controller.updateVariety);
router.delete('/varieties/:varietyId', authMiddleware, requireRole('admin'), controller.deleteVariety);

// AI-powered recommendations
router.post('/crops/:cropName/recommend-varieties', authMiddleware, controller.recommendVarieties);

// Performance tracking
router.post('/varieties/:varietyId/performance', authMiddleware, controller.recordVarietyPerformance);
router.get('/varieties/:varietyId/performance', authMiddleware, controller.getVarietyPerformance);
router.get('/varieties/:varietyId/performance/analysis', authMiddleware, controller.analyzeVarietyPerformance);

// Analytics
router.get('/varieties/analytics', authMiddleware, requireRole('admin'), controller.getVarietyAnalytics);

module.exports = router;

