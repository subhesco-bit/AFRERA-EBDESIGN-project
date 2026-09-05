/**
 * Product Certification Routes
 * Handles product certifications (GI, Organic, Fair-Trade)
 */

const express = require('express');
const router = express.Router();
const productCertificationService = require('../services/productCertificationService');
const { authMiddleware: authenticateToken, requireRole: authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * POST /products/:id/certifications
 * Add certification to product
 */
router.post('/products/:id/certifications',
  authenticateToken,
  authorize(['seller', 'admin']),
  validateRequest({
    body: {
      certification_type: 'string|required',
      certificate_number: 'string',
      issuer: 'string',
      issued_date: 'string',
      valid_until: 'string'
    }
  }),
  async (req, res, next) => {
    try {
      const result = await productCertificationService.addCertification(
        req.params.id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Certification added successfully'
      });
    } catch (error) {
      logger.error(`Add certification error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * GET /products/:id/certifications
 * Get product certifications
 */
router.get('/products/:id/certifications', async (req, res, next) => {
  try {
    let result = await productCertificationService.getProductCertifications(req.params.id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Get certifications error: ${error.message}`);
    next(error);
  }
});

/**
 * POST /certifications/:id/verify
 * Verify certification against registry
 */
router.post('/certifications/:id/verify',
  authenticateToken,
  authorize(['admin']),
  validateRequest({
    body: {
      certificate_number: 'string|required'
    }
  }),
  async (req, res, next) => {
    try {
      let result = await productCertificationService.verifyCertification(
        req.body.certificate_number
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error(`Verify certification error: ${error.message}`);
      next(error);
    }
  }
);

/**
 * DELETE /certifications/:id
 * Revoke certification
 */
router.delete('/certifications/:id',
  authenticateToken,
  authorize(['admin']),
  validateRequest({
    body: {
      reason: 'string'
    }
  }),
  async (req, res, next) => {
    try {
      let result = await productCertificationService.revokeCertification(
        req.params.id,
        req.body.reason
      );

      res.json({
        success: true,
        data: result,
        message: 'Certification revoked'
      });
    } catch (error) {
      logger.error(`Revoke certification error: ${error.message}`);
      next(error);
    }
  }
);

module.exports = router;

