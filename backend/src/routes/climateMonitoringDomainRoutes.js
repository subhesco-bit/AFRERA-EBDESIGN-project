/**
 * Real backend routes for ClimateMonitoringPage.jsx's 5 sub-modules
 * (drought, flood, disease forecasting, climate risk, agro-meteorology),
 * backed by services/legacy/climateMonitoringService.js. Exact 1:1 CRUD
 * match for all 5 resources.
 */
'use strict';

const express = require('express');
const router = express.Router();
const {
  droughtMonitoring, floodMonitoring, diseaseForecasting, climateRisk, agroMeteorology,
} = require('../services/legacy/climateMonitoringService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

function mountCrud(basePath, resource, createLabel = 'record') {
  router.get(`/${basePath}`, async (req, res) => {
    try {
      const result = await resource.list(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  router.post(`/${basePath}/${createLabel}`, async (req, res) => {
    try {
      const item = await resource.create(req.body);
      res.status(201).json({ success: true, item });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  router.put(`/${basePath}/${createLabel}/:id`, async (req, res) => {
    try {
      const item = await resource.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, item });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
  router.delete(`/${basePath}/${createLabel}/:id`, async (req, res) => {
    try {
      const removed = await resource.remove(req.params.id);
      if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
}

mountCrud('drought-monitoring/records', droughtMonitoring, 'record');
mountCrud('flood-monitoring/records', floodMonitoring, 'record');
mountCrud('disease-forecasting/forecasts', diseaseForecasting, 'forecast');
mountCrud('climate-risk/assessments', climateRisk, 'assessment');
mountCrud('agro-meteorology/records', agroMeteorology, 'record');

module.exports = router;
