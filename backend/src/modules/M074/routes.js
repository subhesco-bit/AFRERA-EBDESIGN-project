const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.post('/flocks', authMiddleware, requireRole('admin'), controller.registerSheepFlock);
router.get('/flocks', authMiddleware, controller.listSheepFlocks);
router.get('/flocks/:flockId', authMiddleware, controller.getSheepFlock);
router.put('/flocks/:flockId', authMiddleware, requireRole('admin'), controller.updateSheepFlock);
router.get('/flocks/:flockId/analysis', authMiddleware, controller.analyzeSheepProduction);
router.get('/analytics', authMiddleware, requireRole('admin'), controller.getSheepAnalytics);

module.exports = router;
