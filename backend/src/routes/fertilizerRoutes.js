/**
 * fertilizer Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'fertilizerRoutes',
    message: 'Route operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'fertilizerRoutes'
  });
});

// 2026-09-17: found while auditing FertilizerInventoryPage.jsx's fertilizerAPI
// (getInventory/createInventoryItem/updateInventoryItem/deleteInventoryItem/
// issueStock) against api.js - none of those methods existed (only
// getFertilizers/manageFertilizer, unused by any page). Traced the real
// backend: services/legacy/fertilizerInventoryService.js's own header
// comment already says it "backs frontend/src/pages/FertilizerInventoryPage.jsx,
// a real, already-built stock list + 'Issue Stock' flow that has never had a
// backend" - a genuine, transactional (row-locked issue-stock flow that
// decrements real stock and writes a real agri_input_issues consumption
// record), table-backed (fertilizer_inventory, migration
// 066_fertilizer_inventory_schema.sql) service with exactly these 5
// methods. It was never required anywhere - this file (already mounted at
// /api/fertilizer) was the "Route operational" scaffold sitting in front of
// it. Added real routes calling straight into the real service, no
// fabricated logic.
const fertilizerInventoryService = require('../services/legacy/fertilizerInventoryService.js');

router.get('/inventory', async (req, res) => {
  try {
    const result = await fertilizerInventoryService.listInventory(req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/inventory', async (req, res) => {
  try {
    const item = await fertilizerInventoryService.createInventoryItem(req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(/required/i.test(error.message) ? 400 : 500).json({ success: false, error: error.message });
  }
});

router.put('/inventory/:id', async (req, res) => {
  try {
    const item = await fertilizerInventoryService.updateInventoryItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/inventory/:id', async (req, res) => {
  try {
    const removed = await fertilizerInventoryService.deleteInventoryItem(req.params.id);
    res.json({ success: true, data: { removed } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/inventory/:id/issue', async (req, res) => {
  try {
    const result = await fertilizerInventoryService.issueStock(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(/required|stock|not found/i.test(error.message) ? 400 : 500).json({ success: false, error: error.message });
  }
});

module.exports = router;
