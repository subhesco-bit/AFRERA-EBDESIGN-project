// M107 - Breakdown Maintenance
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/report', controller.reportBreakdown);
router.post('/repair/:id', controller.scheduleEmergencyRepair);
router.get('/downtime/:id', controller.trackDowntime);
router.get('/report/:farmerId', controller.generateBreakdownReport);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
