const router = require('express').Router();
const warehouseService = require('../services/warehouseManagementService');
const auth = require('../middleware/auth');

router.post('/warehouses', auth, async (req, res) => {
  try {
    const result = await warehouseService.createWarehouse(req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/warehouses/:warehouseId/stock', auth, async (req, res) => {
  try {
    let result = await warehouseService.updateStock(req.params.warehouseId, req.body.product_id, req.body.quantity);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/warehouses/:warehouseId/inventory', async (req, res) => {
  try {
    let result = await warehouseService.getWarehouseInventory(req.params.warehouseId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
