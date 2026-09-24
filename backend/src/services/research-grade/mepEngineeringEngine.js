/**
 * MEP first-pass engineering (advisory) — HVAC load proxy, electrical demand,
 * plumbing fixture units. Complements structural/solar in services/engineering.
 * Every result: advisory + basis. Not certified design.
 */

'use strict';

function hvacCoolingLoad({ area_m2 = 100, climate_zone = 'hot_dry', occupancy = 10, w_per_m2_equipment = 15 }) {
  const base = { hot_dry: 180, warm_humid: 160, temperate: 120, cold: 90 }[climate_zone] || 150;
  const occupancyLoad = occupancy * 70; // W sensible proxy
  const equip = area_m2 * w_per_m2_equipment;
  const envelope = area_m2 * base;
  const total_w = envelope + occupancyLoad + equip;
  const tr = total_w / 3500; // rough ton of refrigeration
  return {
    total_w: Math.round(total_w),
    tons_refrigeration: Math.round(tr * 100) / 100,
    components: { envelope_w: envelope, occupancy_w: occupancyLoad, equipment_w: equip },
    advisory: true,
    basis: 'Rule-of-thumb W/m² by climate + occupancy/equipment; not psychrometric heat-balance.',
    notImplemented: ['CFD', 'hourly energy simulation', 'refrigerant charge design'],
  };
}

function electricalDemand({ area_m2 = 100, lighting_w_m2 = 8, equipment_w_m2 = 20, hvac_w = 0, diversity = 0.7 }) {
  const lighting = area_m2 * lighting_w_m2;
  const equipment = area_m2 * equipment_w_m2;
  const connected = lighting + equipment + hvac_w;
  const demand = connected * diversity;
  const current_a_415v_3ph = demand / (Math.sqrt(3) * 415 * 0.9);
  return {
    connected_w: Math.round(connected),
    demand_w: Math.round(demand),
    estimated_current_a_3ph_415v: Math.round(current_a_415v_3ph * 10) / 10,
    advisory: true,
    basis: 'Connected load × diversity; not a full panel schedule or short-circuit study.',
    notImplemented: ['fault level', 'cable sizing IS 7098', 'earthing design'],
  };
}

function plumbingFixtureUnits({ wc = 2, washbasin = 4, shower = 2, kitchen_sink = 1 }) {
  // Simplified Hunter-like FU proxies
  const fu = wc * 3 + washbasin * 1 + shower * 2 + kitchen_sink * 2;
  const peak_lpm = fu * 3.5;
  return {
    fixture_units: fu,
    peak_flow_lpm_proxy: Math.round(peak_lpm),
    advisory: true,
    basis: 'Simplified fixture-unit sum; not IS 1172 detailed design.',
    notImplemented: ['pipe sizing network', 'STP design', 'rainwater harvesting calc'],
  };
}

function mepPackage(input = {}) {
  const hvac = hvacCoolingLoad(input);
  const elec = electricalDemand({ ...input, hvac_w: hvac.total_w * 0.35 });
  const plumb = plumbingFixtureUnits(input);
  return {
    hvac,
    electrical: elec,
    plumbing: plumb,
    confidence: 0.75,
    advisory: true,
    safety_floor: 'First-pass MEP only. Licensed MEP engineer must stamp construction documents.',
  };
}

module.exports = {
  hvacCoolingLoad,
  electricalDemand,
  plumbingFixtureUnits,
  mepPackage,
};
