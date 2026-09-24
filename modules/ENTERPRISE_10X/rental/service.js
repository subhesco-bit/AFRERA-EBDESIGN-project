/**
 * Rental / Equipment Exchange 10x — catalog, booking, deposit, maintenance gate
 */

'use strict';

const { makeMetrics, envelope, rankPanel, buildPanelOpinions } = require('../domain_os');

const LENSES = [
  { id: 'fleet', name: 'Fleet Availability', tags: ['asset', 'slot'], focus: 'Utilisation' },
  { id: 'pricing', name: 'Rental Pricing', tags: ['rate', 'deposit'], focus: 'Yield' },
  { id: 'maintenance', name: 'Maintenance Gate', tags: ['service', 'breakdown'], focus: 'Safety readiness' },
  { id: 'credit', name: 'Renter Credit', tags: ['kyc', 'deposit'], focus: 'Default risk' },
  { id: 'insurance', name: 'Asset Cover', tags: ['insurance'], focus: 'Damage liability' },
];

class Rental10xService {
  constructor() {
    this.moduleId = 'ENTERPRISE_RENTAL_10X';
    this.version = '1.0.0-10x';
    this.metrics = makeMetrics();
    this.fleet = [
      { id: 'TR-101', type: 'tractor', rate_day: 2500, deposit: 10000, status: 'available', last_service_days: 12 },
      { id: 'HB-04', type: 'harvester', rate_day: 8000, deposit: 50000, status: 'available', last_service_days: 40 },
      { id: 'SP-12', type: 'sprayer', rate_day: 800, deposit: 3000, status: 'maintenance', last_service_days: 5 },
    ];
  }

  async initialize() {
    return { success: true, moduleId: this.moduleId, fleet: this.fleet.length };
  }

  async operate(data = {}) {
    this.metrics.requestsProcessed++;
    const action = data.action || 'catalog';
    let result;
    if (action === 'catalog') {
      result = { fleet: this.fleet, confidence: 0.95 };
    } else if (action === 'book') {
      const asset = this.fleet.find((f) => f.id === data.asset_id);
      if (!asset) result = { status: 'not_found', confidence: 0.9 };
      else if (asset.status !== 'available') result = { status: 'unavailable', reason: asset.status, confidence: 0.9 };
      else if (asset.last_service_days > 30) {
        result = {
          status: 'blocked_maintenance',
          message: 'Service overdue — maintenance gate closed',
          confidence: 0.92,
          safety_floor: 'Do not rent unsafe equipment.',
        };
      } else {
        const days = Number(data.days) || 1;
        result = {
          booking_id: `BK-${Date.now()}`,
          asset_id: asset.id,
          days,
          rental_amount: asset.rate_day * days,
          deposit: asset.deposit,
          status: 'reserved',
          confidence: 0.88,
          erp_hooks: { asset_reservation: true, deposit_liability: true, invoice: true },
          safety_floor: 'Operator competence and local transport rules apply.',
        };
      }
    } else {
      result = { message: 'Unknown action', confidence: 0.3 };
    }
    this.metrics.successCount++;
    return envelope({ moduleId: this.moduleId, capability: action, result, safety_floor: result.safety_floor });
  }

  async panel(data = {}) {
    this.metrics.panelRuns++;
    return envelope({
      moduleId: this.moduleId,
      capability: 'panel',
      result: {
        opinions: buildPanelOpinions(rankPanel(LENSES, [data.action, data.type]), data),
        consensus: 'Maintenance gate beats utilisation pressure.',
        confidence: 0.86,
        safety_floor: 'Safety-critical assets require inspection logs.',
      },
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = { Rental10xService };
