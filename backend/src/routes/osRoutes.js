/**
 * OS kernel routes — single domain multiplatform control plane
 * Mount: /api/v1/os
 */

'use strict';

const express = require('express');
const router = express.Router();
const kernel = require('../os/osKernel');
const registry = require('../os/conceptRuntimeRegistry');

router.get('/health', (req, res) => {
  res.json({ success: true, ...kernel.health() });
});

router.get('/platforms', (req, res) => {
  res.json({ success: true, ...kernel.listPlatforms() });
});

router.get('/platforms/:id', (req, res) => {
  const p = kernel.resolvePlatform(req.params.id);
  if (!p) return res.status(404).json({ success: false, error: 'Unknown platform' });
  res.json({ success: true, platform: p });
});

router.get('/registry', (req, res) => {
  res.json({
    success: true,
    ...registry.list({
      status: req.query.status,
      layer: req.query.layer,
    }),
  });
});

router.get('/registry/:conceptId', (req, res) => {
  const c = registry.get(req.params.conceptId);
  if (!c) return res.status(404).json({ success: false, error: 'Unknown concept' });
  res.json({ success: true, concept: c });
});

router.get('/summary', (req, res) => {
  res.json({
    success: true,
    os: kernel.health(),
    registry: registry.summary(),
    maturity_stage: '1_industry_baseline_in_progress',
    next_priority: [
      'Auto-scan modules into registry',
      'Seasonal farmer lifecycle FSM',
      'Postgres persistence for checkout/RMA',
      'Canonical business events',
      'Grievance spine',
    ],
  });
});

module.exports = router;
