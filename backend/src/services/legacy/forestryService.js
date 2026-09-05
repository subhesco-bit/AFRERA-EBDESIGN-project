/**
 * M026 Forestry Management Service
 * Complete forestry management with timber, plantations, and forest resources
 */

const { getPostgreSQL } = require('..\/database\/connection');

class ForestryService {
  constructor() {
    // pool resolved lazily via getter below (getPostgreSQL is a singleton, not a constructor)
  }

  get pool() {
    return getPostgreSQL();
  }

  /**
   * Get all forestry data
   */
  async getAllForestry(filters = {}) {
    try {
      const { farmer_id, type, status } = filters;
      let query = 'SELECT * FROM forestry WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (farmer_id) {
        query += ` AND farmer_id = $${paramCount}`;
        params.push(farmer_id);
        paramCount++;
      }

      if (type) {
        query += ` AND type = $${paramCount}`;
        params.push(type);
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
      console.error('Error getting forestry:', error);
      throw new Error('Failed to get forestry');
    }
  }

  /**
   * Get forestry by ID
   */
  async getForestryById(forestryId) {
    try {
      const query = 'SELECT * FROM forestry WHERE id = $1';
      let result = await this.pool.query(query, [forestryId]);
      
      if (result.rows.length === 0) {
        throw new Error('Forestry not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting forestry by ID:', error);
      throw new Error('Failed to get forestry');
    }
  }

  /**
   * Create forestry
   */
  async createForestry(forestryData) {
    try {
      const {
        farmer_id,
        name,
        location,
        type,
        area_hectares,
        species,
        planting_date,
        expected_harvest_date
      } = forestryData;

      let query = `
        INSERT INTO forestry (farmer_id, name, location, type, area_hectares, species, planting_date, expected_harvest_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        farmer_id, name, location, type, area_hectares, species, planting_date, expected_harvest_date
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating forestry:', error);
      throw new Error('Failed to create forestry');
    }
  }

  /**
   * Get timber inventory
   */
  async getTimberInventory(forestryId) {
    try {
      let query = `
        SELECT * FROM timber_inventory
        WHERE forestry_id = $1
        ORDER BY inventory_date DESC
      `;

      let result = await this.pool.query(query, [forestryId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting timber inventory:', error);
      throw new Error('Failed to get timber inventory');
    }
  }

  /**
   * Get plantation data
   */
  async getPlantationData(forestryId) {
    try {
      let query = `
        SELECT * FROM plantation_data
        WHERE forestry_id = $1
        ORDER BY assessment_date DESC
      `;

      let result = await this.pool.query(query, [forestryId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting plantation data:', error);
      throw new Error('Failed to get plantation data');
    }
  }
}

module.exports = new ForestryService();


