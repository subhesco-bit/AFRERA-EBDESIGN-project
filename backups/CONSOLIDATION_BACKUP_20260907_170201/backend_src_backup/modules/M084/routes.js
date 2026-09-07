// Express routes for Trend Analysis (M084)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

// Trend Definitions
router.post('/trends', controller.createTrendDefinition);

// Trend Data Points
router.post('/trends/:id/data-points', controller.addDataPoint);
router.get('/trends/:id/data-points', controller.getTrendDataPoints);

// Trend Analysis
router.post('/trends/analyze', controller.analyzeTrend);

// Trend Forecasting
router.post('/trends/forecast', controller.generateTrendForecast);

// Seasonality
router.post('/trends/:id/seasonality', controller.detectSeasonality);

// Correlations
router.post('/trends/correlation', controller.calculateCorrelation);

// Breakpoints
router.post('/trends/:id/breakpoints', controller.detectBreakpoints);

// Trend Alerts
router.post('/trends/alerts', controller.createTrendAlert);
router.get('/trends/:id/alerts', controller.getTrendAlerts);

module.exports = router;
