/**
 * Vermicompost Management Routes
 * RESTful API endpoints for vermicompost management (M030)
 *
 * Recovered from the old-new-folder dump — real file, real backing service
 * (services/legacy/vermicompostService.js, exact method-name matches),
 * never copied into the live routes/ tree or mounted.
 */

const express = require('express');
const router = express.Router();
// Liveness ping preserved from the generated stub at
// backend/src/routes/legacy/vermicompostRoutes.js, retired 2026-09-13. That stub shared this
// file's basename, so dynamicRouteLoader.js mounted it INSTEAD of this file and
// these 5 routes never reached the API.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', module: 'vermicompostRoutes' });
});

const vermicompostService = require('../services/legacy/vermicompostService');
const { authMiddleware: authenticate } = require('../middleware/auth');

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

router.get('/:id', authenticate, async (req, res) => {
  try {
    const vermicompost = await vermicompostService.getVermicompostById(req.params.id);
    res.json({ success: true, data: vermicompost });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const vermicompost = await vermicompostService.createVermicompost(req.body);
    res.status(201).json({ success: true, data: vermicompost });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/earthworms', authenticate, async (req, res) => {
  try {
    const earthworms = await vermicompostService.getEarthwormManagement(req.params.id);
    res.json({ success: true, data: earthworms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/waste', authenticate, async (req, res) => {
  try {
    const waste = await vermicompostService.getOrganicWaste(req.params.id);
    res.json({ success: true, data: waste });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
