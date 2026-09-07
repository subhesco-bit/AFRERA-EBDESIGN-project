// Express routes for Water Analytics (M080)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/analytics', controller.generateWaterUsageAnalytics);
router.post('/dashboards', controller.createWaterDashboard);
router.post('/predictions', controller.generatePredictiveAnalysis);
router.post('/comparisons', controller.compareWaterPerformance);

module.exports = router;
