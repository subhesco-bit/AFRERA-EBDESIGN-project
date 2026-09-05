/**
 * Seller Verification Routes
 * POST /sellers/:id/verify - Create verification request
 * GET /sellers/:id/verification - Get verification status
 * POST /admin/sellers/:id/verify - Admin approve verification
 * DELETE /admin/sellers/:id/verify - Admin reject verification
 */

const express = require('express');
const sellerVerificationService = require('../services/sellerVerificationService');
const { authMiddleware: authenticateToken, requireRole: authorize } = require('../middleware/auth');
const { validateBody: validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /sellers/:id/verify
 * Create/submit seller verification request
 */
router.post('/sellers/:id/verify', authenticateToken, validateRequest({
  body: {
    business_name: 'string|required',
    business_type: 'string',
    gst_number: 'string',
    pan_number: 'string',
    business_address: 'string|required',
    contact_phone: 'string|required',
    contact_email: 'string|required|email',
    documents: 'array'
  }
}), async (req, res, next) => {
  try {
    // Ensure user is verifying their own account
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await sellerVerificationService.createVerificationRequest(
      req.params.id,
      req.body
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Verification request submitted successfully'
    });
  } catch (error) {
    logger.error(`Verification endpoint error: ${error.message}`);
    next(error);
  }
});

/**
 * GET /sellers/:id/verification
 * Get seller verification status
 */
router.get('/sellers/:id/verification', authenticateToken, async (req, res, next) => {
  try {
    const status = await sellerVerificationService.getVerificationStatus(req.params.id);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error(`Get verification error: ${error.message}`);
    next(error);
  }
});

/**
 * GET /sellers/:id/certifications
 * Get seller certifications/badges
 */
router.get('/sellers/:id/certifications', async (req, res, next) => {
  try {
    const certs = await sellerVerificationService.getSellerCertifications(req.params.id);
    const trustScore = await sellerVerificationService.calculateTrustScore(req.params.id);

    res.json({
      success: true,
      data: {
        certifications: certs,
        trust_score: trustScore
      }
    });
  } catch (error) {
    logger.error(`Get certifications error: ${error.message}`);
    next(error);
  }
});

/**
 * POST /admin/sellers/:id/verify
 * Admin: Approve seller verification
 */
router.post('/admin/sellers/:id/verify',
  authenticateToken,
  authorize(['admin']),
  validateRequest({
    body: {
      admin_notes: 'string'
    }
  }),
  async (req, res, next) => {
    try {
      let result = await sellerVerificationService.verifySellerAccount(
        req.params.id,
        req.body.admin_notes || ''
      );

      res.json({
        success: true,
        data: result,
        message: 'Seller verified successfully'
      });
    } catch (error) {
      logger.error(`Admin verify error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * POST /admin/sellers/:id/verify/reject
 * Admin: Reject seller verification
 */
router.post('/admin/sellers/:id/verify/reject',
  authenticateToken,
  authorize(['admin']),
  validateRequest({
    body: {
      reason: 'string|required'
    }
  }),
  async (req, res, next) => {
    try {
      let result = await sellerVerificationService.rejectVerification(
        req.params.id,
        req.body.reason
      );

      res.json({
        success: true,
        data: result,
        message: 'Verification rejected'
      });
    } catch (error) {
      logger.error(`Admin reject error: ${error.message}`);
      next(error);
    }
  }
);

module.exports = router;


