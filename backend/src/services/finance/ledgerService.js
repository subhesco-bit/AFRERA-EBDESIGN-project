/**
 * The canonical ledger — read side.
 *
 * WHY THIS EXISTS
 *
 * AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C names `journal_entries` /
 * `journal_lines` as the one real ledger, and deprecated two rivals to HTTP 410
 * on 2026-08-15: `unifiedLedgerService`'s whole route surface, and
 * `recoveredFinanceService`'s `/ledger/*`. Both 410 bodies tell the caller to
 * "use the canonical ledger instead" and name `/api/v1/ledger`.
 *
 * That endpoint did not exist. Every caller redirected off a deprecated ledger
 * landed on a 404, and the canonical ledger — which gstService,
 * costControlService, assetAccountingService and the fulfillment saga all post
 * to — had NO read API at all: no entry list, no trial balance, no integrity
 * check. The `v_ledger_trial_balance` / `v_ledger_integrity` views that do exist
 * are defined over `gl_ledger_chain`, which is the OTHER deprecated ledger, so
 * they report on a book nothing canonical writes to.
 *
 * HOW IT REPORTS
 *
 * Every figure here is computed from `journal_lines` at query time. Nothing is
 * cached, denormalised or carried in a summary column, so a number returned
 * here cannot drift from the rows behind it. Each response carries `basis`
 * naming the SQL that produced it, and `source` naming the tables — per the
 * project rule that no metric ships without its source and calculation being
 * verifiable.
 *
 * `balanced` is measured, never asserted: trialBalance() sums debits and
 * credits independently and reports the difference, including when it is not
 * zero. A trial balance that cannot come out unbalanced is not a check.
 */

'use strict';

// NOT `database/pool`. That wrapper's resolve() swaps in an in-memory mock pool
// whenever NODE_ENV === 'test', unconditionally — even when a real PostgreSQL is
// present and the test is pointed at it. Every assertion a test makes through it
// is therefore about a hand-written fake, not about the SQL below: a malformed
// query would pass. These are read queries whose entire content IS the SQL
// (aggregation, grouping, signing by normal balance), so they are verified
// against a real database or not at all.
const { getPostgreSQL } = require('../../database/connection');

function db() {
  const pg = getPostgreSQL();
  if (!pg) {
    throw new LedgerError('The ledger requires a database connection', 503);
  }
  return pg;
}

class LedgerError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'LedgerError';
    this.status = status;
  }
}

const MAX_LIMIT = 500;

