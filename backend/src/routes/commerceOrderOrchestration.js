const express = require('express');
const router = express.Router();
const service = require('../services/commerceOrderOrchestrationService');

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
  req.userId = token;
  next();
}

router.post('/orders', auth, async (req, res) => {
  try {
    const order = await service.createOrder({ ...req.body, buyerId: req.body.buyerId || req.userId });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/orders/:id', auth, async (req, res) => {
  try {
    const order = await service.getOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/orders/:id/transition', auth, async (req, res) => {
  try {
    const order = await service.transitionOrder(req.params.id, req.body.toStatus, req.userId, req.body.reason);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(error.message === 'Order not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

module.exports = router;
