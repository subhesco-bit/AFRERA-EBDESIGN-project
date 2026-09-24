/**
 * Nutrient / dietitian / vet + product AI enrich + training cartoons + weather
 * Mount: /api/v1/intelligence  and /api/v1/afrera/intelligence
 */

'use strict';

const express = require('express');
const router = express.Router();

const health = require('../services/health/nutrientDietitianVetHub');
const cartoon = require('../services/health/prescriptionCartoonExplainer');
const productAi = require('../services/commerce/productAiEnrichmentService');
const training = require('../services/training/farmerTrainingCartoonService');
const weather = require('../services/weather/weatherAlertService');

function fail(res, e) {
  res.status(400).json({ success: false, error: e.message });
}

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'health_commerce_intelligence',
    modules: ['nutrient', 'dietitian', 'veterinary', 'cartoon', 'product_enrich', 'training', 'weather'],
  });
});

// --- Health pages ---
router.post('/nutrient/calculate', async (req, res) => {
  try {
    res.json({ success: true, ...(await health.operate({ ...req.body, action: 'nutrient' })) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/dietitian/advise', async (req, res) => {
  try {
    res.json({ success: true, ...(await health.operate({ ...req.body, action: 'dietitian' })) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/veterinary/panel', async (req, res) => {
  try {
    res.json({ success: true, ...(await health.operate({ ...req.body, action: 'veterinary' })) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/prescription/cartoon', (req, res) => {
  try {
    res.json({
      success: true,
      ...cartoon.explain(req.body?.domain, req.body?.prescription || req.body),
    });
  } catch (e) {
    fail(res, e);
  }
});

// --- Product add ---
router.post('/product/enrich', async (req, res) => {
  try {
    res.json({ success: true, ...(await productAi.operate({ ...req.body, action: 'enrich' })) });
  } catch (e) {
    fail(res, e);
  }
});

// --- Farmer training cartoons ---
router.get('/training/modules', async (req, res) => {
  res.json({ success: true, ...(await training.operate({ action: 'list' })) });
});

router.post('/training/cartoon', async (req, res) => {
  try {
    res.json({ success: true, ...(await training.operate(req.body || {})) });
  } catch (e) {
    fail(res, e);
  }
});

// --- Weather ---
router.post('/weather/alerts', async (req, res) => {
  try {
    res.json({ success: true, ...(await weather.operate(req.body || {})) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/operate', async (req, res) => {
  try {
    const domain = req.body?.domain;
    if (domain === 'health') res.json({ success: true, ...(await health.operate(req.body)) });
    else if (domain === 'product') res.json({ success: true, ...(await productAi.operate(req.body)) });
    else if (domain === 'training') res.json({ success: true, ...(await training.operate(req.body)) });
    else if (domain === 'weather') res.json({ success: true, ...(await weather.operate(req.body)) });
    else res.json({ success: true, hint: 'domain=health|product|training|weather' });
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
