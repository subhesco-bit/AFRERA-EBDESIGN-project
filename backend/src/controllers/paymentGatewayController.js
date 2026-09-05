/**
 * Payment Gateway Controller
 * Handles payment processing and gateway integration
 */

const { logger } = require('../utils/logger');
const paymentGatewayService = require('../services/paymentGatewayService');

const paymentGatewayController = {
  async processPayment(req, res) {
    try {
      const result = await paymentGatewayService.processPayment(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Payment processing failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const status = await paymentGatewayService.getPaymentStatus(paymentId);
      res.json({ success: true, data: status });
    } catch (error) {
      logger.error('Payment status check failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async refundPayment(req, res) {
    try {
      const { paymentId } = req.params;
      let result = await paymentGatewayService.refundPayment(paymentId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Payment refund failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getSupportedGateways(req, res) {
    try {
      const gateways = await paymentGatewayService.getSupportedGateways();
      res.json({ success: true, data: gateways });
    } catch (error) {
      logger.error('Get supported gateways failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = paymentGatewayController;