const db = require('../../database/connection');
const { logger } = require('../../utils/logger');

class M064Service {
  async getAll(filters = {}) {
    try {
      const { page = 1, limit = 20, status = null } = filters;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM fishery WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const result = await db.query(query, [limit, offset]);

      const countResult = await db.query(`SELECT COUNT(*) as total FROM fishery WHERE deleted_at IS NULL`);

      logger.info(`Retrieved ${result.rows.length} fishery`);
      return {
        data: result.rows,
        pagination: { page, limit, total: parseInt(countResult.rows[0].total) }
      };
    } catch (error) {
      logger.error('Error fetching fishery:', error.message);
      throw new Error(`Failed to fetch fishery: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM fishery WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      if (result.rows.length === 0) throw new Error(`fishery not found`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching fishery:', error.message);
      throw error;
    }
  }

  async create(data) {
    try {
      const { user_id, ...rest } = data;
      const columns = Object.keys(rest).join(', ');
      const placeholders = Object.keys(rest).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(rest);

      const result = await db.query(
        `INSERT INTO fishery (user_id, ${columns}, created_at, updated_at) VALUES ($${Object.keys(rest).length + 1}, ${placeholders}, NOW(), NOW()) RETURNING *`,
        [user_id, ...values]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating fishery:', error.message);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const existing = await this.getById(id);
      const updates = { ...existing, ...data };
      const setClause = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = [...Object.values(data), id];

      const result = await db.query(
        `UPDATE fishery SET ${setClause}, updated_at = NOW() WHERE id = $${Object.keys(data).length + 1} RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating fishery:', error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      const result = await db.query(
        `UPDATE fishery SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) throw new Error(`fishery not found`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting fishery:', error.message);
      throw error;
    }
  }
}

module.exports = new M064Service();