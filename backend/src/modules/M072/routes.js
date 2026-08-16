const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.post('/flocks', authMiddleware, requireRole('admin'), controller.registerPoultryFlock);
router.get('/flocks', authMiddleware, controller.listPoultryFlocks);
router.get('/flocks/:flockId', authMiddleware, controller.getPoultryFlock);
router.put('/flocks/:flockId', authMiddleware, requireRole('admin'), controller.updatePoultryFlock);
router.get('/flocks/:flockId/analysis', authMiddleware, controller.analyzeEggProduction);
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getPoultryAnalytics);

module.exports = router;
