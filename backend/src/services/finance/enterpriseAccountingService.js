'use strict';

const crypto = require('crypto');
const pool = require('../../database/pool');

const ACCOUNT_TYPES = new Set(['asset', 'liability', 'equity', 'revenue', 'expense']);
const PERIOD_STATES = new Set(['open', 'closed', 'locked']);
const MONEY_SCALE = 4;

function required(value, name) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`${name} is required`);
  }
  return value;
}

function moneyUnits(value, name = 'amount') {
  const raw = String(value ?? '0').trim();
  if (!/^\d+(?:\.\d{1,4})?$/.test(raw)) {
    throw new Error(`${name} must be a non-negative decimal with at most four decimal places`);
  }
  const [whole, fraction = ''] = raw.split('.');
  return BigInt(whole) * 10000n + BigInt(fraction.padEnd(MONEY_SCALE, '0'));
}

function validateLines(lines) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error('A journal requires at least two lines');
  }
  let debit = 0n;
  let credit = 0n;
  const accountIds = new Set();
  const normalized = lines.map((line, index) => {
    const debitUnits = moneyUnits(line.debit, `lines[${index}].debit`);
    const creditUnits = moneyUnits(line.credit, `lines[${index}].credit`);
    if ((debitUnits > 0n) === (creditUnits > 0n)) {
      throw new Error(`lines[${index}] must contain exactly one positive debit or credit`);
    }
    const accountId = Number(required(line.accountId ?? line.account_id, `lines[${index}].accountId`));
    if (!Number.isSafeInteger(accountId) || accountId <= 0) {
      throw new Error(`lines[${index}].accountId must be a positive integer`);
    }
    accountIds.add(accountId);
    debit += debitUnits;
    credit += creditUnits;
    return { ...line, accountId };
  });
  if (debit !== credit) throw new Error(`Journal is unbalanced: debit ${debit}, credit ${credit}`);
  if (debit === 0n) throw new Error('Journal total must be greater than zero');
  return { normalized, accountIds: [...accountIds] };
}

async function inTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function audit(client, entryId, action, actorId, detail = {}) {
  await client.query(
    `INSERT INTO journal_audit_log (journal_entry_id, action, actor_id, detail)
     VALUES ($1,$2,$3,$4::jsonb)`,
    [entryId, action, actorId ?? null, JSON.stringify(detail)],
  );
}

async function openPeriod(client, companyId, entryDate, explicitPeriodId) {
  const params = explicitPeriodId ? [explicitPeriodId, companyId] : [companyId, entryDate];
  const predicate = explicitPeriodId
    ? 'fp.id = $1 AND fy.company_id = $2'
    : 'fy.company_id = $1 AND $2::date BETWEEN fp.start_date AND fp.end_date';
  const { rows } = await client.query(
    `SELECT fp.id, fp.status FROM fiscal_periods fp
     JOIN fiscal_years fy ON fy.id = fp.fiscal_year_id
     WHERE ${predicate} FOR UPDATE OF fp`, params,
  );
  if (!rows.length) throw new Error(`No fiscal period covers ${entryDate} for company ${companyId}`);
  if (rows[0].status !== 'open') throw new Error(`Fiscal period ${rows[0].id} is ${rows[0].status}`);
  return rows[0].id;
}

async function assertAccounts(client, companyId, accountIds) {
  const { rows } = await client.query(
    `SELECT id FROM chart_of_accounts
     WHERE company_id = $1 AND id = ANY($2::int[]) AND is_active AND is_postable`,
    [companyId, accountIds],
  );
  if (rows.length !== accountIds.length) {
    throw new Error('Every journal account must be an active, postable account belonging to the company');
  }
}

