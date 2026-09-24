/**
 * Preseason / future purchase + sales analysis driven dynamic pricing
 * Integrates: dynamic pricing, wallet holds, contract farming link, ERP hooks, AI evidence
 */

'use strict';

const { randomUUID } = require('crypto');
const wallet = require('./walletService');
const pricing = require('../ecommerce/dynamicPricingEngine');
const contractFarming = require('../farmer/contractFarmingService');

let erp;
try {
  erp = require('../research-grade/erpDoubleEntrySpine');
} catch {
  erp = null;
}

let aiGateway;
try {
  aiGateway = require('../research-grade/aiBackboneEvidenceGateway');
} catch {
  aiGateway = null;
}

/** Historical preseason demand signals (seed; replace with real analytics) */
const SALES_HISTORY = {
  tomato: [
    { season: 'kharif', year: 2024, booked_kg: 12000, fulfilled_kg: 11000, avg_price: 42 },
    { season: 'kharif', year: 2025, booked_kg: 15000, fulfilled_kg: 14000, avg_price: 46 },
    { season: 'rabi', year: 2025, booked_kg: 8000, fulfilled_kg: 7800, avg_price: 40 },
  ],
  wheat: [
    { season: 'rabi', year: 2024, booked_kg: 50000, fulfilled_kg: 48000, avg_price: 26 },
    { season: 'rabi', year: 2025, booked_kg: 55000, fulfilled_kg: 53000, avg_price: 28 },
  ],
  rice_basmati: [
    { season: 'kharif', year: 2024, booked_kg: 20000, fulfilled_kg: 19000, avg_price: 98 },
    { season: 'kharif', year: 2025, booked_kg: 22000, fulfilled_kg: 21000, avg_price: 102 },
  ],
};

const orders = new Map();

const ORDER_STATES = {
  draft: ['priced', 'cancelled'],
  priced: ['wallet_held', 'cancelled'],
  wallet_held: ['confirmed', 'cancelled'],
  confirmed: ['in_season', 'cancelled'],
  in_season: ['delivered', 'partial', 'defaulted'],
  delivered: ['settled'],
  partial: ['settled', 'defaulted'],
  settled: [],
  defaulted: ['settled'],
  cancelled: [],
};

function analyzePreseason(commodity, season) {
  const rows = (SALES_HISTORY[commodity] || []).filter((r) => !season || r.season === season);
  if (!rows.length) {
    return {
      commodity,
      season: season || null,
      signal: 'no_history',
      demand_index: 1.0,
      price_bias: 1.0,
      confidence: 0.4,
      rows: [],
    };
  }
  const last = rows[rows.length - 1];
  const prev = rows.length > 1 ? rows[rows.length - 2] : last;
  const growth =
    prev.booked_kg > 0 ? (last.booked_kg - prev.booked_kg) / prev.booked_kg : 0;
  const fill = last.fulfilled_kg / Math.max(1, last.booked_kg);
  // Strong booking growth + high fill → tighten supply / raise preseason price
  let demand_index = 1 + Math.max(-0.15, Math.min(0.25, growth));
  if (fill > 0.95) demand_index += 0.05;
  if (fill < 0.8) demand_index -= 0.05;
  const price_bias = Math.max(0.9, Math.min(1.2, demand_index));
  return {
    commodity,
    season: season || last.season,
    signal: growth > 0.1 ? 'rising_demand' : growth < -0.05 ? 'soft_demand' : 'stable',
    demand_index: Math.round(demand_index * 1000) / 1000,
    price_bias: Math.round(price_bias * 1000) / 1000,
    growth_pct: Math.round(growth * 1000) / 10,
    fill_rate: Math.round(fill * 1000) / 1000,
    last_avg_price: last.avg_price,
    confidence: 0.75,
    rows,
    basis: 'YoY booked volume growth + fulfillment rate → preseason price bias',
  };
}

