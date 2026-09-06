/**
 * Controller for Payment Processing (M056)
 */
const paymentService = require('./service');

const create = async (req, res) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const get = async (req, res) => {
  try {
    const payment = await paymentService.getPayment(req.params.id);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const payment = await paymentService.updatePaymentStatus(req.params.id, req.body.status);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const refund = async (req, res) => {
  try {
    const refund = await paymentService.refundPayment(req.params.id, req.body.amount, req.body.reason);
    res.status(201).json({ success: true, data: refund });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await paymentService.deletePayment(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { create, get, updateStatus, refund, update, remove };
