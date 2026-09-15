/**
 * Unified Payment Service
 * Production payment, wallet and transaction orchestration.
 * External gateway credentials are optional at startup; gateway-specific
 * operations fail closed when the required credentials are absent.
 */

const crypto = require('crypto');
const { getPostgreSQL } = require('../database/connection');
const cacheService = require('./cacheService');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const Razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? require('razorpay')
  : null;

const razorpay = Razorpay
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

function database() {
  const db = getPostgreSQL();
  if (!db || typeof db.query !== 'function') {
    throw new Error('PostgreSQL is not connected');
  }
  return db;
}

function validateUserId(userId) {
  if (userId === undefined || userId === null || userId === '') {
    throw new Error('User ID is required');
  }
}

function validateAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0 || !Number.isSafeInteger(Math.round(value * 100))) {
    throw new Error('Payment amount must be a positive finite amount');
  }
  return value;
}

function normaliseLimit(limit) {
  const value = Number.parseInt(limit, 10);
  return Number.isInteger(value) ? Math.min(Math.max(value, 1), 200) : 50;
}

function makeTransferId() {
  return `transfer-${crypto.randomUUID()}`;
}

class PaymentService {
  async init() {
    return this.getStatus();
  }

  getStatus() {
    return {
      stripe: Boolean(stripe),
      razorpay: Boolean(razorpay),
      configured: Boolean(stripe || razorpay),
    };
  }

  async createWallet(userId) {
    validateUserId(userId);
    const result = await database().query(
      `INSERT INTO wallets (user_id, balance, created_at)
       VALUES ($1, 0, NOW())
       ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
       RETURNING *`,
      [userId],
    );
    return result.rows[0];
  }

  async getBalance(userId) {
    validateUserId(userId);
    const key = `wallet:${userId}:balance`;
    const cached = await cacheService.get(key);
    if (cached !== null && cached !== undefined) return cached;

    const result = await database().query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [userId],
    );

