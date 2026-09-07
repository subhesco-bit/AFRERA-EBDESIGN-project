// M085 - Comparative Analytics
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/groups', controller.createComparisonGroup);

router.post('/configs', controller.createComparisonConfig);

router.post('/comparisons/run', controller.runComparison);

router.post('/benchmarks', controller.addBenchmark);
router.get('/groups/:id/benchmarks', controller.getBenchmarks);

router.post('/alerts', controller.createComparisonAlert);
router.get('/configs/:id/alerts', controller.getComparisonAlerts);

router.post('/snapshots', controller.createSnapshot);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
