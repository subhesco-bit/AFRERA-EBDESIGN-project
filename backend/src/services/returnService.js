'use strict';

function required(value, name) {
  if (value === undefined || value === null || value === '') {
    const error = new Error(`${name} is required`);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
}

class ReturnService {
  constructor({ repository = null, idGenerator = () => `RET-${Date.now()}` } = {}) {
    this.repository = repository;
    this.idGenerator = idGenerator;
  }

  async create({ orderId, items, reason, requestedBy }) {
    required(orderId, 'orderId');
    required(requestedBy, 'requestedBy');
    if (!Array.isArray(items) || items.length === 0) {
      const error = new Error('at least one return item is required');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    const record = {
      id: this.idGenerator(), orderId, items, reason: reason || null,
      requestedBy, status: 'REQUESTED', createdAt: new Date().toISOString(),
    };
    return this.repository?.create ? this.repository.create(record) : record;
  }

  async updateStatus(id, status, actor) {
    required(id, 'id'); required(status, 'status'); required(actor, 'actor');
    const allowed = ['REQUESTED', 'APPROVED', 'REJECTED', 'PICKUP', 'RECEIVED', 'REFUNDED', 'CLOSED'];
    if (!allowed.includes(status)) {
      const error = new Error(`invalid return status: ${status}`);
      error.code = 'VALIDATION_ERROR'; throw error;
    }
    if (!this.repository?.updateStatus) throw Object.assign(new Error('return repository is not configured'), { code: 'DEPENDENCY_NOT_CONFIGURED' });
    return this.repository.updateStatus(id, status, actor);
  }
}

module.exports = new ReturnService();
module.exports.ReturnService = ReturnService;
