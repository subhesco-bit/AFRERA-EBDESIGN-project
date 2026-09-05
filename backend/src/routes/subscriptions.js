const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

router.post('/subscriptions', authenticateToken, validateRequest({ body: { plan_id: 'string|required' } }), async (req, res, next) => {
  try {
    const result = await subscriptionService.createSubscription(req.user.id, req.body.plan_id);
    res.status(201).json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.get('/users/:id/subscription', authenticateToken, async (req, res, next) => {
  try {
    let result = await subscriptionService.getActiveSubscription(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.put('/subscriptions/:id/upgrade', authenticateToken, validateRequest({ body: { new_plan_id: 'string|required' } }), async (req, res, next) => {
  try {
    let result = await subscriptionService.upgradeSubscription(req.params.id, req.body.new_plan_id);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

router.delete('/subscriptions/:id', authenticateToken, async (req, res, next) => {
  try {
    let result = await subscriptionService.cancelSubscription(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) { logger.error(`Error: ${error.message}`); next(error); }
});

module.exports = router;
