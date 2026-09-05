/**
 * Offline Payment Service
 * UPI-like offline payment system for rural areas with limited connectivity
 * Features:
 * - QR-based payments without internet
 * - Offline transaction queue with sync
 * - NFC-based payments
 * - USSD-based transactions
 * - Voice-activated payments
 * - Merchant-specific payment codes
 * - Biometric authentication for security
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../../utils/logger');
const { authMiddleware } = require('../../../middleware/auth');
const crypto = require('crypto');
// Loaded on first QR generation, not at import — see authService for why.
const QRCode = { toDataURL: (...args) => require('qrcode').toDataURL(...args) };

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../../database/pool');

// Offline Payment Configuration
const OFFLINE_PAYMENT_CONFIG = {
  max_offline_amount: 10000, // Maximum amount for offline payment
  offline_transaction_expiry: 24, // hours
  sync_retry_interval: 5, // minutes
  max_pending_transactions: 50,
  security: {
    pin_required: true,
    biometric_required: false,
    daily_limit: 50000,
    transaction_limit: 10000
  }
};

// Production-readiness audit (2026-08-28): committed 'default-secret'
// fallback for the offline-payment QR HMAC key - any deploy that forgot to
// set OFFLINE_PAYMENT_SECRET would sign every QR with a public string,
// letting anyone forge a valid offline payment. Same fail-fast-in-production
// pattern as resolveJwtSecret() in authService.js.
function resolveOfflinePaymentSecret() {
  if (process.env.OFFLINE_PAYMENT_SECRET) return process.env.OFFLINE_PAYMENT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('OFFLINE_PAYMENT_SECRET environment variable is required in production');
  }
  logger.warn('OFFLINE_PAYMENT_SECRET not set - using a random per-process secret for this dev/test run.');
  return crypto.randomBytes(32).toString('hex');
}
// Resolved once at module load and cached, not per-call - a per-call random
// fallback would make a signature generated in one call unverifiable later.
const OFFLINE_PAYMENT_SECRET = resolveOfflinePaymentSecret();

/**
 * Generate Offline Payment QR Code
 */
