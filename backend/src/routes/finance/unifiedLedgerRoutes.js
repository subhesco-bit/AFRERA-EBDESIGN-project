'use strict';

/**
 * Unified ledger HTTP API.
 *
 * This file previously held a generic in-memory CRUD scaffold: five handlers
 * over `let _items = []`, accepting `...req.body` with no schema. It answered
 * 200 with `{ success: true, data: [] }`, so a caller could not distinguish an
 * empty ledger from a ledger that had never been written, and every posted
 * entry was lost on process restart (verified 2026-09-21: POST an entry, GET
 * it back, restart, GET returns []).
 *
 * The real implementation already existed and was never imported:
 * services/unifiedLedgerService.js, which writes double-entry rows to
 * unified_ledger and rolls them up into economy_balances and
 * unified_balances inside one transaction.
 *
 * Every route below calls that service. Request validation is derived from the
 * service's own declared contract, not invented here — see the field lists,
 * which mirror the destructuring in createLedgerEntry and
 * createCrossEconomyTransfer, and ECONOMIES, which the service exports.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../../middleware/auth');
const { ValidationError } = require('../../utils/errors');
const ledger = require('../../services/unifiedLedgerService');

const ECONOMY_VALUES = Object.values(ledger.ECONOMIES);
const ENTRY_TYPES = ['credit', 'debit'];

/** Currency codes are stored in VARCHAR(3); reject anything that cannot fit. */
function readCurrency(raw, fallback = 'INR') {
  if (raw === undefined || raw === null || raw === '') return fallback;
  const c = String(raw).toUpperCase();
  if (!/^[A-Z]{3}$/.test(c)) {
    throw new ValidationError('currency must be a 3-letter code', { currency: raw });
  }
  return c;
}

function readEconomy(raw, field = 'economy') {
  const e = String(raw ?? '').toLowerCase();
  if (!ECONOMY_VALUES.includes(e)) {
    throw new ValidationError(`${field} must be one of: ${ECONOMY_VALUES.join(', ')}`, {
      [field]: raw,
      allowed: ECONOMY_VALUES,
    });
  }
  return e;
}

/**
 * Amounts land in NUMERIC(15,2). Reject non-finite and negative values here so
 * the ledger never has to interpret them; direction is carried by `type`.
 */
function readAmount(raw) {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    throw new ValidationError('amount must be a finite number', { amount: raw });
  }
  if (n <= 0) {
    throw new ValidationError('amount must be greater than zero; use type to set direction', {
      amount: raw,
    });
  }
  if (n > 9_999_999_999_999) {
    throw new ValidationError('amount exceeds the ledger column precision NUMERIC(15,2)', {
      amount: raw,
    });
  }
  return Math.round(n * 100) / 100;
}

