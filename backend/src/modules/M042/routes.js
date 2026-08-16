// Express routes for Equipment Inventory (M042)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/equipment', controller.createEquipment);
router.post('/equipment/:equipmentId/usage', controller.recordEquipmentUsage);
router.get('/owners/:ownerId/equipment', controller.getEquipmentByOwner);
router.get('/maintenance/predictions', controller.getMaintenancePredictions);

module.exports = router;
