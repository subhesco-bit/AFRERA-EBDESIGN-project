'use strict';
/** Faithful port of pine-shadow's src/lib/modules/companion.server.ts —
 * named companionServer.js (not companion.server.js) to avoid this
 * project's build tooling treating ".server.js" as a special suffix,
 * which pine-shadow's TanStack Start convention relies on but this
 * project's Express/Vite stack does not use. */

const { ensureBooks } = require('../erp/boot.server');
const { exceptions } = require('../erp/platform');
const { proposeCompanion } = require('./companion');

async function readCompanion() {
  const books = await ensureBooks();
  const gates = exceptions({ journalBalanced: books.kpis.journalBalanced, lots: books.lots, receipts: books.receipts, orders: books.orders, payouts: books.payouts });
  return proposeCompanion(books, gates);
}

module.exports = { readCompanion };
