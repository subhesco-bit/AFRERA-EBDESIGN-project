// M078 - Rainwater Harvesting
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/systems', controller.designHarvestingSystem);
router.get('/systems/:id/collection', controller.monitorCollection);
router.get('/systems/:id/budget', controller.calculateWaterBudget);
router.post('/systems/:id/storage', controller.manageStorageCapacity);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
