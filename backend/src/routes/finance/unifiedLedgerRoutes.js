'use strict';

/**
 * DEPRECATED — this route surface implements a rejected architecture.
 *
 * WHY THIS IS A 410 AND NOT AN IMPLEMENTATION
 *
 * AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C records an explicit, authorized
 * decision dated 2026-08-15: unifiedLedgerService's entire route surface is
 * deprecated in place (HTTP 410 with a canonical pointer), never deleted. The
 * service implements "9 distinct economic zones" with cross-economy
 * reconciliation — the literal reading of REOS that the directive rejects. The
 * canonical architecture is ONE hash-chained double-entry ledger
 * (journal_entries / journal_lines), with a REOS "economy" represented as a
 * cost-center or dimension tag on it, never as a separate ledger, journal or
 * chart of accounts. The service also imports a second, disconnected
 * utils/signalBus.js, so nothing it emits reaches the real reflex/decision
 * engine.
 *
 * routes/unifiedLedgerRoutes.js (the root-level twin of this file) carries
 * that 410. This file is the copy under routes/finance/, which the dynamic
 * route loader mounts at /api/v1/finance/unified-ledger. It previously held a
 * generic in-memory CRUD scaffold answering 200 `{success:true,data:[]}`, so
 * the platform served a fake version of a rejected ledger model on a path
 * nothing had deprecated, while the real file's 410 never took effect at all
 * because that file threw on load (`router.use(rateLimiter)` against a module
 * that exports an object). Both halves of that are now fixed: the root file
 * loads, and this path returns the same 410 rather than fabricated success.
 *
 * KNOWN GAP, NOT FIXED HERE
 *
 * The canonical pointer below names /api/v1/ledger because the directive does.
 * Verified 2026-09-21: no route is mounted there — GET /api/v1/ledger answers
 * 404, while frontend LedgerPage.jsx calls '/ledger' and UnifiedLedgerPage.jsx
 * still calls '/unified-ledger'. The directive's note that "no frontend caller
 * was found for any route here" no longer holds. Building the canonical ledger
 * API, and migrating UnifiedLedgerPage.jsx onto it, is separate work that
 * needs its own decision — it is recorded rather than done silently here.
 */

const express = require('express');
const router = express.Router();

const DEPRECATION = {
  success: false,
  error:
    'The unified-ledger API is deprecated: it implemented a rejected "9 separate economies" ledger model.',
  code: 'UNIFIED_LEDGER_DEPRECATED',
  canonical:
    '/api/v1/ledger (the canonical journal_entries/journal_lines ledger, tagged by cost center for economy-style reporting)',
  canonicalStatus:
    'not yet mounted as of 2026-09-21 — GET /api/v1/ledger returns 404; see AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C',
  deprecatedOn: '2026-08-15',
  reference: 'AFRERA_CLAUDE_BUILD_DIRECTIVE.md, Part 3C',
};

router.use((req, res) => {
  res.status(410).json(DEPRECATION);
});

module.exports = router;
