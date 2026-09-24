/**
 * ENTERPRISE Insurance 10x — CORPORATE / ECOSYSTEM SUPPORT
 * Not retail policy sales. Employees, assets, liabilities, transit, credit,
 * farmer/logistics/cold-storage risk contexts. PolicyBazaar-style support UX backend.
 */

'use strict';

const { makeMetrics, envelope, rankPanel, buildPanelOpinions } = require('../domain_os');

let corporate;
try {
  corporate = require('../../../backend/src/services/insurance/corporateInsurancePlatform');
} catch {
  try {
    corporate = require('../../../../backend/src/services/insurance/corporateInsurancePlatform');
  } catch {
    corporate = null;
  }
}

const LENSES = [
  { id: 'employee', name: 'Employee benefits risk', tags: ['employee', 'hr', 'group'], focus: 'Group health / PA' },
  { id: 'asset', name: 'Asset & stock', tags: ['cold', 'warehouse', 'plant'], focus: 'Building, machinery, stock' },
  { id: 'liability', name: 'Liability', tags: ['liability', 'public'], focus: 'Public / product liability' },
  { id: 'transit', name: 'Transit & cargo', tags: ['transit', 'shipment', 'reefer'], focus: 'Inland + cold transit' },
  { id: 'credit', name: 'Credit risk', tags: ['credit', 'receivable'], focus: 'Trade credit' },
  { id: 'claims_ops', name: 'Claims support desk', tags: ['claim', 'fnol'], focus: 'FNOL to insurer handoff' },
  { id: 'compliance', name: 'Regulatory boundary', tags: ['irdai', 'intermediary'], focus: 'Not the underwriter' },
];

class Insurance10xService {
  constructor() {
    this.moduleId = 'ENTERPRISE_INSURANCE_CORPORATE_10X';
    this.version = '2.0.0-corporate';
    this.metrics = makeMetrics();
  }

  async initialize() {
    return {
      success: true,
      moduleId: this.moduleId,
      version: this.version,
      model: 'corporate_ecosystem_support_not_retail_sales',
      covers: corporate ? corporate.COVER_CLASSES.map((c) => c.id) : [],
    };
  }

  async operate(data = {}) {
    this.metrics.requestsProcessed++;
    if (!corporate) {
      return envelope({
        moduleId: this.moduleId,
        capability: data.action || 'unavailable',
        result: {
          error: 'corporateInsurancePlatform not resolvable from this path',
          safety_floor: 'Support platform only — not an insurer.',
          confidence: 0,
        },
      });
    }
    const result = await corporate.operate(data);
    this.metrics.successCount++;
    return envelope({
      moduleId: this.moduleId,
      capability: data.action || 'operate',
      result: {
        ...result,
        model: 'corporate_ecosystem_support_not_retail_sales',
      },
      safety_floor: result.safety_floor || corporate.safetyFloor(),
    });
  }

  async panel(data = {}) {
    this.metrics.panelRuns++;
    const ranked = rankPanel(LENSES, [data.action, data.context, data.cover_class]);
    return envelope({
      moduleId: this.moduleId,
      capability: 'panel',
      result: {
        opinions: buildPanelOpinions(ranked, data),
        consensus:
          'Platform supports corporate book and claims desk; licensed insurer binds and settles. Separate farmer subsidy eligibility from insurance cover comparison.',
        confidence: 0.88,
        safety_floor: corporate ? corporate.safetyFloor() : 'Not an insurer.',
        model: 'corporate_ecosystem_support_not_retail_sales',
      },
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = { Insurance10xService };
