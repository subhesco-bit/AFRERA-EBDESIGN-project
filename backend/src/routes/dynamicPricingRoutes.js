/**
 * Dynamic pricing + geofence + mandi/ecom search
 * Mount: /api/v1/dynamic-pricing
 * Layer: ecommerce
 */

'use strict';

const express = require('express');
const router = express.Router();
const engine = require('../services/ecommerce/dynamicPricingEngine');

function ok(res, body) {
  res.json({ success: true, layer: 'ecommerce', ...body });
}
function fail(res, e) {
  res.status(e.code === 'SKU_NOT_FOUND' ? 400 : 500).json({
    success: false,
    layer: 'ecommerce',
    error: e.message,
    code: e.code,
  });
}

router.get('/health', (req, res) => {
  ok(res, {
    status: 'healthy',
    capabilities: ['price', 'basket', 'deep_search', 'geofences', 'ingest_mandi', 'ingest_ecom'],
  });
});

router.get('/geofences', (req, res) => {
  ok(res, engine.listGeofences());
});

router.post('/resolve-geofence', (req, res) => {
  try {
    ok(res, engine.resolveGeofence(req.body?.lat, req.body?.lng));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/deep-search', (req, res) => {
  try {
    ok(res, engine.deepSearch(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/price', (req, res) => {
  try {
    const { sku, lat, lng, strategy, cold_chain } = req.body || {};
    ok(res, engine.priceSku(sku, { lat, lng, strategy, cold_chain }));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/basket', (req, res) => {
  try {
    ok(res, engine.priceBasket(req.body?.lines, req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/ingest/mandi', (req, res) => {
  try {
    ok(res, engine.ingestMandiFeed(req.body?.commodity, req.body?.row || req.body));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/ingest/ecommerce', (req, res) => {
  try {
    ok(res, engine.ingestEcomFeed(req.body?.sku, req.body?.row || req.body));
  } catch (e) {
    fail(res, e);
  }
});

router.post('/operate', async (req, res) => {
  try {
    ok(res, await engine.operate(req.body || {}));
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