    const balance = result.rows[0]?.balance ?? 0;
    await cacheService.set(key, balance, 300);
    return balance;
  }

  async processStripePayment(userId, amount, paymentMethodId) {
    validateUserId(userId);
    const value = validateAmount(amount);
    if (!paymentMethodId) throw new Error('Stripe payment method is required');
    if (!stripe) throw new Error('Stripe is not configured');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(value * 100),
      currency: 'inr',
      payment_method: paymentMethodId,
      confirm: true,
      metadata: { userId: String(userId) },
    });

    if (paymentIntent.status !== 'succeeded') {
      return { success: false, status: paymentIntent.status, transactionId: paymentIntent.id };
    }

    const transaction = await this.recordTransaction(
      userId,
      value,
      'stripe',
      paymentIntent.id,
      { idempotencyKey: paymentIntent.id },
    );
    await this.updateBalance(userId, value);
    return { success: true, transactionId: paymentIntent.id, transaction };
  }

  async processRazorpayPayment(userId, amount, paymentId) {
    validateUserId(userId);
    const value = validateAmount(amount);
    if (!paymentId) throw new Error('Razorpay payment ID is required');
    if (!razorpay) throw new Error('Razorpay is not configured');

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== 'captured') {
      return { success: false, status: payment.status, transactionId: payment.id };
    }

    const gatewayAmount = Number(payment.amount) / 100;
    if (Number.isFinite(gatewayAmount) && Math.abs(gatewayAmount - value) > 0.01) {
      throw new Error('Razorpay payment amount does not match the requested amount');
    }

    const transaction = await this.recordTransaction(
      userId,
      value,
      'razorpay',
      payment.id,
      { idempotencyKey: payment.id },
    );
    await this.updateBalance(userId, value);
    return { success: true, transactionId: payment.id, transaction };
  }

  async recordTransaction(userId, amount, gateway, transactionId, options = {}) {
    validateUserId(userId);
    const value = Number(amount);
    if (!Number.isFinite(value)) throw new Error('Transaction amount must be finite');
    if (!gateway || !transactionId) throw new Error('Gateway and transaction ID are required');

    const idempotencyKey = options.idempotencyKey || transactionId;
    const result = await database().query(
      `INSERT INTO transactions
         (user_id, amount, gateway, transaction_id, status, created_at)
       VALUES ($1, $2, $3, $4, 'completed', NOW())
       ON CONFLICT (transaction_id) DO UPDATE
         SET transaction_id = EXCLUDED.transaction_id
       RETURNING *`,
      [userId, value, gateway, transactionId],
    );

    await cacheService.invalidate(`transactions:${userId}:*`);
    return { ...result.rows[0], idempotencyKey };
  }

  async updateBalance(userId, amount) {
    validateUserId(userId);
    const value = Number(amount);
    if (!Number.isFinite(value)) throw new Error('Balance adjustment must be finite');

    const result = await database().query(
      `UPDATE wallets
       SET balance = balance + $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [value, userId],
    );

    if (!result.rows[0]) {
      await this.createWallet(userId);
      return this.updateBalance(userId, value);
    }

    await cacheService.del(`wallet:${userId}:balance`);
    return result.rows[0];
  }

  async transferFunds(fromUserId, toUserId, amount) {
    validateUserId(fromUserId);
    validateUserId(toUserId);
    if (String(fromUserId) === String(toUserId)) throw new Error('Source and destination must differ');
    const value = validateAmount(amount);
    const db = database();
    const client = typeof db.connect === 'function' ? await db.connect() : null;

    if (!client) {
      throw new Error('Database transaction support is required for fund transfers');
    }

    const transferId = makeTransferId();
    try {
      await client.query('BEGIN');

      const debit = await client.query(
        `UPDATE wallets
         SET balance = balance - $1, updated_at = NOW()
         WHERE user_id = $2 AND balance >= $1
         RETURNING balance`,
        [value, fromUserId],
      );
      if (!debit.rows[0]) throw new Error('Insufficient balance or source wallet does not exist');

      const credit = await client.query(
        `UPDATE wallets
         SET balance = balance + $1, updated_at = NOW()
         WHERE user_id = $2
         RETURNING balance`,
        [value, toUserId],
      );
      if (!credit.rows[0]) throw new Error('Destination wallet does not exist');

      await client.query(
        `INSERT INTO transactions
          (user_id, amount, gateway, transaction_id, status, created_at)
         VALUES ($1, $2, 'transfer', $3, 'completed', NOW()),
                ($4, $5, 'transfer', $6, 'completed', NOW())`,
        [fromUserId, -value, transferId, toUserId, value, `${transferId}-credit`],
      );

      await client.query('COMMIT');
      await cacheService.del(`wallet:${fromUserId}:balance`);
      await cacheService.del(`wallet:${toUserId}:balance`);
      await cacheService.invalidate(`transactions:${fromUserId}:*`);
      await cacheService.invalidate(`transactions:${toUserId}:*`);
      return { success: true, transferId };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async getTransactionHistory(userId, limit = 50) {
    validateUserId(userId);
    const safeLimit = normaliseLimit(limit);
    const key = `transactions:${userId}:history:${safeLimit}`;
    const cached = await cacheService.get(key);
    if (cached !== null && cached !== undefined) return cached;

    const result = await database().query(
      `SELECT * FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, safeLimit],
    );

    await cacheService.set(key, result.rows, 600);
    return result.rows;
  }

  async handleStripeWebhook(event) {
    if (!event || typeof event.type !== 'string') throw new Error('Invalid Stripe webhook event');

    switch (event.type) {
      case 'payment_intent.succeeded':
        return { handled: true, type: event.type, paymentIntentId: event.data?.object?.id };
      case 'payment_intent.payment_failed':
        return { handled: true, type: event.type, paymentIntentId: event.data?.object?.id };
      default:
        return { handled: false, type: event.type };
    }
  }

  async handleRazorpayWebhook(event) {
    if (!event || !event.payload) throw new Error('Invalid Razorpay webhook event');
    return { handled: true, type: event.event || 'unknown' };
  }

  setupWebhooks() {
    return true;
  }

  verifyRazorpaySignature(payload, signature) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');
    return expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  }
}

module.exports = new PaymentService();
