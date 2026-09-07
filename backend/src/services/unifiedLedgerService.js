/**
 * Unified Ledger Service with Economy Segmentation
 * 
 * This service implements a hybrid architecture where:
 * - "One Ledger": Single source of truth for all financial transactions
 * - "9 Economies": Segmented economic zones with independent operation
 * 
 * Key Features:
 * - Economy-aware transaction routing
 * - Cross-economy transaction reconciliation
 * - Unified financial reporting across all economies
 * - Economy-specific rules and policies
 * - Real-time cross-economy settlement
 */

'use strict';

const crypto = require('crypto');
const pool = require('../database/pool');
const { logger } = require('../utils/logger');
const { signalBus } = require('../utils/signalBus');

const r2 = (n) => Math.round(n * 100) / 100;

// Economy definitions - 9 distinct economic zones
const ECONOMIES = {
  NORTH: 'north',
  SOUTH: 'south', 
  EAST: 'east',
  WEST: 'west',
  CENTRAL: 'central',
  NORTHEAST: 'northeast',
  NORTHWEST: 'northwest',
  SOUTHEAST: 'southeast',
  SOUTHWEST: 'southwest'
};

/**
 * Create a unified ledger entry with economy segmentation
 * @param {Object} transaction - Transaction details
 * @param {string} transaction.economy - Target economy code
 * @param {string} transaction.type - Transaction type (credit/debit/transfer)
 * @param {number} transaction.amount - Transaction amount
 * @param {string} transaction.currency - Currency code
 * @param {string} transaction.description - Transaction description
 * @param {string} transaction.reference - External reference ID
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created ledger entry
 */
