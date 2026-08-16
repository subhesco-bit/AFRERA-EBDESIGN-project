const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.post('/herds', authMiddleware, requireRole('admin'), controller.registerGoatHerd);
router.get('/herds', authMiddleware, controller.listGoatHerds);
router.get('/herds/:herdId', authMiddleware, controller.getGoatHerd);
router.put('/herds/:herdId', authMiddleware, requireRole('admin'), controller.updateGoatHerd);
router.get('/herds/:herdId/analysis', authMiddleware, controller.analyzeGoatProduction);
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getGoatAnalytics);

module.exports = router;
