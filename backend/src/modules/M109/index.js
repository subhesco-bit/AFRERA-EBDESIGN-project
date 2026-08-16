// M109 - Spare Parts Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/register', controller.registerSparePart);
router.post('/consumption', controller.recordPartConsumption);
router.get('/status/:id', controller.trackInventoryStatus);
router.get('/report/:farmerId', controller.generateInventoryReport);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
