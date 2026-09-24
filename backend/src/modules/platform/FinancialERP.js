/**
 * Financial + Accounting ERP (India-oriented)
 * Chart of accounts, journal, ledger, trial balance, P&L, GST tax engine.
 * Educational/ops scaffolding — not a CA-certified books product.
 */

const { randomUUID } = require('crypto');

const FIN_DISCLAIMER =
  'Financial ERP is operational scaffolding. GST rates and HSN must be verified against current CBIC notifications. Not a substitute for a Chartered Accountant or GST practitioner.';

/** Chart of accounts — standard farm/clinic/nutrition SME */
const COA = [
  { code: '1000', name: 'Assets', type: 'header' },
  { code: '1100', name: 'Cash', type: 'asset' },
  { code: '1200', name: 'Bank', type: 'asset' },
  { code: '1300', name: 'Accounts Receivable', type: 'asset' },
  { code: '1400', name: 'Inventory', type: 'asset' },
  { code: '1500', name: 'Fixed Assets', type: 'asset' },
  { code: '2000', name: 'Liabilities', type: 'header' },
  { code: '2100', name: 'Accounts Payable', type: 'liability' },
  { code: '2200', name: 'GST Output Liability', type: 'liability' },
  { code: '2210', name: 'CGST Payable', type: 'liability' },
  { code: '2220', name: 'SGST Payable', type: 'liability' },
  { code: '2230', name: 'IGST Payable', type: 'liability' },
  { code: '2240', name: 'GST Input Credit', type: 'asset' },
  { code: '2300', name: 'Loans', type: 'liability' },
  { code: '3000', name: 'Equity', type: 'header' },
  { code: '3100', name: 'Capital', type: 'equity' },
  { code: '3200', name: 'Retained Earnings', type: 'equity' },
  { code: '4000', name: 'Income', type: 'header' },
  { code: '4100', name: 'Sales / Service Income', type: 'income' },
  { code: '4200', name: 'Other Income', type: 'income' },
  { code: '5000', name: 'Expenses', type: 'header' },
  { code: '5100', name: 'Cost of Goods / Inputs', type: 'expense' },
  { code: '5200', name: 'Salaries', type: 'expense' },
  { code: '5300', name: 'Feed / Medicine / Seed Expense', type: 'expense' },
  { code: '5400', name: 'Transport', type: 'expense' },
  { code: '5500', name: 'Utilities', type: 'expense' },
  { code: '5600', name: 'GST Expense (if non-creditable)', type: 'expense' },
];

const journals = [];
const parties = new Map();

/** India GST rate cards — illustrative; verify live law */
const GST_RATE_CARDS = [
  { id: 'gst0', rate: 0, label: 'Nil rated / exempt (illustrative)' },
  { id: 'gst5', rate: 5, label: '5% (many food grains, some agro inputs — verify HSN)' },
  { id: 'gst12', rate: 12, label: '12%' },
  { id: 'gst18', rate: 18, label: '18% (many services, packaged goods — verify)' },
  { id: 'gst28', rate: 28, label: '28%' },
];

/** Module default HSN/SAC hints — not authoritative */
const HSN_HINTS = {
  veterinary: [
    { sku_type: 'medicine', hsn_hint: '3004', gst_card: 'gst12', note: 'Verify actual HSN for each SKU' },
    { sku_type: 'vaccine', hsn_hint: '3002', gst_card: 'gst12', note: 'Verify' },
    { sku_type: 'consult_service', sac_hint: '9983', gst_card: 'gst18', note: 'Professional services often 18%' },
  ],
  nutrition: [
    { sku_type: 'food_staple', hsn_hint: '1006', gst_card: 'gst0', note: 'Many unbranded staples nil — packaged may differ' },
    { sku_type: 'supplement', hsn_hint: '2106', gst_card: 'gst18', note: 'Verify' },
    { sku_type: 'consult_service', sac_hint: '9983', gst_card: 'gst18', note: 'Diet consult service' },
  ],
  agro: [
    { sku_type: 'seed', hsn_hint: '1209', gst_card: 'gst5', note: 'Verify seed HSN' },
    { sku_type: 'fertilizer', hsn_hint: '3105', gst_card: 'gst5', note: 'Many fertilizers 5% — verify' },
    { sku_type: 'pesticide', hsn_hint: '3808', gst_card: 'gst18', note: 'Verify' },
    { sku_type: 'produce_sale', hsn_hint: '0701', gst_card: 'gst0', note: 'Fresh produce often exempt — packaged branded differs' },
  ],
};

function getRate(cardId) {
  return GST_RATE_CARDS.find((c) => c.id === cardId) || GST_RATE_CARDS[3];
}

/**
 * Compute GST for a line
 * @param {object} input taxable_value, rate or gst_card, supply_type: intra|inter, place_of_supply rules simplified
 */
function computeGst(input = {}) {
  const taxable = Number(input.taxable_value) || 0;
  const rate = input.rate != null ? Number(input.rate) : getRate(input.gst_card || 'gst18').rate;
  const supply = String(input.supply_type || 'intra').toLowerCase(); // intra-state → CGST+SGST; inter → IGST
  const tax = Math.round(taxable * (rate / 100) * 100) / 100;

  if (supply === 'inter' || supply === 'interstate') {
    return {
      taxable_value: taxable,
      rate,
      supply_type: 'inter',
      cgst: 0,
      sgst: 0,
      igst: tax,
      total_tax: tax,
      grand_total: Math.round((taxable + tax) * 100) / 100,
      hsn_or_sac: input.hsn || input.sac || null,
    };
  }
  const half = Math.round((tax / 2) * 100) / 100;
  return {
    taxable_value: taxable,
    rate,
    supply_type: 'intra',
    cgst: half,
    sgst: half,
    igst: 0,
    total_tax: half * 2,
    grand_total: Math.round((taxable + half * 2) * 100) / 100,
    hsn_or_sac: input.hsn || input.sac || null,
  };
}

