/**
 * Rural Finance Service — REOS Rural Life OS, Layer 7 (Finance).
 *
 * Backs the `rural_finance` table (041_rural_life_os_schema.sql), the
 * multi-purpose loan/advance product taken out against a Rural Economic Unit
 * (REU) — working capital, equipment finance, cash-flow loans, solar/
 * greenhouse/fisheries/dairy/enterprise finance. This is deliberately a
 * DIFFERENT table from financialService.js's `loans`/`emi_schedule`, which
 * is contract-farming specific. rural_finance is REU-scoped and carries a
 * `lender_id` against the `lenders` register (public/private bank, RRB,
 * cooperative, NBFC, MFI, SHG, FPO, government scheme, or informal), which
 * is what makes the refinancing comparison below possible: the schema
 * comment on `lenders` exists specifically so this module can show a farmer
 * what moving off an informal moneylender would save them.
 *
 * EMI math mirrors financialService.js's generateEMISchedule (reducing-
 * balance amortization) for consistency across the codebase.
 *
 * 2026-09-07: this file previously queried a `finance_id`/`village_id`/
 * `service_type`/`provider_id` schema that does not exist anywhere in the
 * migrations (041_rural_life_os_schema.sql, the migration that actually
 * creates `rural_finance`, defines `reu_id`/`loan_number`/`loan_amount`/
 * `emi`/etc — see CREATE TABLE at line 631 of that file). Every route in
 * this service was therefore failing at the database with an
 * undefined-column error on every call, despite being mounted and "live" at
 * /api/v1/rural-finance. Replaced with the schema-correct implementation
 * recovered from services/finance/ruralFinanceService.js (same recovered
 * branch as the rest of the finance domain), which was already correct but
 * never wired in. The old broken version is preserved at
 * ruralFinanceService.js.recovered_old_broken_schema for reference; it
 * should not be reintroduced.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { withTransaction } = require('../../core/withTransaction');

const r2 = (n) => Math.round(n * 100) / 100;

/** Standard reducing-balance EMI, monthly compounding. */
function calcEmi(principal, annualRatePct, tenureMonths) {
  const r = annualRatePct / 12 / 100;
  if (!(tenureMonths > 0)) throw new Error('tenure_months must be positive');
  if (r === 0) return r2(principal / tenureMonths);
  const factor = Math.pow(1 + r, tenureMonths);
  return r2((principal * r * factor) / (factor - 1));
}

/** Total interest paid over `months` at `annualRatePct` on `principal`, reducing balance. */
function totalInterestOverTerm(principal, annualRatePct, months) {
  const emi = calcEmi(principal, annualRatePct, months);
  return r2(emi * months - principal);
}

