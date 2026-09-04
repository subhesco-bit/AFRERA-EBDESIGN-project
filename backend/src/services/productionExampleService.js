// Production-Hardened Service Template - World Class Quality
const ProductionService = require('../core/productionService');
const { ValidationError, NotFoundError } = require('../core/errorHandler');
const { Validator } = require('../core/validation');

class ProductionExampleService extends ProductionService {
  constructor(db) {
    super('ProductionExample', db);
  }

  // World-class service method with all production features
  async getResourceById(resourceId) {
    return this.executeWithErrorHandling('getResourceById', async () => {
      // Input validation
      const validatedId = Validator.uuid(resourceId);

      // Check cache
      const cacheKey = `resource:${validatedId}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for resource ${validatedId}`);
        return cached;
      }

      // Database query with retry logic
      const result = await this.retry(async () => {
        const query = 'SELECT * FROM resources WHERE id = $1 AND deleted_at IS NULL';
        const data = await this.db.query(query, [validatedId]);
        return data.rows[0];
      });

      if (!result) {
        throw new NotFoundError('Resource', { resourceId });
      }

      // Cache successful result
      await this.cache.set(cacheKey, result, this.cache.ttl.medium);

      return result;
    }, [resourceId]);
  }

  // Batch create with transaction support
  async createResources(resources) {
    return this.executeWithErrorHandling('createResources', async () => {
      // Validate input
      const validated = Validator.array(resources, {
        minLength: 1,
        maxLength: 100,
        itemValidator: (item) =>
          Validator.object(item, {
            name: (v) => Validator.string(v, { minLength: 1, maxLength: 255 }),
            description: (v) => Validator.string(v, { maxLength: 1000, required: false })
          })
      });

      // Execute in transaction
      const operations = validated.map(resource => [
        `INSERT INTO resources (id, name, description, created_at)
         VALUES (gen_random_uuid(), $1, $2, NOW())
         RETURNING *`,
        [resource.name, resource.description || null]
      ]);

      const results = await this.executeInTransaction(operations);

      // Invalidate cache
      await this.cache.clear('resource:*');

      return results;
    }, [resources]);
  }

  // Advanced pagination with filters
  async listResources(page = 1, limit = 20, filters = {}) {
    return this.executeWithErrorHandling('listResources', async () => {
      // Validate pagination
      const validatedPage = Validator.number(page, { min: 1, integer: true });
      const validatedLimit = Validator.number(limit, { min: 1, max: 100, integer: true });

      // Build cache key
      const cacheKey = `resources:page:${validatedPage}:limit:${validatedLimit}:filters:${JSON.stringify(filters)}`;

      // Try cache
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      // Execute paginated query
      const result = await this.paginate('resources', validatedPage, validatedLimit, {
        deleted_at: null,
        ...filters
      });

      // Cache pagination result
      await this.cache.set(cacheKey, result, this.cache.ttl.short);

      return result;
    }, [page, limit, filters]);
  }

  // Update with optimistic locking
  async updateResource(resourceId, updates, version = null) {
    return this.executeWithErrorHandling('updateResource', async () => {
      const validatedId = Validator.uuid(resourceId);

      // Fetch current resource
      const current = await this.getResourceById(validatedId);

      if (version && current.version !== version) {
        throw new ValidationError('Resource has been modified. Please refresh and try again.');
      }

      // Execute update in transaction
      const operations = [
        [
          `UPDATE resources
           SET ${Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ')},
               version = version + 1,
               updated_at = NOW()
           WHERE id = $${Object.keys(updates).length + 1}
           AND deleted_at IS NULL
           RETURNING *`,
          [...Object.values(updates), validatedId]
        ]
      ];

      const [result] = await this.executeInTransaction(operations);

      if (!result) {
        throw new NotFoundError('Resource', { resourceId });
      }

      // Invalidate cache
      await this.cache.delete(`resource:${validatedId}`);
      await this.cache.clear(`resources:page:*`);

      return result;
    }, [resourceId, updates, version]);
  }

  // Soft delete with cascade
  async deleteResource(resourceId) {
    return this.executeWithErrorHandling('deleteResource', async () => {
      const validatedId = Validator.uuid(resourceId);

      // Check for dependencies
      const dependencies = await this.db.query(
        'SELECT COUNT(*) FROM resource_items WHERE resource_id = $1',
        [validatedId]
      );

      if (parseInt(dependencies.rows[0].count) > 0) {
        throw new ValidationError('Cannot delete resource with dependent items');
      }

      // Soft delete
      const result = await this.db.query(
        'UPDATE resources SET deleted_at = NOW(), deleted_by = $1 WHERE id = $2 RETURNING *',
        ['system', validatedId]
      );

      if (!result.rows[0]) {
        throw new NotFoundError('Resource', { resourceId });
      }

      // Invalidate cache
      await this.cache.delete(`resource:${validatedId}`);
      await this.cache.clear(`resources:page:*`);

      return { success: true, message: 'Resource deleted' };
    }, [resourceId]);
  }

  // Search with full-text support
  async searchResources(query, page = 1, limit = 20) {
    return this.executeWithErrorHandling('searchResources', async () => {
      const validatedQuery = Validator.string(query, { minLength: 1, maxLength: 255 });

      const cacheKey = `search:${validatedQuery}:${page}:${limit}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;

      const offset = (page - 1) * limit;

      const result = await this.db.query(
        `SELECT * FROM resources
         WHERE deleted_at IS NULL
         AND (name ILIKE $1 OR description ILIKE $1)
         LIMIT $2 OFFSET $3`,
        [`%${validatedQuery}%`, limit, offset]
      );

      await this.cache.set(cacheKey, result.rows, this.cache.ttl.short);

      return result.rows;
    }, [query, page, limit]);
  }

  // Health & stats
  getStats() {
    return {
      ...this.getHealth(),
      cacheStats: {
        hits: this.cache.hits || 0,
        misses: this.cache.misses || 0
      }
    };
  }
}

module.exports = ProductionExampleService;
