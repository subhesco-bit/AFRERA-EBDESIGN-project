const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { requireResourceOwner, farmerIdOf } = require('../../middleware/ownership');

// farmer_alerts.farmer_id is the owner, resolved from the calling user's
// farmer profile — :alertId alone let any account mark another farmer's
// alerts read.
const ownsAlert = requireResourceOwner({ table: 'farmer_alerts', idParam: 'alertId', ownerColumn: 'farmer_id', ownerId: farmerIdOf });

// Advisory generation
router.post('/advisories/generate', authMiddleware, controller.generateAdvisory);

// Advisory management
router.get('/advisories', authMiddleware, controller.getFarmerAdvisories);
router.get('/advisories/analytics', authMiddleware, requireRole('admin'), controller.getAdvisoryAnalytics);
router.get('/advisories/:advisoryId', authMiddleware, controller.getAdvisory);

// IoT integration
router.post('/iot-devices', authMiddleware, controller.registerIoTDevice);
router.get('/iot-devices/data', authMiddleware, controller.getIoTDeviceData);

// Alerts
router.post('/alerts', authMiddleware, controller.createAlert);
router.get('/alerts', authMiddleware, controller.getFarmerAlerts);
router.put('/alerts/:alertId/read', authMiddleware, ownsAlert, controller.markAlertAsRead);

module.exports = router;
