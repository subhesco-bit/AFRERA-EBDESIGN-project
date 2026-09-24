/**
 * Farmer layer — production, land, schemes, advisory hooks
 * NOT ecommerce. Orders here are scheme applications / input plans, not carts.
 */

'use strict';

const { assertLayerCapability, LAYERS, rejectCrossContamination } = require('./layerBoundary');
const subsidy = require('../research-grade/subsidyEligibilityEngine');

const farmers = new Map();

function ensureFarmer(id, patch = {}) {
  if (!farmers.has(id)) {
    farmers.set(id, {
      farmer_id: id,
      landholder: true,
      area_ha: 0,
      category: 'marginal',
      documents: [],
      plots: [],
      layer: LAYERS.FARMER,
    });
  }
  const f = farmers.get(id);
  Object.assign(f, patch, { farmer_id: id, layer: LAYERS.FARMER });
  return f;
}

async function operate(data = {}) {
  rejectCrossContamination(data);
  const action = data.action || 'profile';
  assertLayerCapability(LAYERS.FARMER, action === 'subsidy' ? 'subsidy_extract' : action);

  if (action === 'profile') {
    const id = data.farmer_id || data.id || 'F-DEMO';
    const f = ensureFarmer(id, data.patch || data);
    return {
      layer: LAYERS.FARMER,
      farmer: f,
      confidence: 0.95,
      safety_floor: 'Farmer master data — not a marketplace seller profile.',
    };
  }

  if (action === 'land') {
    const id = data.farmer_id || 'F-DEMO';
    const f = ensureFarmer(id);
    const plot = {
      plot_id: data.plot_id || `P-${Date.now()}`,
      area_ha: Number(data.area_ha) || 0,
      survey_no: data.survey_no || null,
      crop: data.crop || null,
    };
    f.plots.push(plot);
    f.area_ha = f.plots.reduce((s, p) => s + (p.area_ha || 0), 0);
    return {
      layer: LAYERS.FARMER,
      plot,
      farmer_id: id,
      total_area_ha: f.area_ha,
      confidence: 0.9,
      safety_floor: 'Land records must reconcile with official RoR; this is operate support only.',
    };
  }

  if (action === 'subsidy_extract' || action === 'subsidy') {
    const id = data.farmer_id || 'F-DEMO';
    const f = ensureFarmer(id, data.farmer || {});
    const extracted = subsidy.extractAll(f, data.as_of);
    return {
      layer: LAYERS.FARMER,
      ...extracted,
      safety_floor:
        'Subsidy eligibility is Farmer-layer only. Not part of ecommerce checkout.',
    };
  }

  if (action === 'subsidy_list') {
    return {
      layer: LAYERS.FARMER,
      schemes: subsidy.listSchemes(),
      confidence: 1,
    };
  }

  if (action === 'input_plan') {
    const plan = {
      input_plan_id: `IP-${Date.now()}`,
      farmer_id: data.farmer_id || 'F-DEMO',
      items: data.items || [{ input: 'seed', qty: 1 }],
      layer: LAYERS.FARMER,
      note: 'Farm production plan — link to ecommerce only via bridge input_purchase_link',
    };
    return { layer: LAYERS.FARMER, plan, confidence: 0.88 };
  }

  if (action === 'advisory') {
    return {
      layer: LAYERS.FARMER,
      advisory_ref: data.domain || 'general',
      message: 'Route disease/vet/nutrition/agro to respective AI modules; farmer layer holds case ownership.',
      confidence: 0.7,
      safety_floor: 'Clinical/field decisions require licensed authority where regulated.',
    };
  }

  return { layer: LAYERS.FARMER, error: 'Unknown farmer action', confidence: 0.2 };
}

module.exports = { operate, ensureFarmer, LAYERS };
