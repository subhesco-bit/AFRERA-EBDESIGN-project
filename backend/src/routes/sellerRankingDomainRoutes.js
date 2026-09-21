/**
 * Real backend route for sellerRankingAPI.getSellerRankings, backed by
 * services/legacy/sellerRankingService.js's getRankedSellers(). Sellers
 * are ranked from real, DB-backed trust-score data (see the service's own
 * header comment); there is no write/"set rank" action to back the
 * frontend's rankSeller(id, data) call — no backend implementation exists
 * for manually setting a seller's rank, so that method is intentionally
 * left unwired rather than faked.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/sellerRankingService');

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/seller-ranking', wrap((req) => svc.getRankedSellers(req.query)));

module.exports = router;
