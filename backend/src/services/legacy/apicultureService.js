/**
 * M028 Apiculture Management Service
 * Complete apiculture management with beekeeping and honey production
 */

const { getPostgreSQL } = require('../../database/connection');

class ApicultureService {
  constructor() {
    // pool resolved lazily via getter below (getPostgreSQL is a singleton, not a constructor)
  }

  get pool() {
    return getPostgreSQL();
  }

  /**
   * Get all apiculture data
   */
  async getAllApiculture(filters = {}) {
    try {
      const { farmer_id, honey_type, status } = filters;
      let query = 'SELECT * FROM apiculture WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (farmer_id) {
        query += ` AND farmer_id = $${paramCount}`;
        params.push(farmer_id);
        paramCount++;
      }

      if (honey_type) {
        query += ` AND honey_type = $${paramCount}`;
        params.push(honey_type);
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
      console.error('Error getting apiculture:', error);
      throw new Error('Failed to get apiculture');
    }
  }

  /**
   * Get apiculture by ID
   */
  async getApicultureById(apicultureId) {
    try {
      const query = 'SELECT * FROM apiculture WHERE id = $1';
      let result = await this.pool.query(query, [apicultureId]);
      
      if (result.rows.length === 0) {
        throw new Error('Apiculture not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting apiculture by ID:', error);
      throw new Error('Failed to get apiculture');
    }
  }

  /**
   * Create apiculture
   */
  async createApiculture(apicultureData) {
    try {
      const {
        farmer_id,
        name,
        location,
        honey_type,
        hive_count,
        colony_strength,
        expected_honey_kg
      } = apicultureData;

      let query = `
        INSERT INTO apiculture (farmer_id, name, location, honey_type, hive_count, colony_strength, expected_honey_kg)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        farmer_id, name, location, honey_type, hive_count, colony_strength, expected_honey_kg
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating apiculture:', error);
      throw new Error('Failed to create apiculture');
    }
  }

  /**
   * Get honey production data
   */
  async getHoneyProduction(apicultureId) {
    try {
      let query = `
        SELECT * FROM honey_production
        WHERE apiculture_id = $1
        ORDER BY harvest_date DESC
      `;

      let result = await this.pool.query(query, [apicultureId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting honey production:', error);
      throw new Error('Failed to get honey production');
    }
  }

  /**
   * Get hive health data
   */
  async getHiveHealth(apicultureId) {
    try {
      let query = `
        SELECT * FROM hive_health
        WHERE apiculture_id = $1
        ORDER BY inspection_date DESC
      `;

      let result = await this.pool.query(query, [apicultureId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting hive health:', error);
      throw new Error('Failed to get hive health');
    }
  }
}

module.exports = new ApicultureService();