function mapSkuCommodity(sku) {
  const map = {
    'TOM-ORG-1KG': 'tomato',
    'RICE-BAS-5KG': 'rice_basmati',
    'SEED-WHEAT-10KG': 'wheat',
  };
  return map[sku] || null;
}

/**
 * Price preseason line: geo dynamic price × preseason analysis bias
 */
function pricePreseasonLine(sku, opts = {}) {
  const base = pricing.priceSku(sku, {
    lat: opts.lat,
    lng: opts.lng,
    strategy: opts.strategy || 'balanced',
    cold_chain: opts.cold_chain,
  });
  const commodity = mapSkuCommodity(sku) || base.commodity;
  const analysis = analyzePreseason(commodity, opts.season);
  const preseason_price =
    Math.round(base.price * analysis.price_bias * 100) / 100;

  // Early-bird discount if booking far ahead
  const months_ahead = Number(opts.months_ahead) || 3;
  let early_bird = 1;
  if (months_ahead >= 4) early_bird = 0.97;
  if (months_ahead >= 6) early_bird = 0.94;
  const final_price = Math.round(preseason_price * early_bird * 100) / 100;

  return {
    ...base,
    preseason: true,
    analysis,
    early_bird_factor: early_bird,
    months_ahead,
    price: final_price,
    list_dynamic_price: base.price,
    confidence: Math.min(base.confidence, analysis.confidence),
    basis: `${base.basis} × preseason bias ${analysis.price_bias} × early_bird ${early_bird}`,
  };
}

function createOrder(data = {}) {
  const id = data.preseason_order_id || `PSO-${randomUUID().slice(0, 8)}`;
  const linesIn = data.lines || [{ sku: 'TOM-ORG-1KG', qty: 100 }];
  const pricedLines = linesIn.map((l) => {
    const p = pricePreseasonLine(l.sku, data);
    const qty = Number(l.qty) || 1;
    return {
      sku: l.sku,
      qty,
      unit_price: p.price,
      amount: Math.round(p.price * qty * 100) / 100,
      pricing: p,
    };
  });
  const total = pricedLines.reduce((s, x) => s + x.amount, 0);
  const deposit_pct = Number(data.deposit_pct) != null ? Number(data.deposit_pct) : 0.2;
  const deposit = Math.round(total * deposit_pct * 100) / 100;

  const rec = {
    preseason_order_id: id,
    layer: 'ecommerce',
    state: 'priced',
    buyer_id: data.buyer_id || null,
    farmer_id: data.farmer_id || null,
    season: data.season || 'kharif',
    year: data.year || new Date().getFullYear(),
    lines: pricedLines,
    total,
    deposit_pct,
    deposit_inr: deposit,
    wallet_hold_id: null,
    contract_id: data.contract_id || null,
    lat: data.lat,
    lng: data.lng,
    history: [{ state: 'priced', at: new Date().toISOString() }],
    erp_journal_ids: [],
    ai_evidence_id: null,
    created_at: new Date().toISOString(),
  };
  orders.set(id, rec);
  return rec;
}

function transitionOrder(rec, to) {
  if (!(ORDER_STATES[rec.state] || []).includes(to)) {
    const err = new Error(`Invalid preseason transition ${rec.state} → ${to}`);
    err.code = 'PSO_INVALID';
    err.allowed = ORDER_STATES[rec.state];
    throw err;
  }
  rec.state = to;
  rec.history.push({ state: to, at: new Date().toISOString() });
}

/** Hold deposit on buyer wallet */
function holdDeposit(preseason_order_id) {
  const rec = orders.get(preseason_order_id);
  if (!rec) {
    const err = new Error('Preseason order not found');
    err.code = 'PSO_NOT_FOUND';
    throw err;
  }
  if (!rec.buyer_id) {
    const err = new Error('buyer_id required for wallet hold');
    err.code = 'PSO_BUYER';
    throw err;
  }
  const h = wallet.hold(rec.buyer_id, rec.deposit_inr, {
    ref: rec.preseason_order_id,
    hold_id: `HLD-${rec.preseason_order_id}`,
  });
  rec.wallet_hold_id = h.hold_id;
  transitionOrder(rec, 'wallet_held');
  return { order: rec, wallet: h };
}

