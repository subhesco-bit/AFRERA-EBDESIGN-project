/**
 * Fertilizer Engine — real per-crop NPK dose recommendations (kg/ha,
 * India ICAR/state package-of-practices-style figures), split by
 * application timing, plus organic-equivalent guidance.
 *
 * Fills the M055 (fertilizer) gap identified 2026-09-24. SoilMicrobiomeEngine's
 * `nutrition_path` only lists tool categories (organic/inorganic toolkits),
 * never an actual dose — this is the first module with real numbers.
 */
'use strict';

const catalogue = require('./knowledge/india_crops_catalogue.json');

const FERTILIZER_DISCLAIMER =
  'Doses are general package-of-practices figures, not a soil-test-based recommendation. ' +
  'A soil test (especially for P and K, and micronutrients) should override these generic figures where available.';

// kg/ha of N-P2O5-K2O, ICAR/state-extension package-of-practices style
// figures for major crops. split_pct describes how total N is staged
// (basal / active tillering-or-vegetative / flowering-or-panicle).
const NPK_RECOMMENDATIONS = Object.freeze({
  tomato: { n: 150, p: 60, k: 60, split_n_pct: { basal: 25, vegetative: 35, flowering: 40 }, micronutrients: ['boron for fruit-set', 'calcium to reduce blossom-end rot'] },
  paddy: { n: 120, p: 60, k: 40, split_n_pct: { basal: 50, tillering: 25, panicle_initiation: 25 }, micronutrients: ['zinc sulfate 25 kg/ha if deficient soils'] },
  wheat: { n: 120, p: 60, k: 40, split_n_pct: { basal: 50, first_irrigation: 25, second_irrigation: 25 }, micronutrients: ['zinc on zinc-deficient soils'] },
  mango: { n: 500, p: 250, k: 500, unit_basis: 'g/tree/year (mature tree)', split_n_pct: { post_harvest: 50, pre_flowering: 50 }, micronutrients: ['boron pre-flowering to aid fruit-set'] },
  chilli: { n: 100, p: 50, k: 50, split_n_pct: { basal: 30, vegetative: 35, flowering: 35 }, micronutrients: ['calcium and boron for fruit quality'] },
  onion: { n: 100, p: 50, k: 50, split_n_pct: { basal: 40, bulb_initiation: 30, bulb_development: 30 }, micronutrients: ['sulfur — directly affects pungency and bulb quality'] },
  potato: { n: 150, p: 80, k: 100, split_n_pct: { basal: 50, earthing_up: 50 }, micronutrients: ['boron and zinc on deficient soils'] },
  banana: { n: 200, p: 60, k: 300, unit_basis: 'g/plant/year', split_n_pct: { monthly_split: 100 }, micronutrients: ['high K demand — split monthly, never all at once'] },
  cotton: { n: 100, p: 50, k: 50, split_n_pct: { basal: 25, squaring: 25, flowering: 25, boll_development: 25 }, micronutrients: ['magnesium and boron for boll retention'] },
  turmeric: { n: 60, p: 50, k: 120, split_n_pct: { basal: 25, day_45: 25, day_90: 25, day_135: 25 }, micronutrients: ['high K demand for rhizome bulking'] },
  maize: { n: 120, p: 60, k: 40, split_n_pct: { basal: 50, knee_high: 25, tasseling: 25 }, micronutrients: ['zinc sulfate 25 kg/ha standard'] },
  mustard: { n: 80, p: 40, k: 40, split_n_pct: { basal: 50, first_irrigation: 50 }, micronutrients: ['sulfur — mustard is a heavy sulfur feeder, directly affects oil content'] },
});

const ORGANIC_EQUIVALENTS = Object.freeze([
  { id: 'fym_compost', name: 'Farmyard manure / compost', typical_rate: '10-25 t/ha basal', note: 'Slow-release, builds organic carbon; supply N/P/K only partially replaces the schedule above' },
  { id: 'vermicompost', name: 'Vermicompost', typical_rate: '3-5 t/ha', note: 'Higher nutrient density than raw FYM, useful for vegetables' },
  { id: 'biofertilizer', name: 'Biofertilizer (Azotobacter/PSB/Rhizobium as crop-appropriate)', typical_rate: 'seed/soil inoculation per label', note: 'Complements, does not replace, organic matter inputs' },
  { id: 'green_manure', name: 'Green manuring (dhaincha/sunhemp)', typical_rate: 'incorporate at 45-50 days growth', note: 'Real N contribution, 40-60 kg N/ha depending on biomass' },
]);

function recommendationForCrop(input = {}) {
  const cropId = String(input.crop || '').toLowerCase();
  const profile = catalogue.crop_profiles.find((p) => p.id === cropId);
  const dose = NPK_RECOMMENDATIONS[cropId] || null;
  const mode = String(input.farming_mode || 'integrated').toLowerCase();
  const organic = mode === 'organic' || mode === 'natural';

  return {
    engine: 'FertilizerEngine',
    crop: cropId || null,
    crop_known: !!profile,
    dose_known: !!dose,
    npk_recommendation: dose,
    organic_equivalents: organic || !dose ? ORGANIC_EQUIVALENTS : undefined,
    mode,
    disclaimer: FERTILIZER_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { recommendationForCrop, NPK_RECOMMENDATIONS, ORGANIC_EQUIVALENTS, FERTILIZER_DISCLAIMER };
