// Express routes for Performance Analytics (M083)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

// Performance Metrics
router.post('/metrics', controller.recordPerformanceMetric);
router.get('/metrics/:entityId/:entityType', controller.getPerformanceMetrics);

// Performance Reports
router.post('/reports/generate', controller.generatePerformanceReport);

// Performance Trends
router.post('/trends/analyze', controller.analyzePerformanceTrends);

// Performance Comparisons
router.post('/comparisons', controller.comparePerformance);

// Performance Targets
router.post('/targets', controller.setPerformanceTarget);
router.get('/targets/:entityId/:entityType', controller.getPerformanceTargets);

// Performance Alerts
router.post('/alerts', controller.createPerformanceAlert);
router.get('/alerts/:entityId/:entityType', controller.getPerformanceAlerts);

module.exports = router;
