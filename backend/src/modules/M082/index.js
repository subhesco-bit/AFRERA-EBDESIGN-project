// M082 - Business Metrics & KPIs Tracking
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/kpi-definitions', controller.createKPIDefinition);
router.get('/kpi-definitions', controller.listKPIDefinitions);
router.get('/kpi-definitions/:id', controller.getKPIDefinition);

router.post('/kpi-measurements', controller.recordKPIMeasurement);
router.get('/kpi-definitions/:id/measurements', controller.getKPIMeasurements);

router.post('/kpi-targets', controller.setKPITarget);
router.get('/kpi-definitions/:id/targets', controller.getKPITargets);

router.post('/kpi-scores/calculate', controller.calculateKPIScore);

router.post('/kpi-alerts', controller.createKPIAlert);
router.get('/kpi-definitions/:id/alerts', controller.getKPIAlerts);

router.post('/benchmarks', controller.addBenchmark);
router.get('/kpi-definitions/:id/benchmarks', controller.getBenchmarks);

router.post('/dimensions', controller.addDimension);
router.get('/kpi-definitions/:id/dimensions', controller.getDimensions);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
