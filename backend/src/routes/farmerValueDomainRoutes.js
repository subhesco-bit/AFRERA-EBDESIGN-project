/**
 * Real backend route for FarmerRevenueLedgerPage.jsx's
 * farmerValueAPI.getSeasonLedger({season, year}), backed by
 * services/legacy/farmerValueService.js's getSeasonLedger(farmerId, season,
 * year). That service's own internal router requires farmerId as a URL
 * param and is not mounted anywhere; the frontend never has a farmerId to
 * pass, so farmerId is resolved server-side from the authenticated user,
 * same pattern as seedVaultRoutes_merged.js's resolveFarmerId.
 */
'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const { authMiddleware } = require('../middleware/auth');
const { getSeasonLedger } = require('../services/legacy/farmerValueService');

async function resolveFarmerId(req, res, next) {
  try {
    const result = await pool.query('SELECT id FROM farmers WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No farmer profile is associated with this account' });
    }
    req.farmerId = result.rows[0].id;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

router.get('/farmer-value/season-ledger', authMiddleware, resolveFarmerId, async (req, res) => {
  try {
    const data = await getSeasonLedger(req.farmerId, req.query.season, req.query.year ? Number(req.query.year) : undefined);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
