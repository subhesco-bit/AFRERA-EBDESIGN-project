// Express routes for Pond Management (M132) - fisheries/aquaculture, IoT sensor
// integration, AI-driven health/growth/harvest insights. Previously flagged as
// a known mismatch (frontend called /modules/m132/* but nothing was mounted) -
// root cause was that both controller.js and routes.js were empty stubs despite
// service.js being a real, complete 519-line implementation.
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.get('/ponds', authMiddleware, controller.listPonds);
router.get('/ponds/:pondId', authMiddleware, controller.getPond);
router.post('/ponds', authMiddleware, requireRole('farmer', 'admin'), controller.createPond);
router.put('/ponds/:pondId', authMiddleware, requireRole('farmer', 'admin'), controller.updatePond);
router.delete('/ponds/:pondId', authMiddleware, requireRole('farmer', 'admin'), controller.deletePond);

router.post('/ponds/:pondId/sensors', authMiddleware, requireRole('farmer', 'admin'), controller.configurePondSensors);
router.get('/ponds/:pondId/sensor-data', authMiddleware, controller.getPondSensorData);
router.get('/ponds/:pondId/health-index', authMiddleware, controller.getPondHealthIndex);
router.get('/ponds/:pondId/ai-insights', authMiddleware, controller.getPondAIInsights);

module.exports = router;