function entryNumber(data) {
  return data.entryNumber || data.entry_number || `JE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function insertDraft(client, data) {
  const companyId = Number(required(data.companyId ?? data.company_id, 'companyId'));
  const entryDate = required(data.entryDate ?? data.entry_date, 'entryDate');
  const idempotencyKey = data.idempotencyKey ?? data.idempotency_key ?? null;
  const checked = validateLines(data.lines || data.entries);
  const requestHash = crypto.createHash('sha256').update(JSON.stringify({
    companyId, entryDate, journalType: data.journalType || data.journal_type || 'general',
    description: data.description || null, referenceType: data.referenceType || data.reference_type || null,
    referenceId: data.referenceId || data.reference_id || null, currency: data.currency || 'INR',
    exchangeRate: String(data.exchangeRate || data.exchange_rate || 1),
    lines: checked.normalized.map((line) => ({ accountId: line.accountId, debit: String(line.debit || 0),
      credit: String(line.credit || 0), costCenterId: line.costCenterId || line.cost_center_id || null,
      profitCenterId: line.profitCenterId || line.profit_center_id || null })),
  })).digest('hex');
  if (idempotencyKey) {
    const existing = await client.query(
      'SELECT * FROM journal_entries WHERE company_id=$1 AND idempotency_key=$2 FOR UPDATE',
      [companyId, idempotencyKey],
    );
    if (existing.rows.length) {
      if (existing.rows[0].request_hash !== requestHash) throw new Error('Idempotency key was already used for a different journal payload');
      return { entry: existing.rows[0], replayed: true };
    }
  }
  await assertAccounts(client, companyId, checked.accountIds);
  const fiscalPeriodId = await openPeriod(client, companyId, entryDate, data.fiscalPeriodId ?? data.fiscal_period_id);
  const { rows } = await client.query(
    `INSERT INTO journal_entries
      (company_id, entry_number, entry_date, fiscal_period_id, journal_type, description,
       reference_type, reference_id, currency, exchange_rate, status, created_by, idempotency_key,request_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11,$12,$13) RETURNING *`,
    [companyId, entryNumber(data), entryDate, fiscalPeriodId, data.journalType || data.journal_type || 'general',
      data.description || null, data.referenceType || data.reference_type || null,
      data.referenceId || data.reference_id || null, data.currency || 'INR', data.exchangeRate || data.exchange_rate || 1,
      data.actorId || data.created_by || null, idempotencyKey, requestHash],
  );
  for (let index = 0; index < checked.normalized.length; index += 1) {
    const line = checked.normalized[index];
    await client.query(
      `INSERT INTO journal_lines
       (journal_entry_id,line_number,account_id,debit,credit,base_debit,base_credit,
        cost_center_id,profit_center_id,business_unit_id,branch_id,department_id,partner_type,partner_id,description)
       VALUES ($1,$2,$3,$4,$5,ROUND($4::numeric*$6,4),ROUND($5::numeric*$6,4),$7,$8,$9,$10,$11,$12,$13,$14)`,
      [rows[0].id, index + 1, line.accountId, line.debit || 0, line.credit || 0,
        data.exchangeRate || data.exchange_rate || 1, line.costCenterId || line.cost_center_id || null,
        line.profitCenterId || line.profit_center_id || null, line.businessUnitId || line.business_unit_id || null,
        line.branchId || line.branch_id || null, line.departmentId || line.department_id || null,
        line.partnerType || line.partner_type || null, line.partnerId || line.partner_id || null, line.description || null],
    );
  }
  await audit(client, rows[0].id, 'created', data.actorId || data.created_by, { lineCount: checked.normalized.length });
  return { entry: rows[0], replayed: false };
}

async function createDraftJournal(data) {
  return inTransaction(async (client) => (await insertDraft(client, data)).entry);
}

async function postLocked(client, entryId, actorId) {
  const { rows } = await client.query('SELECT * FROM journal_entries WHERE id=$1 FOR UPDATE', [entryId]);
  if (!rows.length) throw new Error(`Journal entry ${entryId} not found`);
  const entry = rows[0];
  if (entry.status === 'posted') return { ...entry, replayed: true };
  if (entry.status !== 'draft') throw new Error(`Only draft journals can be posted; entry is ${entry.status}`);
  await openPeriod(client, entry.company_id, entry.entry_date, entry.fiscal_period_id);
  const balance = await client.query(
    `SELECT COUNT(*)::int line_count, COALESCE(SUM(debit),0)::text debit, COALESCE(SUM(credit),0)::text credit
     FROM journal_lines WHERE journal_entry_id=$1`, [entryId],
  );
  const total = balance.rows[0];
  if (total.line_count < 2 || moneyUnits(total.debit) === 0n || moneyUnits(total.debit) !== moneyUnits(total.credit)) {
    throw new Error(`Journal ${entryId} cannot post: debits and credits must be equal and non-zero`);
  }
  const updated = await client.query(
    `UPDATE journal_entries SET status='posted',posted_at=NOW(),posted_by=$2 WHERE id=$1 RETURNING *`,
    [entryId, actorId ?? null],
  );
  await client.query('SET CONSTRAINTS ALL IMMEDIATE');
  await audit(client, entryId, 'posted', actorId, { debit: total.debit, credit: total.credit });
  return updated.rows[0];
}

async function postJournal(entryId, actorId) {
  return inTransaction((client) => postLocked(client, Number(entryId), actorId));
}

async function createAndPostJournal(data) {
  return inTransaction(async (client) => {
    return createAndPostJournalWithClient(client, data);
  });
}

async function createAndPostJournalWithClient(client, data) {
  if (!client || typeof client.query !== 'function') throw new Error('A transactional database client is required');
  const created = await insertDraft(client, data);
  if (created.replayed && created.entry.status === 'posted') return { ...created.entry, replayed: true };
  return postLocked(client, created.entry.id, data.actorId || data.posted_by || data.created_by);
}

async function reverseJournal(entryId, data = {}) {
  return inTransaction(async (client) => {
    const originalResult = await client.query('SELECT * FROM journal_entries WHERE id=$1 FOR UPDATE', [Number(entryId)]);
    if (!originalResult.rows.length) throw new Error(`Journal entry ${entryId} not found`);
    const original = originalResult.rows[0];
    if (original.status !== 'posted') throw new Error(`Only posted journals can be reversed; entry is ${original.status}`);
    if (original.reversed_by_entry_id) {
      const existing = await client.query('SELECT * FROM journal_entries WHERE id=$1', [original.reversed_by_entry_id]);
      return { ...existing.rows[0], replayed: true };
    }
    const lines = await client.query('SELECT * FROM journal_lines WHERE journal_entry_id=$1 ORDER BY line_number', [original.id]);
    const reversalDate = data.entryDate || data.entry_date || new Date().toISOString().slice(0, 10);
    const created = await insertDraft(client, {
      companyId: original.company_id, entryDate: reversalDate, journalType: 'reversal',
      description: data.description || `Reversal of ${original.entry_number}`,
      referenceType: 'journal_reversal', referenceId: String(original.id), currency: original.currency,
      exchangeRate: original.exchange_rate, actorId: data.actorId || data.created_by,
      idempotencyKey: data.idempotencyKey || `reversal:${original.id}`,
      lines: lines.rows.map((line) => ({ ...line, accountId: line.account_id, debit: line.credit, credit: line.debit })),
    });
    await client.query('UPDATE journal_entries SET reverses_entry_id=$2 WHERE id=$1', [created.entry.id, original.id]);
    const reversal = await postLocked(client, created.entry.id, data.actorId || data.created_by);
    await client.query("UPDATE journal_entries SET status='reversed',reversed_by_entry_id=$2 WHERE id=$1", [original.id, reversal.id]);
    await audit(client, original.id, 'reversed', data.actorId || data.created_by, { reversalEntryId: reversal.id });
    return reversal;
  });
}

async function insertAccount(queryable, data) {
  const type = String(required(data.accountType ?? data.account_type, 'accountType')).toLowerCase();
  if (!ACCOUNT_TYPES.has(type)) throw new Error(`Unsupported account type: ${type}`);
  const expectedNormal = ['asset', 'expense'].includes(type) ? 'DR' : 'CR';
  const normal = String(data.normalBalance || data.normal_balance || expectedNormal).toUpperCase();
  if (normal !== expectedNormal) throw new Error(`${type} accounts must have normal balance ${expectedNormal}`);
  const companyId = required(data.companyId ?? data.company_id, 'companyId');
  const parentId = data.parentAccountId || data.parent_account_id || null;
  if (parentId) {
    const parent = await queryable.query('SELECT account_type,is_postable FROM chart_of_accounts WHERE id=$1 AND company_id=$2 FOR UPDATE', [parentId, companyId]);
    if (!parent.rows.length) throw new Error('Parent account must belong to the same company');
    if (parent.rows[0].account_type !== type) throw new Error('Parent and child accounts must have the same account type');
    if (parent.rows[0].is_postable) throw new Error('Parent account must be non-postable before child accounts can be added');
  }
  const { rows } = await queryable.query(
    `INSERT INTO chart_of_accounts
     (company_id,account_code,account_name,parent_account_id,account_type,account_subtype,normal_balance,is_postable,is_reconcilable,currency)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [companyId, required(data.accountCode ?? data.account_code, 'accountCode'),
      required(data.accountName ?? data.account_name, 'accountName'), parentId,
      type, data.accountSubtype || data.account_subtype || null, normal, data.isPostable ?? data.is_postable ?? true,
      data.isReconcilable ?? data.is_reconcilable ?? false, data.currency || null],
  );
  return rows[0];
}

