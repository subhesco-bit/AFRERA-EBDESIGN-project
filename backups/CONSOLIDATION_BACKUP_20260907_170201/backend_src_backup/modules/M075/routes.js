// Express routes for Pig Herd Registration & Analytics (M075).
// index.js's own header comment said "Irrigation Management" but the real
// controller/service built here (registerPigHerd/listPigHerds/production
// analysis) is pig herd-level tracking - a label/content mismatch found while
// reconciling why this module's routes.js was empty despite 243+76 lines of
// real code. Distinct from services/pigService.js (mounted at /api/v1/pig),
// which tracks individual animals (weight/breeding/vaccination records) - this
// module operates at the herd level (registration, aggregate production
// analysis). Complementary, not a duplicate; not merged.
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.get('/herds', authMiddleware, controller.listPigHerds);
router.get('/herds/:herdId', authMiddleware, controller.getPigHerd);
router.post('/herds', authMiddleware, requireRole('farmer', 'admin'), controller.registerPigHerd);
router.put('/herds/:herdId', authMiddleware, requireRole('farmer', 'admin'), controller.updatePigHerd);
router.get('/herds/:herdId/production-analysis', authMiddleware, controller.analyzePigProduction);
router.get('/analytics', authMiddleware, controller.getPigAnalytics);

module.exports = router;
