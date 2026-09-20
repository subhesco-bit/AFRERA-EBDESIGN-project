const db = require('../../database/connection');
const { logger } = require('../../utils/logger');
const { ValidationError, NotFoundError, DatabaseError } = require('../../utils/errors');

class M285Service {
  constructor() {
    this.table = 'oauth';
    this.defaultLimit = 20;
    this.maxLimit = 100;
  }

  // Validate input data
  validateInput(data, allowedFields) {
    const errors = {};
    const validated = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        const value = data[field];

        if (value === null || value === '') {
          errors[field] = `${field} cannot be empty`;
          continue;
        }

        validated[field] = value;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    return validated;
  }

  // Get all records with pagination, filtering, sorting
  async getAll(filters = {}) {
    try {
      const {
        page = 1,
        limit = this.defaultLimit,
        status = null,
        user_id = null,
        search = null,
        sort = 'created_at',
        order = 'DESC',
      } = filters;

      // Validate pagination
      const validLimit = Math.min(parseInt(limit) || this.defaultLimit, this.maxLimit);
      const validPage = Math.max(parseInt(page) || 1, 1);
      const offset = (validPage - 1) * validLimit;

      // Build dynamic query
      let conditions = ['deleted_at IS NULL'];
      const params = [];

      if (status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }

      if (user_id) {
        conditions.push(`user_id = $${params.length + 1}`);
        params.push(user_id);
      }

      if (search) {
        conditions.push(`data::text ILIKE $${params.length + 1}`);
        params.push(`%${search}%`);
      }

      const whereClause = conditions.join(' AND ');
      const orderClause = `${sort} ${order}`;

      // Execute count query
      const countQuery = `SELECT COUNT(*) as total FROM ${this.table} WHERE ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Execute data query
      const dataQuery = `
        SELECT * FROM ${this.table}
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ${validLimit} OFFSET ${offset}
      `;
      const dataResult = await db.query(dataQuery, params);

      logger.info(`Retrieved ${dataResult.rows.length} records from ${this.table}`);

      return {
        data: dataResult.rows,
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          pages: Math.ceil(total / validLimit),
          hasMore: offset + validLimit < total,
        },
      };
    } catch (error) {
      logger.error(`Error fetching from ${this.table}:`, error);
      throw new DatabaseError(`Failed to fetch ${this.table}: ${error.message}`);
    }
  }

  // Get single record by ID
  async getById(id) {
    try {
      if (!id || id.trim() === '') {
        throw new ValidationError('ID is required');
      }

      const result = await db.query(
        `SELECT * FROM ${this.table} WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(`Record not found in ${this.table}`);
      }

      logger.debug(`Retrieved record ${id} from ${this.table}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error fetching record ${id}:`, error);
      throw error;
    }
  }

  // Create new record
  async create(data) {
    try {
      // Validate required fields
      const { user_id, ...rest } = data;

      if (!user_id) {
        throw new ValidationError('user_id is required');
      }

      // Build insert query
      const fields = ['user_id', ...Object.keys(rest), 'status', 'created_at', 'updated_at'];
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const values = [user_id, ...Object.values(rest), 'active', new Date(), new Date()];

      const result = await db.query(
        `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );

      logger.info(`Created record ${result.rows[0].id} in ${this.table}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating record in ${this.table}:`, error);
      throw new DatabaseError(`Failed to create record: ${error.message}`);
    }
  }

  // Update existing record
  async update(id, data) {
    try {
      // Verify record exists
      const existing = await this.getById(id);

      // Build update query
      const updateFields = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = [...Object.values(data), id];

      const result = await db.query(
        `UPDATE ${this.table} SET ${updateFields}, updated_at = NOW() WHERE id = $${Object.keys(data).length + 1} RETURNING *`,
        values
      );

      logger.info(`Updated record ${id} in ${this.table}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating record ${id}:`, error);
      throw error;
    }
  }

  // Delete (soft delete)
  async delete(id) {
    try {
      const existing = await this.getById(id);

      const result = await db.query(
        `UPDATE ${this.table} SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );

      logger.info(`Soft-deleted record ${id} from ${this.table}`);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error deleting record ${id}:`, error);
      throw error;
    }
  }

  // Bulk operations
  async createBulk(records) {
    try {
      if (!Array.isArray(records) || records.length === 0) {
        throw new ValidationError('Records must be a non-empty array');
      }

      const results = [];
      for (const record of records) {
        const created = await this.create(record);
        results.push(created);
      }

      logger.info(`Bulk created ${results.length} records in ${this.table}`);
      return results;
    } catch (error) {
      logger.error(`Error bulk creating records:`, error);
      throw error;
    }
  }

  // Search with advanced filtering
  async search(query, fields = ['data']) {
    try {
      const searchConditions = fields.map((f, i) => `${f}::text ILIKE $${i + 1}`).join(' OR ');
      const searchParams = fields.map(() => `%${query}%`);

      const result = await db.query(
        `SELECT * FROM ${this.table} WHERE (${searchConditions}) AND deleted_at IS NULL LIMIT 100`,
        searchParams
      );

      logger.info(`Search found ${result.rows.length} matches in ${this.table}`);
      return result.rows;
    } catch (error) {
      logger.error(`Error searching ${this.table}:`, error);
      throw error;
    }
  }
}

module.exports = new M285Service();