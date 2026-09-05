/**
 * Product Review Routes
 *
 * (2026-08-29) productReviewService.js (450 lines, real, table-backed against
 * product_reviews - migration 009_marketplace_enhancements.sql) was never
 * required anywhere in index.js - a genuinely orphaned service. Wired here.
 */

'use strict';

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const productReviewService = require('../services/legacy/productReviewService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

router.post
    // Log request
    logger.debug('router.post request');('/products/:productId', authMiddleware, async (req, res) => {
  try {
    const result = await productReviewService.createReview(req.user.id, req.params.productId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/products/:productId', async (req, res) => {
  try {
    let result = await productReviewService.getProductReviews(req.params.productId, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/products/:productId/stats', async (req, res) => {
  try {
    let result = await productReviewService.getProductReviewStats(req.params.productId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/me', authMiddleware, async (req, res) => {
  try {
    const { page, limit } = req.query;
    let result = await productReviewService.getUserReviews(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put
    // Log request
    logger.debug('router.put request');('/:reviewId', authMiddleware, async (req, res) => {
  try {
    let result = await productReviewService.updateReview(req.params.reviewId, req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete
    // Log request
    logger.debug('router.delete request');('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let result = await productReviewService.deleteReview(req.params.reviewId, req.user.id, isAdmin);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post
    // Log request
    logger.debug('router.post request');('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    let result = await productReviewService.markReviewHelpful(req.params.reviewId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post
    // Log request
    logger.debug('router.post request');('/:reviewId/report', authMiddleware, async (req, res) => {
  try {
    let result = await productReviewService.reportReview(req.params.reviewId, req.user.id, req.body.reason);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch
    // Log request
    logger.debug('router.patch request');('/:reviewId/moderate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let result = await productReviewService.moderateReview(req.params.reviewId, req.body.status, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
