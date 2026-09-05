/**
 * Fertilizer Inventory Routes (M112 — Input Supply domain)
 * Backs frontend/src/pages/FertilizerInventoryPage.jsx — see
 * backend/src/services/fertilizerInventoryService.js and migration
 * 066_fertilizer_inventory_schema.sql for the full context.
 */

const express = require('express');
const router = express.Router();
const fertilizerInventoryService = require('../services/legacy/fertilizerInventoryService');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');

router.get('/inventory', async (req, res) => {
  try {
    const result = await fertilizerInventoryService.listInventory({ page: req.query.page, limit: req.query.limit });
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/inventory', authMiddleware, async (req, res) => {
  try {
    const item = await fertilizerInventoryService.createInventoryItem(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/inventory/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    let item = await fertilizerInventoryService.updateInventoryItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/inventory/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const ok = await fertilizerInventoryService.deleteInventoryItem(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/inventory/:id/issue', authMiddleware, async (req, res) => {
  try {
    let result = await fertilizerInventoryService.issueStock(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/issues', async (req, res) => {
  try {
    let result = await fertilizerInventoryService.listIssues({ page: req.query.page, limit: req.query.limit });
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real stock + real consumption -> computed reorder-point alerts.
router.get('/inventory/reorder-alerts', async (req, res) => {
  try {
    const alerts = await fertilizerInventoryService.getReorderAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
