/**
 * M030 Vermicompost Management Service
 * Complete vermicompost management with earthworm and organic waste management
 */

const { getPostgreSQL } = require('../../database/connection');

class VermicompostService {
  constructor() {
    // pool resolved lazily via getter below (getPostgreSQL is a singleton, not a constructor)
  }

  get pool() {
    return getPostgreSQL();
  }

  /**
   * Get all vermicompost data
   */
  async getAllVermicompost(filters = {}) {
    try {
      const { farmer_id, worm_type, status } = filters;
      let query = 'SELECT * FROM vermicompost WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (farmer_id) {
        query += ` AND farmer_id = $${paramCount}`;
        params.push(farmer_id);
        paramCount++;
      }

      if (worm_type) {
        query += ` AND worm_type = $${paramCount}`;
        params.push(worm_type);
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
      console.error('Error getting vermicompost:', error);
      throw new Error('Failed to get vermicompost');
    }
  }

  /**
   * Get vermicompost by ID
   */
  async getVermicompostById(vermicompostId) {
    try {
      const query = 'SELECT * FROM vermicompost WHERE id = $1';
      let result = await this.pool.query(query, [vermicompostId]);
      
      if (result.rows.length === 0) {
        throw new Error('Vermicompost not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting vermicompost by ID:', error);
      throw new Error('Failed to get vermicompost');
    }
  }

  /**
   * Create vermicompost
   */
  async createVermicompost(vermicompostData) {
    try {
      const {
        farmer_id,
        name,
        location,
        worm_type,
        bed_size_sqft,
        earthworm_count,
        waste_input_kg,
        expected_output_kg
      } = vermicompostData;

      let query = `
        INSERT INTO vermicompost (farmer_id, name, location, worm_type, bed_size_sqft, earthworm_count, waste_input_kg, expected_output_kg)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      let result = await this.pool.query(query, [
        farmer_id, name, location, worm_type, bed_size_sqft, earthworm_count, waste_input_kg, expected_output_kg
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating vermicompost:', error);
      throw new Error('Failed to create vermicompost');
    }
  }

  /**
   * Get earthworm management data
   */
  async getEarthwormManagement(vermicompostId) {
    try {
      let query = `
        SELECT * FROM earthworm_management
        WHERE vermicompost_id = $1
        ORDER BY inspection_date DESC
      `;

      let result = await this.pool.query(query, [vermicompostId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting earthworm management:', error);
      throw new Error('Failed to get earthworm management');
    }
  }

  /**
   * Get organic waste data
   */
  async getOrganicWaste(vermicompostId) {
    try {
      let query = `
        SELECT * FROM organic_waste
        WHERE vermicompost_id = $1
        ORDER BY waste_date DESC
      `;

      let result = await this.pool.query(query, [vermicompostId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting organic waste:', error);
      throw new Error('Failed to get organic waste');
    }
  }
}

module.exports = new VermicompostService();
