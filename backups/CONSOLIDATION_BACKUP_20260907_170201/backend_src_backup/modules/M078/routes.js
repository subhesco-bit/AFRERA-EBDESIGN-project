// Express routes for Rainwater Harvesting (M078)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/systems', controller.designHarvestingSystem);
router.get('/systems/:id/collection', controller.monitorCollection);
router.get('/systems/:id/budget', controller.calculateWaterBudget);
router.post('/systems/:id/storage', controller.manageStorageCapacity);

module.exports = router;
