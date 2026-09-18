/**
 * Real backend routes for ClimateAdvisoryPage.jsx, ClimateWeatherPage.jsx,
 * ForwardPricingPage.jsx, WeatherAnalyticsPage.jsx, backed by
 * services/legacy/weatherService.js.
 *
 * forArp -> weatherForArp, advisoryTriggers -> getAdvisoryTriggers (name
 * differences). activeAlerts, which several pages also call, has no
 * implementation anywhere (raiseAlert/activeDispatchBlocks are different,
 * real concepts - alert creation and dispatch-blocking, not a general
 * alert list) - not wired, flagged instead of faked.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/weatherService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/weather/coverage', wrap(() => svc.coverage()));
router.get('/weather/forecast-accuracy', wrap(() => svc.forecastAccuracy()));
router.get('/weather/advisory-triggers', wrap((req) => svc.getAdvisoryTriggers(req.query)));
router.post('/weather/for-arp', wrap((req) => svc.weatherForArp(req.body)));
router.post('/weather/dispatch-check', wrap((req) => svc.dispatchCheck(req.body)));
router.post('/weather/pest-forecast', wrap((req) => svc.pestForecast(req.body)));

// climateAdvisoryAPI (ClimateAdvisoryPage.jsx): real match is here, not the
// 15-line services/climateAdvisoryService.js stub.
router.get('/climate-advisory/advisories', wrap((req) => svc.listAdvisories(req.query)));
router.post('/climate-advisory/advisory', wrap((req) => svc.createAdvisory(req.body)));

module.exports = router;