async function createLedgerEntry(transaction, metadata = {}) {
  const {
    economy,
    type,
    amount,
    currency = 'INR',
    description,
    reference,
    accountId,
    counterpartyId,
    category
  } = transaction;

  if (!economy || !Object.values(ECONOMIES).includes(economy)) {
    throw new Error(`Invalid economy: ${economy}. Must be one of: ${Object.values(ECONOMIES).join(', ')}`);
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Generate unified transaction ID (cross-economy unique)
    const transactionId = crypto.randomUUID();
    const entryHash = generateEntryHash(transaction);

    // Insert into unified ledger
    const ledgerResult = await client.query(
      `INSERT INTO unified_ledger 
        (transaction_id, economy, type, amount, currency, description, 
         reference, account_id, counterparty_id, category, entry_hash, 
         created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
       RETURNING *`,
      [transactionId, economy, type, amount, currency, description, 
       reference, accountId, counterpartyId, category, entryHash, 
       metadata.createdBy || 'system']
    );

    // Update economy-specific balance
    await updateEconomyBalance(client, economy, type, amount, currency);

    // Update unified balance (all economies combined)
    await updateUnifiedBalance(client, type, amount, currency);

    await client.query('COMMIT');

    const entry = ledgerResult.rows[0];
    
    // Emit signal for real-time updates
    signalBus.emit('ledger:entry:created', {
      transactionId: entry.transaction_id,
      economy: entry.economy,
      type: entry.type,
      amount: entry.amount
    });

    logger.info(`Unified ledger entry created: ${transactionId} in economy ${economy}`);
    return entry;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Failed to create ledger entry: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create cross-economy transfer transaction
 * @param {Object} transfer - Transfer details
 * @param {string} transfer.fromEconomy - Source economy
 * @param {string} transfer.toEconomy - Destination economy
 * @param {number} transfer.amount - Transfer amount
 * @param {string} transfer.currency - Currency code
 * @param {string} transfer.description - Transfer description
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Transfer result with both ledger entries
 */
async function createCrossEconomyTransfer(transfer, metadata = {}) {
  const {
    fromEconomy,
    toEconomy,
    amount,
    currency = 'INR',
    description,
    reference,
    accountId
  } = transfer;

  if (fromEconomy === toEconomy) {
    throw new Error('Source and destination economies must be different for cross-economy transfers');
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const transferId = crypto.randomUUID();

    // Create debit entry in source economy
    const debitEntry = await createLedgerEntryInternal(
      client,
      {
        economy: fromEconomy,
        type: 'debit',
        amount: -Math.abs(amount),
        currency,
        description: `${description} (Transfer to ${toEconomy})`,
        reference: `${reference}_debit`,
        accountId,
        category: 'cross_economy_transfer'
      },
      { ...metadata, transferId }
    );

    // Create credit entry in destination economy
    const creditEntry = await createLedgerEntryInternal(
      client,
      {
        economy: toEconomy,
        type: 'credit',
        amount: Math.abs(amount),
        currency,
        description: `${description} (Transfer from ${fromEconomy})`,
        reference: `${reference}_credit`,
        accountId,
        category: 'cross_economy_transfer'
      },
      { ...metadata, transferId }
    );

    // Record cross-economy transfer linkage
    await client.query(
      `INSERT INTO cross_economy_transfers 
        (transfer_id, from_economy, to_economy, amount, currency, 
         debit_entry_id, credit_entry_id, reference, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [transferId, fromEconomy, toEconomy, amount, currency,
       debitEntry.transaction_id, creditEntry.transaction_id, reference]
    );

    await client.query('COMMIT');

    signalBus.emit('ledger:cross_economy:transfer', {
      transferId,
      fromEconomy,
      toEconomy,
      amount,
      currency
    });

    logger.info(`Cross-economy transfer created: ${transferId} from ${fromEconomy} to ${toEconomy}`);
    
    return {
      transferId,
      fromEconomy,
      toEconomy,
      amount,
      currency,
      debitEntry,
      creditEntry,
      status: 'completed'
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Failed to create cross-economy transfer: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get unified ledger balance (all economies combined)
 * @param {string} currency - Currency code
 * @returns {Promise<Object>} Unified balance
 */
async function getUnifiedBalance(currency = 'INR') {
  const result = await pool.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
       COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
       COALESCE(SUM(amount), 0) as net_balance,
       COUNT(*) as total_transactions
     FROM unified_ledger
     WHERE currency = $1`,
    [currency]
  );

  return {
    currency,
    totalCredits: r2(result.rows[0].total_credits),
    totalDebits: r2(result.rows[0].total_debits),
    netBalance: r2(result.rows[0].net_balance),
    totalTransactions: parseInt(result.rows[0].total_transactions)
  };
}

/**
 * Get economy-specific balance
 * @param {string} economy - Economy code
 * @param {string} currency - Currency code
 * @returns {Promise<Object>} Economy balance
 */
async function getEconomyBalance(economy, currency = 'INR') {
  const result = await pool.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
       COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
       COALESCE(SUM(amount), 0) as net_balance,
       COUNT(*) as total_transactions
     FROM unified_ledger
     WHERE economy = $1 AND currency = $2`,
    [economy, currency]
  );

  return {
    economy,
    currency,
    totalCredits: r2(result.rows[0].total_credits),
    totalDebits: r2(result.rows[0].total_debits),
    netBalance: r2(result.rows[0].net_balance),
    totalTransactions: parseInt(result.rows[0].total_transactions)
  };
}

/**
 * Get all economy balances (9 economies + unified)
 * @param {string} currency - Currency code
 * @returns {Promise<Object>} All balances
 */
async function getAllEconomyBalances(currency = 'INR') {
  const unifiedBalance = await getUnifiedBalance(currency);
  
  const economyBalances = {};
  for (const economy of Object.values(ECONOMIES)) {
    economyBalances[economy] = await getEconomyBalance(economy, currency);
  }

  return {
    unified: unifiedBalance,
    economies: economyBalances,
    timestamp: new Date().toISOString()
  };
}

/**
 * Reconcile cross-economy transactions
 * Ensures all cross-economy transfers are properly balanced
 * @returns {Promise<Object>} Reconciliation report
 */
async function reconcileCrossEconomyTransactions() {
  const result = await pool.query(
    `SELECT 
       cet.transfer_id,
       cet.from_economy,
       cet.to_economy,
       cet.amount,
       cet.currency,
       cet.debit_entry_id,
       cet.credit_entry_id,
       de.amount as debit_amount,
       ce.amount as credit_amount,
       CASE 
         WHEN de.amount = -ce.amount THEN 'balanced'
         ELSE 'mismatch'
       END as status
     FROM cross_economy_transfers cet
     LEFT JOIN unified_ledger de ON cet.debit_entry_id = de.transaction_id
     LEFT JOIN unified_ledger ce ON cet.credit_entry_id = ce.transaction_id
     WHERE cet.reconciled_at IS NULL`
  );

  const transfers = result.rows;
  const report = {
    total: transfers.length,
    balanced: 0,
    mismatched: 0,
    details: []
  };

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    for (const transfer of transfers) {
      const detail = {
        transferId: transfer.transfer_id,
        fromEconomy: transfer.from_economy,
        toEconomy: transfer.to_economy,
        amount: transfer.amount,
        status: transfer.status
      };

      if (transfer.status === 'balanced') {
        report.balanced++;
        // Mark as reconciled
        await client.query(
          `UPDATE cross_economy_transfers 
           SET reconciled_at = NOW(), reconciliation_status = 'balanced'
           WHERE transfer_id = $1`,
          [transfer.transfer_id]
        );
      } else {
        report.mismatched++;
        detail.debitAmount = transfer.debit_amount;
        detail.creditAmount = transfer.credit_amount;
        detail.discrepancy = transfer.debit_amount + transfer.credit_amount;
      }

      report.details.push(detail);
    }

    await client.query('COMMIT');
    
    logger.info(`Cross-economy reconciliation: ${report.balanced} balanced, ${report.mismatched} mismatched`);
    return report;

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Cross-economy reconciliation failed: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get unified trial balance (all economies)
 * @param {Object} filters - Optional filters (date range, economy, etc.)
 * @returns {Promise<Object>} Trial balance
 */
async function getUnifiedTrialBalance(filters = {}) {
  const { economy, startDate, endDate, currency = 'INR' } = filters;

  let query = `
    SELECT 
      category,
      economy,
      COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
      COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
      COALESCE(SUM(amount), 0) as net_balance,
      COUNT(*) as transaction_count
    FROM unified_ledger
    WHERE currency = $1
  `;
  
  const params = [currency];
  let paramIndex = 2;

  if (economy) {
    query += ` AND economy = $${paramIndex}`;
    params.push(economy);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  query += ` GROUP BY category, economy ORDER BY economy, category`;

  const result = await pool.query(query, params);

  return {
    currency,
    filters,
    lineItems: result.rows.map(row => ({
      category: row.category,
      economy: row.economy,
      totalCredits: r2(row.total_credits),
      totalDebits: r2(row.total_debits),
      netBalance: r2(row.net_balance),
      transactionCount: parseInt(row.transaction_count)
    })),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate hash for ledger entry integrity
 * @param {Object} transaction - Transaction data
 * @returns {string} Hash string
 */
function generateEntryHash(transaction) {
  const hashData = {
    economy: transaction.economy,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    timestamp: new Date().toISOString()
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex');
}

/**
 * Update economy-specific balance
 * @param {Object} client - Database client
 * @param {string} economy - Economy code
 * @param {string} type - Transaction type
 * @param {number} amount - Amount
 * @param {string} currency - Currency code
 */
async function updateEconomyBalance(client, economy, type, amount, currency) {
  await client.query(
    `INSERT INTO economy_balances (economy, currency, last_updated)
     VALUES ($1, $2, NOW())
     ON CONFLICT (economy, currency) 
     DO UPDATE SET last_updated = NOW()`,
    [economy, currency]
  );
}

/**
 * Update unified balance (all economies)
 * @param {Object} client - Database client
 * @param {string} type - Transaction type
 * @param {number} amount - Amount
 * @param {string} currency - Currency code
 */
async function updateUnifiedBalance(client, type, amount, currency) {
  await client.query(
    `INSERT INTO unified_balances (currency, last_updated)
     VALUES ($1, NOW())
     ON CONFLICT (currency) 
     DO UPDATE SET last_updated = NOW()`,
    [currency]
  );
}

/**
 * Internal ledger entry creation (within transaction)
 * @param {Object} client - Database client
 * @param {Object} transaction - Transaction details
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Created ledger entry
 */
async function createLedgerEntryInternal(client, transaction, metadata = {}) {
  const {
    economy,
    type,
    amount,
    currency,
    description,
    reference,
    accountId,
    counterpartyId,
    category
  } = transaction;

  const transactionId = crypto.randomUUID();
  const entryHash = generateEntryHash(transaction);

  const result = await client.query(
    `INSERT INTO unified_ledger 
      (transaction_id, economy, type, amount, currency, description, 
       reference, account_id, counterparty_id, category, entry_hash, 
       created_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
     RETURNING *`,
    [transactionId, economy, type, amount, currency, description, 
     reference, accountId, counterpartyId, category, entryHash, 
     metadata.createdBy || 'system']
  );

  await updateEconomyBalance(client, economy, type, amount, currency);
  await updateUnifiedBalance(client, type, amount, currency);

  return result.rows[0];
}

module.exports = {
  ECONOMIES,
  createLedgerEntry,
  createCrossEconomyTransfer,
  getUnifiedBalance,
  getEconomyBalance,
  getAllEconomyBalances,
  reconcileCrossEconomyTransactions,
  getUnifiedTrialBalance
};
