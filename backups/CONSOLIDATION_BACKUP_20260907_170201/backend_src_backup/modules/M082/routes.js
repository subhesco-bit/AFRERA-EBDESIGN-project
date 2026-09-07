// Express routes for Business Metrics & KPIs Tracking (M082)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

// KPI Definitions
router.post('/kpi-definitions', controller.createKPIDefinition);
router.get('/kpi-definitions', controller.listKPIDefinitions);
router.get('/kpi-definitions/:id', controller.getKPIDefinition);

// KPI Measurements
router.post('/kpi-measurements', controller.recordKPIMeasurement);
router.get('/kpi-definitions/:id/measurements', controller.getKPIMeasurements);

// KPI Targets
router.post('/kpi-targets', controller.setKPITarget);
router.get('/kpi-definitions/:id/targets', controller.getKPITargets);

// KPI Scores
router.post('/kpi-scores/calculate', controller.calculateKPIScore);

// KPI Alerts
router.post('/kpi-alerts', controller.createKPIAlert);
router.get('/kpi-definitions/:id/alerts', controller.getKPIAlerts);

// Benchmarks
router.post('/benchmarks', controller.addBenchmark);
router.get('/kpi-definitions/:id/benchmarks', controller.getBenchmarks);

// Dimensions
router.post('/dimensions', controller.addDimension);
router.get('/kpi-definitions/:id/dimensions', controller.getDimensions);

module.exports = router;
