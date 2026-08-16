// M083 - Performance Analytics
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/metrics', controller.recordPerformanceMetric);
router.get('/metrics/:entityId/:entityType', controller.getPerformanceMetrics);

router.post('/reports/generate', controller.generatePerformanceReport);

router.post('/trends/analyze', controller.analyzePerformanceTrends);

router.post('/comparisons', controller.comparePerformance);

router.post('/targets', controller.setPerformanceTarget);
router.get('/targets/:entityId/:entityType', controller.getPerformanceTargets);

router.post('/alerts', controller.createPerformanceAlert);
router.get('/alerts/:entityId/:entityType', controller.getPerformanceAlerts);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
