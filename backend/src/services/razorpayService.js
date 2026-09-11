'use strict';

/**
 * Production Razorpay adapter.
 * Keeps provider concerns behind a stable application service contract.
 */
const crypto = require('crypto');

function required(value, name) {
  if (value === undefined || value === null || value === '') {
    const error = new Error(`${name} is required`);
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  return value;
}

class RazorpayService {
  constructor({ client = null, keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET } = {}) {
    this.client = client;
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  isConfigured() {
    return Boolean(this.client || (this.keyId && this.keySecret));
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      const error = new Error('Razorpay is not configured');
      error.code = 'PAYMENT_PROVIDER_NOT_CONFIGURED';
      throw error;
    }
  }

  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    required(amount, 'amount');
    required(receipt, 'receipt');
    if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) {
      const error = new Error('amount must be a positive integer in the provider minor unit');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    this.assertConfigured();
    if (!this.client) throw new Error('Razorpay SDK client is required for live operations');
    return this.client.orders.create({ amount: Number(amount), currency, receipt, notes });
  }

  verifyWebhookSignature(payload, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
    required(payload, 'payload');
    required(signature, 'signature');
    required(secret, 'webhook secret');
    const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(String(signature)));
  }

  verifyPaymentSignature({ orderId, paymentId, signature, secret = this.keySecret }) {
    required(orderId, 'orderId');
    required(paymentId, 'paymentId');
    required(signature, 'signature');
    required(secret, 'key secret');
    const digest = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(String(signature)));
  }
}

module.exports = new RazorpayService();
module.exports.RazorpayService = RazorpayService;
