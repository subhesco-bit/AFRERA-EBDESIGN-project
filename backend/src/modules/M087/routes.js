// Express routes for Alert Management (M087)
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Rules. Notifications/escalations/suppressions take rule_id in the body
// (see controller.js), not a :id param - kept flat to match that contract.
router.post('/rules', authMiddleware, requireRole('admin'), controller.createAlertRule);
router.post('/notifications', authMiddleware, requireRole('admin'), controller.addNotification);
router.post('/escalations', authMiddleware, requireRole('admin'), controller.addEscalation);
router.post('/suppressions', authMiddleware, requireRole('admin'), controller.createSuppression);

// Incidents
router.post('/incidents', authMiddleware, controller.createIncident);
router.get('/incidents', authMiddleware, controller.getIncidents);
router.post('/incidents/:id/acknowledge', authMiddleware, controller.acknowledgeIncident);
router.post('/incidents/:id/resolve', authMiddleware, controller.resolveIncident);

// Maintenance windows
router.post('/maintenance-windows', authMiddleware, requireRole('admin'), controller.createMaintenanceWindow);

// Statistics
router.post('/statistics', authMiddleware, controller.calculateAlertStatistics);

module.exports = router;
