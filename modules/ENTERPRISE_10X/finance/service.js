/**
 * Finance 10x — ledger snapshot, GST hints, settlements, rural credit advisory
 */

'use strict';

const { makeMetrics, envelope, rankPanel, buildPanelOpinions } = require('../domain_os');

const LENSES = [
  { id: 'gl', name: 'General Ledger', tags: ['ledger', 'journal'], focus: 'Double-entry integrity' },
  { id: 'ar_ap', name: 'AR/AP', tags: ['receivable', 'payable'], focus: 'Aging & settlement' },
  { id: 'gst', name: 'GST', tags: ['gst', 'gstr', 'hsn'], focus: 'Tax compliance' },
  { id: 'treasury', name: 'Treasury', tags: ['cash', 'bank'], focus: 'Liquidity' },
  { id: 'credit', name: 'Rural Credit', tags: ['loan', 'kcc', 'npa'], focus: 'Underwriting advisory' },
  { id: 'audit', name: 'Internal Audit', tags: ['audit', 'control'], focus: 'Control testing' },
];

class Finance10xService {
  constructor() {
    this.moduleId = 'ENTERPRISE_FINANCE_10X';
    this.version = '1.0.0-10x';
    this.metrics = makeMetrics();
    this.books = { cash: 250000, receivables: 180000, payables: 95000, inventory: 320000 };
  }

  async initialize() {
    return { success: true, moduleId: this.moduleId };
  }

  async operate(data = {}) {
    this.metrics.requestsProcessed++;
    const action = data.action || 'dashboard';
    let result;
    if (action === 'dashboard') {
      const assets = this.books.cash + this.books.receivables + this.books.inventory;
      const equity_proxy = assets - this.books.payables;
      result = {
        books: this.books,
        working_capital: this.books.cash + this.books.receivables - this.books.payables,
        equity_proxy,
        confidence: 0.9,
        safety_floor: 'Illustrative books — not audited financial statements.',
        erp_hooks: { gl_sync: true, gstr_export: true },
      };
    } else if (action === 'gst_estimate') {
      const taxable = Number(data.taxable_value) || 0;
      const rate = Number(data.rate) || 0.05;
      const tax = Math.round(taxable * rate * 100) / 100;
      result = {
        taxable_value: taxable,
        rate,
        cgst: tax / 2,
        sgst: tax / 2,
        igst_hint: data.interstate ? tax : 0,
        confidence: 0.88,
        safety_floor: 'GST computation must follow live GSP/GSTN rules and place of supply.',
      };
    } else if (action === 'settle') {
      result = {
        settlement_id: `SET-${Date.now()}`,
        amount: Number(data.amount) || 0,
        status: 'initiated',
        confidence: 0.85,
        safety_floor: 'Bank rails and maker-checker required in production.',
      };
    } else {
      result = { message: 'Unknown action', confidence: 0.3 };
    }
    this.metrics.successCount++;
    return envelope({ moduleId: this.moduleId, capability: action, result, safety_floor: result.safety_floor });
  }

  async panel(data = {}) {
    this.metrics.panelRuns++;
    const ranked = rankPanel(LENSES, [data.action]);
    return envelope({
      moduleId: this.moduleId,
      capability: 'panel',
      result: {
        opinions: buildPanelOpinions(ranked, data),
        consensus: 'No posting without documentary evidence and dual control for material amounts.',
        confidence: 0.87,
        safety_floor: 'CFO/controller authority for policy.',
      },
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = { Finance10xService };
