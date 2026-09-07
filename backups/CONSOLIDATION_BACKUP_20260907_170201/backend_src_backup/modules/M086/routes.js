// Express routes for Real-time Monitoring (M086)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

// Monitoring Sources
router.post('/sources', controller.createMonitoringSource);

// Monitoring Metrics
router.post('/metrics', controller.addMonitoringMetric);

// Real-time Data
router.post('/data/ingest', controller.ingestRealTimeData);
router.get('/data/:id', controller.getRealTimeData);

// Monitoring Dashboards
router.post('/dashboards', controller.createMonitoringDashboard);

// Dashboard Widgets
router.post('/widgets', controller.addDashboardWidget);

// Monitoring Alerts
router.post('/alerts', controller.createMonitoringAlert);
router.get('/alerts/:id', controller.getMonitoringAlerts);

// Monitoring Events
router.post('/events', controller.logMonitoringEvent);

// Alert History
router.get('/alerts/:id/history', controller.getAlertHistory);

module.exports = router;
