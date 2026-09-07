// Express routes for Nursery Management (M046).
// index.js's own header comment said "SHG Management" but the real controller/
// service built here (createNursery/listNurseries/seedling batches/AI environment
// optimization) is Nursery Management - a label/content mismatch found while
// reconciling why this module's routes.js was empty despite 320+114 lines of real
// code in service.js/controller.js. Wiring to what the code actually does.
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.get('/nurseries', authMiddleware, controller.listNurseries);
router.get('/nurseries/:nurseryId', authMiddleware, controller.getNursery);
router.post('/nurseries', authMiddleware, requireRole('farmer', 'admin'), controller.createNursery);
router.put('/nurseries/:nurseryId', authMiddleware, requireRole('farmer', 'admin'), controller.updateNursery);
router.delete('/nurseries/:nurseryId', authMiddleware, requireRole('farmer', 'admin'), controller.deleteNursery);

router.post('/seedling-batches', authMiddleware, requireRole('farmer', 'admin'), controller.createSeedlingBatch);
router.put('/seedling-batches/:batchId/health', authMiddleware, requireRole('farmer', 'admin'), controller.updateSeedlingHealth);

router.post('/nurseries/:nurseryId/optimize', authMiddleware, requireRole('farmer', 'admin'), controller.optimizeNurseryEnvironment);
router.get('/analytics', authMiddleware, controller.getNurseryAnalytics);

module.exports = router;
