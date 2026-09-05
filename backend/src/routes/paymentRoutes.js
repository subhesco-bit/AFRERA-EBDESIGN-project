const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ success: true, data: paymentService.getStatus() });
});

router.use(authMiddleware);

router.post('/stripe/intent', async (req, res, next) => {
  try {
    const { amount, paymentMethodId } = req.body;
    const result = await paymentService.processStripePayment(req.user.id, amount, paymentMethodId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/razorpay/verify', async (req, res, next) => {
  try {
    const { amount, orderId } = req.body;
    const result = await paymentService.processRazorpayPayment(req.user.id, amount, orderId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;