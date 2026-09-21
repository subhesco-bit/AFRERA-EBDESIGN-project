'use strict';

const crypto = require('crypto');

function required(value, name) {
  if (value === undefined || value === null || value === '') {
    const error = new Error(`${name} is required`);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  return value;
}

/** Idempotent application-level refund contract. Provider execution is injected. */
class RefundService {
  constructor({ executeRefund = null, repository = null } = {}) {
    this.executeRefund = executeRefund;
    this.repository = repository;
  }

  buildIdempotencyKey(paymentId, requestId) {
    return crypto.createHash('sha256').update(`${paymentId}:${requestId}`).digest('hex');
  }

  async createRefund({ paymentId, amount, currency = 'INR', requestId, reason = null }) {
    required(paymentId, 'paymentId');
    required(amount, 'amount');
    required(requestId, 'requestId');
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      const error = new Error('refund amount must be positive');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    const idempotencyKey = this.buildIdempotencyKey(paymentId, requestId);
    if (this.repository?.findByIdempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(idempotencyKey);
      if (existing) return existing;
    }
    if (typeof this.executeRefund !== 'function') {
      const error = new Error('Refund provider is not configured');
      error.code = 'PAYMENT_PROVIDER_NOT_CONFIGURED';
      throw error;
    }
    const result = await this.executeRefund({ paymentId, amount: Number(amount), currency, reason, idempotencyKey });
    if (this.repository?.save) await this.repository.save({ ...result, paymentId, amount: Number(amount), currency, idempotencyKey });
    return result;
  }
}

module.exports = new RefundService();
module.exports.RefundService = RefundService;