function createInvoice(input = {}) {
  const lines = (input.lines || []).map((line) => {
    const gst = computeGst({
      taxable_value: Number(line.qty || 1) * Number(line.rate || line.unit_price || 0),
      gst_card: line.gst_card || input.gst_card || 'gst18',
      rate: line.gst_rate,
      supply_type: input.supply_type || 'intra',
      hsn: line.hsn,
      sac: line.sac,
    });
    return { ...line, gst };
  });

  const taxable = lines.reduce((s, l) => s + l.gst.taxable_value, 0);
  const cgst = lines.reduce((s, l) => s + l.gst.cgst, 0);
  const sgst = lines.reduce((s, l) => s + l.gst.sgst, 0);
  const igst = lines.reduce((s, l) => s + l.gst.igst, 0);

  const inv = {
    invoice_id: randomUUID(),
    module: input.module || 'agro',
    type: input.type || 'tax_invoice', // tax_invoice | bill_of_supply | credit_note
    party: input.party || null,
    party_gstin: input.party_gstin || null,
    own_gstin: input.own_gstin || null,
    place_of_supply: input.place_of_supply || null,
    supply_type: input.supply_type || 'intra',
    lines,
    totals: {
      taxable: Math.round(taxable * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      grand_total: Math.round((taxable + cgst + sgst + igst) * 100) / 100,
    },
    status: 'draft',
    created_at: new Date().toISOString(),
    disclaimer: FIN_DISCLAIMER,
  };

  // Journal: Dr AR, Cr Sales, Cr GST liability
  postJournal({
    module: inv.module,
    narration: `Invoice ${inv.invoice_id.slice(0, 8)}`,
    lines: [
      { account: '1300', debit: inv.totals.grand_total, credit: 0 },
      { account: '4100', debit: 0, credit: inv.totals.taxable },
      ...(inv.totals.cgst ? [{ account: '2210', debit: 0, credit: inv.totals.cgst }] : []),
      ...(inv.totals.sgst ? [{ account: '2220', debit: 0, credit: inv.totals.sgst }] : []),
      ...(inv.totals.igst ? [{ account: '2230', debit: 0, credit: inv.totals.igst }] : []),
    ],
    ref: inv.invoice_id,
  });

  return inv;
}

function postJournal(input = {}) {
  const j = {
    journal_id: randomUUID(),
    module: input.module || 'agro',
    narration: input.narration || '',
    lines: input.lines || [],
    ref: input.ref || null,
    at: new Date().toISOString(),
  };
  const deb = j.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const cre = j.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  j.balanced = Math.abs(deb - cre) < 0.05;
  journals.push(j);
  return j;
}

function trialBalance(module) {
  const map = {};
  for (const j of journals) {
    if (module && j.module !== module) continue;
    for (const l of j.lines) {
      if (!map[l.account]) map[l.account] = { account: l.account, debit: 0, credit: 0 };
      map[l.account].debit += Number(l.debit) || 0;
      map[l.account].credit += Number(l.credit) || 0;
    }
  }
  const rows = Object.values(map).map((r) => {
    const coa = COA.find((c) => c.code === r.account);
    return {
      ...r,
      name: coa?.name || r.account,
      type: coa?.type,
      debit: Math.round(r.debit * 100) / 100,
      credit: Math.round(r.credit * 100) / 100,
    };
  });
  return { module: module || 'all', rows, disclaimer: FIN_DISCLAIMER };
}

function profitAndLoss(module) {
  const tb = trialBalance(module);
  let income = 0;
  let expense = 0;
  for (const r of tb.rows) {
    if (r.type === 'income') income += r.credit - r.debit;
    if (r.type === 'expense') expense += r.debit - r.credit;
  }
  return {
    module: module || 'all',
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    net: Math.round((income - expense) * 100) / 100,
    disclaimer: FIN_DISCLAIMER,
  };
}

function gstSummary(module) {
  // From journals liability accounts — simplified
  const tb = trialBalance(module);
  const pick = (code) => tb.rows.find((r) => r.account === code);
  return {
    module: module || 'all',
    cgst_payable: pick('2210')?.credit || 0,
    sgst_payable: pick('2220')?.credit || 0,
    igst_payable: pick('2230')?.credit || 0,
    input_credit: pick('2240')?.debit || 0,
    note: 'Simplified ledger view — file GST returns via GSTN/GSP with practitioner',
    rate_cards: GST_RATE_CARDS,
    hsn_hints: module ? HSN_HINTS[module] : HSN_HINTS,
    disclaimer: FIN_DISCLAIMER,
  };
}

function financialDashboard(module) {
  return {
    module: module || 'all',
    trial_balance: trialBalance(module),
    pnl: profitAndLoss(module),
    gst: gstSummary(module),
    journal_count: journals.filter((j) => !module || j.module === module).length,
    coa: COA,
    disclaimer: FIN_DISCLAIMER,
  };
}

module.exports = {
  COA,
  GST_RATE_CARDS,
  HSN_HINTS,
  computeGst,
  createInvoice,
  postJournal,
  trialBalance,
  profitAndLoss,
  gstSummary,
  financialDashboard,
  FIN_DISCLAIMER,
};
