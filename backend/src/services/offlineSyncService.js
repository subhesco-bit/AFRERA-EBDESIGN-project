/**
 * Offline Sync Service
 * Comprehensive offline-first synchronization system for AFRERA platform
 * Features:
 * - Background data synchronization
 * - Conflict resolution algorithms
 * - Queue-based data management
 * - Progressive data loading
 * - Storage optimization
 * - Network-aware sync strategies
 * - Delta synchronization
 * - Retry mechanisms with exponential backoff
 * - Data integrity verification
 * - User preference-based sync policies
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');
const crypto = require('crypto');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../database/pool');

// Offline Sync Configuration
const OFFLINE_SYNC_CONFIG = {
  sync_interval: 5, // minutes
  max_retry_attempts: 5,
  retry_backoff_base: 1000, // milliseconds
  max_queue_size: 1000,
  conflict_resolution: 'last_write_wins', // or 'manual', 'server_wins', 'client_wins'
  data_retention_days: 30,
  sync_priorities: {
    critical: 1, // Orders, payments
    high: 2, // Inventory, prices
    medium: 3, // User data, preferences
    low: 4 // Analytics, logs
  }
};

/**
 * Generate sync token for data integrity
 */
function generateSyncToken(data) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data) + process.env.SYNC_SECRET || 'default-secret')
    .digest('hex');
}

/**
 * Add data to sync queue
 */
