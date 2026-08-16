// M081 - Data Visualization Dashboard
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/dashboards', controller.createDashboard);
router.get('/dashboards', controller.listDashboards);
router.get('/dashboards/:id', controller.getDashboard);
router.put('/dashboards/:id', controller.updateDashboard);
router.delete('/dashboards/:id', controller.deleteDashboard);

router.post('/dashboards/:id/widgets', controller.addWidget);
router.get('/dashboards/:id/widgets', controller.getDashboardWidgets);
router.put('/dashboards/:id/widgets/:widgetId', controller.updateWidget);
router.delete('/dashboards/:id/widgets/:widgetId', controller.deleteWidget);

router.post('/dashboards/:id/datasources', controller.addDataSource);
router.get('/dashboards/:id/datasources', controller.getDataSources);

router.post('/dashboards/:id/filters', controller.addFilter);
router.get('/dashboards/:id/filters', controller.getDashboardFilters);

router.post('/dashboards/:id/snapshots', controller.createSnapshot);
router.post('/dashboards/:id/share', controller.shareDashboard);

router.get('/dashboards/:id/analytics', controller.getDashboardAnalytics);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
