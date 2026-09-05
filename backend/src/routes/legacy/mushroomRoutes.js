/**
 * Mushroom Cultivation Routes
 * RESTful API endpoints for mushroom cultivation (M029)
 */

const express = require('express.js');
const router = express.Router();
const mushroomService = require('../../services/legacy/mushroomService.js');
// (2026-08-29) Was importing from '../../middleware/authMiddleware', which
// does not exist - fixed to the real middleware module. See apicultureRoutes.js.
const { authMiddleware: authenticate } = require('../../middleware/auth.js');

// GET /api/v1/mushroom - Get all mushroom cultivation
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      farmer_id: req.query.farmer_id,
      variety: req.query.variety,
      status: req.query.status
    };
    const mushroom = await mushroomService.getAllMushroom(filters);
    res.json({ success: true, data: mushroom });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/mushroom/:id - Get mushroom cultivation by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    let mushroom = await mushroomService.getMushroomById(req.params.id);
    res.json({ success: true, data: mushroom });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/v1/mushroom - Create mushroom cultivation
router.post('/', authenticate, async (req, res) => {
  try {
    let mushroom = await mushroomService.createMushroom(req.body);
    res.status(201).json({ success: true, data: mushroom });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/v1/mushroom/:id/spawn - Get spawn management
router.get('/:id/spawn', authenticate, async (req, res) => {
  try {
    const spawn = await mushroomService.getSpawnManagement(req.params.id);
    res.json({ success: true, data: spawn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/mushroom/:id/substrate - Get substrate management
router.get('/:id/substrate', authenticate, async (req, res) => {
  try {
    const substrate = await mushroomService.getSubstrateManagement(req.params.id);
    res.json({ success: true, data: substrate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
