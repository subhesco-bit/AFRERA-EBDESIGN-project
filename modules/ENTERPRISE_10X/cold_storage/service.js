/**
 * Cold Storage 10x — bay allocation, temp SLA, energy, insurance link
 */

'use strict';

const { makeMetrics, envelope, rankPanel, buildPanelOpinions } = require('../domain_os');

const LENSES = [
  { id: 'capacity', name: 'Capacity Planning', tags: ['bay', 'occupancy'], focus: 'Utilisation' },
  { id: 'quality', name: 'Quality / Temp', tags: ['temp', 'humidity', 'fssai'], focus: 'Cold chain integrity' },
  { id: 'energy', name: 'Energy', tags: ['kwh', 'cost'], focus: 'Cost per MT-day' },
  { id: 'commercial', name: 'Commercial', tags: ['tariff', 'invoice'], focus: 'Storage charges' },
  { id: 'risk', name: 'Risk & Insurance', tags: ['insurance', 'claim'], focus: 'Stock cover' },
];

class ColdStorage10xService {
  constructor() {
    this.moduleId = 'ENTERPRISE_COLD_STORAGE_10X';
    this.version = '1.0.0-10x';
    this.metrics = makeMetrics();
    this.bays = [
      { id: 'B1', temp_c: 2, capacity_mt: 50, used_mt: 32, commodity: 'potato' },
      { id: 'B2', temp_c: -18, capacity_mt: 20, used_mt: 8, commodity: 'frozen' },
      { id: 'B3', temp_c: 4, capacity_mt: 40, used_mt: 40, commodity: 'dairy' },
    ];
  }

  async initialize() {
    return { success: true, moduleId: this.moduleId, bays: this.bays.length };
  }

  async operate(data = {}) {
    this.metrics.requestsProcessed++;
    const action = data.action || 'status';
    let result;
    if (action === 'status') {
      result = {
        bays: this.bays,
        alerts: this.bays.filter((b) => b.used_mt >= b.capacity_mt).map((b) => ({ bay: b.id, type: 'full' })),
        confidence: 0.92,
        safety_floor: 'IoT sensors are source of truth in production; this is operate logic.',
      };
    } else if (action === 'allocate') {
      const need = Number(data.mt) || 1;
      const bay = this.bays.find((b) => b.capacity_mt - b.used_mt >= need && (!data.temp_max || b.temp_c <= data.temp_max));
      result = bay
        ? {
            allocation_id: `AL-${Date.now()}`,
            bay: bay.id,
            mt: need,
            tariff_per_mt_day: 12,
            confidence: 0.88,
            erp_hooks: { warehouse_receipt: true, invoice_storage: true },
            safety_floor: 'Commodity compatibility and hygiene SOPs mandatory.',
          }
        : { status: 'no_capacity', confidence: 0.9, safety_floor: 'Do not override capacity without manager approval.' };
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
        opinions: buildPanelOpinions(rankPanel(LENSES, [data.action, data.commodity]), data),
        consensus: 'Never compromise temperature SLA for utilisation.',
        confidence: 0.86,
        safety_floor: 'Food safety authority requirements apply.',
      },
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = { ColdStorage10xService };
