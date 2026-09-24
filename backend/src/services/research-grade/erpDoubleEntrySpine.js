/**
 * ERP accounting spine — chart of accounts + double-entry journal
 * Research-grade minimal spine before more ERP surface (per baseline TODO item 7).
 */

'use strict';

const { randomUUID } = require('crypto');

const COA = [
  { code: '1000', name: 'Cash', type: 'asset' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset' },
  { code: '1200', name: 'Inventory', type: 'asset' },
  { code: '2000', name: 'Accounts Payable', type: 'liability' },
  { code: '2100', name: 'GST Payable', type: 'liability' },
  { code: '3000', name: 'Equity', type: 'equity' },
  { code: '4000', name: 'Sales Revenue', type: 'income' },
  { code: '5000', name: 'COGS', type: 'expense' },
  { code: '5100', name: 'Freight Expense', type: 'expense' },
];

const journals = []; // process-local; production → PostgreSQL

function postJournal({ memo, lines, actor = 'system' }) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw Object.assign(new Error('Journal requires ≥2 lines'), { code: 'JE_LINES' });
  }
  let debit = 0;
  let credit = 0;
  for (const l of lines) {
    if (!COA.find((c) => c.code === l.account)) {
      throw Object.assign(new Error(`Unknown account ${l.account}`), { code: 'JE_ACCOUNT' });
    }
    debit += Number(l.debit) || 0;
    credit += Number(l.credit) || 0;
  }
  if (Math.round(debit * 100) !== Math.round(credit * 100)) {
    throw Object.assign(new Error(`Unbalanced JE debit=${debit} credit=${credit}`), {
      code: 'JE_UNBALANCED',
    });
  }
  const je = {
    id: `JE-${randomUUID().slice(0, 8)}`,
    memo: memo || '',
    lines,
    actor,
    posted_at: new Date().toISOString(),
    debit_total: debit,
    credit_total: credit,
  };
  journals.push(je);
  return { success: true, journal: je, confidence: 1, advisory: false };
}

/** Post a simple sale: DR AR, CR Sales, CR GST; DR COGS, CR Inventory */
function postSale({ amount = 1000, gst = 50, cogs = 600, actor }) {
  const ar = postJournal({
    memo: 'Sale invoice',
    actor,
    lines: [
      { account: '1100', debit: amount + gst, credit: 0 },
      { account: '4000', debit: 0, credit: amount },
      { account: '2100', debit: 0, credit: gst },
    ],
  });
  const cogsJe = postJournal({
    memo: 'COGS',
    actor,
    lines: [
      { account: '5000', debit: cogs, credit: 0 },
      { account: '1200', debit: 0, credit: cogs },
    ],
  });
  return { sale: ar, cogs: cogsJe };
}

function trialBalance() {
  const bal = {};
  for (const a of COA) bal[a.code] = { name: a.name, type: a.type, debit: 0, credit: 0 };
  for (const je of journals) {
    for (const l of je.lines) {
      bal[l.account].debit += Number(l.debit) || 0;
      bal[l.account].credit += Number(l.credit) || 0;
    }
  }
  return {
    accounts: Object.entries(bal).map(([code, v]) => ({
      code,
      ...v,
      net: v.debit - v.credit,
    })),
    journal_count: journals.length,
    confidence: 1,
  };
}

module.exports = {
  COA,
  postJournal,
  postSale,
  trialBalance,
  _journals: journals,
};
