/**
 * Forestry Management Routes
 * RESTful API endpoints for forestry management (M026)
 *
 * Recovered from the old-new-folder dump — real file, real backing service
 * (services/legacy/forestryService.js, exact method-name matches), never
 * copied into the live routes/ tree or mounted.
 */

const express = require('express');
const router = express.Router();
// Liveness ping carried over from forestryRoutes.js, merged and
// retired 2026-09-13. Declared first so a pattern route cannot swallow it.
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', module: 'forestryRoutes' });
});

const forestryService = require('../services/legacy/forestryService');
const { authMiddleware: authenticate } = require('../middleware/auth');

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

router.get('/:id', authenticate, async (req, res) => {
  try {
    const forestry = await forestryService.getForestryById(req.params.id);
    res.json({ success: true, data: forestry });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const forestry = await forestryService.createForestry(req.body);
    res.status(201).json({ success: true, data: forestry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/timber', authenticate, async (req, res) => {
  try {
    const timber = await forestryService.getTimberInventory(req.params.id);
    res.json({ success: true, data: timber });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/plantation', authenticate, async (req, res) => {
  try {
    const plantation = await forestryService.getPlantationData(req.params.id);
    res.json({ success: true, data: plantation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
