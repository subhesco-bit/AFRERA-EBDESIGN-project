/**
 * Village Contract Labour (UrbanClap-style) API
 * /api/v1/village-contract-labour
 * /api/v1/afrera/village-contract-labour
 */

'use strict';

const express = require('express');
const router = express.Router();
const vcl = require('../services/village/villageContractLabourPlatform');

function fail(res, e) {
  res.status(e.code ? 400 : 500).json({
    success: false,
    error: e.message,
    code: e.code,
    allowed: e.allowed,
  });
}

router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'village_contract_labour',
    model: 'urbanclap_farm',
    layer: 'farmer',
  });
});

router.get('/catalog', (req, res) => {
  res.json({ success: true, ...vcl.getCatalog() });
});

router.get('/catalog/:categoryId', (req, res) => {
  const c = vcl.getCategory(req.params.categoryId);
  if (!c) return res.status(404).json({ success: false, error: 'category not found' });
  res.json({ success: true, category: c });
});

router.get('/slots', (req, res) => {
  res.json({
    success: true,
    ...vcl.availableSlots(req.query.date, Number(req.query.duration_hours) || 4),
  });
});

router.post('/providers', (req, res) => {
  try {
    res.json({ success: true, ...vcl.registerProvider(req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/bookings', (req, res) => {
  try {
    res.json({ success: true, ...vcl.createBooking(req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/bookings/book-now', (req, res) => {
  try {
    res.json({ success: true, ...vcl.bookNow(req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/bookings/:id/schedule', (req, res) => {
  try {
    res.json({ success: true, ...vcl.scheduleBooking(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/bookings/:id/assign', (req, res) => {
  try {
    res.json({ success: true, ...vcl.assignProvider(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/bookings/:id/en-route', (req, res) => {
  try {
    res.json({ success: true, ...vcl.providerEnRoute(req.params.id) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/bookings/:id/start', (req, res) => {
  try {
    res.json({ success: true, ...vcl.startJob(req.params.id) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/bookings/:id/complete', (req, res) => {
  try {
    res.json({ success: true, ...vcl.completeJob(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/bookings/:id/rate', (req, res) => {
  try {
    res.json({ success: true, ...vcl.rateBooking(req.params.id, req.body || {}) });
  } catch (e) {
    fail(res, e);
  }
});

router.get('/bookings/:id', (req, res) => {
  const b = vcl.getBooking(req.params.id);
  if (!b) return res.status(404).json({ success: false, error: 'not found' });
  res.json({ success: true, booking: b });
});

router.get('/bookings', (req, res) => {
  res.json({ success: true, bookings: vcl.listBookings(req.query) });
});

router.post('/operate', async (req, res) => {
  try {
    res.json({ success: true, ...(await vcl.operate(req.body || {})) });
  } catch (e) {
    fail(res, e);
  }
});

module.exports = router;
