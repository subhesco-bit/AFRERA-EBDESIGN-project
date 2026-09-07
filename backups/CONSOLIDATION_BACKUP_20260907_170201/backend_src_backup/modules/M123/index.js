// M123 - Poultry Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/flocks', controller.registerPoultryFlock);
router.put('/flocks/:id/health', controller.updateFlockHealth);
router.get('/flocks/:id/performance', controller.trackFlockPerformance);
router.get('/farmers/:farmerId/report', controller.generatePoultryReport);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
