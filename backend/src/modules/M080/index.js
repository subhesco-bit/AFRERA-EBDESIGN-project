// M080 - Water Analytics
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/analytics', controller.generateWaterUsageAnalytics);
router.post('/dashboards', controller.createWaterDashboard);
router.post('/predictions', controller.generatePredictiveAnalysis);
router.post('/comparisons', controller.compareWaterPerformance);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
