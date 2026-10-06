/**
 * Wallet Controller
 * Handles digital wallet operations
 *
 * Every handler acts on the caller's own wallet unless the caller is an
 * admin. Previously any authenticated user could read any user's balance by
 * id, create wallets for other users, and credit arbitrary amounts to any
 * wallet (add-funds had no ownership, payment or amount check). Crediting
 * funds is now admin-only: user deposits go through the payment flow
 * (farmer-portal wallet / payment gateway), not a bare balance update.
 */

const { logger } = require('../utils/logger');
const walletService = require('../services/walletService');

const PRIVILEGED_ROLES = ['admin', 'superadmin'];
const isPrivileged = (req) => PRIVILEGED_ROLES.includes(req.user && req.user.role);

async function assertWalletAccess(req, res, walletId) {
  const ownerId = await walletService.getWalletOwner(walletId);
  if (!ownerId) {
    res.status(404).json({ success: false, error: 'Wallet not found' });
    return false;
  }
  if (!isPrivileged(req) && String(ownerId) !== String(req.user.id)) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return false;
  }
  return true;
}

const walletController = {
  async getWalletBalance(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      if (!isPrivileged(req) && String(userId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      const balance = await walletService.getBalance(userId);
      res.json({ success: true, data: balance });
    } catch (error) {
      logger.error('Get wallet balance failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createWallet(req, res) {
    try {
      // Only the currency is caller-controlled; owner and balance are not.
      const userId = isPrivileged(req) && req.body.userId ? req.body.userId : req.user.id;
      const wallet = await walletService.createWallet({ userId, currency: req.body.currency });
      res.json({ success: true, data: wallet });
    } catch (error) {
      logger.error('Create wallet failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async addFunds(req, res) {
    try {
      if (!isPrivileged(req)) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, error: 'amount must be a positive number' });
      }
      const { walletId } = req.params;
      if (!(await assertWalletAccess(req, res, walletId))) return undefined;
      const result = await walletService.addFunds(walletId, { ...req.body, amount });
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Add funds failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getTransactionHistory(req, res) {
    try {
      const { walletId } = req.params;
      if (!(await assertWalletAccess(req, res, walletId))) return undefined;
      const history = await walletService.getTransactionHistory(walletId);
      res.json({ success: true, data: history });
    } catch (error) {
      logger.error('Get transaction history failed', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = walletController;
