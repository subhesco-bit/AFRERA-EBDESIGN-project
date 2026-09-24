/**
 * Corporate / ecosystem insurance platform
 * — NOT retail policy sales as insurer
 * — Employees, assets, liabilities, vehicles, transit, credit
 * — Farmers / logistics / cold-storage as risk contexts
 * — PolicyBazaar-style support: compare, register, FNOL, renewals, docs
 */

'use strict';

const { randomUUID } = require('crypto');

const COVER_CLASSES = [
  {
    id: 'employee_group_health',
    name: 'Employee group health',
    class: 'employee',
    typical_si_inr: 500000,
    premium_rate_proxy: 0.012,
    for: ['corporate_hr', 'fpo_staff'],
  },
  {
    id: 'employee_pa',
    name: 'Employee personal accident',
    class: 'employee',
    typical_si_inr: 1000000,
    premium_rate_proxy: 0.0015,
    for: ['corporate_hr', 'logistics_staff'],
  },
  {
    id: 'asset_cold_storage',
    name: 'Cold storage building & machinery',
    class: 'asset',
    typical_si_inr: 20000000,
    premium_rate_proxy: 0.008,
    for: ['cold_storage', 'warehouse'],
  },
  {
    id: 'asset_stock',
    name: 'Stock in cold store / warehouse',
    class: 'asset',
    typical_si_inr: 5000000,
    premium_rate_proxy: 0.01,
    for: ['cold_storage', 'warehouse', 'farmer_produce'],
  },
  {
    id: 'liability_public',
    name: 'Public liability',
    class: 'liability',
    typical_si_inr: 10000000,
    premium_rate_proxy: 0.002,
    for: ['cold_storage', 'logistics', 'processing'],
  },
  {
    id: 'vehicle_fleet',
    name: 'Fleet motor (OD+TP proxy)',
    class: 'vehicle',
    typical_si_inr: 800000,
    premium_rate_proxy: 0.03,
    for: ['logistics', 'fleet'],
  },
  {
    id: 'transit_inland',
    name: 'Inland transit / cargo',
    class: 'transit',
    typical_si_inr: 2000000,
    premium_rate_proxy: 0.004,
    for: ['logistics', 'ecommerce_fulfillment', 'farmer_dispatch'],
  },
  {
    id: 'transit_reefer',
    name: 'Temperature-controlled transit',
    class: 'transit',
    typical_si_inr: 2000000,
    premium_rate_proxy: 0.006,
    for: ['logistics', 'cold_chain'],
  },
  {
    id: 'credit_trade',
    name: 'Trade credit (receivables)',
    class: 'credit',
    typical_si_inr: 5000000,
    premium_rate_proxy: 0.015,
    for: ['b2b', 'fpo', 'marketplace_seller'],
  },
  {
    id: 'farmer_crop_master',
    name: 'Crop risk object (master / scheme-linked)',
    class: 'farmer_linked',
    typical_si_inr: 100000,
    premium_rate_proxy: 0.02,
    for: ['farmer', 'fpo'],
    note: 'Not retail sale of PMFBY; links risk object to external scheme or master policy',
  },
  {
    id: 'farmer_livestock_master',
    name: 'Livestock risk object (master / scheme-linked)',
    class: 'farmer_linked',
    typical_si_inr: 50000,
    premium_rate_proxy: 0.035,
    for: ['farmer', 'dairy'],
  },
];

const policyRegister = new Map();
const claims = new Map();

function safetyFloor() {
  return (
    'SUPPORT PLATFORM ONLY — not an insurer. Quotes are proxies for comparison. ' +
    'Binding cover, premium debit, and claim settlement require licensed insurer / intermediary / government scheme. ' +
    'IRDAI-regulated activity stays with authorised entities.'
  );
}

function listCovers(filter = {}) {
  let list = COVER_CLASSES;
  if (filter.class) list = list.filter((c) => c.class === filter.class);
  if (filter.for_context) {
    list = list.filter((c) => (c.for || []).includes(filter.for_context));
  }
  return {
    covers: list,
    positioning: 'corporate_ecosystem_support',
    safety_floor: safetyFloor(),
    confidence: 1,
  };
}

/** PolicyBazaar-style comparison */
function compare(data = {}) {
  const sum = Number(data.sum_insured) || null;
  const contexts = data.contexts || data.for_context ? [data.for_context] : null;
  let list = COVER_CLASSES;
  if (data.classes) list = list.filter((c) => data.classes.includes(c.class));
  if (contexts) {
    list = list.filter((c) => contexts.some((ctx) => (c.for || []).includes(ctx)));
  }
  const rows = list.map((c) => {
    const si = sum || c.typical_si_inr;
    const premium_proxy = Math.round(si * c.premium_rate_proxy * 100) / 100;
    return {
      cover_id: c.id,
      name: c.name,
      class: c.class,
      sum_insured: si,
      premium_proxy_inr: premium_proxy,
      rate_proxy: c.premium_rate_proxy,
      suitable_for: c.for,
      note: c.note || null,
    };
  });
  return {
    comparison: rows,
    sorted_by: 'premium_proxy_asc',
    comparison: rows.sort((a, b) => a.premium_proxy_inr - b.premium_proxy_inr),
    safety_floor: safetyFloor(),
    advisory: true,
    confidence: 0.85,
    basis: 'Proxy rates for decision-support comparison only — not insurer quotations.',
  };
}

