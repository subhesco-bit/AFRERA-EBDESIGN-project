/**
 * Real backend routes for cart/checkout/order pages (CartPage, CheckoutPage,
 * OrderDetailPage, PaymentProcessingPage, ProductDetailPage), backed by
 * services/legacy/orderService.js.
 *
 * All cart/order operations require the authenticated user's id, which the
 * page calls don't pass explicitly (filled from req.user here - this
 * router requires authMiddleware, not optional, since these are
 * money/order-handling endpoints). getOrders -> getUserOrders, getOrder ->
 * getOrderById (name differences). cancelOrder maps to the real
 * updateOrderStatus(orderId, 'cancelled') - there's no separate
 * cancelOrder function, but this is exactly what cancellation means in
 * this service's model, not an invented behavior.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/orderService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/orders/cart', wrap((req) => svc.getCart(req.user.id)));
router.post('/orders/cart/add', wrap((req) => svc.addToCart(req.user.id, req.body.product_id, req.body.quantity, req.body.attributes)));
router.put('/orders/cart/item/:id', wrap((req) => svc.updateCartItem(req.user.id, req.params.id, req.body.quantity)));
router.delete('/orders/cart/item/:id', wrap((req) => svc.removeFromCart(req.user.id, req.params.id)));

router.get('/orders', wrap((req) => svc.getUserOrders(req.user.id, req.query, req.query)));
router.get('/orders/:id', wrap((req) => svc.getOrderById(req.params.id, req.user.id)));
router.post('/orders/:id/cancel', wrap((req) => svc.updateOrderStatus(req.params.id, 'cancelled')));
router.post('/orders/:id/payment', wrap((req) => svc.processPayment(req.params.id, req.body, req.user.id)));

module.exports = router;
