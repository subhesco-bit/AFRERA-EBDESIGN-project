// Enterprise Production Service Template - Claude AI Design
const logger = require('../utils/logger');
const { ValidationError, ServerError, NotFoundError } = require('./errorHandler');
const cache = require('./cache');

class ProductionService {
  constructor(name, db) {
    this.name = name;
    this.db = db;
    this.cache = cache;
    this.logger = logger;
    this.requestCount = 0;
    this.errorCount = 0;
  }

  // Protected method wrapper with error handling & logging
  async executeWithErrorHandling(methodName, fn, args = []) {
    const startTime = Date.now();
    this.requestCount++;

    try {
      this.logger.debug(`${this.name}.${methodName} started`, { args });
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      this.logger.info(`${this.name}.${methodName} completed`, {
        duration,
        hasResult: !!result
      });

      return result;
    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;

      this.logger.error(`${this.name}.${methodName} failed`, {
        error: error.message,
        duration,
        stack: error.stack
      });

      throw error;
    }
  }

  // Database operation wrapper with transaction support
  async executeInTransaction(operations) {
    const client = await this.db.pool.connect();

    try {
      await client.query('BEGIN');

      const results = [];
      for (const operation of operations) {
        const result = await client.query(...operation);
        results.push(result);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new ServerError('Transaction failed', { originalError: error.message });
    } finally {
      client.release();
    }
  }

  // Cached database query
  async queryWithCache(cacheKey, query, params, ttl = cache.ttl.medium) {
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    // Execute query
    const result = await this.db.query(query, params);

    // Cache result
    await this.cache.set(cacheKey, result.rows, ttl);

    return result.rows;
  }

  // Batch operation with validation
  async batchInsert(table, records, batchSize = 100) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new ValidationError('Records must be a non-empty array');
    }

    const results = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const placeholders = batch.map((_, idx) => {
        const cols = Object.keys(batch[0]);
        return `(${cols.map((_, col) => `$${idx * cols.length + col + 1}`).join(',')})`;
      }).join(',');

      const columns = Object.keys(batch[0]);
      const values = batch.flatMap(record => columns.map(col => record[col]));

      const query = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders} RETURNING *`;

      const result = await this.db.query(query, values);
      results.push(...result.rows);
    }

    return results;
  }

  // Pagination helper
  async paginate(table, page = 1, limit = 20, filter = {}) {
    const offset = (page - 1) * limit;

    const where = Object.entries(filter)
      .map(([key], idx) => `${key} = $${idx + 1}`)
      .join(' AND ');

    const whereClause = where ? `WHERE ${where}` : '';
    const values = Object.values(filter);

    const [countResult, dataResult] = await Promise.all([
      this.db.query(`SELECT COUNT(*) FROM ${table} ${whereClause}`, values),
      this.db.query(`SELECT * FROM ${table} ${whereClause} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, offset])
    ]);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
  }

  // Circuit breaker pattern for external calls
  async callExternalService(serviceName, fn, fallback = null) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      return result;
    } catch (error) {
      this.logger.warn(`External service call failed: ${serviceName}`, error);

      if (fallback) {
        this.logger.info(`Using fallback for ${serviceName}`);
        return fallback;
      }

      throw new ServerError(`Service unavailable: ${serviceName}`);
    }
  }

  // Retry logic for transient failures
  async retry(fn, maxRetries = 3, backoffMs = 100) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt);
          this.logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Health check
  getHealth() {
    return {
      service: this.name,
      status: this.errorCount / (this.requestCount + 1) < 0.01 ? 'healthy' : 'degraded',
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: ((this.errorCount / (this.requestCount + 1)) * 100).toFixed(2) + '%'
    };
  }
}

module.exports = ProductionService;
