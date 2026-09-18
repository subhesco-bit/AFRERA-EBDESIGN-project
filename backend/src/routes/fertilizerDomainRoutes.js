/**
 * Real backend routes for FertilizerInventoryPage.jsx, backed by
 * services/legacy/fertilizerInventoryService.js.
 *
 * Paths match frontend/src/services/api.js's fertilizerAPI (verified against
 * actual page usage - fertilizerAPI.getInventory/createInventoryItem/
 * updateInventoryItem/deleteInventoryItem/issueStock didn't exist on the
 * exported client until this change).
 */
'use strict';

const express = require('express');
const router = express.Router();
const {
  listInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, issueStock,
} = require('../services/legacy/fertilizerInventoryService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

router.get('/fertilizer-inventory/items', async (req, res) => {
  try {
    const result = await listInventory(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/fertilizer-inventory/item', async (req, res) => {
  try {
    const item = await createInventoryItem(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.put('/fertilizer-inventory/item/:id', async (req, res) => {
  try {
    const item = await updateInventoryItem(req.params.id, req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.delete('/fertilizer-inventory/item/:id', async (req, res) => {
  try {
    await deleteInventoryItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
router.post('/fertilizer-inventory/item/:id/issue', async (req, res) => {
  try {
    const result = await issueStock(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
