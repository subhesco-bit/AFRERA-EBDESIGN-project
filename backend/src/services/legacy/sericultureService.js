/**
 * M027 Sericulture Management Service
 * Complete sericulture management with silk production and mulberry cultivation
 */

const { getPostgreSQL } = require('../../database\/connection');

class SericultureService {
  constructor() {
    // pool resolved lazily via getter below (getPostgreSQL is a singleton, not a constructor)
  }

  get pool() {
    return getPostgreSQL();
  }

  /**
   * Get all sericulture data
   */
  async getAllSericulture(filters = {}) {
    try {
      const { farmer_id, variety, status } = filters;
      let query = 'SELECT * FROM sericulture WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (farmer_id) {
        query += ` AND farmer_id = $${paramCount}`;
        params.push(farmer_id);
        paramCount++;
      }

      if (variety) {
        query += ` AND variety = $${paramCount}`;
        params.push(variety);
        paramCount++;
      }

      if (status) {
        query += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      query += ' ORDER BY created_at DESC';
      const result = await this.pool.query(query, params);
      
      return result.rows;
    } catch (error) {
      console.error('Error getting sericulture:', error);
      throw new Error('Failed to get sericulture');
    }
  }

  /**
   * Get sericulture by ID
   */
  async getSericultureById(sericultureId) {
    try {
      const query = 'SELECT * FROM sericulture WHERE id = $1';
      let result = await this.pool.query(query, [sericultureId]);
      
      if (result.rows.length === 0) {
        throw new Error('Sericulture not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting sericulture by ID:', error);
      throw new Error('Failed to get sericulture');
    }
  }

  /**
   * Create sericulture
   */
  async createSericulture(sericultureData) {
    try {
      const {
        farmer_id,
        name,
        location,
        variety,
        mulberry_area_acres,
        rearing_capacity,
        current_rearing_count
      } = sericultureData;

      let query = `
        INSERT INTO sericulture (farmer_id, name, location, variety, mulberry_area_acres, rearing_capacity, current_rearing_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        farmer_id, name, location, variety, mulberry_area_acres, rearing_capacity, current_rearing_count
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating sericulture:', error);
      throw new Error('Failed to create sericulture');
    }
  }

  /**
   * Get silk production data
   */
  async getSilkProduction(sericultureId) {
    try {
      let query = `
        SELECT * FROM silk_production
        WHERE sericulture_id = $1
        ORDER BY production_date DESC
      `;

      let result = await this.pool.query(query, [sericultureId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting silk production:', error);
      throw new Error('Failed to get silk production');
    }
  }

  /**
   * Get mulberry cultivation data
   */
  async getMulberryCultivation(sericultureId) {
    try {
      let query = `
        SELECT * FROM mulberry_cultivation
        WHERE sericulture_id = $1
        ORDER BY assessment_date DESC
      `;

      let result = await this.pool.query(query, [sericultureId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting mulberry cultivation:', error);
      throw new Error('Failed to get mulberry cultivation');
    }
  }
}

module.exports = new SericultureService();



