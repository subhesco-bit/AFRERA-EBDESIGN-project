/**
 * Tax and statutory compliance: TDS, e-invoice IRN, GSTR filings, RCM.
 *
 * These four were named as missing modules in the source document. They are
 * one compliance surface rather than four features — a single sale can create
 * an IRN, a GSTR-1 line, a TDS deduction on the transporter paid to move it,
 * and an RCM liability on the farmer it was bought from. Splitting them across
 * modules is how a filing ends up assembled by hand on the 19th.
 *
 * Backed by migration 056.
 */

'use strict';

const pool = require('../../database\/pool');
const { logger } = require('../../utils\/logger');

const r2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// TDS
// ---------------------------------------------------------------------------

/**
 * Statutory rates. Recorded here with their section so a deduction can be
 * explained to a deductee who queries it.
 *
 * The no-PAN case is not a penalty the platform invents — s.206AA sets 20%
 * where the deductee has not furnished a PAN, and applying the normal rate
 * instead leaves the deductor liable for the shortfall.
 */
const TDS_RATES = {
  transporter: { section: '194C', rate: 1.0, note: 'Payment to a transport contractor (individual/HUF).' },
  contractor: { section: '194C', rate: 2.0, note: 'Payment to a contractor (other than individual/HUF).' },
  commission_agent: { section: '194H', rate: 5.0, note: 'Commission or brokerage.' },
  professional: { section: '194J', rate: 10.0, note: 'Professional or technical services.' },
  fpo: { section: '194C', rate: 2.0, note: 'Contractual payment to an FPO.' },
  vendor: { section: '194C', rate: 2.0, note: 'General vendor contract payment.' },
};
const NO_PAN_RATE = 20.0;

function financialYearOf(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  // Indian FY runs April to March.
  return d.getMonth() >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}
function quarterOf(date = new Date()) {
  const m = new Date(date).getMonth();
  return m >= 3 && m <= 5 ? 'Q1' : m >= 6 && m <= 8 ? 'Q2' : m >= 9 && m <= 11 ? 'Q3' : 'Q4';
}

