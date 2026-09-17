/**
 * return Load Board Routes
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
    module: 'returnLoadBoardRoutes',
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
    module: 'returnLoadBoardRoutes'
  });
});

// 2026-09-17: found while auditing LogisticsMatchingPage.jsx's
// returnLoadBoardAPI (postCapacity/searchAvailable/bookPosting/cancelPosting)
// against api.js - none of those methods existed (only getReturnLoads/
// postReturnLoad, unused by this page). Traced the real backend: a genuine,
// table-backed (return_load_postings, migration
// 9999_zzzzzzzz_return_load_board_schema.sql) service already exists at
// services/legacy/returnLoadBoardService.js with exactly these 4 methods -
// it just had no working router pointed at it. Two OTHER route files
// (routes/returnLoadBoardRoutes_merged.js and
// routes/logistics/returnLoadBoardRoutes.js) already wrap this same real
// service correctly, but neither is required/mounted anywhere in index.js -
// this file (already mounted at /api/returnloadboard) was the "Route
// operational" scaffold actually in front of traffic. Added real routes
// calling straight into the real service under /postings (kept off the
// scaffold's existing POST '/' and GET '/health' to avoid shadowing them),
// no fabricated logic.
const returnLoadBoardService = require('../services/legacy/returnLoadBoardService.js');

router.post('/postings', async (req, res) => {
  try {
    const posting = await returnLoadBoardService.postCapacity(req.user?.id, req.body);
    res.status(201).json({ success: true, data: posting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/postings', async (req, res) => {
  try {
    const { originAddress, destinationAddress, minCapacityKg } = req.query;
    const postings = await returnLoadBoardService.searchAvailable({ originAddress, destinationAddress, minCapacityKg });
    res.json({ success: true, count: postings.length, data: postings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/postings/:postingId/book', async (req, res) => {
  try {
    const posting = await returnLoadBoardService.bookPosting(req.params.postingId, req.body.shipmentId);
    res.json({ success: true, data: posting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/postings/:postingId', async (req, res) => {
  try {
    const posting = await returnLoadBoardService.cancelPosting(req.params.postingId, req.user?.id);
    res.json({ success: true, data: posting });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
