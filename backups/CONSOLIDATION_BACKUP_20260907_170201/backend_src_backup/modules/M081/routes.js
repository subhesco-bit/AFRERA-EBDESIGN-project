// Express routes for Data Visualization Dashboard (M081)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

// Dashboard CRUD
router.post('/dashboards', controller.createDashboard);
router.get('/dashboards', controller.listDashboards);
router.get('/dashboards/:id', controller.getDashboard);
router.put('/dashboards/:id', controller.updateDashboard);
router.delete('/dashboards/:id', controller.deleteDashboard);

// Widget management
router.post('/dashboards/:id/widgets', controller.addWidget);
router.get('/dashboards/:id/widgets', controller.getDashboardWidgets);
router.put('/dashboards/:id/widgets/:widgetId', controller.updateWidget);
router.delete('/dashboards/:id/widgets/:widgetId', controller.deleteWidget);

// Data source management
router.post('/dashboards/:id/datasources', controller.addDataSource);
router.get('/dashboards/:id/datasources', controller.getDataSources);

// Filter management
router.post('/dashboards/:id/filters', controller.addFilter);
router.get('/dashboards/:id/filters', controller.getDashboardFilters);

// Snapshots and sharing
router.post('/dashboards/:id/snapshots', controller.createSnapshot);
router.post('/dashboards/:id/share', controller.shareDashboard);

// Analytics
router.get('/dashboards/:id/analytics', controller.getDashboardAnalytics);

module.exports = router;
