/**
 * Escrow Service
 * Manages fund holding for secure transactions between buyers and farmers
 * Holds payments in escrow until delivery confirmation
 */

const { logger } = require('../../utils/logger');
const pool = require('../../database/pool');

/**
 * Create escrow transaction
 * Holds funds from buyer until delivery is confirmed
 */
async function createEscrowTransaction(escrowData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      order_id,
      buyer_id,
      farmer_id,
      amount,
      currency = 'INR',
      payment_reference,
      release_conditions
    } = escrowData;

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid escrow amount');
    }

    // Create escrow record
    const result = await client.query(
      `INSERT INTO escrow_transactions 
       (order_id, buyer_id, farmer_id, amount, currency, payment_reference, release_conditions, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [order_id, buyer_id, farmer_id, amount, currency, payment_reference, JSON.stringify(release_conditions)]
    );

    const escrow = result.rows[0];

    logger.info(`Escrow transaction created: ${escrow.escrow_id}`, {
      order_id,
      amount,
      buyer_id,
      farmer_id
    });

    await client.query('COMMIT');
    return escrow;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error creating escrow transaction', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Release escrow funds to farmer
 * Called when delivery is confirmed and conditions are met
 */
async function releaseEscrowFunds(escrowId, releaseData) {
  let client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get escrow transaction
    const escrowResult = await client.query(
      'SELECT * FROM escrow_transactions WHERE escrow_id = $1 FOR UPDATE',
      [escrowId]
    );

    if (escrowResult.rows.length === 0) {
      throw new Error('Escrow transaction not found');
    }

    let escrow = escrowResult.rows[0];

    // Validate status
    if (escrow.status !== 'pending') {
      throw new Error(`Cannot release escrow in status: ${escrow.status}`);
    }

    // Verify release conditions
    if (escrow.release_conditions) {
      const conditions = JSON.parse(escrow.release_conditions);
      for (const condition of conditions) {
        if (!verifyCondition(condition, releaseData)) {
          throw new Error(`Release condition not met: ${condition.type}`);
        }
      }
    }

    // Update escrow status
    await client.query(
      `UPDATE escrow_transactions 
       SET status = 'released', 
           released_at = CURRENT_TIMESTAMP,
           release_data = $1
       WHERE escrow_id = $2`,
      [JSON.stringify(releaseData), escrowId]
    );

    logger.info(`Escrow funds released: ${escrowId}`, {
      order_id: escrow.order_id,
      amount: escrow.amount,
      farmer_id: escrow.farmer_id
    });

    await client.query('COMMIT');
    return { success: true, escrow_id: escrowId };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error releasing escrow funds', { error: error.message, escrowId });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Refund escrow funds to buyer
 * Called when delivery fails or conditions are not met
 */
async function refundEscrowFunds(escrowId, refundReason) {
  let client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get escrow transaction
    let escrowResult = await client.query(
      'SELECT * FROM escrow_transactions WHERE escrow_id = $1 FOR UPDATE',
      [escrowId]
    );

    if (escrowResult.rows.length === 0) {
      throw new Error('Escrow transaction not found');
    }

    let escrow = escrowResult.rows[0];

    // Validate status
    if (escrow.status !== 'pending') {
      throw new Error(`Cannot refund escrow in status: ${escrow.status}`);
    }

    // Update escrow status
    await client.query(
      `UPDATE escrow_transactions 
       SET status = 'refunded', 
           refunded_at = CURRENT_TIMESTAMP,
           refund_reason = $1
       WHERE escrow_id = $2`,
      [refundReason, escrowId]
    );

    logger.info(`Escrow funds refunded: ${escrowId}`, {
      order_id: escrow.order_id,
      amount: escrow.amount,
      buyer_id: escrow.buyer_id,
      reason: refundReason
    });

    await client.query('COMMIT');
    return { success: true, escrow_id: escrowId };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error refunding escrow funds', { error: error.message, escrowId });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get escrow transaction details
 */
async function getEscrowTransaction(escrowId) {
  try {
    let result = await pool.query(
      'SELECT * FROM escrow_transactions WHERE escrow_id = $1',
      [escrowId]
    );

    if (result.rows.length === 0) {
      throw new Error('Escrow transaction not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Error getting escrow transaction', { error: error.message, escrowId });
    throw error;
  }
}

/**
 * Get escrow transactions by order
 */
async function getEscrowByOrder(orderId) {
  try {
    let result = await pool.query(
      'SELECT * FROM escrow_transactions WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Error getting escrow by order', { error: error.message, orderId });
    throw error;
  }
}

/**
 * Get user's escrow transactions
 */
async function getUserEscrowTransactions(userId, role = 'all') {
  try {
    let query = 'SELECT * FROM escrow_transactions WHERE ';
    const params = [];

    if (role === 'buyer') {
      query += 'buyer_id = $1';
      params.push(userId);
    } else if (role === 'farmer') {
      query += 'farmer_id = $1';
      params.push(userId);
    } else {
      query += '(buyer_id = $1 OR farmer_id = $1)';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting user escrow transactions', { error: error.message, userId });
    throw error;
  }
}

/**
 * Verify release condition
 */
function verifyCondition(condition, data) {
  switch (condition.type) {
    case 'delivery_confirmed':
      return data.delivery_confirmed === true;
    case 'quality_verified':
      return data.quality_passed === true;
    case 'deadline_passed':
      return new Date() > new Date(condition.deadline);
    default:
      logger.warn(`Unknown escrow condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Setup Express routes
 */
function setupRoutes(app) {
  // Create escrow transaction
  app.post('/api/v1/escrow', async (req, res) => {
    try {
      let escrow = await createEscrowTransaction(req.body);
      res.json({ success: true, data: escrow });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Release escrow funds
  app.post('/api/v1/escrow/:escrowId/release', async (req, res) => {
    try {
      let result = await releaseEscrowFunds(req.params.escrowId, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Refund escrow funds
  app.post('/api/v1/escrow/:escrowId/refund', async (req, res) => {
    try {
      let result = await refundEscrowFunds(req.params.escrowId, req.body.reason);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get escrow transaction
  app.get('/api/v1/escrow/:escrowId', async (req, res) => {
    try {
      let escrow = await getEscrowTransaction(req.params.escrowId);
      res.json({ success: true, data: escrow });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get escrow by order
  app.get('/api/v1/escrow/order/:orderId', async (req, res) => {
    try {
      const escrows = await getEscrowByOrder(req.params.orderId);
      res.json({ success: true, data: escrows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get user escrow transactions
  app.get('/api/v1/escrow/user/:userId', async (req, res) => {
    try {
      const role = req.query.role || 'all';
      let escrows = await getUserEscrowTransactions(req.params.userId, role);
      res.json({ success: true, data: escrows });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = {
  createEscrowTransaction,
  releaseEscrowFunds,
  refundEscrowFunds,
  getEscrowTransaction,
  getEscrowByOrder,
  getUserEscrowTransactions,
  setupRoutes
};