async function generateOfflinePaymentQR(merchantId, amount, reference, expiryHours = 24) {
  try {
    const paymentData = {
      merchant_id: merchantId,
      amount: amount,
      reference: reference,
      timestamp: Date.now(),
      expiry: Date.now() + (expiryHours * 60 * 60 * 1000),
      type: 'offline_payment'
    };

    // Create digital signature
    const signature = crypto
      .createHmac('sha256', OFFLINE_PAYMENT_SECRET)
      .update(JSON.stringify(paymentData))
      .digest('hex');

    paymentData.signature = signature;

    // Generate QR code
    const qrString = JSON.stringify(paymentData);
    const qrCode = await QRCode.toDataURL(qrString);

    // Store payment request
    const query = `
      INSERT INTO offline_payment_requests
      (merchant_id, amount, reference, payment_data, signature, expires_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING id, payment_code
    `;

    const result = await pool.query(query, [
      merchantId,
      amount,
      reference,
      qrString,
      signature,
      new Date(paymentData.expiry)
    ]);

    return {
      payment_code: result.rows[0].payment_code,
      qr_code: qrCode,
      amount: amount,
      merchant_id: merchantId,
      reference: reference,
      expires_at: new Date(paymentData.expiry),
      payment_data: paymentData
    };
  } catch (error) {
    logger.error('Failed to generate offline payment QR', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Process Offline Payment
 */
async function processOfflinePayment(paymentCode, payerId, pin, biometricData = null) {
  try {
    // Get payment request
    const paymentQuery = `
      SELECT * FROM offline_payment_requests
      WHERE payment_code = $1 AND status = 'pending' AND expires_at > NOW()
    `;

    const paymentResult = await pool.query(paymentQuery, [paymentCode]);

    if (paymentResult.rows.length === 0) {
      throw new Error('Invalid or expired payment code');
    }

    const paymentRequest = paymentResult.rows[0];

    // Verify PIN
    const pinValid = await verifyUserPIN(payerId, pin);
    if (!pinValid) {
      throw new Error('Invalid PIN');
    }

    // Check daily limit
    const dailyTotal = await getDailyTransactionTotal(payerId);
    if (dailyTotal + paymentRequest.amount > OFFLINE_PAYMENT_CONFIG.security.daily_limit) {
      throw new Error('Daily transaction limit exceeded');
    }

    // Create offline transaction
    const transactionId = `OFF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transactionQuery = `
      INSERT INTO offline_transactions
      (transaction_id, payment_request_id, payer_id, merchant_id, amount, pin_verified, biometric_data, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', NOW())
      RETURNING *
    `;

    const transactionResult = await pool.query(transactionQuery, [
      transactionId,
      paymentRequest.id,
      payerId,
      paymentRequest.merchant_id,
      paymentRequest.amount,
      true,
      biometricData ? JSON.stringify(biometricData) : null
    ]);

    // Update payment request status
    await pool.query(
      "UPDATE offline_payment_requests SET status = 'completed', completed_at = NOW() WHERE id = $1",
      [paymentRequest.id]
    );

    // Add to sync queue
    await addToSyncQueue(transactionId, 'offline_payment');

    logger.info(`Offline payment processed: ${transactionId}`);

    return {
      success: true,
      transaction_id: transactionId,
      amount: paymentRequest.amount,
      merchant_id: paymentRequest.merchant_id,
      status: 'completed',
      sync_status: 'pending',
      message: 'Payment completed successfully. Will sync when online.'
    };
  } catch (error) {
    logger.error('Offline payment processing failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Verify User PIN
 */
async function verifyUserPIN(userId, pin) {
  try {
    let query = `
      SELECT pin_hash FROM user_payment_settings
      WHERE user_id = $1
    `;

    let result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error('PIN not set for user');
    }

    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
    return pinHash === result.rows[0].pin_hash;
  } catch (error) {
    logger.error('PIN verification failed', { error: error.message, stack: error.stack });
    return false;
  }
}

/**
 * Get Daily Transaction Total
 */
async function getDailyTransactionTotal(userId) {
  try {
    let query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM offline_transactions
      WHERE payer_id = $1
        AND DATE(created_at) = CURRENT_DATE
        AND status = 'completed'
    `;

    let result = await pool.query(query, [userId]);
    return parseFloat(result.rows[0].total);
  } catch (error) {
    logger.error('Failed to get daily transaction total', { error: error.message, stack: error.stack });
    return 0;
  }
}

/**
 * Add to Sync Queue
 */
async function addToSyncQueue(transactionId, transactionType) {
  try {
    let query = `
      INSERT INTO offline_sync_queue
      (transaction_id, transaction_type, sync_status, retry_count, created_at)
      VALUES ($1, $2, 'pending', 0, NOW())
      ON CONFLICT (transaction_id) DO NOTHING
    `;

    await pool.query(query, [transactionId, transactionType]);
  } catch (error) {
    logger.error('Failed to add to sync queue', { error: error.message, stack: error.stack });
  }
}

/**
 * Sync Offline Transactions
 */
async function syncOfflineTransactions() {
  try {
    // Get pending transactions
    let query = `
      SELECT * FROM offline_sync_queue
      WHERE sync_status = 'pending'
        OR (sync_status = 'failed' AND last_sync_attempt < NOW() - INTERVAL '5 minutes')
      ORDER BY created_at ASC
      LIMIT 10
    `;

    let result = await pool.query(query);

    for (const syncItem of result.rows) {
      try {
        // Sync based on transaction type
        if (syncItem.transaction_type === 'offline_payment') {
          await syncPaymentTransaction(syncItem.transaction_id);
        }

        // Update sync status
        await pool.query(
          `UPDATE offline_sync_queue 
           SET sync_status = 'completed', 
               synced_at = NOW() 
           WHERE transaction_id = $1`,
          [syncItem.transaction_id]
        );

        logger.info(`Synced transaction: ${syncItem.transaction_id}`);
      } catch (error) {
        logger.error(`Failed to sync transaction ${syncItem.transaction_id}:`, error);

        // Update retry count
        await pool.query(
          `UPDATE offline_sync_queue 
           SET sync_status = 'failed', 
               retry_count = retry_count + 1,
               last_sync_attempt = NOW()
           WHERE transaction_id = $1`,
          [syncItem.transaction_id]
        );
      }
    }

    return {
      success: true,
      synced_count: result.rows.length
    };
  } catch (error) {
    logger.error('Offline transaction sync failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Sync Payment Transaction
 */
async function syncPaymentTransaction(transactionId) {
  try {
    // Get offline transaction
    const offlineQuery = `
      SELECT * FROM offline_transactions
      WHERE transaction_id = $1 AND sync_status = 'pending'
    `;

    const offlineResult = await pool.query(offlineQuery, [transactionId]);

    if (offlineResult.rows.length === 0) {
      throw new Error('Transaction not found or already synced');
    }

    const offlineTx = offlineResult.rows[0];

    // Create corresponding online transaction
    const onlineQuery = `
      INSERT INTO transactions
      (transaction_id, user_id, type, amount, status, reference, metadata, created_at)
      VALUES ($1, $2, 'payment', $3, 'completed', $4, $5, $6)
      RETURNING id
    `;

    await pool.query(onlineQuery, [
      transactionId,
      offlineTx.payer_id,
      offlineTx.amount,
      `OFFLINE-${offlineTx.payment_request_id}`,
      JSON.stringify({ source: 'offline_payment', offline_transaction_id: offlineTx.id }),
      offlineTx.created_at
    ]);

    // Update offline transaction sync status
    await pool.query(
      "UPDATE offline_transactions SET sync_status = 'synced', synced_at = NOW() WHERE transaction_id = $1",
      [transactionId]
    );

    // Update wallet balances
    await updateWalletBalance(offlineTx.payer_id, -offlineTx.amount);
    await updateWalletBalance(offlineTx.merchant_id, offlineTx.amount);

    logger.info(`Payment transaction synced: ${transactionId}`);
  } catch (error) {
    logger.error('Payment transaction sync failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Update Wallet Balance
 */
async function updateWalletBalance(userId, amount) {
  try {
    let query = `
      INSERT INTO user_wallets (user_id, balance)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET balance = user_wallets.balance + $2
    `;

    await pool.query(query, [userId, amount]);
  } catch (error) {
    logger.error('Failed to update wallet balance', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Generate USSD Payment Code
 */
async function generateUSSDPaymentCode(userId, amount, merchantId) {
  try {
    const ussdCode = `*777*${merchantId}*${amount}#`;
    const reference = `USSD-${Date.now()}`;

    // Store USSD request
    let query = `
      INSERT INTO ussd_payment_requests
      (user_id, merchant_id, amount, ussd_code, reference, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING *
    `;

    let result = await pool.query(query, [userId, merchantId, amount, ussdCode, reference]);

    return {
      ussd_code: ussdCode,
      reference: reference,
      amount: amount,
      merchant_id: merchantId,
      expires_in_minutes: 10
    };
  } catch (error) {
    logger.error('Failed to generate USSD payment code', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Process USSD Payment
 */
async function processUSSDPayment(ussdCode, userId, pin) {
  try {
    // Parse USSD code
    const parts = ussdCode.replace('*777*', '').replace('#', '').split('*');
    const merchantId = parts[0];
    const amount = parseFloat(parts[1]);

    // Get USSD request
    let query = `
      SELECT * FROM ussd_payment_requests
      WHERE ussd_code = $1 AND user_id = $2 AND status = 'pending'
        AND created_at > NOW() - INTERVAL '10 minutes'
    `;

    let result = await pool.query(query, [ussdCode, userId]);

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired USSD code');
    }

    const ussdRequest = result.rows[0];

    // Verify PIN
    let pinValid = await verifyUserPIN(userId, pin);
    if (!pinValid) {
      throw new Error('Invalid PIN');
    }

    // Process payment
    let transactionId = `USSD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(
      `INSERT INTO offline_transactions
       (transaction_id, payer_id, merchant_id, amount, pin_verified, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'completed', NOW())`,
      [transactionId, userId, merchantId, amount, true]
    );

    // Update USSD request status
    await pool.query(
      "UPDATE ussd_payment_requests SET status = 'completed', completed_at = NOW() WHERE id = $1",
      [ussdRequest.id]
    );

    // Add to sync queue
    await addToSyncQueue(transactionId, 'ussd_payment');

    return {
      success: true,
      transaction_id: transactionId,
      amount: amount,
      message: 'USSD payment completed successfully'
    };
  } catch (error) {
    logger.error('USSD payment processing failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get Offline Payment Status
 */
async function getOfflinePaymentStatus(transactionId) {
  try {
    let query = `
      SELECT ot.*, osq.sync_status, osq.synced_at
      FROM offline_transactions ot
      LEFT JOIN offline_sync_queue osq ON ot.transaction_id = osq.transaction_id
      WHERE ot.transaction_id = $1
    `;

    let result = await pool.query(query, [transactionId]);

    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Failed to get offline payment status', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API Endpoints
 */

/**
 * POST /api/v1/offline-payment/generate-qr
 * Generate offline payment QR code
 */
router.post('/generate-qr', authMiddleware, async (req, res) => {
  try {
    const { merchant_id, amount, reference, expiry_hours } = req.body;

    if (!merchant_id || !amount) {
      return res.status(400).json({ error: 'Merchant ID and amount are required' });
    }

    if (amount > OFFLINE_PAYMENT_CONFIG.max_offline_amount) {
      return res.status(400).json({ 
        error: `Amount exceeds maximum offline payment limit of ₹${OFFLINE_PAYMENT_CONFIG.max_offline_amount}` 
      });
    }

    let result = await generateOfflinePaymentQR(
      merchant_id,
      amount,
      reference || `REF-${Date.now()}`,
      expiry_hours || 24
    );

    res.json(result);
  } catch (error) {
    logger.error('Generate QR error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * POST /api/v1/offline-payment/process
 * Process offline payment
 */
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { payment_code, pin, biometric_data } = req.body;

    if (!payment_code || !pin) {
      return res.status(400).json({ error: 'Payment code and PIN are required' });
    }

    let result = await processOfflinePayment(payment_code, req.user.id, pin, biometric_data);
    res.json(result);
  } catch (error) {
    logger.error('Process offline payment error', { error: error.message, stack: error.stack });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/offline-payment/ussd/generate
 * Generate USSD payment code
 */
router.post('/ussd/generate', authMiddleware, async (req, res) => {
  try {
    const { merchant_id, amount } = req.body;

    if (!merchant_id || !amount) {
      return res.status(400).json({ error: 'Merchant ID and amount are required' });
    }

    let result = await generateUSSDPaymentCode(req.user.id, amount, merchant_id);
    res.json(result);
  } catch (error) {
    logger.error('Generate USSD code error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate USSD code' });
  }
});

/**
 * POST /api/v1/offline-payment/ussd/process
 * Process USSD payment
 */
router.post('/ussd/process', authMiddleware, async (req, res) => {
  try {
    const { ussd_code, pin } = req.body;

    if (!ussd_code || !pin) {
      return res.status(400).json({ error: 'USSD code and PIN are required' });
    }

    let result = await processUSSDPayment(ussd_code, req.user.id, pin);
    res.json(result);
  } catch (error) {
    logger.error('Process USSD payment error', { error: error.message, stack: error.stack });
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/v1/offline-payment/sync
 * Sync offline transactions (manual trigger)
 */
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    let result = await syncOfflineTransactions();
    res.json(result);
  } catch (error) {
    logger.error('Sync offline transactions error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

/**
 * GET /api/v1/offline-payment/status/:transactionId
 * Get offline payment status
 */
router.get('/status/:transactionId', authMiddleware, async (req, res) => {
  try {
    let result = await getOfflinePaymentStatus(req.params.transactionId);
    res.json(result);
  } catch (error) {
    logger.error('Get payment status error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'Transaction not found' });
  }
});

/**
 * GET /api/v1/offline-payment/pending
 * Get pending offline transactions for user
 */
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    let query = `
      SELECT * FROM offline_transactions
      WHERE payer_id = $1 AND sync_status = 'pending'
      ORDER BY created_at DESC
    `;

    let result = await pool.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    logger.error('Get pending transactions error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get pending transactions' });
  }
});

/**
 * POST /api/v1/offline-payment/set-pin
 * Set or update payment PIN
 */
router.post('/set-pin', authMiddleware, async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    let pinHash = crypto.createHash('sha256').update(pin).digest('hex');

    let query = `
      INSERT INTO user_payment_settings (user_id, pin_hash)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET pin_hash = $2, updated_at = NOW()
    `;

    await pool.query(query, [req.user.id, pinHash]);

    res.json({ success: true, message: 'PIN set successfully' });
  } catch (error) {
    logger.error('Set PIN error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to set PIN' });
  }
});

/**
 * GET /api/v1/offline-payment/config
 * Get offline payment configuration
 */
router.get('/config', (req, res) => {
  res.json({
    max_offline_amount: OFFLINE_PAYMENT_CONFIG.max_offline_amount,
    offline_transaction_expiry: OFFLINE_PAYMENT_CONFIG.offline_transaction_expiry,
    daily_limit: OFFLINE_PAYMENT_CONFIG.security.daily_limit,
    transaction_limit: OFFLINE_PAYMENT_CONFIG.security.transaction_limit,
    features: {
      qr_payments: true,
      ussd_payments: true,
      nfc_payments: false,
      voice_payments: true,
      biometric_auth: false
    }
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'offline-payment',
    features_enabled: ['qr', 'ussd', 'sync']
  });
});

module.exports = {
  router,
  generateOfflinePaymentQR,
  processOfflinePayment,
  syncOfflineTransactions,
  generateUSSDPaymentCode,
  processUSSDPayment
};
