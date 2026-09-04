/**
 * Buyer Trust Routes
 * Handles buyer trust scoring and reputation management
 */

const express = require('express');
const router = express.Router();
const buyerTrustService = require('../services/buyerTrustService');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * GET /buyers/:id/trust
 * Get buyer trust score
 */
router.get('/buyers/:id/trust', authenticateToken, async (req, res, next) => {
  try {
    const result = await buyerTrustService.calculateBuyerTrustScore(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get buyer trust score error: ${error.message}`);
    next(error);
  }
});

/**
 * GET /buyers/:id/reputation
 * Get buyer reputation badge
 */
router.get('/buyers/:id/reputation', async (req, res, next) => {
  try {
    const result = await buyerTrustService.getBuyerReputation(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get buyer reputation error: ${error.message}`);
    next(error);
  }
});

/**
 * GET /buyers/:id/payment-history
 * Get buyer payment reliability metrics
 */
router.get('/buyers/:id/payment-history', authenticateToken, async (req, res, next) => {
  try {
    const result = await buyerTrustService.getBuyerPaymentHistory(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get payment history error: ${error.message}`);
    next(error);
  }
});

/**
 * POST /buyers/:id/fraud-report
 * Report fraud suspicion for buyer
 */
router.post('/buyers/:id/fraud-report',
  authenticateToken,
  validateRequest({
    body: {
      reason: 'string|required'
    }
  }),
  async (req, res, next) => {
    try {
      const result = await buyerTrustService.reportFraudSuspicion(
        req.params.id,
        req.body.reason
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Fraud report submitted'
      });
    } catch (error) {
      logger.error(`Report fraud error: ${error.message}`);
      next(error);
    }
  }
);

module.exports = router;
