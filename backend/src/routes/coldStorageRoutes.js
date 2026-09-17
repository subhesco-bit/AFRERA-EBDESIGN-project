/**
 * cold Storage Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'coldStorageRoutes',
    message: 'Route operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'coldStorageRoutes'
  });
});

// 2026-09-17: found while auditing ColdStorageDashboardPage.jsx's
// coldStorageAPI (getFacilities/getStatus/getTemperatureData/
// getComplianceStatus/bookFacility) against api.js - none of those
// methods existed (only getColdStorage/manageColdStorage, unused by any
// page). Traced the real backend: services/legacy/coldStorageService.js
// is a genuine, 644-line, transactional (row-locked, overlap-checked
// booking capacity) service with getFacilities/getSystemStatus/
// getTemperatureReadings/getComplianceStats/bookFacility methods that
// match this page almost exactly - it just had no route file at all.
// This file (already mounted at /api/coldstorage) was the "Route
// operational" scaffold sitting in front of it. Added real routes
// calling straight into the real service, no fabricated logic.
const coldStorageService = require('../services/legacy/coldStorageService.js');

router.get('/facilities', async (req, res) => {
  try {
    const facilities = await coldStorageService.getFacilities(req.query);
    res.json({ success: true, data: facilities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const status = await coldStorageService.getSystemStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:facilityId/temperature', async (req, res) => {
  try {
    const readings = await coldStorageService.getTemperatureReadings(req.params.facilityId, req.query);
    res.json({ success: true, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:facilityId/compliance', async (req, res) => {
  try {
    const stats = await coldStorageService.getComplianceStats(req.params.facilityId, req.query.hours);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:facilityId/book', async (req, res) => {
  try {
    const booking = await coldStorageService.bookFacility(req.params.facilityId, req.body);
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(/capacity|required/i.test(error.message) ? 400 : 500).json({ success: false, error: error.message });
  }
});

module.exports = router;
