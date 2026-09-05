/**
 * Apiculture Management Routes
 * RESTful API endpoints for apiculture management (M028)
 */

const express = require('express');
const router = express.Router();
const apicultureService = require('../../services/legacy/apicultureService');
// (2026-08-29) Was importing from '../../middleware/authMiddleware', which
// does not exist - this route file could never be mounted without crashing
// the boot. That is the real reason it sat unwired. Fixed to the real
// middleware module.
const { authMiddleware: authenticate } = require('../../middleware/auth');

// GET /api/v1/apiculture - Get all apiculture
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      farmer_id: req.query.farmer_id,
      honey_type: req.query.honey_type,
      status: req.query.status
    };
    const apiculture = await apicultureService.getAllApiculture(filters);
    res.json({ success: true, data: apiculture });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/apiculture/:id - Get apiculture by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    let apiculture = await apicultureService.getApicultureById(req.params.id);
    res.json({ success: true, data: apiculture });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// POST /api/v1/apiculture - Create apiculture
router.post('/', authenticate, async (req, res) => {
  try {
    let apiculture = await apicultureService.createApiculture(req.body);
    res.status(201).json({ success: true, data: apiculture });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/v1/apiculture/:id/honey - Get honey production
router.get('/:id/honey', authenticate, async (req, res) => {
  try {
    const honey = await apicultureService.getHoneyProduction(req.params.id);
    res.json({ success: true, data: honey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/apiculture/:id/hives - Get hive health
router.get('/:id/hives', authenticate, async (req, res) => {
  try {
    const hives = await apicultureService.getHiveHealth(req.params.id);
    res.json({ success: true, data: hives });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
