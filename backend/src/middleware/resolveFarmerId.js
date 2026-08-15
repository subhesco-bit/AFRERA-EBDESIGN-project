/**
 * Resolves the real farmers.id for the authenticated user and attaches it
 * as req.farmerId.
 *
 * WHY THIS EXISTS: authMiddleware only ever sets req.user = { id, email,
 * role, permissions } (see middleware/auth.js), where req.user.id is a
 * users.id. Several tables that are conceptually "the current farmer's
 * data" (farmer_wallets, land_records, crop_plans, seed_vault_items, and
 * the farmers row itself) key on farmer_id/farmers.id — a DIFFERENT UUID
 * (farmers.id, farmers.user_id REFERENCES users(id)). Found and fixed
 * 2026-08-15 after this exact bug (req.user.id passed directly where
 * farmers.id was required) turned up independently in
 * farmerPortalEnhancements.js (wallet/land-records/crop-plans, 19 call
 * sites) and farmerRoutes.js (GET /farmers/me). Use this middleware after
 * authMiddleware on any route that operates on "my own farmer record."
 */

'use strict';

const pool = require('../database/pool');

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

module.exports = { resolveFarmerId };
