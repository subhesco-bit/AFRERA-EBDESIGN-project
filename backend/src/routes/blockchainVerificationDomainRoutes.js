/**
 * Real backend routes for BlockchainVerificationPage.jsx, backed by
 * services/blockchainVerificationService.js. getStats -> getBlockchainStats
 * (name diff); verifyProduct is exact.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/blockchainVerificationService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/blockchain-verification/product/:productId/verify', wrap((req) => svc.verifyProduct(req.params.productId)));
router.get('/blockchain-verification/stats', wrap(() => svc.getBlockchainStats()));

module.exports = router;
