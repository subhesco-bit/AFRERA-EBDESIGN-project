/**
 * Unified Ledger Routes with Economy Segmentation
 * 
 * API endpoints for the hybrid One Ledger + 9 Economies architecture
 */

'use strict';

const express = require('express');
const router = express.Router();
const unifiedLedgerService = require('../services/unifiedLedgerService');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const rateLimiter = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

// Apply rate limiting to all ledger routes
router.use(rateLimiter);

// Apply authentication to all routes
router.use(authMiddleware);

// DEPRECATED 2026-08-15 — see AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C.
//
// This entire router implements the literal "9 separate economic zones"
// ledger-segmentation model the build directive explicitly resolves against:
// the canonical architecture is ONE ledger (journal_entries/journal_lines),
// with any REOS "economy" represented as a cost-center/dimension tag on it,
// not a separate ledger. unifiedLedgerService.js also imports from a second,
// disconnected utils/signalBus.js instance (confirmed by a nervous-system
// audit), so nothing it emits ever reached the real reflex/decision engine
// even while this was live. No frontend caller was found for any route here.
// Deprecated in place rather than deleted — service/route code is untouched
// so this is fully reversible if something unknown depended on it.
router.use((req, res) => {
  res.status(410).json({
    success: false,
    error: 'The unified-ledger API is deprecated: it implemented a rejected "9 separate economies" ledger model. Use the canonical ledger instead.',
    canonical: '/api/v1/ledger (the canonical journal_entries/journal_lines ledger, tagged by cost center for economy-style reporting)',
    deprecatedOn: '2026-08-15',
    reference: 'AFRERA_CLAUDE_BUILD_DIRECTIVE.md, Part 3C',
  });
});

/**
 * POST /api/v1/unified-ledger/entries
 * Create a new ledger entry with economy segmentation
 */
router.post('/entries', async (req, res) => {
  try {
    const entry = await unifiedLedgerService.createLedgerEntry(req.body, {
      createdBy: req.user?.id || 'system'
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    logger.error(`Failed to create ledger entry: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/unified-ledger/cross-economy-transfer
 * Create a cross-economy transfer transaction
 */
router.post('/cross-economy-transfer', async (req, res) => {
  try {
    const transfer = await unifiedLedgerService.createCrossEconomyTransfer(req.body, {
      createdBy: req.user?.id || 'system'
    });
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    logger.error(`Failed to create cross-economy transfer: ${error.message}`);
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/unified-ledger/balance/unified
 * Get unified balance (all economies combined)
 */
router.get('/balance/unified', async (req, res) => {
  try {
    const { currency } = req.query;
    const balance = await unifiedLedgerService.getUnifiedBalance(currency);
    res.json({ success: true, data: balance });
  } catch (error) {
    logger.error(`Failed to get unified balance: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/unified-ledger/balance/economy/:economy
 * Get economy-specific balance
 */
router.get('/balance/economy/:economy', async (req, res) => {
  try {
    const { economy } = req.params;
    const { currency } = req.query;
    const balance = await unifiedLedgerService.getEconomyBalance(economy, currency);
    res.json({ success: true, data: balance });
  } catch (error) {
    logger.error(`Failed to get economy balance: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/unified-ledger/balance/all
 * Get all economy balances (9 economies + unified)
 */
router.get('/balance/all', async (req, res) => {
  try {
    const { currency } = req.query;
    const balances = await unifiedLedgerService.getAllEconomyBalances(currency);
    res.json({ success: true, data: balances });
  } catch (error) {
    logger.error(`Failed to get all economy balances: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/unified-ledger/reconcile
 * Reconcile cross-economy transactions
 * Admin only
 */
router.post('/reconcile', adminMiddleware, async (req, res) => {
  try {
    const report = await unifiedLedgerService.reconcileCrossEconomyTransactions();
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error(`Failed to reconcile cross-economy transactions: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/unified-ledger/trial-balance
 * Get unified trial balance (all economies)
 */
router.get('/trial-balance', async (req, res) => {
  try {
    const filters = {
      economy: req.query.economy,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      currency: req.query.currency
    };
    const trialBalance = await unifiedLedgerService.getUnifiedTrialBalance(filters);
    res.json({ success: true, data: trialBalance });
  } catch (error) {
    logger.error(`Failed to get trial balance: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/unified-ledger/economies
 * Get list of available economies
 */
router.get('/economies', (req, res) => {
  res.json({ 
    success: true, 
    data: {
      economies: Object.entries(unifiedLedgerService.ECONOMIES).map(([key, value]) => ({
        code: value,
        name: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')
      }))
    }
  });
});

/**
 * GET /api/v1/unified-ledger/entries
 * Get ledger entries with optional filters
 */
router.get('/entries', async (req, res) => {
  try {
    const { economy, type, category, currency, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT * FROM v_unified_ledger_enriched
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (economy) {
      query += ` AND economy = $${paramIndex}`;
      params.push(economy);
      paramIndex++;
    }

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (currency) {
      query += ` AND currency = $${paramIndex}`;
      params.push(currency);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const pool = require('../database/pool');
    const result = await pool.query(query, params);

    res.json({ 
      success: true, 
      data: {
        entries: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error(`Failed to get ledger entries: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/unified-ledger/transfers
 * Get cross-economy transfers with optional filters
 */
router.get('/transfers', async (req, res) => {
  try {
    const { fromEconomy, toEconomy, status, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        cet.*,
        de.amount as debit_amount,
        ce.amount as credit_amount,
        CASE 
          WHEN de.amount = -ce.amount THEN 'balanced'
          ELSE 'mismatch'
        END as balance_status
      FROM cross_economy_transfers cet
      LEFT JOIN unified_ledger de ON cet.debit_entry_id = de.transaction_id
      LEFT JOIN unified_ledger ce ON cet.credit_entry_id = ce.transaction_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (fromEconomy) {
      query += ` AND cet.from_economy = $${paramIndex}`;
      params.push(fromEconomy);
      paramIndex++;
    }

    if (toEconomy) {
      query += ` AND cet.to_economy = $${paramIndex}`;
      params.push(toEconomy);
      paramIndex++;
    }

    if (status) {
      query += ` AND cet.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY cet.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const pool = require('../database/pool');
    const result = await pool.query(query, params);

    res.json({ 
      success: true, 
      data: {
        transfers: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error(`Failed to get cross-economy transfers: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
