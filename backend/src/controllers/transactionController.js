/**
 * Transaction Controller
 * Handles transaction processing and management
 */

const { logger } = require('../utils/logger');
const transactionService = require('../services/transactionService');

const transactionController = {
  async createTransaction(req, res) {
    try {
      const transaction = await transactionService.createTransaction(req.body);
      res.json({ success: true, data: transaction });
    } catch (error) {
      logger.error('Create transaction failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const transaction = await transactionService.getTransaction(transactionId);
      res.json({ success: true, data: transaction });
    } catch (error) {
      logger.error('Get transaction failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getUserTransactions(req, res) {
    try {
      const { userId } = req.params;
      const transactions = await transactionService.getUserTransactions(userId);
      res.json({ success: true, data: transactions });
    } catch (error) {
      logger.error('Get user transactions failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateTransactionStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const result = await transactionService.updateStatus(transactionId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Update transaction status failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = transactionController;