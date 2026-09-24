/**
 * Village Freelancer API
 * Mount: /api/v1/village-freelancer  and /api/v1/afrera/village-freelancer
 */

'use strict';

const express = require('express');
const router = express.Router();
const vf = require('../services/village/villageFreelancerPlatform');

function fail(res, e) {
  res.status(e.code ? 400 : 500).json({
    success: false,
    error: e.message,
    code: e.code,
    allowed: e.allowed,
    known: e.known,
  });
}

router.get('/health', (req, res) => {
  res.json({ success: true, service: 'village_freelancer', layer: 'farmer' });
});

router.get('/skills', (req, res) => {
  res.json({ success: true, ...vf.skillsCatalog() });
});

router.get('/stats', (req, res) => {
  res.json({ success: true, ...(awaitable => vf.operate({ action: 'stats' }))() });
});

router.post('/workers', (req, res) => {
  try {
    res.json({ success: true, ...vf.registerWorker(req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.get('/workers', (req, res) => {
  res.json({ success: true, workers: vf.listWorkers(req.query) });
});

router.get('/workers/:id', (req, res) => {
  const w = vf.getWorker(req.params.id);
  if (!w) return res.status(404).json({ success: false, error: 'not found' });
  res.json({ success: true, worker: w });
});

router.post('/jobs', (req, res) => {
  try {
    res.json({ success: true, ...vf.createJob(req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/jobs/:id/publish', (req, res) => {
  try {
    res.json({ success: true, ...vf.publishJob(req.params.id) });
  } catch (e) {
    fail(res, e);
  }
});

router.get('/jobs/:id/match', (req, res) => {
  try {
    res.json({ success: true, ...vf.matchWorkers(req.params.id, req.query) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/jobs/:id/apply', (req, res) => {
  try {
    res.json({
      success: true,
      ...vf.applyToJob(req.params.id, req.body?.worker_id, req.body || {}),
    });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/jobs/:id/assign', (req, res) => {
  try {
    res.json({
      success: true,
      ...vf.assignWorker(req.params.id, req.body?.worker_id, req.body || {}),
    });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/jobs/:id/start', (req, res) => {
  try {
    res.json({ success: true, ...vf.startJob(req.params.id) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/jobs/:id/submit', (req, res) => {
  try {
    res.json({ success: true, ...vf.submitWork(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/jobs/:id/approve', (req, res) => {
  try {
    res.json({ success: true, ...vf.approveJob(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/jobs/:id/dispute', async (req, res) => {
  try {
    res.json({ success: true, ...(await vf.disputeJob(req.params.id, req.body || {})) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/operate', async (req, res) => {
  try {
    res.json({ success: true, ...(await vf.operate(req.body || {})) });
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
