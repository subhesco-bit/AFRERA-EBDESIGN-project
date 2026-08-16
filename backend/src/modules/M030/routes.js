const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Advisory generation
router.post('/advisories/generate', authMiddleware, controller.generateAdvisory);

// Advisory management
router.get('/advisories', authMiddleware, controller.getFarmerAdvisories);
router.get('/advisories/:advisoryId', authMiddleware, controller.getAdvisory);

// IoT integration
router.post('/iot-devices', authMiddleware, controller.registerIoTDevice);
router.get('/iot-devices/data', authMiddleware, controller.getIoTDeviceData);

// Alerts
router.post('/alerts', authMiddleware, controller.createAlert);
router.get('/alerts', authMiddleware, controller.getFarmerAlerts);
router.put('/alerts/:alertId/read', authMiddleware, controller.markAlertAsRead);

// Analytics
router.get('/advisories/analytics', authMiddleware, requireRole('admin'), controller.getAdvisoryAnalytics);

module.exports = router;