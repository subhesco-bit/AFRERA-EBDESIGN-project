/**
 * Yield Prediction Engine — baseline India average yields (ICAR/DES
 * Agricultural Statistics-style figures, t/ha) adjusted by real, stated
 * factors (season fit, water adequacy, soil match) rather than a black-box
 * number. Every adjustment is shown, not just the final figure.
 *
 * Fills the M056 (yield_prediction) gap identified 2026-09-24 — no yield
 * estimation existed anywhere in the codebase.
 */
'use strict';

const catalogue = require('./knowledge/india_crops_catalogue.json');

const YIELD_DISCLAIMER =
  'Baseline is a national average, not this specific field\'s history. Actual yield depends heavily on variety, ' +
  'pest/disease pressure, and management not captured here — treat as a planning estimate, not a guarantee.';

// India average yield, tonnes/hectare — public agricultural statistics range
// (rounded to realistic mid-range figures for irrigated, reasonably-managed
// conditions; rainfed/unmanaged fields should expect materially less).
const BASELINE_YIELD_T_HA = Object.freeze({
  tomato: 24, paddy: 3.9, wheat: 3.5, mango: 8, chilli: 2.2, onion: 18,
  potato: 23, banana: 38, cotton: 0.5, turmeric: 6, maize: 3.2, mustard: 1.3,
});

function estimateYield(input = {}) {
  const cropId = String(input.crop || '').toLowerCase();
  const profile = catalogue.crop_profiles.find((p) => p.id === cropId);
  const baseline = BASELINE_YIELD_T_HA[cropId];
  if (baseline == null) {
    return {
      engine: 'YieldPredictionEngine',
      crop: cropId || null,
      crop_known: !!profile,
      baseline_known: false,
      note: 'No baseline yield figure on file for this crop — cannot estimate.',
      disclaimer: YIELD_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  const adjustments = [];
  let multiplier = 1.0;

  const season = input.season || input.current_season;
  if (season && profile?.seasons) {
    const fits = profile.seasons.some((s) => s.includes(season) || s.includes('multi') || s.includes('perennial') || s.includes('year'));
    adjustments.push({ factor: 'season_fit', fits, effect: fits ? '+0%' : '-25%' });
    if (!fits) multiplier *= 0.75;
  }

  if (input.irrigation_available === false) {
    adjustments.push({ factor: 'irrigation', available: false, effect: '-30%' });
    multiplier *= 0.70;
  } else if (input.irrigation_available === true) {
    adjustments.push({ factor: 'irrigation', available: true, effect: '+0% (baseline assumes irrigated)' });
  }

  if (input.soil_tested === false) {
    adjustments.push({ factor: 'soil_not_tested', effect: '-10% (unmanaged nutrient risk)' });
    multiplier *= 0.90;
  }

  const estimated = Math.round(baseline * multiplier * 100) / 100;

  return {
    engine: 'YieldPredictionEngine',
    crop: cropId,
    crop_known: !!profile,
    baseline_known: true,
    baseline_yield_t_ha: baseline,
    adjustments,
    estimated_yield_t_ha: estimated,
    confidence: adjustments.length > 0 ? 0.55 : 0.4,
    disclaimer: YIELD_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { estimateYield, BASELINE_YIELD_T_HA, YIELD_DISCLAIMER };