function confirm(preseason_order_id, opts = {}) {
  const rec = orders.get(preseason_order_id);
  if (!rec) {
    const err = new Error('Preseason order not found');
    err.code = 'PSO_NOT_FOUND';
    throw err;
  }
  if (rec.state === 'priced') holdDeposit(preseason_order_id);
  if (rec.state !== 'wallet_held' && rec.state !== 'confirmed') {
    // allow confirm from wallet_held
  }
  if (rec.wallet_hold_id) {
    wallet.captureHold(rec.buyer_id, rec.deposit_inr, { ref: rec.preseason_order_id });
  }
  transitionOrder(rec, 'confirmed');

  // Optional contract farming link
  if (opts.create_contract && rec.farmer_id) {
    const cf = contractFarming.create({
      farmer_id: rec.farmer_id,
      buyer_id: rec.buyer_id,
      crop: rec.lines[0] && mapSkuCommodity(rec.lines[0].sku),
      expected_qty_kg: rec.lines.reduce((s, l) => s + l.qty, 0),
      price_inr_per_kg: rec.lines[0] ? rec.lines[0].unit_price : 0,
      price_type: 'preseason_dynamic',
      season: rec.season,
      year: rec.year,
      preseason_order_id: rec.preseason_order_id,
      advance_inr: rec.deposit_inr,
    });
    contractFarming.transition(cf.contract_id, 'offered', { type: 'from_preseason' });
    contractFarming.transition(cf.contract_id, 'accepted', { type: 'auto' });
    contractFarming.transition(cf.contract_id, 'active', { type: 'auto' });
    rec.contract_id = cf.contract_id;
  }

  // ERP: deposit as advance liability / cash
  if (erp && rec.deposit_inr > 0) {
    try {
      const je = erp.postJournal({
        memo: `Preseason deposit ${rec.preseason_order_id}`,
        actor: 'preseason_service',
        lines: [
          { account: '1000', debit: rec.deposit_inr, credit: 0 },
          { account: '2000', debit: 0, credit: rec.deposit_inr },
        ],
      });
      rec.erp_journal_ids.push(je.journal.id);
    } catch (e) {
      rec.erp_error = e.message;
    }
  }

  return { order: rec };
}

async function withAiEvidence(rec) {
  if (!aiGateway) return rec;
  try {
    const ev = aiGateway.evidenceBase({
      engine: 'preseasonPurchaseService',
      input: { preseason_order_id: rec.preseason_order_id, season: rec.season },
      output: { total: rec.total, deposit: rec.deposit_inr, lines: rec.lines.length },
      confidence: rec.lines[0] && rec.lines[0].pricing && rec.lines[0].pricing.confidence,
      assumptions: ['Preseason sales history seed until live analytics warehouse connected'],
    });
    rec.ai_evidence_id = ev.evidence_id;
    rec.ai_evidence = ev;
  } catch {
    /* non-fatal */
  }
  return rec;
}

async function operate(data = {}) {
  const action = data.action || 'analyze';
  switch (action) {
    case 'analyze':
      return analyzePreseason(data.commodity || 'tomato', data.season);
    case 'price_line':
      return pricePreseasonLine(data.sku, data);
    case 'create': {
      const rec = createOrder(data);
      await withAiEvidence(rec);
      return { order: rec };
    }
    case 'hold_deposit':
      return holdDeposit(data.preseason_order_id);
    case 'confirm':
      return confirm(data.preseason_order_id, data);
    case 'get':
      return { order: orders.get(data.preseason_order_id) || null };
    case 'list':
      return { orders: [...orders.values()] };
    default:
      return { error: 'Unknown action', action };
  }
}

module.exports = {
  operate,
  analyzePreseason,
  pricePreseasonLine,
  createOrder,
  holdDeposit,
  confirm,
  SALES_HISTORY,
};
