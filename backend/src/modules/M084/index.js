// M084 - Trend Analysis
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/trends', controller.createTrendDefinition);

router.post('/trends/:id/data-points', controller.addDataPoint);
router.get('/trends/:id/data-points', controller.getTrendDataPoints);

router.post('/trends/analyze', controller.analyzeTrend);

router.post('/trends/forecast', controller.generateTrendForecast);

router.post('/trends/:id/seasonality', controller.detectSeasonality);

router.post('/trends/correlation', controller.calculateCorrelation);

router.post('/trends/:id/breakpoints', controller.detectBreakpoints);

router.post('/trends/alerts', controller.createTrendAlert);
router.get('/trends/:id/alerts', controller.getTrendAlerts);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