async function addToSyncQueue(userId, entityType, entityData, operation, priority = 'medium') {
  try {
    const syncToken = generateSyncToken(entityData);
    const priorityValue = OFFLINE_SYNC_CONFIG.sync_priorities[priority] || 3;

    const query = `
      INSERT INTO sync_queue
      (user_id, entity_type, entity_data, operation, sync_token, priority, status, retry_count, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', 0, NOW())
      RETURNING id, sync_token
    `;

    const result = await pool.query(query, [
      userId,
      entityType,
      JSON.stringify(entityData),
      operation,
      syncToken,
      priorityValue
    ]);

    logger.info(`Added to sync queue: ${entityType} for user ${userId}`);

    return {
      success: true,
      queue_id: result.rows[0].id,
      sync_token: result.rows[0].sync_token,
      priority: priority
    };
  } catch (error) {
    logger.error('Failed to add to sync queue', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Process sync queue for user
 */
async function processSyncQueue(userId) {
  try {
    // Get pending sync items for user
    const query = `
      SELECT * FROM sync_queue
      WHERE user_id = $1
        AND status = 'pending'
        OR (status = 'failed' AND retry_count < $2)
      ORDER BY priority ASC, created_at ASC
      LIMIT 50
    `;

    const result = await pool.query(query, [userId, OFFLINE_SYNC_CONFIG.max_retry_attempts]);
    const syncItems = result.rows;

    let processedCount = 0;
    let failedCount = 0;
    const results = [];
    const completedIds = [];
    const failedIds = [];

    for (const syncItem of syncItems) {
      try {
        const syncResult = await processSyncItem(syncItem);
        completedIds.push(syncItem.id);

        processedCount++;
        results.push({
          queue_id: syncItem.id,
          status: 'success',
          result: syncResult
        });

        logger.info(`Sync item processed: ${syncItem.entity_type} (ID: ${syncItem.id})`);
      } catch (error) {
        const retryCount = syncItem.retry_count + 1;
        const backoffTime = Math.pow(OFFLINE_SYNC_CONFIG.retry_backoff_base, retryCount);
        failedIds.push({
          id: syncItem.id,
          retryCount,
          backoffTime,
          errorMessage: error.message
        });

        failedCount++;
        results.push({
          queue_id: syncItem.id,
          status: 'failed',
          error: error.message,
          retry_count: retryCount
        });

        logger.error(`Sync item failed: ${syncItem.entity_type} (ID: ${syncItem.id})`, error);
      }
    }

    // Bulk update completed items
    if (completedIds.length > 0) {
      await pool.query(
        `UPDATE sync_queue 
         SET status = 'completed', synced_at = NOW() 
         WHERE id = ANY($1)`,
        [completedIds]
      );
    }

    // Bulk update failed items — each row needs a different retry_count/
    // backoff/error_message, so a single WHERE id = ANY() won't do; join
    // against a VALUES list instead of one UPDATE per row.
    if (failedIds.length > 0) {
      const rows = failedIds.map((f, i) => {
        const base = i * 4;
        return `($${base + 1}::int, $${base + 2}::int, $${base + 3}::numeric, $${base + 4}::text)`;
      }).join(', ');
      const params = failedIds.flatMap((f) => [f.id, f.retryCount, f.backoffTime, f.errorMessage]);

      await pool.query(
        `UPDATE sync_queue AS sq
         SET status = 'failed',
             retry_count = v.retry_count,
             next_retry_at = NOW() + INTERVAL '1 second' * v.backoff,
             error_message = v.error_message
         FROM (VALUES ${rows}) AS v(id, retry_count, backoff, error_message)
         WHERE sq.id = v.id`,
        params
      );
    }

    return {
      success: true,
      processed_count: processedCount,
      failed_count: failedCount,
      results: results
    };
  } catch (error) {
    logger.error('Sync queue processing failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Process individual sync item
 */
async function processSyncItem(syncItem) {
  let entityData;
  try {
    entityData = JSON.parse(syncItem.entity_data);
  } catch (error) {
    throw new Error('Invalid JSON data in sync item');
  }
  
  const syncToken = generateSyncToken(entityData);

  // Verify data integrity
  if (syncToken !== syncItem.sync_token) {
    throw new Error('Data integrity check failed');
  }

  // Process based on entity type and operation
  switch (syncItem.entity_type) {
    case 'order':
      return await syncOrder(entityData, syncItem.operation);
    case 'product':
      return await syncProduct(entityData, syncItem.operation);
    case 'user_profile':
      return await syncUserProfile(entityData, syncItem.operation);
    case 'inventory':
      return await syncInventory(entityData, syncItem.operation);
    case 'payment':
      return await syncPayment(entityData, syncItem.operation);
    default:
      return await syncGenericEntity(entityData, syncItem.entity_type, syncItem.operation);
  }
}

/**
 * Sync order data
 */
async function syncOrder(orderData, operation) {
  try {
    switch (operation) {
      case 'create': {
        const createQuery = `
          INSERT INTO orders (id, user_id, total_amount, status, metadata, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        await pool.query(createQuery, [
          orderData.id,
          orderData.user_id,
          orderData.total_amount,
          orderData.status,
          JSON.stringify(orderData.metadata || {}),
          orderData.created_at
        ]);
        break;
      }

      case 'update': {
        const updateQuery = `
          UPDATE orders
          SET total_amount = $2, status = $3, metadata = $4, updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `;
        await pool.query(updateQuery, [
          orderData.id,
          orderData.total_amount,
          orderData.status,
          JSON.stringify(orderData.metadata || {})
        ]);
        break;
      }

      case 'delete':
        await pool.query('DELETE FROM orders WHERE id = $1', [orderData.id]);
        break;
    }

    return { success: true, message: 'Order synced successfully' };
  } catch (error) {
    logger.error('Order sync failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Sync product data
 */
async function syncProduct(productData, operation) {
  try {
    switch (operation) {
      case 'create': {
        const createQuery = `
          INSERT INTO products (id, name, category, price, stock, metadata, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        await pool.query(createQuery, [
          productData.id,
          productData.name,
          productData.category,
          productData.price,
          productData.stock,
          JSON.stringify(productData.metadata || {}),
          productData.created_at
        ]);
        break;
      }

      case 'update': {
        const updateQuery = `
          UPDATE products
          SET name = $2, category = $3, price = $4, stock = $5, metadata = $6, updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `;
        await pool.query(updateQuery, [
          productData.id,
          productData.name,
          productData.category,
          productData.price,
          productData.stock,
          JSON.stringify(productData.metadata || {})
        ]);
        break;
      }

      case 'delete':
        await pool.query('DELETE FROM products WHERE id = $1', [productData.id]);
        break;
    }

    return { success: true, message: 'Product synced successfully' };
  } catch (error) {
    logger.error('Product sync failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Sync user profile data
 */
async function syncUserProfile(profileData, operation) {
  try {
    switch (operation) {
      case 'update': {
        const updateQuery = `
          UPDATE user_profiles
          SET first_name = $2, last_name = $3, phone = $4, address = $5, preferences = $6, updated_at = NOW()
          WHERE user_id = $1
          RETURNING user_id
        `;
        await pool.query(updateQuery, [
          profileData.user_id,
          profileData.first_name,
          profileData.last_name,
          profileData.phone,
          profileData.address,
          JSON.stringify(profileData.preferences || {})
        ]);
        break;
      }
    }

    return { success: true, message: 'User profile synced successfully' };
  } catch (error) {
    logger.error('User profile sync failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Sync inventory data
 */
async function syncInventory(inventoryData, operation) {
  try {
    switch (operation) {
      case 'update': {
        const updateQuery = `
          UPDATE inventory
          SET quantity = $2, location = $3, metadata = $4, updated_at = NOW()
          WHERE product_id = $1 AND warehouse_id = $5
          RETURNING product_id
        `;
        await pool.query(updateQuery, [
          inventoryData.product_id,
          inventoryData.quantity,
          inventoryData.location,
          JSON.stringify(inventoryData.metadata || {}),
          inventoryData.warehouse_id
        ]);
        break;
      }
    }

    return { success: true, message: 'Inventory synced successfully' };
  } catch (error) {
    logger.error('Inventory sync failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Sync payment data
 */
async function syncPayment(paymentData, operation) {
  try {
    switch (operation) {
      case 'create': {
        const createQuery = `
          INSERT INTO transactions (transaction_id, user_id, type, amount, status, metadata, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (transaction_id) DO NOTHING
          RETURNING transaction_id
        `;
        await pool.query(createQuery, [
          paymentData.transaction_id,
          paymentData.user_id,
          paymentData.type,
          paymentData.amount,
          paymentData.status,
          JSON.stringify(paymentData.metadata || {}),
          paymentData.created_at
        ]);
        break;
      }

      case 'update': {
        const updateQuery = `
          UPDATE transactions
          SET status = $2, metadata = $3, updated_at = NOW()
          WHERE transaction_id = $1
          RETURNING transaction_id
        `;
        await pool.query(updateQuery, [
          paymentData.transaction_id,
          paymentData.status,
          JSON.stringify(paymentData.metadata || {})
        ]);
        break;
      }
    }

    return { success: true, message: 'Payment synced successfully' };
  } catch (error) {
    logger.error('Payment sync failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Sync generic entity
 */
async function syncGenericEntity(entityData, entityType, operation) {
  try {
    // Generic sync handler for entities without specific handlers
    const query = `
      INSERT INTO generic_entities
      (entity_type, entity_id, entity_data, operation, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (entity_type, entity_id) 
      DO UPDATE SET entity_data = $3, operation = $4, updated_at = NOW()
      RETURNING id
    `;

    await pool.query(query, [
      entityType,
      entityData.id,
      JSON.stringify(entityData),
      operation
    ]);

    return { success: true, message: 'Generic entity synced successfully' };
  } catch (error) {
    logger.error('Generic entity sync failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Resolve sync conflicts
 */
async function resolveSyncConflict(conflictId, resolution, resolvedData) {
  try {
    const conflictQuery = `
      SELECT * FROM sync_conflicts
      WHERE id = $1
    `;

    const conflictResult = await pool.query(conflictQuery, [conflictId]);

    if (conflictResult.rows.length === 0) {
      throw new Error('Conflict not found');
    }

    const conflict = conflictResult.rows[0];

    switch (resolution) {
      case 'client_wins':
        // Apply client data
        await processSyncItem({
          entity_type: conflict.entity_type,
          entity_data: conflict.client_data,
          operation: conflict.operation,
          sync_token: conflict.client_sync_token
        });
        break;

      case 'server_wins':
        // Server data already exists, no action needed
        break;

      case 'manual':
        // Apply manually resolved data
        await processSyncItem({
          entity_type: conflict.entity_type,
          entity_data: resolvedData,
          operation: conflict.operation,
          sync_token: generateSyncToken(resolvedData)
        });
        break;
    }

    // Mark conflict as resolved
    await pool.query(
      "UPDATE sync_conflicts SET status = 'resolved', resolution = $1, resolved_at = NOW() WHERE id = $2",
      [resolution, conflictId]
    );

    logger.info(`Sync conflict resolved: ${conflictId} with resolution: ${resolution}`);

    return {
      success: true,
      message: 'Conflict resolved successfully',
      resolution: resolution
    };
  } catch (error) {
    logger.error('Conflict resolution failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get sync status for user
 */
async function getSyncStatus(userId) {
  try {
    const statusQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'conflict') as conflict_count,
        MAX(created_at) as last_sync_attempt
      FROM sync_queue
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '7 days'
    `;

    const statusResult = await pool.query(statusQuery, [userId]);

    // Get recent conflicts
    const conflictsQuery = `
      SELECT * FROM sync_conflicts
      WHERE user_id = $1
        AND status = 'unresolved'
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const conflictsResult = await pool.query(conflictsQuery, [userId]);

    return {
      user_id: userId,
      queue_status: statusResult.rows[0],
      active_conflicts: conflictsResult.rows,
      sync_enabled: await isSyncEnabled(userId),
      last_successful_sync: await getLastSuccessfulSync(userId)
    };
  } catch (error) {
    logger.error('Failed to get sync status', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Check if sync is enabled for user
 */
async function isSyncEnabled(userId) {
  try {
    const query = `
      SELECT sync_enabled FROM user_sync_preferences
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length > 0) {
      return result.rows[0].sync_enabled;
    }

    return true; // Default to enabled
  } catch (error) {
    logger.error('Failed to check sync enabled status', { error: error.message, stack: error.stack });
    return true;
  }
}

/**
 * Get last successful sync timestamp
 */
async function getLastSuccessfulSync(userId) {
  try {
    const query = `
      SELECT MAX(synced_at) as last_sync
      FROM sync_queue
      WHERE user_id = $1 AND status = 'completed'
    `;

    const result = await pool.query(query, [userId]);

    return result.rows[0].last_sync || null;
  } catch (error) {
    logger.error('Failed to get last successful sync', { error: error.message, stack: error.stack });
    return null;
  }
}

/**
 * Get data snapshot for offline use
 */
async function getOfflineDataSnapshot(userId, entityType, lastSyncTimestamp = null) {
  try {
    const timestamp = lastSyncTimestamp || await getLastSuccessfulSync(userId);

    switch (entityType) {
      case 'products': {
        const productsQuery = `
          SELECT * FROM products
          WHERE updated_at > $1 OR $1 IS NULL
          ORDER BY name ASC
          LIMIT 100
        `;
        const productsResult = await pool.query(productsQuery, [timestamp]);
        return productsResult.rows;
      }

      case 'orders': {
        const ordersQuery = `
          SELECT * FROM orders
          WHERE user_id = $1
            AND (updated_at > $2 OR $2 IS NULL)
          ORDER BY created_at DESC
          LIMIT 50
        `;
        const ordersResult = await pool.query(ordersQuery, [userId, timestamp]);
        return ordersResult.rows;
      }

      case 'user_profile': {
        const profileQuery = `
          SELECT up.*, u.email, u.phone
          FROM user_profiles up
          JOIN users u ON up.user_id = u.id
          WHERE up.user_id = $1
        `;
        const profileResult = await pool.query(profileQuery, [userId]);
        return profileResult.rows[0];
      }

      default:
        throw new Error('Unsupported entity type');
    }
  } catch (error) {
    logger.error('Failed to get offline data snapshot', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API Endpoints
 */

/**
 * POST /api/v1/offline-sync/queue
 * Add data to sync queue
 */
router.post('/queue', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { entity_type, entity_data, operation, priority } = req.body;

    if (!entity_type || !entity_data || !operation) {
      return res.status(400).json({ error: 'Entity type, data, and operation are required' });
    }

    const result = await addToSyncQueue(req.user.id, entity_type, entity_data, operation, priority);
    res.json(result);
  } catch (error) {
    logger.error('Add to sync queue API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add to sync queue' });
  }
});

/**
 * POST /api/v1/offline-sync/process
 * Process sync queue for user
 */
router.post('/process', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const result = await processSyncQueue(req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Process sync queue API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to process sync queue' });
  }
});

/**
 * GET /api/v1/offline-sync/status
 * Get sync status for user
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const result = await getSyncStatus(req.user.id);
    res.json(result);
  } catch (error) {
    logger.error('Get sync status API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

/**
 * POST /api/v1/offline-sync/resolve-conflict
 * Resolve sync conflict
 */
router.post('/resolve-conflict', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { conflict_id, resolution, resolved_data } = req.body;

    if (!conflict_id || !resolution) {
      return res.status(400).json({ error: 'Conflict ID and resolution are required' });
    }

    const result = await resolveSyncConflict(conflict_id, resolution, resolved_data);
    res.json(result);
  } catch (error) {
    logger.error('Resolve conflict API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

/**
 * GET /api/v1/offline-sync/snapshot/:entityType
 * Get offline data snapshot
 */
router.get('/snapshot/:entityType', authMiddleware, async (req, res) => {
  try {
    const { last_sync } = req.query;
    const result = await getOfflineDataSnapshot(req.user.id, req.params.entityType, last_sync);
    res.json(result);
  } catch (error) {
    logger.error('Get offline snapshot API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get offline snapshot' });
  }
});

/**
 * PUT /api/v1/offline-sync/preferences
 * Update sync preferences
 */
router.put('/preferences', authRateLimit, authMiddleware, async (req, res) => {
  try {
    const { sync_enabled, sync_frequency, sync_on_wifi_only } = req.body;

    const query = `
      INSERT INTO user_sync_preferences (user_id, sync_enabled, sync_frequency, sync_on_wifi_only)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) 
      DO UPDATE SET sync_enabled = $2, sync_frequency = $3, sync_on_wifi_only = $4, updated_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [
      req.user.id,
      sync_enabled !== undefined ? sync_enabled : true,
      sync_frequency || 5,
      sync_on_wifi_only || false
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update sync preferences API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update sync preferences' });
  }
});

/**
 * GET /api/v1/offline-sync/preferences
 * Get sync preferences
 */
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT * FROM user_sync_preferences
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      // Return default preferences
      res.json({
        user_id: req.user.id,
        sync_enabled: true,
        sync_frequency: 5,
        sync_on_wifi_only: false
      });
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    logger.error('Get sync preferences API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get sync preferences' });
  }
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'offline-sync',
    config: OFFLINE_SYNC_CONFIG,
    features: [
      'queue_management',
      'conflict_resolution',
      'data_snapshot',
      'sync_preferences',
      'retry_mechanisms'
    ]
  });
});

module.exports = {
  router,
  addToSyncQueue,
  processSyncQueue,
  resolveSyncConflict,
  getSyncStatus,
  getOfflineDataSnapshot
};