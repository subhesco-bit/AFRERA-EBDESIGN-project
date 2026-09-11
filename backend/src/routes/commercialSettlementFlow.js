const express = require('express');
const router = express.Router();
const flow = require('../services/commercialSettlementFlowService');

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  req.userId = token; next();
}
router.use(auth);

router.post('/prepare', async (req, res) => {
  try { res.status(201).json({ success: true, data: await flow.reconcileAndPrepare({ ...req.body, actorId: req.userId }) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.post('/:orderId/settlements/:settlementId/approve', async (req, res) => {
  try { res.json({ success: true, data: await flow.approve(req.params.orderId, req.params.settlementId, req.userId) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

module.exports = router;