async function createAccount(data) {
  return insertAccount(pool, data);
}

async function provisionChart(data) {
  const companyId = required(data.companyId ?? data.company_id, 'companyId');
  if (!Array.isArray(data.accounts) || !data.accounts.length) throw new Error('accounts must contain at least one account');
  return inTransaction(async (client) => {
    const created = [];
    for (const account of data.accounts) created.push(await insertAccount(client, { ...account, companyId }));
    return { companyId: Number(companyId), accounts: created };
  });
}

async function trialBalance(filters = {}) {
  const params = [required(filters.companyId ?? filters.company_id, 'companyId'), filters.fromDate || filters.from_date || '0001-01-01', filters.toDate || filters.to_date || '9999-12-31'];
  const { rows } = await pool.query(
    `SELECT coa.id account_id,coa.account_code,coa.account_name,coa.account_type,coa.normal_balance,
      COALESCE(SUM(jl.base_debit) FILTER (WHERE je.id IS NOT NULL),0)::text total_debit,
      COALESCE(SUM(jl.base_credit) FILTER (WHERE je.id IS NOT NULL),0)::text total_credit,
      (COALESCE(SUM(jl.base_debit) FILTER (WHERE je.id IS NOT NULL),0)-
       COALESCE(SUM(jl.base_credit) FILTER (WHERE je.id IS NOT NULL),0))::text balance
     FROM chart_of_accounts coa
     LEFT JOIN journal_lines jl ON jl.account_id=coa.id
     LEFT JOIN journal_entries je ON je.id=jl.journal_entry_id AND je.status='posted' AND je.entry_date BETWEEN $2 AND $3
     WHERE coa.company_id=$1 GROUP BY coa.id ORDER BY coa.account_code`, params,
  );
  const totals = rows.reduce((a, row) => ({ debit: a.debit + moneyUnits(row.total_debit), credit: a.credit + moneyUnits(row.total_credit) }), { debit: 0n, credit: 0n });
  return { companyId: Number(params[0]), fromDate: params[1], toDate: params[2], lines: rows,
    totalDebit: Number(totals.debit) / 10000, totalCredit: Number(totals.credit) / 10000,
    difference: Number(totals.debit - totals.credit) / 10000, balanced: totals.debit === totals.credit };
}