function toInt(value, name, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) return fallback;
    throw new LedgerError(`${name} is required`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new LedgerError(`${name} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function toDate(value, name) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new LedgerError(`${name} must be a valid date (YYYY-MM-DD)`);
  }
  return value;
}

function money(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

/**
 * Journal entries, newest first, with the debit/credit totals of their lines.
 *
 * Totals are aggregated from `journal_lines` rather than read from the entry,
 * because `journal_entries` carries no total column — and a header total that
 * could disagree with its lines is precisely the thing a ledger must not have.
 */
async function listEntries(filters = {}) {
  const companyId = toInt(filters.companyId, 'companyId', { min: 1 });
  const from = toDate(filters.from, 'from');
  const to = toDate(filters.to, 'to');
  const limit = toInt(filters.limit, 'limit', { min: 1, max: MAX_LIMIT, fallback: 50 });
  const offset = toInt(filters.offset, 'offset', { min: 0, fallback: 0 });

  const where = ['je.company_id = $1'];
  const params = [companyId];

  const add = (clause, value) => {
    params.push(value);
    where.push(clause.replace('$?', `$${params.length}`));
  };

  if (from) add('je.entry_date >= $?', from);
  if (to) add('je.entry_date <= $?', to);
  if (filters.journalType) add('je.journal_type = $?', filters.journalType);
  if (filters.referenceType) add('je.reference_type = $?', filters.referenceType);
  if (filters.referenceId) add('je.reference_id = $?', String(filters.referenceId));
  if (filters.status) add('je.status = $?', filters.status);

  const whereSql = where.join(' AND ');

  const rows = await db().query(
    `SELECT je.id, je.entry_number, je.entry_date, je.journal_type, je.description,
            je.reference_type, je.reference_id, je.status, je.currency,
            je.reverses_entry_id, je.reversed_by_entry_id, je.posted_at,
            COALESCE(SUM(jl.debit), 0)  AS total_debit,
            COALESCE(SUM(jl.credit), 0) AS total_credit,
            COUNT(jl.id)                AS line_count
       FROM journal_entries je
       LEFT JOIN journal_lines jl ON jl.journal_entry_id = je.id
      WHERE ${whereSql}
      GROUP BY je.id
      ORDER BY je.entry_date DESC, je.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  const total = await db().query(
    `SELECT COUNT(*) AS n FROM journal_entries je WHERE ${whereSql}`,
    params,
  );

  return {
    basis: 'journal_entries joined to journal_lines, debit/credit aggregated per entry',
    source: ['journal_entries', 'journal_lines'],
    companyId,
    filters: {
      from: from || null,
      to: to || null,
      journalType: filters.journalType || null,
      referenceType: filters.referenceType || null,
      referenceId: filters.referenceId || null,
      status: filters.status || null,
    },
    pagination: { limit, offset, total: Number(total.rows[0].n) },
    entries: rows.rows.map((row) => ({
      id: row.id,
      entryNumber: row.entry_number,
      entryDate: row.entry_date,
      journalType: row.journal_type,
      description: row.description,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      status: row.status,
      currency: row.currency,
      reversesEntryId: row.reverses_entry_id,
      reversedByEntryId: row.reversed_by_entry_id,
      postedAt: row.posted_at,
      lineCount: Number(row.line_count),
      totalDebit: money(row.total_debit),
      totalCredit: money(row.total_credit),
      // Stated per entry rather than assumed: an entry whose lines do not
      // balance is a defect, and hiding it behind a header total would make it
      // unfindable.
      balanced: money(row.total_debit) === money(row.total_credit),
    })),
  };
}

/** One entry with its lines and the account each line hits. */
async function getEntry(entryId) {
  const id = toInt(entryId, 'entryId', { min: 1 });

  const entry = await db().query(
    `SELECT je.*, rev.entry_number AS reverses_entry_number,
            revd.entry_number AS reversed_by_entry_number
       FROM journal_entries je
       LEFT JOIN journal_entries rev  ON rev.id  = je.reverses_entry_id
       LEFT JOIN journal_entries revd ON revd.id = je.reversed_by_entry_id
      WHERE je.id = $1`,
    [id],
  );
  if (!entry.rows.length) throw new LedgerError(`Journal entry ${id} not found`, 404);

  const lines = await db().query(
    `SELECT jl.id, jl.line_number, jl.account_id, jl.debit, jl.credit,
            jl.base_debit, jl.base_credit, jl.description,
            jl.cost_center_id, jl.profit_center_id, jl.project_id,
            coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
       FROM journal_lines jl
       LEFT JOIN chart_of_accounts coa ON coa.id = jl.account_id
      WHERE jl.journal_entry_id = $1
      ORDER BY jl.line_number`,
    [id],
  );

  const totalDebit = money(lines.rows.reduce((sum, l) => sum + Number(l.debit), 0));
  const totalCredit = money(lines.rows.reduce((sum, l) => sum + Number(l.credit), 0));

  const row = entry.rows[0];
  return {
    basis: 'journal_entries row with its journal_lines, joined to chart_of_accounts',
    source: ['journal_entries', 'journal_lines', 'chart_of_accounts'],
    entry: {
      id: row.id,
      entryNumber: row.entry_number,
      entryDate: row.entry_date,
      journalType: row.journal_type,
      description: row.description,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      status: row.status,
      currency: row.currency,
      exchangeRate: row.exchange_rate,
      companyId: row.company_id,
      fiscalPeriodId: row.fiscal_period_id,
      postedAt: row.posted_at,
      reversesEntryId: row.reverses_entry_id,
      reversesEntryNumber: row.reverses_entry_number,
      reversedByEntryId: row.reversed_by_entry_id,
      reversedByEntryNumber: row.reversed_by_entry_number,
    },
    lines: lines.rows.map((l) => ({
      id: l.id,
      lineNumber: l.line_number,
      accountId: l.account_id,
      accountCode: l.account_code,
      accountName: l.account_name,
      accountType: l.account_type,
      normalBalance: l.normal_balance,
      debit: money(l.debit),
      credit: money(l.credit),
      description: l.description,
      costCenterId: l.cost_center_id,
      profitCenterId: l.profit_center_id,
      projectId: l.project_id,
    })),
    totals: {
      debit: totalDebit,
      credit: totalCredit,
      difference: money(totalDebit - totalCredit),
      balanced: totalDebit === totalCredit,
    },
  };
}

/**
 * Trial balance: per-account debit and credit totals over posted entries.
 *
 * The account balance is signed by the account's normal side, so an asset with
 * more debits reads positive and a liability with more credits reads positive.
 * The `balanced` flag is the measured equality of the two column totals, not a
 * claim — it is reported false, with the difference, when it is false.
 */
async function trialBalance(filters = {}) {
  const companyId = toInt(filters.companyId, 'companyId', { min: 1 });
  const from = toDate(filters.from, 'from');
  const to = toDate(filters.to, 'to');

  const where = ['je.company_id = $1', "je.status = 'posted'"];
  const params = [companyId];
  if (from) { params.push(from); where.push(`je.entry_date >= $${params.length}`); }
  if (to) { params.push(to); where.push(`je.entry_date <= $${params.length}`); }

  const rows = await db().query(
    `SELECT coa.id AS account_id, coa.account_code, coa.account_name,
            coa.account_type, coa.normal_balance,
            COALESCE(SUM(jl.debit), 0)  AS total_debit,
            COALESCE(SUM(jl.credit), 0) AS total_credit
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       JOIN chart_of_accounts coa ON coa.id = jl.account_id
      WHERE ${where.join(' AND ')}
      GROUP BY coa.id, coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
      HAVING COALESCE(SUM(jl.debit), 0) <> 0 OR COALESCE(SUM(jl.credit), 0) <> 0
      ORDER BY coa.account_code`,
    params,
  );

  const accounts = rows.rows.map((r) => {
    const debit = money(r.total_debit);
    const credit = money(r.total_credit);
    return {
      accountId: r.account_id,
      accountCode: r.account_code,
      accountName: r.account_name,
      accountType: r.account_type,
      normalBalance: r.normal_balance,
      totalDebit: debit,
      totalCredit: credit,
      balance: money(r.normal_balance === 'CR' ? credit - debit : debit - credit),
    };
  });

  const totalDebit = money(accounts.reduce((sum, a) => sum + a.totalDebit, 0));
  const totalCredit = money(accounts.reduce((sum, a) => sum + a.totalCredit, 0));

  return {
    basis: "SUM(journal_lines.debit/credit) grouped by account over journal_entries with status = 'posted'",
    source: ['journal_lines', 'journal_entries', 'chart_of_accounts'],
    companyId,
    period: { from: from || null, to: to || null },
    scope: 'Posted entries only. Draft and void entries are excluded.',
    accounts,
    accountCount: accounts.length,
    totals: {
      debit: totalDebit,
      credit: totalCredit,
      difference: money(totalDebit - totalCredit),
      // Measured, not asserted.
      balanced: totalDebit === totalCredit,
    },
  };
}

/** One account's posted movements with a running balance. */
async function accountLedger(filters = {}) {
  const companyId = toInt(filters.companyId, 'companyId', { min: 1 });
  const accountCode = String(filters.accountCode || '').trim();
  if (!accountCode) throw new LedgerError('accountCode is required');
  const from = toDate(filters.from, 'from');
  const to = toDate(filters.to, 'to');
  const limit = toInt(filters.limit, 'limit', { min: 1, max: MAX_LIMIT, fallback: 200 });

  const account = await db().query(
    'SELECT id, account_code, account_name, account_type, normal_balance FROM chart_of_accounts WHERE company_id = $1 AND account_code = $2',
    [companyId, accountCode],
  );
  if (!account.rows.length) {
    throw new LedgerError(`Account ${accountCode} not found for company ${companyId}`, 404);
  }
  const acc = account.rows[0];

  const where = ['jl.account_id = $1', "je.status = 'posted'"];
  const params = [acc.id];
  if (from) { params.push(from); where.push(`je.entry_date >= $${params.length}`); }
  if (to) { params.push(to); where.push(`je.entry_date <= $${params.length}`); }

  const rows = await db().query(
    `SELECT je.id AS entry_id, je.entry_number, je.entry_date, je.description AS entry_description,
            je.reference_type, je.reference_id,
            jl.line_number, jl.debit, jl.credit, jl.description AS line_description
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
      WHERE ${where.join(' AND ')}
      ORDER BY je.entry_date, je.id, jl.line_number
      LIMIT $${params.length + 1}`,
    [...params, limit],
  );

  const sign = acc.normal_balance === 'CR' ? -1 : 1;
  let running = 0;
  const movements = rows.rows.map((r) => {
    const debit = money(r.debit);
    const credit = money(r.credit);
    running = money(running + sign * (debit - credit));
    return {
      entryId: r.entry_id,
      entryNumber: r.entry_number,
      entryDate: r.entry_date,
      description: r.line_description || r.entry_description,
      referenceType: r.reference_type,
      referenceId: r.reference_id,
      debit,
      credit,
      runningBalance: running,
    };
  });

  return {
    basis: 'journal_lines for one account over posted entries, ordered by entry_date then id, with a running balance signed by the account normal side',
    source: ['journal_lines', 'journal_entries', 'chart_of_accounts'],
    account: {
      id: acc.id,
      accountCode: acc.account_code,
      accountName: acc.account_name,
      accountType: acc.account_type,
      normalBalance: acc.normal_balance,
    },
    period: { from: from || null, to: to || null },
    movementCount: movements.length,
    truncated: movements.length === limit,
    closingBalance: running,
    movements,
  };
}

/** The chart of accounts for a company. */
async function listAccounts(filters = {}) {
  const companyId = toInt(filters.companyId, 'companyId', { min: 1 });
  const where = ['company_id = $1'];
  const params = [companyId];
  if (filters.postableOnly === true || filters.postableOnly === 'true') {
    where.push('is_postable = TRUE');
  }
  if (filters.accountType) {
    params.push(filters.accountType);
    where.push(`account_type = $${params.length}`);
  }

  const rows = await db().query(
    `SELECT id, account_code, account_name, account_type, account_subtype,
            normal_balance, is_postable, is_reconcilable, currency, is_active,
            parent_account_id
       FROM chart_of_accounts
      WHERE ${where.join(' AND ')}
      ORDER BY account_code`,
    params,
  );

  return {
    basis: 'chart_of_accounts rows for the company',
    source: ['chart_of_accounts'],
    companyId,
    accountCount: rows.rows.length,
    accounts: rows.rows,
  };
}

/**
 * Integrity: the three ways this ledger can be wrong, each reported with the
 * offending rows rather than as a pass/fail word.
 *
 *   unbalancedEntries  an entry whose lines' debits <> credits
 *   emptyEntries       an entry with no lines at all
 *   orphanLines        a line whose account_id is not in chart_of_accounts
 *
 * An empty `findings` list is evidence only for the checks listed in `checks`.
 * It is not a claim that the ledger is correct in any wider sense.
 *
 * WHY emptyEntries IS NOT REDUNDANT WITH THE DATABASE: the balance trigger is
 * on `journal_lines` and fires FOR EACH ROW, so an entry with ZERO lines never
 * fires it and commits happily. Found in practice during verification — a
 * header row whose lines insert was rejected survived on its own, invisible to
 * the trigger and to any balance check, until this query named it.
 *
 * NOTE ON unbalancedEntries: the database ALREADY enforces this. `journal_lines`
 * carries `trg_journal_lines_balanced`, a DEFERRABLE INITIALLY DEFERRED
 * constraint trigger running `assert_journal_balanced()`, so an unbalanced entry
 * cannot commit through any ordinary write — verified by planting one, which
 * PostgreSQL refused at COMMIT. This check is therefore a backstop for rows that
 * bypassed the trigger: a restore, a COPY, or a session with
 * `session_replication_role = replica`. It is not the primary guard, and should
 * not be presented as one.
 */
async function integrityCheck(filters = {}) {
  const companyId = toInt(filters.companyId, 'companyId', { min: 1 });

  const unbalanced = await db().query(
    `SELECT je.id, je.entry_number, je.entry_date, je.status,
            COALESCE(SUM(jl.debit), 0)  AS total_debit,
            COALESCE(SUM(jl.credit), 0) AS total_credit
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
      WHERE je.company_id = $1
      GROUP BY je.id
     HAVING COALESCE(SUM(jl.debit), 0) <> COALESCE(SUM(jl.credit), 0)
      ORDER BY je.id
      LIMIT 100`,
    [companyId],
  );

  const empty = await db().query(
    `SELECT je.id, je.entry_number, je.entry_date, je.status
       FROM journal_entries je
       LEFT JOIN journal_lines jl ON jl.journal_entry_id = je.id
      WHERE je.company_id = $1 AND jl.id IS NULL
      ORDER BY je.id
      LIMIT 100`,
    [companyId],
  );

  const orphan = await db().query(
    `SELECT jl.id, jl.journal_entry_id, jl.account_id
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       LEFT JOIN chart_of_accounts coa ON coa.id = jl.account_id
      WHERE je.company_id = $1 AND coa.id IS NULL
      ORDER BY jl.id
      LIMIT 100`,
    [companyId],
  );

  const findings = {
    unbalancedEntries: unbalanced.rows.map((r) => ({
      id: r.id,
      entryNumber: r.entry_number,
      entryDate: r.entry_date,
      status: r.status,
      totalDebit: money(r.total_debit),
      totalCredit: money(r.total_credit),
      difference: money(Number(r.total_debit) - Number(r.total_credit)),
    })),
    emptyEntries: empty.rows,
    orphanLines: orphan.rows,
  };

  const total = findings.unbalancedEntries.length
    + findings.emptyEntries.length
    + findings.orphanLines.length;

  return {
    basis: 'Three aggregate checks over journal_entries/journal_lines/chart_of_accounts',
    source: ['journal_entries', 'journal_lines', 'chart_of_accounts'],
    companyId,
    checks: [
      'unbalancedEntries: an entry whose lines do not sum debit = credit',
      'emptyEntries: an entry with no lines',
      'orphanLines: a line whose account_id is absent from chart_of_accounts',
    ],
    scopeNote: 'An empty findings list is evidence only for the checks listed above. '
      + 'It is not a claim that the ledger is correct in any wider sense. '
      + 'Each list is capped at 100 rows.',
    findingCount: total,
    clean: total === 0,
    findings,
  };
}

module.exports = {
  listEntries,
  getEntry,
  trialBalance,
  accountLedger,
  listAccounts,
  integrityCheck,
  LedgerError,
  MAX_LIMIT,
};
