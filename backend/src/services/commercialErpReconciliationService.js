// Professional Service: Dependency injection, repository pattern, error handling
export class commercialErpReconciliationService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.repository.find({ offset, limit }),
      this.repository.count()
    ]);
    return { items, total, page, limit };
  }

  async getById(id) {
    return this.repository.findById(id);
  }

  async create(data) {
    return this.repository.create(data);
  }

  async update(id, data) {
    return this.repository.update(id, data);
  }

  async delete(id) {
    return this.repository.delete(id);
  }
}
