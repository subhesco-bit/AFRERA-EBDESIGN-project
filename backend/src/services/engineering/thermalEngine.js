/**
 * Thermal first-pass (advisory) — refrigeration / insulation proxies
 * Not CFD. Declared limits explicit.
 */

'use strict';

function coldRoomLoad(input = {}) {
  const volume_m3 = Number(input.volume_m3) || 100;
  const deltaT = Number(input.delta_t_c) || 30; // ambient - room
  const u_wall = Number(input.u_wall) || 0.3; // W/m²K insulated panel proxy
  const area_m2 = Number(input.surface_area_m2) || 6 * Math.pow(volume_m3, 2 / 3);
  const transmission_w = u_wall * area_m2 * deltaT;
  const infiltration_w = volume_m3 * 2 * deltaT; // rough
  const product_pull_w = Number(input.product_load_w) || volume_m3 * 15;
  const total_w = transmission_w + infiltration_w + product_pull_w;
  const kw = total_w / 1000;
  const tr = total_w / 3500;
  return {
    transmission_w: Math.round(transmission_w),
    infiltration_w: Math.round(infiltration_w),
    product_pull_w: Math.round(product_pull_w),
    total_w: Math.round(total_w),
    cooling_kw: Math.round(kw * 100) / 100,
    tons_refrigeration: Math.round(tr * 100) / 100,
    advisory: true,
    basis: 'Steady-state U·A·ΔT + infiltration/product proxies — not transient CFD/thermal FEM.',
    notImplemented: ['CFD airflow', 'defrost cycle simulation', 'refrigerant charge design'],
    confidence: 0.7,
  };
}

function insulationThickness(input = {}) {
  const k = Number(input.k_w_mk) || 0.022; // PUF proxy
  const target_u = Number(input.target_u) || 0.3;
  const thickness_m = k / target_u;
  return {
    thickness_mm: Math.round(thickness_m * 1000),
    k_w_mk: k,
    target_u,
    advisory: true,
    basis: 'U = k/d one-dimensional; ignores bridges and ageing.',
    confidence: 0.75,
  };
}

module.exports = { coldRoomLoad, insulationThickness };
