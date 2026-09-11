const express = require('express');
const router = express.Router();
const service = require('../services/commercialErpReconciliationService');

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  req.userId = token;
  next();
}

router.use(auth);
router.post('/inventory', async (req, res) => {
  try { res.status(201).json({ success: true, data: await service.recordInventory({ ...req.body, createdBy: req.userId }) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
router.post('/accounting', async (req, res) => {
  try { res.status(201).json({ success: true, data: await service.recordAccounting({ ...req.body, createdBy: req.userId }) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
router.post('/orders/:orderId/reconcile', async (req, res) => {
  try { res.json({ success: true, data: await service.reconcileOrder(req.params.orderId) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
module.exports = router;
