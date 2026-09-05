/**
 * M028: Blockchain Verification Routes
 * Production-level API routes for blockchain verification service
 */

const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainVerificationService');
const apiResponseHandler = require('../middleware/apiResponseHandler');
// '../middleware/authMiddleware' does not exist in this repo - the real module is
// '../middleware/auth', exporting authMiddleware/requireRole, not authenticate/authorize.
const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
const authorize = (roles) => requireRole(...roles);
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply authentication and rate limiting
router.use(authenticate);
router.use(apiLimiter);

/**
 * POST /api/blockchain/transactions/product
 * Create blockchain transaction for product
 */
router.post('/transactions/product',
  authorize(['farmer', 'admin', 'system']),
  async (req, res) => {
    try {
      const productData = req.body;
      const { farmerId } = productData;

      // Authorization check
      if (req.user.role === 'farmer' && req.user.id !== farmerId) {
        return apiResponseHandler.sendError(res, 'Unauthorized access', 403, 'FORBIDDEN');
      }

      const result = await blockchainService.createProductTransaction(productData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Product transaction created on blockchain');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'BLOCKCHAIN_ERROR', result.productId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to create product transaction', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/blockchain/transactions/custody
 * Add custody transfer transaction
 */
router.post('/transactions/custody',
  authorize(['admin', 'system', 'logistics_provider']),
  async (req, res) => {
    try {
      const transferData = req.body;

      let result = await blockchainService.addCustodyTransfer(transferData);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Custody transfer recorded on blockchain');
      } else {
        return apiResponseHandler.sendError(res, result.error, 400, 'BLOCKCHAIN_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to add custody transfer', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/blockchain/products/:productId/verify
 * Verify product authenticity
 */
router.get('/products/:productId/verify',
  authenticate, // Open to authenticated users for transparency
  async (req, res) => {
    try {
      const { productId } = req.params;

      let result = await blockchainService.verifyProductAuthenticity(productId);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Product authenticity verified');
      } else {
        return apiResponseHandler.sendError(res, result.error, 404, 'PRODUCT_NOT_FOUND', result.productId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to verify product authenticity', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/blockchain/products/:productId/traceability
 * Get product traceability report
 */
router.get('/products/:productId/traceability',
  authenticate, // Open to authenticated users for transparency
  async (req, res) => {
    try {
      const { productId } = req.params;

      let result = await blockchainService.getProductTraceabilityReport(productId);
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Product traceability report generated');
      } else {
        return apiResponseHandler.sendError(res, result.error, 404, 'PRODUCT_NOT_FOUND', result.productId);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to generate traceability report', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/blockchain/transactions/:productId/history
 * Get product transaction history
 */
router.get('/transactions/:productId/history',
  authenticate,
  async (req, res) => {
    try {
      const { productId } = req.params;

      const history = await blockchainService.getProductTransactionHistory(productId);
      
      return apiResponseHandler.sendSuccess(res, {
        productId,
        transactionCount: history.length,
        transactions: history
      }, 'Product transaction history retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get transaction history', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/blockchain/stats
 * Get blockchain statistics
 */
router.get('/stats',
  authorize(['admin', 'analyst']),
  async (req, res) => {
    try {
      let result = await blockchainService.getBlockchainStats();
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, 'Blockchain statistics retrieved');
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'STATS_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get blockchain statistics', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * POST /api/blockchain/transactions/process
 * Process pending transactions
 */
router.post('/transactions/process',
  authorize(['admin', 'system']),
  async (req, res) => {
    try {
      let result = await blockchainService.processPendingTransactions();
      
      if (result.success) {
        return apiResponseHandler.sendSuccess(res, result.data, result.message);
      } else {
        return apiResponseHandler.sendError(res, result.error, 500, 'PROCESSING_ERROR', result.details);
      }
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to process pending transactions', 500, 'SERVER_ERROR', error.message);
    }
  }
);

/**
 * GET /api/blockchain/transactions/pending
 * Get pending transactions
 */
router.get('/transactions/pending',
  authorize(['admin']),
  async (req, res) => {
    try {
      const pending = blockchainService.getPendingTransactions();
      
      return apiResponseHandler.sendSuccess(res, pending, 'Pending transactions retrieved');
    } catch (error) {
      return apiResponseHandler.sendError(res, 'Failed to get pending transactions', 500, 'SERVER_ERROR', error.message);
    }
  }
);

module.exports = router;