/**
 * Logistics Decision Platform — mode choice, SLA, cost, carbon proxy, cold-chain
 */

'use strict';

const MODES = [
  { id: 'bike', name: 'Two-wheeler', max_kg: 20, speed_kmh: 25, cost_per_km: 8, co2_g_per_km: 40 },
  { id: 'van', name: 'Van', max_kg: 800, speed_kmh: 40, cost_per_km: 18, co2_g_per_km: 180 },
  { id: 'reefer', name: 'Reefer van', max_kg: 2000, speed_kmh: 35, cost_per_km: 32, co2_g_per_km: 260, cold: true },
  { id: 'truck', name: 'Truck', max_kg: 10000, speed_kmh: 45, cost_per_km: 28, co2_g_per_km: 500 },
  { id: 'rail_ftl', name: 'Rail FTL proxy', max_kg: 50000, speed_kmh: 30, cost_per_km: 12, co2_g_per_km: 30 },
];

function decide(shipment = {}) {
  const weight = Number(shipment.weight_kg) || 10;
  const distance = Number(shipment.distance_km) || 50;
  const cold = !!shipment.cold_chain;
  const sla_hours = Number(shipment.sla_hours) || 48;

  const candidates = MODES.filter((m) => weight <= m.max_kg && (!cold || m.cold))
    .map((m) => {
      const hours = distance / m.speed_kmh;
      const cost = Math.round(distance * m.cost_per_km * 100) / 100;
      const co2_kg = Math.round(((distance * m.co2_g_per_km) / 1000) * 100) / 100;
      const meets_sla = hours <= sla_hours;
      const score =
        (meets_sla ? 40 : 0) +
        Math.max(0, 30 - cost / 100) +
        Math.max(0, 20 - co2_kg) +
        (m.cold && cold ? 10 : 0);
      return {
        mode: m.id,
        name: m.name,
        hours: Math.round(hours * 10) / 10,
        cost_inr: cost,
        co2_kg,
        meets_sla,
        score: Math.round(score * 10) / 10,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = candidates[0] || null;
  return {
    shipment: { weight_kg: weight, distance_km: distance, cold_chain: cold, sla_hours },
    recommendation: best,
    alternatives: candidates.slice(1, 4),
    confidence: best ? (best.meets_sla ? 0.9 : 0.65) : 0.3,
    advisory: true,
    basis: 'Mode choice by capacity, SLA, cost/km, CO2 proxy; not a live TMS quote.',
    safety_floor: 'Cold-chain must use reefer-capable mode; regulatory e-way bill external.',
    erp_hooks: { transport_order: true, freight_cost_accrual: true },
  };
}

module.exports = { MODES, decide };