async function deductTds({ deducteeId, deducteeName, deducteePan, deducteeType, paymentAmountInr, paidOn }) {
  const cfg = TDS_RATES[deducteeType];
  if (!cfg) throw new Error(`Unknown deductee type: ${deducteeType}`);
  if (!(paymentAmountInr > 0)) throw new Error('paymentAmountInr must be positive');

  const noPan = !deducteePan;
  const rate = noPan ? NO_PAN_RATE : cfg.rate;
  const when = paidOn ? new Date(paidOn) : new Date();

  const { rows } = await pool.query(
    `INSERT INTO tds_deductions
       (deductee_id, deductee_name, deductee_pan, deductee_type, section,
        payment_amount_inr, tds_rate_pct, higher_rate_no_pan, quarter, financial_year)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [deducteeId ?? null, deducteeName, deducteePan ?? null, deducteeType, cfg.section,
      paymentAmountInr, rate, noPan, quarterOf(when), financialYearOf(when)]
  );
  const row = rows[0];
  return {
    ...row,
    tds_amount_inr: Number(row.tds_amount_inr),
    netPayableInr: r2(paymentAmountInr - Number(row.tds_amount_inr)),
    explanation: noPan
      ? `No PAN on record, so s.206AA applies a flat ${NO_PAN_RATE}% instead of the `
      + `usual ${cfg.rate}% under ${cfg.section}. Furnishing a PAN reduces this.`
      : `${cfg.rate}% under ${cfg.section}. ${cfg.note}`,
  };
}

/** Quarterly Form 26Q position. */
async function tdsSummary({ financialYear, quarter } = {}) {
  const fy = financialYear || financialYearOf();
  const q = quarter || quarterOf();
  const { rows } = await pool.query(
    `SELECT section, COUNT(*) AS deductions,
            SUM(payment_amount_inr) AS gross_paid,
            SUM(tds_amount_inr)     AS tds_deducted,
            COUNT(*) FILTER (WHERE deposited_on IS NULL) AS undeposited,
            COUNT(*) FILTER (WHERE higher_rate_no_pan)   AS no_pan_cases
       FROM tds_deductions
      WHERE financial_year = $1 AND quarter = $2
      GROUP BY section`,
    [fy, q]
  );
  const undeposited = rows.reduce((s, r) => s + Number(r.undeposited), 0);
  return {
    financialYear: fy, quarter: q, bySection: rows,
    totalTdsInr: rows.reduce((s, r) => s + Number(r.tds_deducted || 0), 0),
    undepositedCount: undeposited,
    warning: undeposited
      ? `${undeposited} deduction(s) have no challan recorded. TDS deducted but not `
      + 'deposited attracts interest at 1.5% per month and is a personal liability of '
      + 'the principal officer, not just a company one.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// E-invoice IRN
// ---------------------------------------------------------------------------

/**
 * Register an invoice for IRN generation.
 *
 * `environment` defaults to sandbox and must be set deliberately. A sandbox
 * IRN on a real invoice is not a valid document, the buyer cannot claim input
 * credit against it, and it looks completely normal until they try.
 */
async function registerIrn({ invoiceRef, environment = 'sandbox' }) {
  const { rows } = await pool.query(
    `INSERT INTO einvoice_irn (invoice_ref, environment, status)
     VALUES ($1,$2,'pending')
     ON CONFLICT (invoice_ref) DO UPDATE SET environment = EXCLUDED.environment
     RETURNING *`,
    [invoiceRef, environment]
  );
  return {
    ...rows[0],
    warning: environment === 'sandbox'
      ? 'SANDBOX. This IRN is not legally valid and the buyer cannot claim input credit '
      + 'against it. Set environment to production before issuing to a customer.'
      : null,
  };
}

async function recordIrnResult({ invoiceRef, irn, ackNo, ackDate, signedQr, errorCode, errorMessage }) {
  const ok = Boolean(irn);
  const { rows } = await pool.query(
    `UPDATE einvoice_irn
        SET irn = $2, ack_no = $3, ack_date = $4, signed_qr_code = $5,
            status = $6, error_code = $7, error_message = $8
      WHERE invoice_ref = $1 RETURNING *`,
    [invoiceRef, irn ?? null, ackNo ?? null, ackDate ?? null, signedQr ?? null,
      ok ? 'generated' : 'failed', errorCode ?? null,
      ok ? null : (errorMessage || 'IRP rejected the invoice without a message')]
  );
  if (!rows.length) throw new Error(`No IRN registration for invoice ${invoiceRef}`);
  return rows[0];
}

// ---------------------------------------------------------------------------
// GSTR
// ---------------------------------------------------------------------------

/**
 * Assemble a GSTR-1 or 3B position for a period from recorded invoices.
 *
 * Returns a DRAFT. Nothing here files anything: an incorrect return filed
 * automatically is far more expensive to unwind than one never filed, and the
 * signatory carries personal liability for it.
 */
async function buildGstrDraft({ returnType, period, gstin }) {
  if (!['GSTR-1', 'GSTR-3B'].includes(returnType)) {
    throw new Error(`Unsupported return type: ${returnType}`);
  }
  let totals = { b2b: 0, b2c: 0, cgst: 0, sgst: 0, igst: 0 };
  try {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(total_amount) FILTER (WHERE customer_gst_number IS NOT NULL), 0) AS b2b,
         COALESCE(SUM(total_amount) FILTER (WHERE customer_gst_number IS NULL), 0)     AS b2c,
         COALESCE(SUM(cgst_amount), 0) AS cgst,
         COALESCE(SUM(sgst_amount), 0) AS sgst,
         COALESCE(SUM(igst_amount), 0) AS igst
       FROM gst_invoices
      WHERE to_char(invoice_date, 'MM-YYYY') = $1`,
      [period]
    );
    const t = rows[0] || {};
    totals = {
      b2b: Number(t.b2b || 0), b2c: Number(t.b2c || 0),
      cgst: Number(t.cgst || 0), sgst: Number(t.sgst || 0), igst: Number(t.igst || 0),
    };
  } catch (err) {
    logger.warn('buildGstrDraft: could not read gst_invoices', { error: err.message });
  }

  const { rows } = await pool.query(
    `INSERT INTO gstr_filings
       (return_type, period, gstin, b2b_taxable_inr, b2c_taxable_inr,
        total_cgst_inr, total_sgst_inr, total_igst_inr, status, generated_json)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft',$9)
     ON CONFLICT (return_type, period, gstin) DO UPDATE SET
       b2b_taxable_inr = EXCLUDED.b2b_taxable_inr,
       b2c_taxable_inr = EXCLUDED.b2c_taxable_inr,
       total_cgst_inr  = EXCLUDED.total_cgst_inr,
       total_sgst_inr  = EXCLUDED.total_sgst_inr,
       total_igst_inr  = EXCLUDED.total_igst_inr,
       generated_json  = EXCLUDED.generated_json,
       status = 'draft'
     RETURNING *`,
    [returnType, period, gstin, totals.b2b, totals.b2c, totals.cgst, totals.sgst,
      totals.igst, JSON.stringify(totals)]
  );

  return {
    ...rows[0],
    status: 'draft',
    filed: false,
    note: 'DRAFT only. Nothing is filed automatically — an incorrect auto-filed return is '
        + 'far more expensive to unwind than one never filed, and the signatory carries '
        + 'personal liability for it.',
  };
}

