/**
 * Fisheries Management Routes
 * RESTful API endpoints for fisheries management (M025)
 */

const express = require('express');
const router = express.Router();
const fisheriesService = require('../../services/legacy/fisheriesService');
// (2026-08-29) Was importing from '../../middleware/authMiddleware', which
// does not exist - fixed to the real middleware module. See apicultureRoutes.js.
const { authMiddleware: authenticate } = require('../../middleware/auth');
const { SIGNAL } = require('../../core/signalBus');
// Bounds pagination/IDs, sanitizes bodies, redacts internal errors, emits a
// correlated FISHERIES_RECORD_CHANGED signal on mutations - see
// livestockRouteSupport.js (shared with dairyRoutes.js).
const { protectLivestockRouter } = require('../livestockRouteSupport');

// requestGuard (installed below) already bounds page/limit (1-100) as
// router-wide middleware, ahead of this route's own `authenticate` check -
// that ordering is what lets an out-of-range limit return 400 even on an
// unauthenticated request, matching the other CRUD routers in this domain.
protectLivestockRouter(router, { signal: SIGNAL.FISHERIES_RECORD_CHANGED });

// GET /api/v1/fisheries - Get all fisheries
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      farmer_id: req.query.farmer_id,
      species: req.query.species,
      status: req.query.status
    };
    const fisheries = await fisheriesService.getAllFisheries(filters);
    res.json({ success: true, data: fisheries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/fisheries/:id - Get fishery by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const fishery = await fisheriesService.getFisheryById(req.params.id);
    res.json({ success: true, data: fishery });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/v1/fisheries - Create fishery
router.post('/', authenticate, async (req, res) => {
  try {
    const fishery = await fisheriesService.createFishery(req.body);
    res.status(201).json({ success: true, data: fishery });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/v1/fisheries/:id/ponds - Get pond management
router.get('/:id/ponds', authenticate, async (req, res) => {
  try {
    const ponds = await fisheriesService.getPondManagement(req.params.id);
    res.json({ success: true, data: ponds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/fisheries/:id/feed - Get fish feed
router.get('/:id/feed', authenticate, async (req, res) => {
  try {
    const feed = await fisheriesService.getFishFeed(req.params.id);
    res.json({ success: true, data: feed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/fisheries/:id/harvest - Get fish harvest
router.get('/:id/harvest', authenticate, async (req, res) => {
  try {
    const harvest = await fisheriesService.getFishHarvest(req.params.id);
    res.json({ success: true, data: harvest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
