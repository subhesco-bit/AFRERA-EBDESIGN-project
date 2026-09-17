/**
 * seller Ranking Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

// 2026-09-17: real, DB-backed trust-score logic (services/legacy/
// sellerRankingService.js - ranks sellers by farmers.fdi_score,
// fulfilled_orders, disputes, years_active, certification_count,
// training_completed, all real columns) had zero route anywhere, so
// MarketSignalsPage.jsx's sellerRankingAPI.getRankedSellers/
// getSellerTrustScore calls threw. Added here rather than as a new file
// since this scaffold is already mounted at /api/sellerranking.
const sellerRankingService = require('../services/legacy/sellerRankingService');

router.get('/ranked', async (req, res) => {
  try {
    const { categoryId, stateId, limit } = req.query;
    const ranked = await sellerRankingService.getRankedSellers({
      categoryId, stateId, limit: limit ? Number(limit) : undefined,
    });
    res.json({ success: true, data: ranked });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/trust-score/:userId', async (req, res) => {
  try {
    const score = await sellerRankingService.getSellerTrustScore(req.params.userId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'sellerRankingRoutes',
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
    module: 'sellerRankingRoutes'
  });
});

module.exports = router;
