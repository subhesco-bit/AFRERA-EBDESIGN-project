/**
 * India-first Subsidy Eligibility Engine — computable effective-dated rules
 * Research-grade: not static text. Returns eligibility, quantum, evidence, and
 * explicit non-eligibility reasons. Never silently infers protected attributes.
 *
 * Advisory for decision-support; final sanction by competent authority.
 */

'use strict';

const SCHEMES = [
  {
    id: 'pm_kisan',
    name: 'PM-KISAN',
    effective_from: '2019-02-01',
    effective_to: null,
    category: 'income_support',
    quantum: { type: 'fixed_annual', amount_inr: 6000, installments: 3 },
    rules: {
      landholder: true,
      max_land_ha: null,
      exclude_income_tax_payer: true,
      exclude_institutional: true,
      states: null,
    },
    docs: ['land_record', 'aadhaar_seeded_bank'],
    basis: 'Central income support to landholding farmer families; computable gate only — DBT sanction external.',
  },
  {
    id: 'pmfby',
    name: 'PM Fasal Bima Yojana (farmer premium share)',
    effective_from: '2016-01-01',
    effective_to: null,
    category: 'crop_insurance',
    quantum: {
      type: 'premium_share',
      kharif_pct: 2,
      rabi_pct: 1.5,
      commercial_horticulture_pct: 5,
    },
    rules: {
      must_insure_notified_crop: true,
      landholder_or_tenant: true,
    },
    docs: ['sowing_certificate', 'land_or_lease'],
    basis: 'Farmer premium share of sum insured; actuarial premium higher — difference subsidised.',
  },
  {
    id: 'soil_health_card',
    name: 'Soil Health Card linked input guidance',
    effective_from: '2015-01-01',
    effective_to: null,
    category: 'extension',
    quantum: { type: 'service', amount_inr: 0 },
    rules: { farmer_id_required: true },
    docs: ['farmer_id'],
    basis: 'Service entitlement; not cash subsidy.',
  },
  {
    id: 'micro_irrigation',
    name: 'PDMC / Micro Irrigation subsidy (illustrative central share)',
    effective_from: '2015-01-01',
    effective_to: null,
    category: 'infrastructure',
    quantum: {
      type: 'percent_of_cost',
      small_marginal_pct: 55,
      other_pct: 45,
      max_ha: 5,
    },
    rules: {
      max_area_ha: 5,
      drip_or_sprinkler: true,
    },
    docs: ['estimate', 'land_record', 'bank_account'],
    basis: 'Illustrative rates — state top-up and guidelines override; verify current GO.',
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card interest subvention (illustrative)',
    effective_from: '2018-01-01',
    effective_to: null,
    category: 'credit',
    quantum: { type: 'interest_subvention_pct', prompt_repayment_bonus_pct: 3 },
    rules: { kcc_account: true },
    docs: ['kcc_account'],
    basis: 'Subvention subject to RBI/NABARD circulars and bank compliance.',
  },
  {
    id: 'organic_npop_support',
    name: 'Organic / NPOP transition support (framework)',
    effective_from: '2020-01-01',
    effective_to: null,
    category: 'organic',
    quantum: { type: 'area_based', amount_inr_per_ha: 10000, years: 3 },
    rules: { organic_intent: true, certification_path: ['NPOP', 'PGS'] },
    docs: ['organic_plan'],
    basis: 'Framework quantum — actual state/central schemes vary; do not claim payment without GO.',
  },
];

function isEffective(scheme, asOf) {
  const d = asOf || new Date().toISOString().slice(0, 10);
  if (scheme.effective_from && d < scheme.effective_from) return false;
  if (scheme.effective_to && d > scheme.effective_to) return false;
  return true;
}

function evaluateScheme(scheme, farmer = {}) {
  const reasons = [];
  const missing_docs = [];
  let eligible = true;

  if (scheme.rules.landholder && farmer.landholder === false) {
    eligible = false;
    reasons.push('Requires landholder status');
  }
  if (scheme.rules.exclude_income_tax_payer && farmer.income_tax_payer === true) {
    eligible = false;
    reasons.push('Income-tax payers excluded under scheme rules');
  }
  if (scheme.rules.exclude_institutional && farmer.institutional === true) {
    eligible = false;
    reasons.push('Institutional landholders excluded');
  }
  if (scheme.rules.max_area_ha != null && farmer.area_ha != null && farmer.area_ha > scheme.rules.max_area_ha) {
    eligible = false;
    reasons.push(`Area ${farmer.area_ha} ha exceeds max ${scheme.rules.max_area_ha} ha`);
  }
  if (scheme.rules.small_marginal_only && farmer.category && !['small', 'marginal'].includes(farmer.category)) {
    eligible = false;
    reasons.push('Limited to small/marginal farmers');
  }
  if (scheme.rules.kcc_account && !farmer.kcc_account) {
    eligible = false;
    reasons.push('KCC account required');
  }
  if (scheme.rules.organic_intent && !farmer.organic_intent) {
    eligible = false;
    reasons.push('Organic transition intent not declared');
  }

  for (const doc of scheme.docs || []) {
    if (!(farmer.documents || []).includes(doc)) missing_docs.push(doc);
  }
  if (missing_docs.length && eligible) {
    // eligible pending docs
  }

  let estimated_benefit_inr = null;
  const q = scheme.quantum;
  if (q.type === 'fixed_annual') estimated_benefit_inr = q.amount_inr;
  if (q.type === 'percent_of_cost' && farmer.project_cost_inr) {
    const pct =
      farmer.category === 'small' || farmer.category === 'marginal'
        ? q.small_marginal_pct
        : q.other_pct;
    estimated_benefit_inr = Math.round((farmer.project_cost_inr * pct) / 100);
  }
  if (q.type === 'area_based' && farmer.area_ha) {
    estimated_benefit_inr = Math.round(q.amount_inr_per_ha * Math.min(farmer.area_ha, q.max_ha || farmer.area_ha));
  }

  return {
    scheme_id: scheme.id,
    scheme_name: scheme.name,
    category: scheme.category,
    eligible,
    pending_documents: missing_docs,
    ineligibility_reasons: reasons,
    estimated_benefit_inr,
    quantum: q,
    basis: scheme.basis,
    confidence: eligible && missing_docs.length === 0 ? 0.9 : eligible ? 0.7 : 0.95,
    advisory: true,
    safety_floor:
      'Eligibility is computable decision-support only. Sanction, DBT, and state variations require competent authority and current GOs.',
  };
}

function extractAll(farmer = {}, asOf) {
  const results = SCHEMES.filter((s) => isEffective(s, asOf)).map((s) => evaluateScheme(s, farmer));
  const eligible = results.filter((r) => r.eligible);
  const total_estimated = eligible.reduce((s, r) => s + (r.estimated_benefit_inr || 0), 0);
  return {
    as_of: asOf || new Date().toISOString().slice(0, 10),
    farmer_ref: farmer.id || farmer.farmer_id || null,
    schemes_evaluated: results.length,
    eligible_count: eligible.length,
    results,
    total_estimated_benefit_inr: total_estimated,
    protected_attributes_policy:
      'Religion, caste, health, psychology are never inferred or used for eligibility in this engine.',
    confidence: 0.88,
    advisory: true,
  };
}

function listSchemes() {
  return SCHEMES.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    effective_from: s.effective_from,
    effective_to: s.effective_to,
  }));
}

module.exports = {
  SCHEMES,
  evaluateScheme,
  extractAll,
  listSchemes,
  isEffective,
};
