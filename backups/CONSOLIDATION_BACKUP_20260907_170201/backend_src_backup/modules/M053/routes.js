// Express routes for Order Management (M053)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/orders', controller.createOrder);
router.get('/orders', controller.listOrders);
router.get('/orders/:id', controller.getOrder);
router.put('/orders/:id/status', controller.updateOrderStatus);
router.post('/orders/:id/cancel', controller.cancelOrder);
router.post('/orders/:id/payment', controller.processPayment);
router.get('/orders/:id/tracking', controller.trackOrder);

module.exports = router;