/** Register a corporate policy on the books (metadata; insurer is external) */
function registerPolicy(data = {}) {
  const id = data.policy_id || `POL-${randomUUID().slice(0, 8)}`;
  const rec = {
    policy_id: id,
    cover_id: data.cover_id || 'asset_cold_storage',
    insurer_name: data.insurer_name || 'EXTERNAL_INSURER',
    policy_number: data.policy_number || null,
    sum_insured: Number(data.sum_insured) || 0,
    premium: Number(data.premium) || null,
    effective_from: data.effective_from || new Date().toISOString().slice(0, 10),
    effective_to: data.effective_to || null,
    insured_party: data.insured_party || null,
    risk_objects: data.risk_objects || [], // asset ids, vehicle ids, employee group, shipment templates
    contexts: data.contexts || [], // cold_storage, logistics, farmer, corporate_hr
    documents: data.documents || [],
    status: data.status || 'active',
    layer: 'insurance_corporate',
    created_at: new Date().toISOString(),
  };
  policyRegister.set(id, rec);
  return {
    policy: rec,
    safety_floor: safetyFloor(),
    confidence: 0.95,
    erp_hooks: { asset_link: true, prepaid_expense: true },
  };
}

function listPolicies(filter = {}) {
  let all = [...policyRegister.values()];
  if (filter.context) all = all.filter((p) => (p.contexts || []).includes(filter.context));
  if (filter.status) all = all.filter((p) => p.status === filter.status);
  return { policies: all, count: all.length, confidence: 1 };
}

/** FNOL — claim intake support desk */
function claimIntake(data = {}) {
  const claim_id = `CLM-${randomUUID().slice(0, 8)}`;
  const claim = {
    claim_id,
    policy_id: data.policy_id || null,
    cover_class: data.cover_class || null,
    loss_type: data.loss_type || 'unknown',
    loss_date: data.loss_date || new Date().toISOString().slice(0, 10),
    claimed_amount: Number(data.claimed_amount) || 0,
    description: data.description || '',
    risk_object_id: data.risk_object_id || null, // vehicle, bay, shipment, employee
    context: data.context || null, // logistics, cold_storage, farmer, corporate
    status: 'fnol_received',
    timeline: [{ status: 'fnol_received', at: new Date().toISOString() }],
    documents_requested: ['photos', 'fir_or_incident', 'policy_copy', 'estimate'],
    safety_floor: 'Claim support only — settlement by insurer/TPA.',
  };
  claims.set(claim_id, claim);
  return { claim, confidence: 0.9, advisory: true, safety_floor: safetyFloor() };
}

function claimStatus(claim_id) {
  const c = claims.get(claim_id);
  if (!c) return { error: 'Claim not found', claim_id };
  return { claim: c, confidence: 1 };
}

function advanceClaim(claim_id, status, note) {
  const c = claims.get(claim_id);
  if (!c) return { error: 'Claim not found' };
  const allowed = ['fnol_received', 'documents_pending', 'submitted_to_insurer', 'under_survey', 'settled', 'rejected', 'closed'];
  if (!allowed.includes(status)) {
    return { error: 'Invalid claim status', allowed };
  }
  c.status = status;
  c.timeline.push({ status, at: new Date().toISOString(), note: note || null });
  return { claim: c, confidence: 1, safety_floor: safetyFloor() };
}

/** Renewal calendar */
function renewals(within_days = 60) {
  const today = new Date();
  const horizon = new Date(today.getTime() + within_days * 86400000);
  const due = [...policyRegister.values()].filter((p) => {
    if (!p.effective_to) return false;
    const end = new Date(p.effective_to);
    return end >= today && end <= horizon;
  });
  return {
    within_days,
    renewals_due: due,
    count: due.length,
    confidence: 1,
    safety_floor: safetyFloor(),
  };
}

/** Suggest covers for a context (farmers, logistics, cold storage, corporate) */
function suggestForContext(context, data = {}) {
  const list = COVER_CLASSES.filter((c) => (c.for || []).includes(context));
  const comparison = compare({
    for_context: context,
    sum_insured: data.sum_insured,
    classes: list.map((c) => c.class),
  });
  return {
    context,
    recommended_cover_ids: list.map((c) => c.id),
    ...comparison,
    integration_hints: {
      logistics: ['link shipment_id to transit cover'],
      cold_storage: ['link bay/asset_id to asset + stock cover'],
      farmer: ['link lot/herd as risk_object under master/scheme — subsidy eligibility stays Farmer layer'],
      corporate_hr: ['link employee_group_id to group covers'],
    }[context] || [],
  };
}

async function operate(data = {}) {
  const action = data.action || 'list_covers';
  switch (action) {
    case 'list_covers':
      return listCovers(data);
    case 'compare':
      return compare(data);
    case 'register_policy':
      return registerPolicy(data);
    case 'list_policies':
      return listPolicies(data);
    case 'claim_intake':
      return claimIntake(data);
    case 'claim_status':
      return claimStatus(data.claim_id);
    case 'claim_advance':
      return advanceClaim(data.claim_id, data.status, data.note);
    case 'renewals':
      return renewals(Number(data.within_days) || 60);
    case 'suggest':
      return suggestForContext(data.context || 'logistics', data);
    default:
      return { error: 'Unknown action', action, safety_floor: safetyFloor() };
  }
}

module.exports = {
  COVER_CLASSES,
  operate,
  listCovers,
  compare,
  registerPolicy,
  listPolicies,
  claimIntake,
  claimStatus,
  advanceClaim,
  renewals,
  suggestForContext,
  safetyFloor,
};