function readText(raw, field, { required = false, max = 500 } = {}) {
  if (raw === undefined || raw === null || raw === '') {
    if (required) throw new ValidationError(`${field} is required`, { [field]: raw });
    return null;
  }
  const s = String(raw).trim();
  if (!s && required) throw new ValidationError(`${field} is required`, { [field]: raw });
  if (s.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`, {
      [field]: s.length,
    });
  }
  return s || null;
}

/**
 * POST /entries — single ledger entry.
 *
 * Field list mirrors createLedgerEntry(transaction, metadata)'s destructuring:
 * economy, type, amount, currency, description, reference, accountId,
 * counterpartyId, category.
 */
router.post('/entries', authMiddleware, async (req, res, next) => {
  try {
    const b = req.body || {};
    const type = String(b.type ?? '').toLowerCase();
    if (!ENTRY_TYPES.includes(type)) {
      throw new ValidationError(`type must be one of: ${ENTRY_TYPES.join(', ')}`, { type: b.type });
    }

    const entry = await ledger.createLedgerEntry(
      {
        economy: readEconomy(b.economy),
        type,
        amount: readAmount(b.amount),
        currency: readCurrency(b.currency),
        description: readText(b.description, 'description', { required: true }),
        reference: readText(b.reference, 'reference'),
        accountId: readText(b.accountId, 'accountId', { required: true, max: 100 }),
        counterpartyId: readText(b.counterpartyId, 'counterpartyId', { max: 100 }),
        category: readText(b.category, 'category', { max: 100 }),
      },
      { createdBy: req.user.id }
    );

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /transfers — cross-economy transfer.
 *
 * Mirrors createCrossEconomyTransfer(transfer, metadata): fromEconomy,
 * toEconomy, amount, currency, description, reference, accountId. The service
 * writes the paired debit and credit itself; it rejects equal economies.
 */
router.post('/transfers', authMiddleware, async (req, res, next) => {
  try {
    const b = req.body || {};
    const fromEconomy = readEconomy(b.fromEconomy, 'fromEconomy');
    const toEconomy = readEconomy(b.toEconomy, 'toEconomy');
    if (fromEconomy === toEconomy) {
      throw new ValidationError('fromEconomy and toEconomy must differ', {
        fromEconomy,
        toEconomy,
      });
    }

    const transfer = await ledger.createCrossEconomyTransfer(
      {
        fromEconomy,
        toEconomy,
        amount: readAmount(b.amount),
        currency: readCurrency(b.currency),
        description: readText(b.description, 'description', { required: true }),
        reference: readText(b.reference, 'reference'),
        accountId: readText(b.accountId, 'accountId', { required: true, max: 100 }),
      },
      { createdBy: req.user.id }
    );

    res.status(201).json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
});

/** GET /balance — platform-wide balance for one currency. */
router.get('/balance', authMiddleware, async (req, res, next) => {
  try {
    const currency = readCurrency(req.query.currency);
    res.json({ success: true, data: await ledger.getUnifiedBalance(currency) });
  } catch (err) {
    next(err);
  }
});

/** GET /balances — per-economy balances for one currency. */
router.get('/balances', authMiddleware, async (req, res, next) => {
  try {
    const currency = readCurrency(req.query.currency);
    res.json({ success: true, data: await ledger.getAllEconomyBalances(currency) });
  } catch (err) {
    next(err);
  }
});

/** GET /balances/:economy — one economy's balance for one currency. */
router.get('/balances/:economy', authMiddleware, async (req, res, next) => {
  try {
    const economy = readEconomy(req.params.economy);
    const currency = readCurrency(req.query.currency);
    res.json({ success: true, data: await ledger.getEconomyBalance(economy, currency) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /trial-balance — category/economy rollup.
 *
 * Filter names mirror getUnifiedTrialBalance(filters)'s destructuring:
 * economy, startDate, endDate, currency.
 */
router.get('/trial-balance', authMiddleware, async (req, res, next) => {
  try {
    const filters = { currency: readCurrency(req.query.currency) };
    if (req.query.economy) filters.economy = readEconomy(req.query.economy);
    for (const f of ['startDate', 'endDate']) {
      if (!req.query[f]) continue;
      const d = new Date(req.query[f]);
      if (Number.isNaN(d.getTime())) {
        throw new ValidationError(`${f} must be a valid date`, { [f]: req.query[f] });
      }
      filters[f] = req.query[f];
    }
    res.json({ success: true, data: await ledger.getUnifiedTrialBalance(filters) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /reconcile — cross-economy reconciliation sweep.
 *
 * Restricted: it reads and settles transfer state across every economy, which
 * is a finance-operations action rather than a tenant-scoped one. 'admin' is
 * the only role used here because it is the only administrative label in the
 * live user_role enum (admin, farmer, fpo, corporate, consumer, logistics,
 * horeca, processor, retailer, research) — a finance-specific role would have
 * to be added to that enum first.
 */
router.post(
  '/reconcile',
  authMiddleware,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      res.json({ success: true, data: await ledger.reconcileCrossEconomyTransactions() });
    } catch (err) {
      next(err);
    }
  }
);

/** GET /economies — the economy codes the ledger accepts. */
router.get('/economies', authMiddleware, (req, res) => {
  res.json({ success: true, data: ECONOMY_VALUES });
});

module.exports = router;
