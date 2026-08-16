// M086 - Real-time Monitoring
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/sources', controller.createMonitoringSource);

router.post('/metrics', controller.addMonitoringMetric);

router.post('/data/ingest', controller.ingestRealTimeData);
router.get('/data/:id', controller.getRealTimeData);

router.post('/dashboards', controller.createMonitoringDashboard);

router.post('/widgets', controller.addDashboardWidget);

router.post('/alerts', controller.createMonitoringAlert);
router.get('/alerts/:id', controller.getMonitoringAlerts);

router.post('/events', controller.logMonitoringEvent);

router.get('/alerts/:id/history', controller.getAlertHistory);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
