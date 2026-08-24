// Express routes for Orchard Management (M141). controller.js was a 3-line stub
// despite service.js being a real 130-line implementation; wiring it in.
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.get('/orchards', authMiddleware, controller.listOrchards);
router.get('/orchards/:orchardId', authMiddleware, controller.getOrchard);
router.post('/orchards', authMiddleware, requireRole('farmer', 'admin'), controller.createOrchard);
router.put('/orchards/:orchardId', authMiddleware, requireRole('farmer', 'admin'), controller.updateOrchard);
router.delete('/orchards/:orchardId', authMiddleware, requireRole('farmer', 'admin'), controller.deleteOrchard);

router.get('/orchards/:orchardId/production', authMiddleware, controller.getOrchardProduction);
router.post('/orchards/:orchardId/production', authMiddleware, requireRole('farmer', 'admin'), controller.recordOrchardProduction);
router.get('/orchards/:orchardId/analytics', authMiddleware, controller.getOrchardAnalytics);

module.exports = router;
