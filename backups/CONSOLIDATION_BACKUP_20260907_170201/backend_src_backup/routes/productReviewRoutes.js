/**
 * Product Review Routes
 *
 * (2026-08-29) productReviewService.js (450 lines, real, table-backed against
 * product_reviews - migration 009_marketplace_enhancements.sql) was never
 * required anywhere in index.js - a genuinely orphaned service. Wired here.
 */

'use strict';

const express = require('express');
const router = express.Router();
const productReviewService = require('../services/legacy/productReviewService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

router.post('/products/:productId', authMiddleware, async (req, res) => {
  try {
    const result = await productReviewService.createReview(req.user.id, req.params.productId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/products/:productId', async (req, res) => {
  try {
    const result = await productReviewService.getProductReviews(req.params.productId, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/products/:productId/stats', async (req, res) => {
  try {
    const result = await productReviewService.getProductReviewStats(req.params.productId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await productReviewService.getUserReviews(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const result = await productReviewService.updateReview(req.params.reviewId, req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await productReviewService.deleteReview(req.params.reviewId, req.user.id, isAdmin);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:reviewId/helpful', authMiddleware, async (req, res) => {
  try {
    const result = await productReviewService.markReviewHelpful(req.params.reviewId, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:reviewId/report', authMiddleware, async (req, res) => {
  try {
    const result = await productReviewService.reportReview(req.params.reviewId, req.user.id, req.body.reason);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:reviewId/moderate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await productReviewService.moderateReview(req.params.reviewId, req.body.status, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
