/**
 * TrackDart — multi-key shipment tracking. Confirmed genuinely absent
 * (2026-08-15 concept-document gap analysis) — only a single-key
 * (shipment_id) tracking function existed (logisticsService.js
 * addTrackingUpdate/getShipmentTracking). This adds real lookup by
 * waybill/shipment number, vehicle registration, or a comma-separated
 * multi-query — all against the same real shipments/vehicles/
 * shipment_tracking tables, no new schema needed.
 */

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const pool = require('../database/pool');
const { authMiddleware } = require('../middleware/auth');

async function trackOneKey(key) {
  const trimmed = key.trim();
  if (!trimmed) return null;

  // Try shipment_number first (the real waybill-equivalent key).
  const byNumber = await pool.query(
    `SELECT s.*, (SELECT json_agg(t.* ORDER BY t.timestamp ASC) FROM shipment_tracking t WHERE t.shipment_id = s.id) AS tracking_history
       FROM shipments s WHERE s.shipment_number = $1`,
    [trimmed],
  );
  if (byNumber.rows.length > 0) return { queriedKey: trimmed, matchType: 'shipment_number', shipment: byNumber.rows[0] };

  // Fall back to vehicle registration — real shipments have no direct
  // vehicle FK in this schema, so this surfaces the vehicle record itself
  // plus its most recent tracking-relevant status, honestly, rather than
  // inventing a shipment linkage that doesn't exist.
  const byVehicle = await pool.query('SELECT * FROM vehicles WHERE registration_number = $1', [trimmed]);
  if (byVehicle.rows.length > 0) {
    return { queriedKey: trimmed, matchType: 'vehicle_registration', vehicle: byVehicle.rows[0], note: 'This schema does not link shipments to a vehicle directly, so no shipment history is attached here.' };
  }

  return { queriedKey: trimmed, matchType: 'not_found', shipment: null };
}

// 2026-09-15: the closing brace above used to be missing - trackOneKey's
// body ran straight into this router.get('/', ...) call (only a lone CR,
// not a real newline+brace, separated them), same bug shape as
// seedVaultRoutes_merged.js/unifiedAIRoutes_merged.js (see those files
// for the full writeup). Since trackOneKey is only ever invoked via
// keyList.map(trackOneKey) below, and this was the router's only route,
// node -c and require() both stayed silent - the router loaded fine and
// exported a real Express router, it just had zero routes registered.
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { keys } = req.query;
    if (!keys) return res.status(400).json({ success: false, error: 'keys query parameter is required (comma-separated for multi-query)' });

    const keyList = String(keys).split(',').map((k) => k.trim()).filter(Boolean);
    if (keyList.length === 0) return res.status(400).json({ success: false, error: 'At least one key is required' });

    const results = await Promise.all(keyList.map(trackOneKey));
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
