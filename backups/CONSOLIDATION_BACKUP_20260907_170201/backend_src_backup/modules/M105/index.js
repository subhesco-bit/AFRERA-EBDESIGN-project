// M105 - Fleet Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/vehicles', controller.registerFleetVehicle);
router.post('/dispatch', controller.createDispatchSchedule);
router.get('/performance/:id', controller.trackFleetPerformance);
router.get('/report/:farmerId', controller.generateFleetReport);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
