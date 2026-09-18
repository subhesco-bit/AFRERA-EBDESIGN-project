/**
 * Mushroom Cultivation Routes
 * RESTful API endpoints for mushroom cultivation (M029)
 *
 * Recovered from the old-new-folder dump — real file, real backing service
 * (services/legacy/mushroomService.js, exact method-name matches), never
 * copied into the live routes/ tree or mounted.
 */

const express = require('express');
const router = express.Router();
// Liveness ping preserved from the generated stub at
// backend/src/routes/legacy/mushroomRoutes.js, retired 2026-09-13. That stub shared this
// file's basename, so dynamicRouteLoader.js mounted it INSTEAD of this file and
// these 5 routes never reached the API.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', module: 'mushroomRoutes' });
});

const mushroomService = require('../services/legacy/mushroomService');
const { authMiddleware: authenticate } = require('../middleware/auth');

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

router.get('/:id', authenticate, async (req, res) => {
  try {
    const mushroom = await mushroomService.getMushroomById(req.params.id);
    res.json({ success: true, data: mushroom });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const mushroom = await mushroomService.createMushroom(req.body);
    res.status(201).json({ success: true, data: mushroom });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/spawn', authenticate, async (req, res) => {
  try {
    const spawn = await mushroomService.getSpawnManagement(req.params.id);
    res.json({ success: true, data: spawn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/substrate', authenticate, async (req, res) => {
  try {
    const substrate = await mushroomService.getSubstrateManagement(req.params.id);
    res.json({ success: true, data: substrate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
