/**
 * Escrow Routes
 * Manages escrow transaction endpoints for secure buyer-farmer transactions
 */

const express = require('express');
const router = express.Router();
const escrowService = require('../services/legacy/escrowService');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const apiResponseHandler = require('../middleware/apiResponseHandler');

// Get all escrow transactions (admin only)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const transactions = await escrowService.listEscrowTransactions();
    apiResponseHandler.sendSuccess(res, transactions);
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

// Create escrow transaction
router.post('/', authMiddleware, async (req, res) => {
  try {
    const escrowData = { ...req.body };
    if (req.user.role === 'buyer') {
      escrowData.buyer_id = req.user.id;
    } else if (req.user.role === 'farmer') {
      escrowData.farmer_id = req.user.id;
    } else if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Buyer, farmer, or admin role required' });
    }
    const escrow = await escrowService.createEscrowTransaction(escrowData);
    apiResponseHandler.sendSuccess(res, escrow, 'Escrow transaction created successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

// Get specific escrow transaction
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    let escrow = await escrowService.getEscrowTransaction(req.params.id);
    const canView = ['admin', 'superadmin'].includes(req.user.role)
      || escrow.buyer_id === req.user.id
      || escrow.farmer_id === req.user.id;
    if (!canView) {
      return res.status(403).json({ error: 'You do not have access to this escrow transaction' });
    }
    apiResponseHandler.sendSuccess(res, escrow);
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

// Release escrow funds to farmer
router.post('/:id/release', authMiddleware, async (req, res) => {
  try {
    let escrow = await escrowService.getEscrowTransaction(req.params.id);
    if (!['admin', 'superadmin'].includes(req.user.role) && escrow.farmer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the receiving farmer or an administrator can release escrow' });
    }
    const result = await escrowService.releaseEscrowFunds(req.params.id, req.body);
    apiResponseHandler.sendSuccess(res, result, 'Escrow funds released successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

// Refund escrow to buyer
router.post('/:id/refund', authMiddleware, async (req, res) => {
  try {
    let escrow = await escrowService.getEscrowTransaction(req.params.id);
    if (!['admin', 'superadmin'].includes(req.user.role) && escrow.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the paying buyer or an administrator can request a refund' });
    }
    let result = await escrowService.refundEscrowFunds(req.params.id, req.body.reason || 'Buyer refund request');
    apiResponseHandler.sendSuccess(res, result, 'Escrow refunded successfully');
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

// Get escrow status
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    let escrow = await escrowService.getEscrowTransaction(req.params.id);
    let canView = ['admin', 'superadmin'].includes(req.user.role)
      || escrow.buyer_id === req.user.id
      || escrow.farmer_id === req.user.id;
    if (!canView) {
      return res.status(403).json({ error: 'You do not have access to this escrow status' });
    }
    const status = await escrowService.getEscrowStatus(req.params.id);
    apiResponseHandler.sendSuccess(res, status);
  } catch (error) {
    apiResponseHandler.sendError(res, error.message);
  }
});

module.exports = router;
