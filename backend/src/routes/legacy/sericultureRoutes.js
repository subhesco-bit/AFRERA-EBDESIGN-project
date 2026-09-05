/**
 * Sericulture Management Routes
 * RESTful API endpoints for sericulture management (M027)
 */

const express = require('express.js');
const router = express.Router();
const sericultureService = require('../../services/legacy/sericultureService.js');
// (2026-08-29) Was importing from '../../middleware/authMiddleware', which
// does not exist - fixed to the real middleware module. See apicultureRoutes.js.
const { authMiddleware: authenticate } = require('../../middleware/auth.js');

// GET /api/v1/sericulture - Get all sericulture
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      farmer_id: req.query.farmer_id,
      variety: req.query.variety,
      status: req.query.status
    };
    const sericulture = await sericultureService.getAllSericulture(filters);
    res.json({ success: true, data: sericulture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/sericulture/:id - Get sericulture by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    let sericulture = await sericultureService.getSericultureById(req.params.id);
    res.json({ success: true, data: sericulture });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/v1/sericulture - Create sericulture
router.post('/', authenticate, async (req, res) => {
  try {
    let sericulture = await sericultureService.createSericulture(req.body);
    res.status(201).json({ success: true, data: sericulture });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/v1/sericulture/:id/silk - Get silk production
router.get('/:id/silk', authenticate, async (req, res) => {
  try {
    const silk = await sericultureService.getSilkProduction(req.params.id);
    res.json({ success: true, data: silk });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/sericulture/:id/mulberry - Get mulberry cultivation
router.get('/:id/mulberry', authenticate, async (req, res) => {
  try {
    const mulberry = await sericultureService.getMulberryCultivation(req.params.id);
    res.json({ success: true, data: mulberry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
