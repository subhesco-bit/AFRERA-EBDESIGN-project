/**
 * Fisheries Management Routes
 * RESTful API endpoints for fisheries management (M025)
 *
 * Recovered from the old-new-folder dump — real file, real backing service
 * (services/legacy/fisheriesService.js). NOTE: this is a DIFFERENT service
 * from services/legacy/fisheriesManagementService.js (backing
 * fisheriesDomainRoutes.js's 9 sub-modules, mounted separately at
 * /bioflocc-farm, /hatchery-management, /fish-feed, etc.) — verified no
 * path collision, this file owns the bare /fisheries paths and
 * fisheriesManagementService covers a distinct set of sub-features.
 */

const express = require('express');
const router = express.Router();
// Liveness ping carried over from fisheriesRoutes.js, merged and
// retired 2026-09-13. Declared first so a pattern route cannot swallow it.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', module: 'fisheriesRoutes' });
});

const fisheriesService = require('../services/legacy/fisheriesService');
const { authMiddleware: authenticate } = require('../middleware/auth');

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

router.get('/:id', authenticate, async (req, res) => {
  try {
    const fishery = await fisheriesService.getFisheryById(req.params.id);
    res.json({ success: true, data: fishery });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const fishery = await fisheriesService.createFishery(req.body);
    res.status(201).json({ success: true, data: fishery });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/ponds', authenticate, async (req, res) => {
  try {
    const ponds = await fisheriesService.getPondManagement(req.params.id);
    res.json({ success: true, data: ponds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/feed', authenticate, async (req, res) => {
  try {
    const feed = await fisheriesService.getFishFeed(req.params.id);
    res.json({ success: true, data: feed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/harvest', authenticate, async (req, res) => {
  try {
    const harvest = await fisheriesService.getFishHarvest(req.params.id);
    res.json({ success: true, data: harvest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
