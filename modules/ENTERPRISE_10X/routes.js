/**
 * Enterprise 10x unified router
 * Mount at /api/v1/enterprise-10x
 */

'use strict';

const express = require('express');
const router = express.Router();
const { Ecommerce10xService } = require('./ecommerce/service');
const { Insurance10xService } = require('./insurance/service');
const { Finance10xService } = require('./finance/service');
const { ColdStorage10xService } = require('./cold_storage/service');
const { Rental10xService } = require('./rental/service');
const { Erp10xService } = require('./erp/service');
const { Platform10xService } = require('./platform/service');

const services = {
  ecommerce: new Ecommerce10xService(),
  insurance: new Insurance10xService(),
  finance: new Finance10xService(),
  cold_storage: new ColdStorage10xService(),
  rental: new Rental10xService(),
  erp: new Erp10xService(),
  platform: new Platform10xService(),
};

function fail(res, s, e) {
  res.status(s).json({ success: false, error: typeof e === 'string' ? e : e.message });
}

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    domains: Object.keys(services),
    timestamp: new Date().toISOString(),
  });
});

router.get('/domains', (req, res) => {
  res.json({ success: true, domains: Object.keys(services) });
});

router.post('/:domain/operate', async (req, res) => {
  try {
    const svc = services[req.params.domain];
    if (!svc) return fail(res, 404, 'Unknown domain');
    res.json(await svc.operate(req.body || {}));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.post('/:domain/panel', async (req, res) => {
  try {
    const svc = services[req.params.domain];
    if (!svc) return fail(res, 404, 'Unknown domain');
    res.json(await svc.panel(req.body || {}));
  } catch (e) {
    fail(res, 500, e);
  }
});

router.get('/:domain/metrics', (req, res) => {
  const svc = services[req.params.domain];
  if (!svc) return fail(res, 404, 'Unknown domain');
  res.json({ success: true, metrics: svc.getMetrics() });
});

router.get('/:domain/health', async (req, res) => {
  const svc = services[req.params.domain];
  if (!svc) return fail(res, 404, 'Unknown domain');
  const init = svc.initialize ? await svc.initialize() : { success: true };
  res.json({ success: true, domain: req.params.domain, ...init });
});

module.exports = router;
