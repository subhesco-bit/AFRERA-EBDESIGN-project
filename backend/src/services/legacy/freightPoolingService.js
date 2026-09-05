/**
 * Full-Truck Window — LTL to FTL freight pooling.
 *
 * Confirmed genuinely absent (2026-08-15 concept-document gap analysis;
 * searched logisticsService.js/logisticsEnhancementService.js for pool/
 * fill/consolidate/LTL/FullTruckWindow — no matches). Freight is one of
 * the largest single costs eating into a farmer's share of the sale
 * price, so consolidating several small (LTL) shipments into one truck
 * (FTL) and passing the per-kg savings back is a real, high-value,
 * directly-computable feature.
 *
 * RATE SLABS ARE ASSUMED (no historical freight-cost dataset exists in
 * this codebase to calibrate real ₹/kg breakpoints against) — labeled as
 * such rather than presented as validated pricing, same discipline as
 * costControlService.js's OVER_BUDGET_THRESHOLD_PCT and
 * sellerRankingService.js's WEIGHTS.
 */

'use strict';

const pool = require('..\/database\/pool');
const { logger } = require('..\/utils\/logger');
const { withTransaction } = require('..\/core\/withTransaction');

// ASSUMED freight-rate slabs: rate per kg falls as truck fill % rises.
// A deployment should replace these with real historical freight-cost
// data once enough dispatches have been recorded.
const RATE_SLABS = [
  { minFillPct: 0, maxFillPct: 25, ratePerKgInr: 24 },
  { minFillPct: 25, maxFillPct: 50, ratePerKgInr: 18 },
  { minFillPct: 50, maxFillPct: 75, ratePerKgInr: 13 },
  { minFillPct: 75, maxFillPct: 100.01, ratePerKgInr: 9 },
];

function rateForFillPct(fillPct) {
  const slab = RATE_SLABS.find((s) => fillPct >= s.minFillPct && fillPct < s.maxFillPct) || RATE_SLABS[RATE_SLABS.length - 1];
  return slab.ratePerKgInr;
}

class FreightPoolingService {
  /** Real query: pending/unassigned shipments on a matching origin/destination lane not yet in a pool window. */
  async findPoolableShipments(originAddress, destinationAddress) {
    const result = await pool.query(
      `SELECT s.id, s.shipment_number, s.weight_kg, s.origin_address, s.destination_address, s.status
         FROM shipments s
        WHERE s.status = 'pending'
          AND s.origin_address ILIKE $1
          AND s.destination_address ILIKE $2
          AND NOT EXISTS (SELECT 1 FROM freight_pool_shipments fps WHERE fps.shipment_id = s.id)
        ORDER BY s.created_at ASC`,
      [`%${originAddress}%`, `%${destinationAddress}%`]
    );
    return result.rows;
  }

