/**
 * Catch-all real logic for modules that were stubs
 * Mount: /api/v1/modules/:moduleId
 */

'use strict';

const express = require('express');
const { getRuntime } = require('../core/universalModuleRuntime');

const router = express.Router({ mergeParams: true });

router.use((req, res, next) => {
  const moduleId = req.params.moduleId || req.baseUrl.split('/').pop();
  req.moduleRuntime = getRuntime(moduleId.toUpperCase());
  next();
});

router.get('/health', (req, res) => res.json(req.moduleRuntime.health()));
router.get('/capabilities', (req, res) => res.json(req.moduleRuntime.capabilities()));
router.get('/metrics', (req, res) => res.json(req.moduleRuntime.getMetrics()));

router.post('/operate', async (req, res) => {
  const out = await req.moduleRuntime.operate(req.body || {});
  res.status(out.success === false ? 400 : 200).json(out);
});

router.post('/records', (req, res) => {
  res.json(req.moduleRuntime.create(req.body || {}));
});

router.get('/records', (req, res) => {
  res.json(req.moduleRuntime.list(req.query));
});

router.get('/records/:id', (req, res) => {
  const out = req.moduleRuntime.get(req.params.id);
  res.status(out.success === false ? 404 : 200).json(out);
});

router.patch('/records/:id', (req, res) => {
  res.json(req.moduleRuntime.update(req.params.id, req.body || {}));
});

router.post('/records/:id/transition', (req, res) => {
  const out = req.moduleRuntime.transition(req.params.id, req.body?.to, req.body?.event);
  res.status(out.success === false ? 400 : 200).json(out);
});

module.exports = router;
