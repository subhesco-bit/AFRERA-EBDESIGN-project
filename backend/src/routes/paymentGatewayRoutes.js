/**
 * Payment Gateway Routes
 */

const express = require('express');
const router = express.Router();
const paymentGatewayController = require('../controllers/paymentGatewayController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(apiLimiter);

router.post('/process', paymentGatewayController.processPayment);
router.get('/status/:paymentId', paymentGatewayController.getPaymentStatus);
router.post('/refund/:paymentId', paymentGatewayController.refundPayment);
router.get('/gateways', paymentGatewayController.getSupportedGateways);

module.exports = router;