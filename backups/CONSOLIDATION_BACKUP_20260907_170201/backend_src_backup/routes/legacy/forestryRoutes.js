/**
 * Forestry Management Routes
 * RESTful API endpoints for forestry management (M026)
 */

const express = require('express');
const router = express.Router();
const forestryService = require('../../services/legacy/forestryService');
// (2026-08-29) Was importing from '../../middleware/authMiddleware', which
// does not exist - fixed to the real middleware module. See apicultureRoutes.js.
const { authMiddleware: authenticate } = require('../../middleware/auth');

// GET /api/v1/forestry - Get all forestry
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      farmer_id: req.query.farmer_id,
      type: req.query.type,
      status: req.query.status
    };
    const forestry = await forestryService.getAllForestry(filters);
    res.json({ success: true, data: forestry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/forestry/:id - Get forestry by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const forestry = await forestryService.getForestryById(req.params.id);
    res.json({ success: true, data: forestry });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/v1/forestry - Create forestry
router.post('/', authenticate, async (req, res) => {
  try {
    const forestry = await forestryService.createForestry(req.body);
    res.status(201).json({ success: true, data: forestry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/v1/forestry/:id/timber - Get timber inventory
router.get('/:id/timber', authenticate, async (req, res) => {
  try {
    const timber = await forestryService.getTimberInventory(req.params.id);
    res.json({ success: true, data: timber });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/forestry/:id/plantation - Get plantation data
router.get('/:id/plantation', authenticate, async (req, res) => {
  try {
    const plantation = await forestryService.getPlantationData(req.params.id);
    res.json({ success: true, data: plantation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
