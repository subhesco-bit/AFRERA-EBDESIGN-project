import { {REPOSITORY_NAME} } from '../repositories/{REPOSITORY_NAME}';
import { {DTO_NAME} } from '../dtos/{DTO_NAME}';
import { logger } from '../logging/logger';

export class {SERVICE_NAME} {
  constructor(repository = new {REPOSITORY_NAME}()) {
    this.repository = repository;
  }

  async getAll(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const [items, total] = await Promise.all([
        this.repository.find({ offset, limit }),
        this.repository.count()
      ]);
      return { items, total, page, limit };
    } catch (err) {
      logger.error('Error fetching items', { error: err.message });
      throw err;
    }
  }

  async getById(id) {
    try {
      const item = await this.repository.findById(id);
      return item ? new {DTO_NAME}(item) : null;
    } catch (err) {
      logger.error('Error fetching item', { id, error: err.message });
      throw err;
    }
  }

  async create(data) {
    try {
      const item = await this.repository.create(data);
      logger.info('Item created', { id: item.id });
      return new {DTO_NAME}(item);
    } catch (err) {
      logger.error('Error creating item', { error: err.message });
      throw err;
    }
  }

  async update(id, data) {
    try {
      const item = await this.repository.update(id, data);
      if (!item) return null;
      logger.info('Item updated', { id });
      return new {DTO_NAME}(item);
    } catch (err) {
      logger.error('Error updating item', { id, error: err.message });
      throw err;
    }
  }

  async delete(id) {
    try {
      await this.repository.delete(id);
      logger.info('Item deleted', { id });
    } catch (err) {
      logger.error('Error deleting item', { id, error: err.message });
      throw err;
    }
  }
}
