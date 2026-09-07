// M001 - Platform Core
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/initialize', controller.initializePlatform);
router.get('/health', controller.getPlatformHealth);
router.get('/metrics', controller.getPlatformMetrics);
router.put('/configurations/:id', controller.updatePlatformConfiguration);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
