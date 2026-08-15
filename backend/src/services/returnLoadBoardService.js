/**
 * Return-Load Board — open marketplace for a vehicle's spare/empty
 * return-leg capacity. Confirmed genuinely absent (2026-08-15
 * concept-document gap analysis). Reduces empty-backhaul waste by
 * letting any vehicle post real spare capacity for other shippers to book.
 */

'use strict';

const pool = require('../database/pool');

class ReturnLoadBoardService {
  async postCapacity(postedBy, data) {
    const { vehicleId, originAddress, destinationAddress, availableCapacityKg, availableFrom, availableUntil, askingRatePerKgInr } = data || {};
    if (!originAddress || !destinationAddress) throw new Error('originAddress and destinationAddress are required');
    if (!(Number(availableCapacityKg) > 0)) throw new Error('availableCapacityKg must be > 0');
    if (!availableFrom || !availableUntil) throw new Error('availableFrom and availableUntil are required');
    if (new Date(availableUntil) <= new Date(availableFrom)) throw new Error('availableUntil must be after availableFrom');

    const result = await pool.query(
      `INSERT INTO return_load_postings
        (vehicle_id, posted_by, origin_address, destination_address, available_capacity_kg, available_from, available_until, asking_rate_per_kg_inr)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [vehicleId || null, postedBy, originAddress, destinationAddress, availableCapacityKg, availableFrom, availableUntil, askingRatePerKgInr || null]
    );
    return result.rows[0];
  }

  async searchAvailable({ originAddress, destinationAddress, minCapacityKg }) {
    const conditions = [`status = 'open'`, `available_until > NOW()`];
    const params = [];
    if (originAddress) { params.push(`%${originAddress}%`); conditions.push(`origin_address ILIKE $${params.length}`); }
    if (destinationAddress) { params.push(`%${destinationAddress}%`); conditions.push(`destination_address ILIKE $${params.length}`); }
    if (minCapacityKg) { params.push(minCapacityKg); conditions.push(`available_capacity_kg >= $${params.length}`); }

    const result = await pool.query(
      `SELECT * FROM return_load_postings WHERE ${conditions.join(' AND ')} ORDER BY available_from ASC`,
      params
    );
    return result.rows;
  }

  async bookPosting(postingId, shipmentId) {
    const result = await pool.query(
      `UPDATE return_load_postings SET status = 'booked', booked_shipment_id = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'open' RETURNING *`,
      [shipmentId, postingId]
    );
    if (result.rows.length === 0) throw new Error('Posting not found or not open');
    return result.rows[0];
  }

  async cancelPosting(postingId, postedBy) {
    const result = await pool.query(
      `UPDATE return_load_postings SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND posted_by = $2 AND status = 'open' RETURNING *`,
      [postingId, postedBy]
    );
    if (result.rows.length === 0) throw new Error('Posting not found, not yours, or not open');
    return result.rows[0];
  }
}

module.exports = new ReturnLoadBoardService();
