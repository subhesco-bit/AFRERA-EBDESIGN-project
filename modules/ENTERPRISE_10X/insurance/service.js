/**
 * Insurance 10x — policy quote, premium, claims intake, fraud flags (advisory)
 */

'use strict';

const { makeMetrics, envelope, rankPanel, buildPanelOpinions } = require('../domain_os');

const LENSES = [
  { id: 'underwriting', name: 'Underwriting', tags: ['risk', 'crop', 'livestock'], focus: 'Risk selection' },
  { id: 'pricing', name: 'Premium Actuarial', tags: ['premium', 'rate'], focus: 'Rate adequacy' },
  { id: 'claims', name: 'Claims', tags: ['claim', 'loss', 'survey'], focus: 'FNOL to settlement' },
  { id: 'fraud', name: 'Fraud Intelligence', tags: ['fraud', 'anomaly'], focus: 'Red flags' },
  { id: 'compliance', name: 'Regulatory', tags: ['irdai', 'kyc'], focus: 'Disclosure & KYC' },
  { id: 'reinsurance', name: 'Risk Transfer', tags: ['reinsurance', 'cat'], focus: 'Retention limits' },
];

const PRODUCTS = [
  { id: 'crop_pmfby_like', name: 'Crop multi-peril (scheme-aligned)', base_rate: 0.02 },
  { id: 'livestock', name: 'Livestock mortality', base_rate: 0.035 },
  { id: 'warehouse', name: 'Warehouse / cold stock', base_rate: 0.012 },
  { id: 'asset', name: 'Farm asset / machinery', base_rate: 0.015 },
];

class Insurance10xService {
  constructor() {
    this.moduleId = 'ENTERPRISE_INSURANCE_10X';
    this.version = '1.0.0-10x';
    this.metrics = makeMetrics();
  }

  async initialize() {
    return { success: true, moduleId: this.moduleId, products: PRODUCTS.map((p) => p.id) };
  }

  async operate(data = {}) {
    this.metrics.requestsProcessed++;
    const action = data.action || 'quote';
    let result;
    if (action === 'quote') {
      const product = PRODUCTS.find((p) => p.id === data.product_id) || PRODUCTS[0];
      const sum_insured = Number(data.sum_insured) || 100000;
      const premium = Math.round(sum_insured * product.base_rate * 100) / 100;
      result = {
        product,
        sum_insured,
        premium,
        gst_on_premium_hint: Math.round(premium * 0.18 * 100) / 100,
        exclusions_hint: ['war', 'nuclear', 'willful negligence'],
        confidence: 0.84,
        safety_floor:
          'NOT A BINDING POLICY. Licensed insurer / intermediary required. IRDAI-regulated product rules apply.',
        erp_hooks: { premium_receivable: true, policy_register: true },
      };
    } else if (action === 'claim_intake') {
      const amount = Number(data.claimed_amount) || 0;
      const fraud_score = Math.min(0.95, 0.2 + (amount > 500000 ? 0.3 : 0) + (data.repeat_claim ? 0.25 : 0));
      result = {
        claim_id: `CLM-${Date.now()}`,
        status: 'fnol_received',
        claimed_amount: amount,
        fraud_score,
        next: fraud_score > 0.55 ? ['survey', 'siu_review'] : ['survey', 'assessment'],
        confidence: 0.8,
        safety_floor: 'Claims decisions by authorized claims handler only.',
      };
    } else if (action === 'products') {
      result = { products: PRODUCTS, confidence: 1 };
    } else {
      result = { message: 'Unknown action', confidence: 0.3 };
    }
    this.metrics.successCount++;
    return envelope({ moduleId: this.moduleId, capability: action, result, safety_floor: result.safety_floor });
  }

  async panel(data = {}) {
    this.metrics.panelRuns++;
    const ranked = rankPanel(LENSES, [data.action, data.product_id]);
    return envelope({
      moduleId: this.moduleId,
      capability: 'panel',
      result: {
        opinions: buildPanelOpinions(ranked, data),
        consensus: 'Separate underwriting from claims; escalate high fraud_score.',
        confidence: 0.85,
        safety_floor: 'Regulated activity — licensed entities only.',
      },
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = { Insurance10xService };
