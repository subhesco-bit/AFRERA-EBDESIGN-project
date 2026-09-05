/**
 * Controller for Order Management (M053)
 * Handles HTTP requests for order operations
 */

const orderService = require('./service');

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const listOrders = async (req, res) => {
  try {
    const orders = await orderService.listOrders(req.query);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    let order = await orderService.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    let order = await orderService.updateOrderStatus(req.params.id, req.body.status, req.body.notes);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    let order = await orderService.cancelOrder(req.params.id, req.body.reason);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const processPayment = async (req, res) => {
  try {
    const payment = await orderService.processPayment(req.params.id, req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const trackOrder = async (req, res) => {
  try {
    const tracking = await orderService.trackOrder(req.params.id);
    res.status(200).json({ success: true, data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  processPayment,
  trackOrder
};
