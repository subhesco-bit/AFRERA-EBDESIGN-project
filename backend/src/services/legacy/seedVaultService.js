/**
 * Seed Vault Service — personal on-farm seed inventory tracker.
 * See migration 9999_zzzzzz_seed_vault_schema.sql for the pre-build-gate
 * note: frontend/src/pages/SeedVaultPage.jsx has been a complete, real UI
 * with zero backend behind it (calling API methods that didn't exist).
 */

'use strict';

const pool = require('../../database\/pool');

class SeedVaultService {
  async listSeeds(farmerId) {
    const result = await pool.query(
      'SELECT * FROM seed_vault_items WHERE farmer_id = $1 ORDER BY name ASC',
      [farmerId]
    );
    return result.rows;
  }

  /** Real categories are simply the distinct set the farmer has actually recorded — no invented master list. */
  async listCategories(farmerId) {
    let result = await pool.query(
      'SELECT DISTINCT category AS id, category AS name FROM seed_vault_items WHERE farmer_id = $1 ORDER BY category ASC',
      [farmerId]
    );
    return result.rows;
  }

  async addSeed(farmerId, data) {
    const { name, variety, category, quantity, unit, purchaseDate, minStock, supplier, storageConditions } = data || {};
    if (!name) throw new Error('name is required');
    if (!category) throw new Error('category is required');
    if (!(Number(quantity) >= 0)) throw new Error('quantity must be >= 0');

    let result = await pool.query(
      `INSERT INTO seed_vault_items
         (farmer_id, name, variety, category, quantity, unit, purchase_date, min_stock, supplier, storage_conditions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [farmerId, name, variety || null, category, quantity, unit || 'kg', purchaseDate || null,
        minStock || 0, supplier || null, storageConditions ? JSON.stringify(storageConditions) : null]
    );
    return result.rows[0];
  }

  async updateSeed(seedId, farmerId, data) {
    const existing = await pool.query('SELECT id FROM seed_vault_items WHERE id = $1 AND farmer_id = $2', [seedId, farmerId]);
    if (existing.rows.length === 0) throw new Error('Seed not found');

    const { name, variety, category, quantity, unit, purchaseDate, minStock, supplier, storageConditions } = data || {};
    let result = await pool.query(
      `UPDATE seed_vault_items SET
         name = COALESCE($1, name),
         variety = COALESCE($2, variety),
         category = COALESCE($3, category),
         quantity = COALESCE($4, quantity),
         unit = COALESCE($5, unit),
         purchase_date = COALESCE($6, purchase_date),
         min_stock = COALESCE($7, min_stock),
         supplier = COALESCE($8, supplier),
         storage_conditions = COALESCE($9, storage_conditions),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND farmer_id = $11
       RETURNING *`,
      [name, variety, category, quantity, unit, purchaseDate, minStock, supplier,
        storageConditions ? JSON.stringify(storageConditions) : null, seedId, farmerId]
    );
    return result.rows[0];
  }

  async deleteSeed(seedId, farmerId) {
    let result = await pool.query(
      'DELETE FROM seed_vault_items WHERE id = $1 AND farmer_id = $2 RETURNING id',
      [seedId, farmerId]
    );
    if (result.rows.length === 0) throw new Error('Seed not found');
    return { deleted: true, id: seedId };
  }

  /** Real usage recording: decrements quantity, never below zero. */
  async recordUsage(seedId, farmerId, amountUsed) {
    if (!(Number(amountUsed) > 0)) throw new Error('amountUsed must be > 0');
    let existing = await pool.query('SELECT quantity FROM seed_vault_items WHERE id = $1 AND farmer_id = $2', [seedId, farmerId]);
    if (existing.rows.length === 0) throw new Error('Seed not found');

    const newQuantity = Math.max(0, Number(existing.rows[0].quantity) - Number(amountUsed));
    let result = await pool.query(
      'UPDATE seed_vault_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newQuantity, seedId]
    );
    return result.rows[0];
  }
}

module.exports = new SeedVaultService();

// Merged from backend/src/modules/M045
{
  const m045 = require("../../modules/M045/service");
  const { ...rest } = m045;
  Object.assign(module.exports, rest);
}