function generateLoanNumber() {
  return `RF-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Apply for a rural finance product. Computes EMI up front using the same
 * reducing-balance formula as financialService.js, and records it so the
 * repayment schedule downstream (whichever module renders it) does not
 * have to recompute or risk drifting from what was disclosed at approval.
 */
async function applyForFinance(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const {
    reu_id, enterprise_id, energy_system_id, financial_product_type, product_subtype,
    loan_amount, interest_rate, tenure_months, purpose, purpose_category,
    collateral_type, collateral_value, collateral_details,
    lender_id, lender_type, government_scheme,
  } = payload;

  if (!reu_id) throw new Error('reu_id is required');
  if (!financial_product_type) throw new Error('financial_product_type is required');
  if (!(loan_amount > 0)) throw new Error('loan_amount must be positive');
  if (!(interest_rate >= 0)) throw new Error('interest_rate must be zero or positive');
  if (!(tenure_months > 0)) throw new Error('tenure_months must be positive');

  const emi = calcEmi(loan_amount, interest_rate, tenure_months);
  const loanNumber = generateLoanNumber();

  const { rows } = await pg.query(
    `INSERT INTO rural_finance
       (reu_id, enterprise_id, energy_system_id, financial_product_type, product_subtype,
        loan_number, loan_amount, interest_rate, tenure_months, emi, purpose, purpose_category,
        collateral_type, collateral_value, collateral_details, lender_id, lender_type,
        government_scheme, status, outstanding_principal)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'applied',$7)
     RETURNING *`,
    [reu_id, enterprise_id || null, energy_system_id || null, financial_product_type, product_subtype || null,
      loanNumber, loan_amount, interest_rate, tenure_months, emi, purpose || null, purpose_category || null,
      collateral_type || null, collateral_value || null, collateral_details ? JSON.stringify(collateral_details) : null,
      lender_id || null, lender_type || null, government_scheme || null]
  );

  logger.info(`Rural finance application created: ${loanNumber}`, { emi });
  return rows[0];
}

async function listFinanceRecords({ reu_id, status, financial_product_type, page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const conditions = [];
  const params = [];
  if (reu_id) { params.push(reu_id); conditions.push(`reu_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  if (financial_product_type) { params.push(financial_product_type); conditions.push(`financial_product_type = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const offset = (page - 1) * limit;
  const totalRes = await pg.query(`SELECT COUNT(*) FROM rural_finance ${where}`, params);
  const dataParams = [...params, limit, offset];
  const { rows } = await pg.query(
    `SELECT * FROM rural_finance ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    dataParams
  );
  const total = parseInt(totalRes.rows[0].count || '0', 10);
  return { items: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function approveAndDisburse(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { rows: existing } = await pg.query('SELECT * FROM rural_finance WHERE id = $1', [id]);
  if (!existing.length) throw new Error('Rural finance record not found');
  const record = existing[0];
  if (!['applied', 'under_review', 'approved'].includes(record.status)) {
    throw new Error(`Cannot disburse from status '${record.status}'`);
  }

  const emiStart = new Date();
  emiStart.setMonth(emiStart.getMonth() + 1);

  const { rows } = await pg.query(
    `UPDATE rural_finance
        SET status = 'active', approval_date = CURRENT_DATE, disbursement_date = CURRENT_DATE,
            emi_start_date = $2, next_emi_date = $2, outstanding_principal = loan_amount
      WHERE id = $1
      RETURNING *`,
    [id, emiStart.toISOString().slice(0, 10)]
  );
  logger.info(`Rural finance disbursed: ${record.loan_number}`);
  return rows[0];
}

/**
 * Record an EMI/repayment against a rural_finance record.
 *
 * Same failure mode financialService.payEMI's BR-08 comment describes: the
 * repayment amount, the outstanding-principal reduction, and the interest
 * component recognised must all move together or the record ends up with a
 * repayment logged but the balance untouched. Reducing-balance interest for
 * the instalment is computed here (outstanding * monthly rate) rather than
 * trusting the caller, so a client cannot under-report interest and
 * over-report principal reduction.
 */
async function recordRepayment(id, { amount } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  if (!(amount > 0)) throw new Error('Repayment amount must be positive');

  return withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM rural_finance WHERE id = $1 FOR UPDATE', [id]);
    if (!rows.length) throw new Error('Rural finance record not found');
    const record = rows[0];
    if (record.status !== 'active') throw new Error(`Cannot repay a record with status '${record.status}'`);

    const outstanding = Number(record.outstanding_principal);
    const monthlyRate = Number(record.interest_rate) / 12 / 100;
    const interestComponent = r2(outstanding * monthlyRate);
    const principalComponent = r2(Math.min(amount - interestComponent, outstanding));
    if (principalComponent < 0) {
      // Payment doesn't even cover the interest due — record it entirely as
      // interest rather than letting the balance grow silently in the wrong
      // direction.
    }
    const newOutstanding = r2(Math.max(outstanding - Math.max(principalComponent, 0), 0));
    const newStatus = newOutstanding <= 0 ? 'closed' : 'active';

    const nextEmi = record.next_emi_date ? new Date(record.next_emi_date) : new Date();
    nextEmi.setMonth(nextEmi.getMonth() + 1);

    const { rows: updated } = await client.query(
      `UPDATE rural_finance
          SET principal_repaid = principal_repaid + $2,
              interest_paid = interest_paid + $3,
              outstanding_principal = $4,
              status = $5,
              next_emi_date = CASE WHEN $5 = 'closed' THEN NULL ELSE $6 END
        WHERE id = $1
        RETURNING *`,
      [id, Math.max(principalComponent, 0), interestComponent, newOutstanding, newStatus, nextEmi.toISOString().slice(0, 10)]
    );

    logger.info(`Repayment recorded for ${record.loan_number}`, { amount, interestComponent, principalComponent, newOutstanding });
    return {
      record: updated[0],
      breakdown: { amount, interest_component: interestComponent, principal_component: Math.max(principalComponent, 0), outstanding_principal: newOutstanding },
    };
  }, { name: 'ruralFinance.recordRepayment', isolation: 'repeatable read' });
}