async function financialStatements(filters = {}) {
  const tb = await trialBalance(filters);
  const signed = (line) => Number(line.normal_balance === 'DR' ? line.balance : -Number(line.balance));
  const groups = { assets: [], liabilities: [], equity: [], revenue: [], expenses: [] };
  for (const line of tb.lines) {
    const key = line.account_type === 'asset' ? 'assets' : line.account_type === 'liability' ? 'liabilities' : line.account_type === 'expense' ? 'expenses' : line.account_type;
    groups[key].push({ ...line, amount: signed(line) });
  }
  const total = (items) => items.reduce((sum, item) => sum + item.amount, 0);
  const revenue = total(groups.revenue); const expenses = total(groups.expenses); const profit = revenue - expenses;
  const assets = total(groups.assets); const liabilities = total(groups.liabilities); const equity = total(groups.equity);
  return { trialBalance: tb, profitAndLoss: { revenue: groups.revenue, expenses: groups.expenses, totalRevenue: revenue, totalExpenses: expenses, netProfit: profit },
    balanceSheet: { assets: groups.assets, liabilities: groups.liabilities, equity: groups.equity, totalAssets: assets,
      totalLiabilities: liabilities, totalEquity: equity, currentPeriodProfit: profit,
      difference: assets - liabilities - equity - profit, balanced: Math.abs(assets - liabilities - equity - profit) < 0.0001 } };
}

async function setPeriodStatus(periodId, status, actorId) {
  if (!PERIOD_STATES.has(status)) throw new Error(`Unsupported period status: ${status}`);
  return inTransaction(async (client) => {
    const current = await client.query('SELECT * FROM fiscal_periods WHERE id=$1 FOR UPDATE', [Number(periodId)]);
    if (!current.rows.length) throw new Error(`Fiscal period ${periodId} not found`);
    const allowed = { open: ['closed', 'locked'], closed: ['locked'], locked: [] };
    if (current.rows[0].status !== status && !allowed[current.rows[0].status].includes(status)) {
      throw new Error(`Invalid period transition ${current.rows[0].status} -> ${status}`);
    }
    if (current.rows[0].status === status) return { ...current.rows[0], replayed: true };
    const updated = await client.query(
      `UPDATE fiscal_periods SET status=$2,closed_at=CASE WHEN $2='open' THEN NULL ELSE NOW() END,
       closed_by=CASE WHEN $2='open' THEN NULL ELSE $3 END WHERE id=$1 RETURNING *`, [Number(periodId), status, actorId ?? null],
    );
    return updated.rows[0];
  });
}

async function getJournal(entryId) {
  const [entry, lines, auditLog] = await Promise.all([
    pool.query('SELECT * FROM journal_entries WHERE id=$1', [Number(entryId)]),
    pool.query('SELECT * FROM journal_lines WHERE journal_entry_id=$1 ORDER BY line_number', [Number(entryId)]),
    pool.query('SELECT * FROM journal_audit_log WHERE journal_entry_id=$1 ORDER BY occurred_at,id', [Number(entryId)]),
  ]);
  if (!entry.rows.length) throw new Error(`Journal entry ${entryId} not found`);
  return { ...entry.rows[0], lines: lines.rows, auditLog: auditLog.rows };
}

module.exports = { validateLines, provisionChart, createAccount, createDraftJournal, postJournal,
  createAndPostJournal, createAndPostJournalWithClient, reverseJournal, getJournal, trialBalance,
  financialStatements, setPeriodStatus };
