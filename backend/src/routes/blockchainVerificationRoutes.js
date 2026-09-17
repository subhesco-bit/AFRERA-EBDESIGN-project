/**
 * blockchain Verification Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

// 2026-09-17: real, DB-backed blockchain traceability logic (services/
// blockchainVerificationService.js, queries product_custody_transactions -
// migration 072) had zero route anywhere. BlockchainVerificationPage.jsx's
// getStats()/verifyProduct() calls expect exactly this service's
// getBlockchainStats()/verifyProductAuthenticity() response shapes
// (totalTransactions/uniqueProducts/currentBlockHeight/... and
// authenticityScore/chainValid/custodyChain/...) - added here rather than
// as a new file since this scaffold is already mounted at
// /api/blockchainverification.
const blockchainVerificationService = require('../services/blockchainVerificationService');

router.get('/stats', async (req, res) => {
  const result = await blockchainVerificationService.getBlockchainStats();
  res.status(result.success ? 200 : 500).json(result);
});

router.get('/verify/:productId', async (req, res) => {
  const result = await blockchainVerificationService.verifyProductAuthenticity(req.params.productId);
  res.status(result.success ? 200 : 404).json(result);
});

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'blockchainVerificationRoutes',
    message: 'Route operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'blockchainVerificationRoutes'
  });
});

module.exports = router;