/**
 * Refinancing opportunity check.
 *
 * Compares the remaining interest cost of the current record's rate against
 * the cheapest active FORMAL lender on file (bank/RRB/cooperative/NBFC/MFI —
 * i.e. `lender_type <> 'informal'`), over the remaining tenure, using the
 * same reducing-balance formula as the rest of this module. This is the
 * concrete instance of the schema comment on `lenders`: "a finance module
 * that cannot record [informal lending] cannot show a farmer what
 * refinancing would save them."
 */
async function checkRefinanceOpportunity(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { rows } = await pg.query('SELECT * FROM rural_finance WHERE id = $1', [id]);
  if (!rows.length) throw new Error('Rural finance record not found');
  const record = rows[0];

  if (!['active', 'approved'].includes(record.status)) {
    return { eligible: false, reason: `Record status '${record.status}' is not refinanceable`, confidence: 1 };
  }

  const outstanding = Number(record.outstanding_principal ?? record.loan_amount);
  let remainingMonths = Number(record.tenure_months);
  if (record.emi_start_date) {
    const monthsElapsed = Math.max(0, Math.floor((Date.now() - new Date(record.emi_start_date).getTime()) / (30 * 24 * 3600 * 1000)));
    remainingMonths = Math.max(1, Number(record.tenure_months) - monthsElapsed);
  }

  const { rows: lenders } = await pg.query(
    `SELECT * FROM lenders
       WHERE is_active = TRUE AND lender_type <> 'informal' AND interest_rate_min IS NOT NULL
       ORDER BY interest_rate_min ASC
       LIMIT 5`
  );

  if (!lenders.length) {
    return {
      eligible: false,
      reason: 'No formal lenders on file to compare against',
      current_rate: Number(record.interest_rate),
      confidence: 0.4,
    };
  }

  const best = lenders[0];
  const currentInterest = totalInterestOverTerm(outstanding, Number(record.interest_rate), remainingMonths);
  const altInterest = totalInterestOverTerm(outstanding, Number(best.interest_rate_min), remainingMonths);
  const savings = r2(currentInterest - altInterest);

  return {
    eligible: savings > 0,
    current_lender_type: record.lender_type,
    current_rate: Number(record.interest_rate),
    remaining_principal: outstanding,
    remaining_months: remainingMonths,
    projected_interest_at_current_rate: currentInterest,
    best_alternative: { lender_code: best.lender_code, name: best.name, lender_type: best.lender_type, rate: Number(best.interest_rate_min) },
    projected_interest_at_alternative_rate: altInterest,
    projected_savings: savings > 0 ? savings : 0,
    reasoning: {
      factors: [
        `Current: ${record.lender_type || 'unknown'} lender at ${record.interest_rate}% p.a.`,
        `Best formal alternative on file: ${best.name} (${best.lender_type}) at ${best.interest_rate_min}% p.a.`,
        `Comparison amortizes the remaining principal (₹${outstanding}) over the remaining ${remainingMonths} months at each rate.`,
      ],
      formula: 'reducing-balance EMI: interest = EMI * months - principal',
    },
    confidence: record.lender_type === 'informal' ? 0.85 : 0.65,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

router.get('/', async (req, res) => {
  try {
    const { reu_id, status, financial_product_type, page, limit } = req.query;
    const result = await listFinanceRecords({
      reu_id, status, financial_product_type,
      page: parseInt(page, 10) || 1, limit: parseInt(limit, 10) || 20,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('ruralFinanceService list failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    const { rows } = await pg.query('SELECT * FROM rural_finance WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const record = await applyForFinance(req.body || {});
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/disburse', authMiddleware, async (req, res) => {
  try {
    const record = await approveAndDisburse(req.params.id);
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/repay', authMiddleware, async (req, res) => {
  try {
    const result = await recordRepayment(req.params.id, req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/refinance-check', async (req, res) => {
  try {
    const result = await checkRefinanceOpportunity(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

function setupRoutes(app) {
  app.use('/api/v1/rural-finance', router);
}

module.exports = {
  router, setupRoutes,
  calcEmi, totalInterestOverTerm,
  applyForFinance, listFinanceRecords, approveAndDisburse, recordRepayment, checkRefinanceOpportunity,
};
