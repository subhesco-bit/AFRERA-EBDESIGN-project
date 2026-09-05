/**
 * Second-Use Equipment Exchange — marketplace for retired farm machinery
 * with condition grade, donor attribution, and free/priced listings.
 * Confirmed genuinely absent (2026-08-15 concept-document gap analysis).
 * Reduces farmer capital cost by giving working-but-retired equipment a
 * second life instead of it sitting idle or being scrapped.
 */

'use strict';

const pool = require('../../database/pool');

class EquipmentExchangeService {
  async createListing(listedBy, data) {
    const { equipmentName, equipmentType, conditionGrade, description, images, pricingType, priceInr, locationAddress, stateId } = data || {};
    if (!equipmentName || typeof equipmentName !== 'string' || equipmentName.length > 200) throw new Error('equipmentName is required and must be at most 200 characters');
    if (!conditionGrade || typeof conditionGrade !== 'string' || conditionGrade.length > 50) throw new Error('conditionGrade is required and must be at most 50 characters');
    const resolvedPricingType = pricingType || 'priced';
    if (!['free', 'priced'].includes(resolvedPricingType)) throw new Error('pricingType must be free or priced');
    if (resolvedPricingType === 'priced' && (!Number.isFinite(Number(priceInr)) || Number(priceInr) < 0 || Number(priceInr) > 1000000000)) throw new Error('priceInr is required and must be between 0 and 1000000000 for a priced listing');

    const result = await pool.query(
      `INSERT INTO equipment_exchange_listings
        (listed_by, equipment_name, equipment_type, condition_grade, description, images, pricing_type, price_inr, location_address, state_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [listedBy, equipmentName, equipmentType || null, conditionGrade, description || null,
        JSON.stringify(images || []), resolvedPricingType, resolvedPricingType === 'priced' ? priceInr : null,
        locationAddress || null, stateId || null]
    );
    return result.rows[0];
  }

  async listAvailable({ equipmentType, stateId, pricingType } = {}) {
    const conditions = [`status = 'available'`];
    const params = [];
    if (equipmentType) { params.push(equipmentType); conditions.push(`equipment_type = $${params.length}`); }
    if (stateId) { if (!Number.isInteger(stateId) || stateId < 1 || stateId > 100000) throw new Error('stateId is outside the allowed range'); params.push(stateId); conditions.push(`state_id = $${params.length}`); }
    if (pricingType) { if (!['free', 'priced'].includes(pricingType)) throw new Error('pricingType must be free or priced'); params.push(pricingType); conditions.push(`pricing_type = $${params.length}`); }

    let result = await pool.query(
      `SELECT eel.*, u.name AS listed_by_name
         FROM equipment_exchange_listings eel
         JOIN users u ON u.id = eel.listed_by
        WHERE ${conditions.join(' AND ')}
        ORDER BY eel.created_at DESC`,
      params
    );
    return result.rows;
  }

  async getListing(listingId) {
    let result = await pool.query(
      `SELECT eel.*, u.name AS listed_by_name
         FROM equipment_exchange_listings eel
         JOIN users u ON u.id = eel.listed_by
        WHERE eel.id = $1`,
      [listingId]
    );
    if (result.rows.length === 0) throw new Error('Listing not found');
    return result.rows[0];
  }

  async reserveListing(listingId, reservedBy) {
    let result = await pool.query(
      `UPDATE equipment_exchange_listings SET status = 'reserved', reserved_by = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'available' RETURNING *`,
      [reservedBy, listingId]
    );
    if (result.rows.length === 0) throw new Error('Listing not found or not available');
    return result.rows[0];
  }

  async completeExchange(listingId, listedBy) {
    let result = await pool.query(
      `UPDATE equipment_exchange_listings SET status = 'exchanged', updated_at = NOW()
       WHERE id = $1 AND listed_by = $2 AND status = 'reserved' RETURNING *`,
      [listingId, listedBy]
    );
    if (result.rows.length === 0) throw new Error('Listing not found, not yours, or not reserved');
    return result.rows[0];
  }

  async withdrawListing(listingId, listedBy) {
    let result = await pool.query(
      `UPDATE equipment_exchange_listings SET status = 'withdrawn', updated_at = NOW()
       WHERE id = $1 AND listed_by = $2 AND status IN ('available', 'reserved') RETURNING *`,
      [listingId, listedBy]
    );
    if (result.rows.length === 0) throw new Error('Listing not found, not yours, or already exchanged/withdrawn');
    return result.rows[0];
  }
}

module.exports = new EquipmentExchangeService();

// Merged from backend/src/modules/M107
{
  const m107 = require("../../modules/M107/service");
  const { ...rest } = m107;
  Object.assign(module.exports, rest);
}
