// M079 - Watershed Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/plans', controller.createWatershedPlan);
router.get('/watersheds/:id/health', controller.monitorWatershedHealth);
router.post('/watersheds/:id/conservation', controller.implementConservationMeasures);
router.get('/watersheds/:id/report', controller.generateWatershedReport);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
