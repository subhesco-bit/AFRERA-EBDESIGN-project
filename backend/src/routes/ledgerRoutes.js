/**
 * The canonical ledger API — /api/v1/ledger.
 *
 * WHY THIS EXISTS
 *
 * Two deprecated ledgers already point here. `unifiedLedgerRoutes` returns 410
 * with `canonical: '/api/v1/ledger (the canonical journal_entries/journal_lines
 * ledger...)'`, and `recoveredFinanceRoutes`' `/ledger/*` does the same. Until
 * now that endpoint did not exist, so every caller redirected off a deprecated
 * ledger landed on a 404 — a deprecation notice pointing at nothing.
 *
 *   GET /entries                       list journal entries
 *   GET /entries/:id                   one entry with its lines
 *   GET /trial-balance                 per-account totals, measured balance
 *   GET /accounts                      chart of accounts
 *   GET /accounts/:code/ledger         one account's movements, running balance
 *   GET /integrity                     unbalanced / empty / orphan findings
 *
 * READ ONLY, on purpose. Posting belongs to the services that own the business
 * event — gstService for tax, costControlService for cost allocation,
 * assetAccountingService for depreciation, the fulfillment saga for order
 * revenue — each inside its own transaction alongside the rows the entry
 * describes. A generic "post anything" endpoint would let a caller write a
 * journal entry with no business event behind it, which is how a ledger stops
 * being evidence of anything.
 */

'use strict';

const express = require('express');

const router = express.Router();

const { authMiddleware, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const ledgerService = require('../services/finance/ledgerService');
const { logger } = require('../utils/logger');

router.use(authMiddleware);
router.use(apiLimiter);

// The general ledger is not open to every authenticated caller: it exposes the
// company's full financial position, including every counterparty and amount.
router.use(requireRole('admin', 'finance', 'accountant', 'auditor'));

function handle(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req);
      return res.json({ success: true, data });
    } catch (error) {
      if (error instanceof ledgerService.LedgerError) {
        return res.status(error.status).json({
          success: false,
          error: error.message,
          code: error.status === 404 ? 'NOT_FOUND' : 'INVALID_INPUT',
        });
      }
      logger.error('Ledger query failed', { error: error.message, stack: error.stack });
      return res.status(500).json({ success: false, error: 'Ledger query failed', code: 'LEDGER_ERROR' });
    }
  };
}

router.get('/entries', handle((req) => ledgerService.listEntries(req.query)));

router.get('/entries/:id', handle((req) => ledgerService.getEntry(req.params.id)));

router.get('/trial-balance', handle((req) => ledgerService.trialBalance(req.query)));

router.get('/accounts', handle((req) => ledgerService.listAccounts(req.query)));

router.get('/accounts/:code/ledger', handle((req) => ledgerService.accountLedger({
  ...req.query,
  accountCode: req.params.code,
})));

router.get('/integrity', handle((req) => ledgerService.integrityCheck(req.query)));

// Self-description, so a caller arriving from a 410 can discover the shape of
// what replaced it without reading the source.
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      ledger: 'canonical',
      tables: ['journal_entries', 'journal_lines', 'chart_of_accounts'],
      authority: 'AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C — one hash-chained double-entry ledger',
      readOnly: true,
      readOnlyReason:
        'Posting belongs to the service that owns the business event, inside the same '
        + 'transaction as the rows the entry describes. A generic post endpoint would allow '
        + 'a journal entry with no business event behind it.',
      posters: [
        'gstService.postGSTInvoiceToLedger (tax)',
        'costControlService (cost allocation)',
        'assetAccountingService (depreciation)',
        'services/fulfillment/fulfillmentEngine (order revenue)',
      ],
      endpoints: [
        { method: 'GET', path: '/api/v1/ledger/entries', query: 'companyId (required), from, to, journalType, referenceType, referenceId, status, limit, offset' },
        { method: 'GET', path: '/api/v1/ledger/entries/:id' },
        { method: 'GET', path: '/api/v1/ledger/trial-balance', query: 'companyId (required), from, to' },
        { method: 'GET', path: '/api/v1/ledger/accounts', query: 'companyId (required), postableOnly, accountType' },
        { method: 'GET', path: '/api/v1/ledger/accounts/:code/ledger', query: 'companyId (required), from, to, limit' },
        { method: 'GET', path: '/api/v1/ledger/integrity', query: 'companyId (required)' },
      ],
      deprecatedPredecessors: [
        { path: '/api/v1/unified-ledger', status: 410, reason: 'implemented the rejected "9 separate economies" model' },
        { path: '/api/v1/finance/ledger', status: 410, reason: 'second hash-chained ledger (gl_ledger_chain), blind to canonical postings' },
      ],
    },
  });
});

module.exports = router;
