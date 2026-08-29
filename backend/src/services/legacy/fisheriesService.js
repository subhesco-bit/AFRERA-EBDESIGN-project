/**
 * M025 Fisheries Management Service
 * Complete fisheries management with pond management, fish species, and feed management
 */

const { getPostgreSQL } = require('../../database/connection');

class FisheriesService {
  constructor() {
    // pool resolved lazily via getter below (getPostgreSQL is a singleton, not a constructor)
  }

  get pool() {
    return getPostgreSQL();
  }

  /**
   * Get all fisheries data
   */
  async getAllFisheries(filters = {}) {
    try {
      const { farmer_id, species, status } = filters;
      let query = 'SELECT * FROM fisheries WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (farmer_id) {
        query += ` AND farmer_id = $${paramCount}`;
        params.push(farmer_id);
        paramCount++;
      }

      if (species) {
        query += ` AND species = $${paramCount}`;
        params.push(species);
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
      console.error('Error getting fisheries:', error);
      throw new Error('Failed to get fisheries');
    }
  }

  /**
   * Get fishery by ID
   */
  async getFisheryById(fisheryId) {
    try {
      const query = 'SELECT * FROM fisheries WHERE id = $1';
      const result = await this.pool.query(query, [fisheryId]);
      
      if (result.rows.length === 0) {
        throw new Error('Fishery not found');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting fishery by ID:', error);
      throw new Error('Failed to get fishery');
    }
  }

  /**
   * Create fishery
   */
  async createFishery(fisheryData) {
    try {
      const {
        farmer_id,
        name,
        location,
        species,
        pond_size_sqft,
        water_source,
        stock_count,
        average_weight_kg
      } = fisheryData;

      const query = `
        INSERT INTO fisheries (farmer_id, name, location, species, pond_size_sqft, water_source, stock_count, average_weight_kg)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        farmer_id, name, location, species, pond_size_sqft, water_source, stock_count, average_weight_kg
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating fishery:', error);
      throw new Error('Failed to create fishery');
    }
  }

  /**
   * Get pond management data
   */
  async getPondManagement(fisheryId) {
    try {
      const query = `
        SELECT * FROM pond_management
        WHERE fishery_id = $1
        ORDER BY inspection_date DESC
      `;

      const result = await this.pool.query(query, [fisheryId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting pond management:', error);
      throw new Error('Failed to get pond management');
    }
  }

  /**
   * Get fish feed data
   */
  async getFishFeed(fisheryId) {
    try {
      const query = `
        SELECT * FROM fish_feed
        WHERE fishery_id = $1
        ORDER BY feed_date DESC
      `;

      const result = await this.pool.query(query, [fisheryId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting fish feed:', error);
      throw new Error('Failed to get fish feed');
    }
  }

  /**
   * Get fish harvest data
   */
  async getFishHarvest(fisheryId) {
    try {
      const query = `
        SELECT * FROM fish_harvest
        WHERE fishery_id = $1
        ORDER BY harvest_date DESC
      `;

      const result = await this.pool.query(query, [fisheryId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting fish harvest:', error);
      throw new Error('Failed to get fish harvest');
    }
  }
}

module.exports = new FisheriesService();

// Merged from backend/src/modules/M132
{
  const m132 = require("../../modules/M132/service");
  const { ...rest } = m132;
  Object.assign(module.exports, rest);
}
