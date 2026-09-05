/**
 * Seller Ranking Routes. See services/sellerRankingService.js — read its
 * header before assuming this is a full "buy-box"; it isn't (no real
 * multi-seller-per-product data model exists yet). This is real,
 * DB-backed seller trust ranking.
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const sellerRankingService = require('../services/legacy/sellerRankingService');
const { authMiddleware } = require('../middleware/auth');

router.get
    // Log request
    logger.debug('router.get request');('/sellers', async (req, res) => {
  try {
    const { categoryId, stateId, limit } = req.query;
    const sellers = await sellerRankingService.getRankedSellers({
      categoryId: categoryId ? Number(categoryId) : undefined,
      stateId: stateId ? Number(stateId) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, count: sellers.length, data: sellers });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get
    // Log request
    logger.debug('router.get request');('/sellers/:userId/trust-score', authMiddleware, async (req, res) => {
  try {
    const score = await sellerRankingService.getSellerTrustScore(req.params.userId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

module.exports = router;
