'use strict';

const crypto = require('crypto');
const pool = require('../database/pool');

const VALID = {
  invoiceStatus: new Set(['draft', 'approved', 'posted', 'part_paid', 'paid', 'cancelled']),
  paymentDirection: new Set(['inbound', 'outbound']),
  paymentStatus: new Set(['initiated', 'authorised', 'settled', 'failed', 'reversed']),
  taxTypes: new Set(['GST', 'IGST', 'CGST', 'SGST', 'UTGST', 'TDS', 'TCS', 'OTHER']),
};

function idempotencyKey(value) {
  return value ? String(value) : crypto.randomUUID();
}

function money(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${field} must be a non-negative number`);
  return n.toFixed(4);
}

function required(value, field) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`${field} is required`);
  }
  return value;
}

function date(value, field) {
  const d = new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) throw new Error(`${field} must be a valid date`);
  return d.toISOString().slice(0, 10);
}

async function insert(table, columns, values, returning = '*') {
  const quoted = columns.map(c => `"${c}"`).join(', ');
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `INSERT INTO ${table} (${quoted}) VALUES (${placeholders}) RETURNING ${returning}`,
    values,
  );
  return rows[0];
}

async function createAPInvoice(input = {}) {
  const companyId = input.company_id || null;
  const invoiceNumber = required(input.invoice_number, 'invoice_number');
  const subtotal = money(input.subtotal || 0, 'subtotal');
  const tax = money(input.tax_amount || 0, 'tax_amount');
  const total = money(input.total_amount === undefined ? Number(subtotal) + Number(tax) : input.total_amount, 'total_amount');
  if (input.status && !VALID.invoiceStatus.has(input.status)) throw new Error('Invalid AP invoice status');
  return insert('erp_ap_invoices',
    ['company_id','supplier_id','invoice_number','invoice_date','due_date','currency','subtotal','tax_amount','total_amount','status','source_type','source_id','rural_entity_type','rural_entity_id','metadata'],
    [companyId,input.supplier_id || null,invoiceNumber,date(input.invoice_date,'invoice_date'),input.due_date ? date(input.due_date,'due_date') : null,input.currency || 'INR',subtotal,tax,total,input.status || 'draft',input.source_type || null,input.source_id || null,input.rural_entity_type || null,input.rural_entity_id || null,input.metadata || {}]);
}

async function createARInvoice(input = {}) {
  const subtotal = money(input.subtotal || 0, 'subtotal');
  const tax = money(input.tax_amount || 0, 'tax_amount');
  const total = money(input.total_amount === undefined ? Number(subtotal) + Number(tax) : input.total_amount, 'total_amount');
  const status = input.status || 'draft';
  if (!VALID.invoiceStatus.has(status)) throw new Error('Invalid AR invoice status');
  return insert('erp_ar_invoices',
    ['company_id','customer_id','invoice_number','invoice_date','due_date','currency','subtotal','tax_amount','total_amount','status','channel','rural_entity_type','rural_entity_id','metadata'],
    [input.company_id || null,input.customer_id || null,required(input.invoice_number,'invoice_number'),date(input.invoice_date,'invoice_date'),input.due_date ? date(input.due_date,'due_date') : null,input.currency || 'INR',subtotal,tax,total,status,input.channel || null,input.rural_entity_type || null,input.rural_entity_id || null,input.metadata || {}]);
}

async function recordPayment(input = {}) {
  const direction = required(input.direction, 'direction');
  if (!VALID.paymentDirection.has(direction)) throw new Error('direction must be inbound or outbound');
  const amount = money(input.amount, 'amount');
  if (Number(amount) <= 0) throw new Error('amount must be greater than zero');
  const key = idempotencyKey(input.idempotency_key);
  const existing = await pool.query('SELECT * FROM erp_payments WHERE idempotency_key = $1', [key]);
  if (existing.rows[0]) return { ...existing.rows[0], idempotent_replay: true };
  return insert('erp_payments',
    ['company_id','payment_reference','payment_date','direction','amount','currency','method','bank_account_id','party_id','invoice_id','invoice_type','status','idempotency_key','reference_type','reference_id','metadata'],
    [input.company_id || null,required(input.payment_reference,'payment_reference'),date(input.payment_date,'payment_date'),direction,amount,input.currency || 'INR',required(input.method,'method'),input.bank_account_id || null,input.party_id || null,input.invoice_id || null,input.invoice_type || null,input.status || 'initiated',key,input.reference_type || null,input.reference_id || null,input.metadata || {}]);
}

async function recordTaxTransaction(input = {}) {
  const taxType = required(input.tax_type, 'tax_type');
  if (!VALID.taxTypes.has(taxType)) throw new Error('Unsupported Indian tax type');
  return insert('erp_tax_transactions',
    ['company_id','transaction_date','tax_type','direction','taxable_amount','tax_amount','rate','document_type','document_id','counterparty_id','state_code','place_of_supply','filing_period','status','metadata'],
    [input.company_id || null,date(input.transaction_date,'transaction_date'),taxType,required(input.direction,'direction'),money(input.taxable_amount || 0,'taxable_amount'),money(input.tax_amount || 0,'tax_amount'),input.rate == null ? null : Number(input.rate),input.document_type || null,input.document_id || null,input.counterparty_id || null,input.state_code || null,input.place_of_supply || null,input.filing_period || null,input.status || 'open',input.metadata || {}]);
}

async function createBudget(input = {}) {
  const budget = money(input.budget_amount || 0,'budget_amount');
  return insert('erp_budgets',
    ['company_id','fiscal_year','period','cost_center_id','profit_center_id','project_id','account_id','rural_entity_type','rural_entity_id','budget_amount','committed_amount','actual_amount','currency','status','metadata'],
    [input.company_id || null,required(input.fiscal_year,'fiscal_year'),input.period || null,input.cost_center_id || null,input.profit_center_id || null,input.project_id || null,input.account_id || null,input.rural_entity_type || null,input.rural_entity_id || null,budget,money(input.committed_amount || 0,'committed_amount'),money(input.actual_amount || 0,'actual_amount'),input.currency || 'INR',input.status || 'draft',input.metadata || {}]);
}

async function reconcileBank(input = {}) {
  const opening = Number(input.opening_balance || 0);
  const closing = Number(input.closing_balance || 0);
  const ledger = Number(input.ledger_balance || 0);
  if (![opening,closing,ledger].every(Number.isFinite)) throw new Error('Bank balances must be numeric');
  const difference = closing - ledger;
  const status = Math.abs(difference) < 0.005 ? 'reconciled' : 'exception';
  const result = await pool.query(
    `INSERT INTO erp_bank_reconciliations
      (company_id,bank_account_id,statement_date,opening_balance,closing_balance,ledger_balance,difference_amount,reconciled_amount,unreconciled_count,status,exceptions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (bank_account_id,statement_date) DO UPDATE SET
       closing_balance=EXCLUDED.closing_balance, ledger_balance=EXCLUDED.ledger_balance,
       difference_amount=EXCLUDED.difference_amount, reconciled_amount=EXCLUDED.reconciled_amount,
       unreconciled_count=EXCLUDED.unreconciled_count, status=EXCLUDED.status, exceptions=EXCLUDED.exceptions
     RETURNING *`,
    [input.company_id || null,required(input.bank_account_id,'bank_account_id'),date(input.statement_date,'statement_date'),opening,closing,ledger,difference,Math.min(closing,ledger),Number(input.unreconciled_count || (Math.abs(difference) < 0.005 ? 0 : 1)),status,input.exceptions || (Math.abs(difference) < 0.005 ? [] : [{ code:'BALANCE_MISMATCH', amount:difference }])],
  );
  return result.rows[0];
}

async function closePeriod(input = {}) {
  const checklist = input.checklist || {};
  const verified = Boolean(input.trial_balance_verified) && Boolean(input.tax_reconciled) && Boolean(input.bank_reconciled) && Boolean(input.subledgers_reconciled);
  if (input.status === 'closed' && !verified) throw new Error('A period cannot be closed until trial balance, tax, bank and subledgers are reconciled');
  const result = await pool.query(
    `INSERT INTO erp_period_closures
      (company_id,fiscal_year,period,status,checklist,trial_balance_verified,tax_reconciled,bank_reconciled,subledgers_reconciled,approved_by,approved_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (company_id,fiscal_year,period) DO UPDATE SET
       status=EXCLUDED.status, checklist=EXCLUDED.checklist,
       trial_balance_verified=EXCLUDED.trial_balance_verified, tax_reconciled=EXCLUDED.tax_reconciled,
       bank_reconciled=EXCLUDED.bank_reconciled, subledgers_reconciled=EXCLUDED.subledgers_reconciled,
       approved_by=EXCLUDED.approved_by, approved_at=EXCLUDED.approved_at, updated_at=now()
     RETURNING *`,
    [input.company_id || null,required(input.fiscal_year,'fiscal_year'),required(input.period,'period'),input.status || (verified ? 'closed' : 'soft_closed'),checklist,Boolean(input.trial_balance_verified),Boolean(input.tax_reconciled),Boolean(input.bank_reconciled),Boolean(input.subledgers_reconciled),input.approved_by || null,input.approved_by ? new Date() : null],
  );
  return result.rows[0];
}

async function financialControlDashboard(input = {}) {
  const companyId = input.company_id || null;
  const [ap, ar, payments, tax, budgets, exceptions] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*) FILTER (WHERE status IN ('approved','posted','part_paid')) AS open_count FROM erp_ap_invoices WHERE ($1::uuid IS NULL OR company_id=$1)`, [companyId]),
    pool.query(`SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*) FILTER (WHERE status IN ('approved','posted','part_paid')) AS open_count FROM erp_ar_invoices WHERE ($1::uuid IS NULL OR company_id=$1)`, [companyId]),
    pool.query(`SELECT COALESCE(SUM(CASE WHEN direction='inbound' THEN amount ELSE -amount END),0) AS net_cash FROM erp_payments WHERE ($1::uuid IS NULL OR company_id=$1) AND status='settled'`, [companyId]),
    pool.query(`SELECT COALESCE(SUM(tax_amount),0) AS tax_open FROM erp_tax_transactions WHERE ($1::uuid IS NULL OR company_id=$1) AND status IN ('open','review')`, [companyId]),
    pool.query(`SELECT COALESCE(SUM(budget_amount),0) AS budget, COALESCE(SUM(actual_amount),0) AS actual, COALESCE(SUM(committed_amount),0) AS committed FROM erp_budgets WHERE ($1::uuid IS NULL OR company_id=$1)`, [companyId]),
    pool.query(`SELECT COUNT(*) AS count FROM erp_bank_reconciliations WHERE ($1::uuid IS NULL OR company_id=$1) AND status='exception'`, [companyId]),
  ]);
  return { accounts_payable: ap.rows[0], accounts_receivable: ar.rows[0], cash: payments.rows[0], tax: tax.rows[0], budget: budgets.rows[0], bank_exceptions: exceptions.rows[0] };
}

module.exports = { createAPInvoice, createARInvoice, recordPayment, recordTaxTransaction, createBudget, reconcileBank, closePeriod, financialControlDashboard };
