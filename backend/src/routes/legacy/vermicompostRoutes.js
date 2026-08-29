/**
 * Vermicompost Management Routes
 * RESTful API endpoints for vermicompost management (M030)
 */

const express = require('express');
const router = express.Router();
const vermicompostService = require('../../services/legacy/vermicompostService');
const { authenticate } = require('../../middleware/authMiddleware');

// GET /api/v1/vermicompost - Get all vermicompost
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      farmer_id: req.query.farmer_id,
      worm_type: req.query.worm_type,
      status: req.query.status
    };
    const vermicompost = await vermicompostService.getAllVermicompost(filters);
    res.json({ success: true, data: vermicompost });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/vermicompost/:id - Get vermicompost by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const vermicompost = await vermicompostService.getVermicompostById(req.params.id);
    res.json({ success: true, data: vermicompost });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/v1/vermicompost - Create vermicompost
router.post('/', authenticate, async (req, res) => {
  try {
    const vermicompost = await vermicompostService.createVermicompost(req.body);
    res.status(201).json({ success: true, data: vermicompost });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/v1/vermicompost/:id/earthworms - Get earthworm management
router.get('/:id/earthworms', authenticate, async (req, res) => {
  try {
    const earthworms = await vermicompostService.getEarthwormManagement(req.params.id);
    res.json({ success: true, data: earthworms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/vermicompost/:id/waste - Get organic waste
router.get('/:id/waste', authenticate, async (req, res) => {
  try {
    const waste = await vermicompostService.getOrganicWaste(req.params.id);
    res.json({ success: true, data: waste });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
