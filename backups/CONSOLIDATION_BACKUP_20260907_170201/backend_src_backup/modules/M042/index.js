// M042 - Equipment Inventory
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/equipment', controller.createEquipment);
router.post('/equipment/:equipmentId/usage', controller.recordEquipmentUsage);
router.get('/owners/:ownerId/equipment', controller.getEquipmentByOwner);
router.get('/maintenance/predictions', controller.getMaintenancePredictions);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