// ---------------------------------------------------------------------------
// RCM
// ---------------------------------------------------------------------------

/**
 * Record a reverse-charge liability.
 *
 * Buying raw agricultural produce from an unregistered farmer shifts the GST
 * liability to the buyer. Missing it means the buyer under-declares, and the
 * platform's own invoice is the evidence trail that shows it.
 */
async function recordRcm({ invoiceRef, supplierName, supplyDescription, taxableValueInr, gstRatePct, period, itcEligible = true }) {
  if (!(taxableValueInr > 0)) throw new Error('taxableValueInr must be positive');
  const { rows } = await pool.query(
    `INSERT INTO rcm_liabilities
       (invoice_ref, supplier_name, supply_description, taxable_value_inr,
        gst_rate_pct, period, itc_eligible)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [invoiceRef ?? null, supplierName, supplyDescription, taxableValueInr,
      gstRatePct, period, itcEligible]
  );
  let row = rows[0];
  return {
    ...row,
    rcm_liability_inr: Number(row.rcm_liability_inr),
    note: 'Liability sits with the BUYER, not the farmer. '
        + (itcEligible
          ? 'Input credit is claimable once discharged, so the net cost is timing, not tax.'
          : 'Input credit is NOT available on this supply — this is a real cost, not a timing difference.'),
  };
}

async function rcmOutstanding(period) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS items, SUM(rcm_liability_inr) AS liability_inr
       FROM rcm_liabilities WHERE period = $1 AND discharged = FALSE`,
    [period]
  );
  const r = rows[0];
  return {
    period,
    items: Number(r.items),
    liabilityInr: Number(r.liability_inr || 0),
    note: Number(r.items) ? 'Undischarged RCM must be paid in cash — it cannot be set off '
                          + 'against input credit.' : null,
  };
}

module.exports = {
  deductTds, tdsSummary,
  registerIrn, recordIrnResult,
  buildGstrDraft,
  recordRcm, rcmOutstanding,
  TDS_RATES,
};

// Merged from backend/src/modules/M008
{
  const m008 = require("../../modules/M008/service");
  const { ...rest } = m008;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M077
{
  const m077 = require("../../modules/M077/service");
  const { ...rest } = m077;
  Object.assign(module.exports, rest);
}



