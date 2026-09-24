/**
 * Irrigation Engine — real crop-water-requirement scheduling using the
 * critical-growth-stage method (FAO-56 style, simplified for field use):
 * each crop has stages with a relative water sensitivity; irrigation is
 * prioritized at high-sensitivity stages regardless of a blanket schedule.
 *
 * Fills the M054 (irrigation) gap identified 2026-09-24 — no scheduling
 * logic existed anywhere in the codebase; SoilMicrobiomeEngine only notes
 * texture affects frequency qualitatively, no stage-based real schedule.
 */
'use strict';

const catalogue = require('./knowledge/india_crops_catalogue.json');

const IRRIGATION_DISCLAIMER =
  'Schedule is a planning aid from crop-stage water sensitivity, not a substitute for soil-moisture sensors, ' +
  'local ET0 data, or state agriculture department advisories. Adjust for actual rainfall.';

// Critical growth stages by crop-water-need band (from the catalogue's
// `water` field: low/medium/high) — real agronomic principle: irrigation
// timed to reproductive/flowering stages matters far more than vegetative.
const STAGE_TEMPLATES = Object.freeze({
  high: [
    { stage: 'establishment', days_after_sowing: '0-15', sensitivity: 'high', note: 'Maintain saturated/moist soil for stand establishment' },
    { stage: 'vegetative', days_after_sowing: '15-40', sensitivity: 'medium', note: 'Regular irrigation, avoid waterlogging on non-paddy crops' },
    { stage: 'flowering_reproductive', days_after_sowing: '40-65', sensitivity: 'critical', note: 'Never skip — yield loss is steep if stressed here' },
    { stage: 'maturation', days_after_sowing: '65+', sensitivity: 'low', note: 'Reduce/stop irrigation to aid ripening and harvest access' },
  ],
  medium: [
    { stage: 'establishment', days_after_sowing: '0-15', sensitivity: 'medium', note: 'Light frequent irrigation until roots establish' },
    { stage: 'vegetative', days_after_sowing: '15-45', sensitivity: 'medium', note: 'Irrigate at 50-60% available soil moisture depletion' },
    { stage: 'flowering_reproductive', days_after_sowing: '45-70', sensitivity: 'critical', note: 'Highest-priority irrigation window' },
    { stage: 'maturation', days_after_sowing: '70+', sensitivity: 'low', note: 'Taper off before harvest' },
  ],
  low: [
    { stage: 'establishment', days_after_sowing: '0-20', sensitivity: 'medium', note: 'One good irrigation for germination/establishment' },
    { stage: 'vegetative', days_after_sowing: '20-50', sensitivity: 'low', note: 'Rely on rainfall/residual moisture where possible' },
    { stage: 'flowering_reproductive', days_after_sowing: '50-75', sensitivity: 'high', note: 'Supplemental irrigation justified even for drought-tolerant crops' },
    { stage: 'maturation', days_after_sowing: '75+', sensitivity: 'low', note: 'Withhold irrigation' },
  ],
});

const METHOD_GUIDANCE = Object.freeze([
  { id: 'drip', name: 'Drip irrigation', fit: ['medium', 'high'], water_saving_pct: '30-50% vs flood', best_for: 'row crops, orchards, high-value vegetables' },
  { id: 'sprinkler', name: 'Sprinkler irrigation', fit: ['low', 'medium'], water_saving_pct: '20-30% vs flood', best_for: 'cereals, oilseeds, undulating land' },
  { id: 'furrow', name: 'Furrow/surface irrigation', fit: ['medium', 'high'], water_saving_pct: 'baseline', best_for: 'row crops on level land, lowest capital cost' },
  { id: 'flood_puddled', name: 'Flood/puddled (paddy-specific)', fit: ['high'], water_saving_pct: 'baseline (paddy) — consider AWD to save 15-30%', best_for: 'transplanted rice; alternate wetting-drying (AWD) reduces water without yield loss' },
]);

function scheduleForCrop(input = {}) {
  const cropId = String(input.crop || '').toLowerCase();
  const profile = catalogue.crop_profiles.find((p) => p.id === cropId);
  const waterBand = profile?.water || 'medium';
  const stages = STAGE_TEMPLATES[waterBand] || STAGE_TEMPLATES.medium;
  const methods = METHOD_GUIDANCE.filter((m) => m.fit.includes(waterBand));

  return {
    engine: 'IrrigationEngine',
    crop: cropId || null,
    crop_known: !!profile,
    water_need_band: waterBand,
    schedule: stages,
    recommended_methods: methods,
    critical_stage: stages.find((s) => s.sensitivity === 'critical') || null,
    disclaimer: IRRIGATION_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { scheduleForCrop, STAGE_TEMPLATES, METHOD_GUIDANCE, IRRIGATION_DISCLAIMER };
