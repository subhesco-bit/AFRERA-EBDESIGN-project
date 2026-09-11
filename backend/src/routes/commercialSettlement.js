const express = require('express');
const router = express.Router();
const service = require('../services/commercialSettlementService');

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  req.userId = token;
  next();
}

router.use(auth);

router.post('/', async (req, res) => {
  try { res.status(201).json({ success: true, data: await service.createSettlement({ ...req.body, actorId: req.userId }) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try { const data = await service.getSettlement(req.params.id); if (!data) return res.status(404).json({ success: false, error: 'Settlement not found' }); res.json({ success: true, data }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.post('/:id/transition', async (req, res) => {
  try { res.json({ success: true, data: await service.transition(req.params.id, req.body.toStatus, req.userId, req.body.reason) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

router.post('/:id/payment-attempts', async (req, res) => {
  try { res.status(201).json({ success: true, data: await service.recordPaymentAttempt({ ...req.body, settlementId: req.params.id }) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

module.exports = router;
