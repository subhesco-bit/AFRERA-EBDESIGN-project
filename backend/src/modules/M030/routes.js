const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { requireResourceOwner, farmerIdOf, requireFarmerOwner } = require('../../middleware/ownership');

// farmer_alerts.farmer_id is the owner, resolved from the calling user's
// farmer profile — :alertId alone let any account mark another farmer's
// alerts read.
const ownsAlert = requireResourceOwner({ table: 'farmer_alerts', idParam: 'alertId', ownerColumn: 'farmer_id', ownerId: farmerIdOf });
const ownsAdvisory = requireResourceOwner({ table: 'farmer_advisories', idParam: 'advisoryId', ownerColumn: 'farmer_id', ownerId: farmerIdOf });

// Advisory generation
router.post('/advisories/generate', authMiddleware, requireFarmerOwner('body'), controller.generateAdvisory);

// Advisory management
router.get('/advisories', authMiddleware, requireFarmerOwner(), controller.getFarmerAdvisories);
router.get('/advisories/analytics', authMiddleware, requireRole('admin'), controller.getAdvisoryAnalytics);
router.get('/advisories/:advisoryId', authMiddleware, ownsAdvisory, controller.getAdvisory);

// IoT integration
router.post('/iot-devices', authMiddleware, requireFarmerOwner('body'), controller.registerIoTDevice);
router.get('/iot-devices/data', authMiddleware, requireFarmerOwner(), controller.getIoTDeviceData);

// Alerts
router.post('/alerts', authMiddleware, requireFarmerOwner('body'), controller.createAlert);
router.get('/alerts', authMiddleware, requireFarmerOwner(), controller.getFarmerAlerts);
router.put('/alerts/:alertId/read', authMiddleware, ownsAlert, controller.markAlertAsRead);

module.exports = router;
