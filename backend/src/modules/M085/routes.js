// Express routes for Comparative Analytics (M085)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

// Comparison Groups
router.post('/groups', controller.createComparisonGroup);

// Comparison Configs
router.post('/configs', controller.createComparisonConfig);

// Run Comparison
router.post('/comparisons/run', controller.runComparison);

// Benchmarks
router.post('/benchmarks', controller.addBenchmark);
router.get('/groups/:id/benchmarks', controller.getBenchmarks);

// Alerts
router.post('/alerts', controller.createComparisonAlert);
router.get('/configs/:id/alerts', controller.getComparisonAlerts);

// Snapshots
router.post('/snapshots', controller.createSnapshot);

module.exports = router;
