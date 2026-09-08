// Express routes for Trend Analysis (M084)
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { rateLimiters } = require('../../middleware/rateLimit');

const read = [rateLimiters.read, authMiddleware];
const write = [rateLimiters.write, authMiddleware, requireRole('admin', 'superadmin')];

// Trend Definitions
router.post('/trends', write, controller.createTrendDefinition);

// Trend Data Points
router.post('/trends/:id/data-points', write, controller.addDataPoint);
router.get('/trends/:id/data-points', read, controller.getTrendDataPoints);

// Trend Analysis
router.post('/trends/analyze', write, controller.analyzeTrend);

// Trend Forecasting
router.post('/trends/forecast', write, controller.generateTrendForecast);

// Seasonality
router.post('/trends/:id/seasonality', write, controller.detectSeasonality);

// Correlations
router.post('/trends/correlation', write, controller.calculateCorrelation);

// Breakpoints
router.post('/trends/:id/breakpoints', write, controller.detectBreakpoints);

// Trend Alerts
router.post('/trends/alerts', write, controller.createTrendAlert);
router.get('/trends/:id/alerts', read, controller.getTrendAlerts);

router.post('/disaster-alerts', write, controller.createDisasterAlert);
router.get('/disaster-alerts', read, controller.listDisasterAlerts);
router.get('/disaster-alerts/:id', read, controller.getDisasterAlert);
router.post('/disaster-alerts/:id/cancel', write, controller.cancelDisasterAlert);
router.get('/disaster-alerts/:id/advisory', read, controller.getDisasterAlertAdvisory);

module.exports = router;
