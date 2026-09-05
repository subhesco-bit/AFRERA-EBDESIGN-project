/**
 * Wallet Controller
 * Handles digital wallet operations
 */

const { logger } = require('../utils/logger');
const walletService = require('../services/walletService');

const walletController = {
  async getWalletBalance(req, res) {
    try {
      const { userId } = req.params;
      const balance = await walletService.getBalance(userId);
      res.json({ success: true, data: balance });
    } catch (error) {
      logger.error('Get wallet balance failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createWallet(req, res) {
    try {
      const wallet = await walletService.createWallet(req.body);
      res.json({ success: true, data: wallet });
    } catch (error) {
      logger.error('Create wallet failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async addFunds(req, res) {
    try {
      const { walletId } = req.params;
      const result = await walletService.addFunds(walletId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Add funds failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getTransactionHistory(req, res) {
    try {
      const { walletId } = req.params;
      const history = await walletService.getTransactionHistory(walletId);
      res.json({ success: true, data: history });
    } catch (error) {
      logger.error('Get transaction history failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = walletController;