  async createPoolWindow({ originAddress, destinationAddress, vehicleCapacityKg, closesAt }) {
    if (!originAddress || !destinationAddress) throw new Error('originAddress and destinationAddress are required');
    if (!(Number(vehicleCapacityKg) > 0)) throw new Error('vehicleCapacityKg must be > 0');

    let result = await pool.query(
      `INSERT INTO freight_pool_windows (origin_address, destination_address, vehicle_capacity_kg, closes_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [originAddress, destinationAddress, vehicleCapacityKg, closesAt || null]
    );
    return result.rows[0];
  }

  async getPoolWindow(windowId) {
    const windowResult = await pool.query('SELECT * FROM freight_pool_windows WHERE id = $1', [windowId]);
    if (windowResult.rows.length === 0) throw new Error('Freight pool window not found');
    const window = windowResult.rows[0];

    const shipmentsResult = await pool.query(
      `SELECT fps.*, s.shipment_number, s.origin_address, s.destination_address
         FROM freight_pool_shipments fps
         JOIN shipments s ON s.id = fps.shipment_id
        WHERE fps.window_id = $1
        ORDER BY fps.joined_at ASC`,
      [windowId]
    );

    const totalWeightKg = shipmentsResult.rows.reduce((sum, r) => sum + Number(r.weight_kg), 0);
    const fillPct = Number(((totalWeightKg / Number(window.vehicle_capacity_kg)) * 100).toFixed(1));
    const currentRatePerKg = rateForFillPct(fillPct);

    return {
      ...window,
      shipments: shipmentsResult.rows,
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      fillPct,
      currentRatePerKgInr: currentRatePerKg,
      rateSlabsNote: 'Rate slabs are an assumed starting point (no historical freight-cost data exists yet to calibrate real breakpoints) — recalibrate once enough dispatches are recorded.',
    };
  }

  /** Joins a real shipment to a window, computing and locking in its rate at the fill % at time of joining. */
  async joinPoolWindow(windowId, shipmentId) {
    // The capacity check and the insert must be one atomic step. Read-check-
    // insert on the pool means two concurrent joins both see the same "space
    // remaining" snapshot and both commit, overfilling the truck — and the
    // same shipment could be booked into two windows at once. Locking the
    // window row serialises every join against that window; the shipment row
    // lock stops the same shipment joining two windows concurrently. Same
    // shape as coldStorageService.createBooking.
    return withTransaction(async (client) => {
      let windowResult = await client.query(
        'SELECT * FROM freight_pool_windows WHERE id = $1 FOR UPDATE',
        [windowId]
      );
      if (windowResult.rows.length === 0) throw new Error('Freight pool window not found');
      let window = windowResult.rows[0];
      if (window.status !== 'open') throw new Error(`Cannot join a ${window.status} window`);

      const shipmentResult = await client.query(
        'SELECT * FROM shipments WHERE id = $1 AND status = $2 FOR UPDATE',
        [shipmentId, 'pending']
      );
      if (shipmentResult.rows.length === 0) throw new Error('Shipment not found or not pending');
      const shipment = shipmentResult.rows[0];

      const alreadyPooled = await client.query(
        'SELECT 1 FROM freight_pool_shipments WHERE shipment_id = $1 LIMIT 1',
        [shipmentId]
      );
      if (alreadyPooled.rows.length > 0) throw new Error('Shipment is already in a freight pool window');

      const existingResult = await client.query(
        'SELECT COALESCE(SUM(weight_kg), 0) AS total FROM freight_pool_shipments WHERE window_id = $1',
        [windowId]
      );
      const existingWeight = Number(existingResult.rows[0].total);
      const newTotal = existingWeight + Number(shipment.weight_kg);
      if (newTotal > Number(window.vehicle_capacity_kg)) {
        throw new Error(`Adding this shipment (${shipment.weight_kg}kg) would exceed vehicle capacity (${window.vehicle_capacity_kg}kg); current pool weight is ${existingWeight}kg`);
      }

      const fillPctAfterJoin = (newTotal / Number(window.vehicle_capacity_kg)) * 100;
      const ratePerKg = rateForFillPct(fillPctAfterJoin);

      let result = await client.query(
        `INSERT INTO freight_pool_shipments (window_id, shipment_id, weight_kg, rate_per_kg_inr)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [windowId, shipmentId, shipment.weight_kg, ratePerKg]
      );

      logger.info('Shipment joined freight pool window', { windowId, shipmentId, fillPctAfterJoin: fillPctAfterJoin.toFixed(1) });
      return result.rows[0];
    }, { name: 'freightPooling.joinPoolWindow' });
  }

  async listOpenWindows() {
    let result = await pool.query(`SELECT * FROM freight_pool_windows WHERE status = 'open' ORDER BY created_at DESC`);
    return result.rows;
  }

  async closeAndDispatch(windowId) {
    let result = await pool.query(
      `UPDATE freight_pool_windows SET status = 'dispatched', dispatched_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'open' RETURNING *`,
      [windowId]
    );
    if (result.rows.length === 0) throw new Error('Window not found or not open');
    return result.rows[0];
  }
}

module.exports = new FreightPoolingService();


