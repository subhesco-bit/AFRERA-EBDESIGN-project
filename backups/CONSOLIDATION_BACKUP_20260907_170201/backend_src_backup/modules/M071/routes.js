const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Dairy herd CRUD
router.post('/herds', authMiddleware, requireRole('admin'), controller.registerDairyHerd);
router.get('/herds', authMiddleware, controller.listDairyHerds);
router.get('/herds/:herdId', authMiddleware, controller.getDairyHerd);
router.put('/herds/:herdId', authMiddleware, requireRole('admin'), controller.updateDairyHerd);

// AI-powered analysis
router.get('/herds/:herdId/analysis', authMiddleware, controller.analyzeMilkProduction);

// Milk quality
router.post('/milk-quality', authMiddleware, controller.recordMilkQuality);
router.get('/milk-quality/history', authMiddleware, controller.getMilkQualityHistory);

// Analytics
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getDairyAnalytics);

module.exports = router;
