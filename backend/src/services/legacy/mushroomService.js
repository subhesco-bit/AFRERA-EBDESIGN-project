/**
 * M029 Mushroom Cultivation Service
 * Complete mushroom cultivation management with spawn and substrate management
 */

const { getPostgreSQL } = require('..\/database\/connection');

class MushroomService {
  constructor() {
    // pool resolved lazily via getter below (getPostgreSQL is a singleton, not a constructor)
  }

  get pool() {
    return getPostgreSQL();
  }

  /**
   * Get all mushroom cultivation data
   */
  async getAllMushroom(filters = {}) {
    try {
      const { farmer_id, variety, status } = filters;
      let query = 'SELECT * FROM mushroom_cultivation WHERE 1=1';
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
      console.error('Error getting mushroom cultivation:', error);
      throw new Error('Failed to get mushroom cultivation');
    }
  }

  /**
   * Get mushroom cultivation by ID
   */
  async getMushroomById(mushroomId) {
    try {
      const query = 'SELECT * FROM mushroom_cultivation WHERE id = $1';
      let result = await this.pool.query(query, [mushroomId]);
      
      if (result.rows.length === 0) {
        throw new Error('Mushroom cultivation not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting mushroom cultivation by ID:', error);
      throw new Error('Failed to get mushroom cultivation');
    }
  }

  /**
   * Create mushroom cultivation
   */
  async createMushroom(mushroomData) {
    try {
      const {
        farmer_id,
        name,
        location,
        variety,
        cultivation_area_sqft,
        substrate_type,
        spawn_quantity_kg,
        expected_yield_kg
      } = mushroomData;

      let query = `
        INSERT INTO mushroom_cultivation (farmer_id, name, location, variety, cultivation_area_sqft, substrate_type, spawn_quantity_kg, expected_yield_kg)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        farmer_id, name, location, variety, cultivation_area_sqft, substrate_type, spawn_quantity_kg, expected_yield_kg
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating mushroom cultivation:', error);
      throw new Error('Failed to create mushroom cultivation');
    }
  }

  /**
   * Get spawn management data
   */
  async getSpawnManagement(mushroomId) {
    try {
      let query = `
        SELECT * FROM spawn_management
        WHERE mushroom_id = $1
        ORDER BY spawn_date DESC
      `;

      let result = await this.pool.query(query, [mushroomId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting spawn management:', error);
      throw new Error('Failed to get spawn management');
    }
  }

  /**
   * Get substrate management data
   */
  async getSubstrateManagement(mushroomId) {
    try {
      let query = `
        SELECT * FROM substrate_management
        WHERE mushroom_id = $1
        ORDER BY preparation_date DESC
      `;

      let result = await this.pool.query(query, [mushroomId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting substrate management:', error);
      throw new Error('Failed to get substrate management');
    }
  }
}

module.exports = new MushroomService();


