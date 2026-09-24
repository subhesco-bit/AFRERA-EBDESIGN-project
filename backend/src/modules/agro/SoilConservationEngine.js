/**
 * Soil Conservation Engine — real soil & water conservation (SWC)
 * practices selected by slope and soil-erosion risk, the standard
 * watershed-management doctrine (mechanical measures for steeper slopes,
 * vegetative measures layered on top regardless of slope).
 *
 * Fills the M087 (soil_conservation) gap identified 2026-09-24.
 * SoilMicrobiomeEngine covers soil health/nutrition and BiocharEngine
 * covers biochar application — neither addresses erosion control, which
 * is a distinct, real SWC discipline.
 */
'use strict';

const SOIL_CONSERVATION_DISCLAIMER =
  'Slope-based practice selection is general SWC doctrine; a watershed/soil-conservation officer\'s site visit ' +
  'is needed before earthwork (bunding/terracing) — wrong execution can worsen erosion.';

// Slope band -> primary mechanical measure. This is standard Indian
// soil-conservation department practice (matches Integrated Watershed
// Management Programme guidelines).
const SLOPE_MEASURES = Object.freeze([
  { slope_pct: '0-2', band: 'nearly_level', mechanical: 'None typically needed', erosion_risk: 'low' },
  { slope_pct: '2-5', band: 'gentle', mechanical: 'Contour bunding / contour cultivation', erosion_risk: 'moderate' },
  { slope_pct: '5-10', band: 'moderate', mechanical: 'Graded bunding with safe disposal of excess runoff', erosion_risk: 'high' },
  { slope_pct: '10-33', band: 'steep', mechanical: 'Bench terracing (for arable use) or contour trenching (for tree crops)', erosion_risk: 'very_high' },
  { slope_pct: '>33', band: 'very_steep', mechanical: 'Not recommended for arable cultivation — afforestation/permanent vegetative cover only', erosion_risk: 'severe' },
]);

const VEGETATIVE_MEASURES = Object.freeze([
  { id: 'vetiver_hedges', name: 'Vetiver grass hedgerows on contour', role: 'Slows runoff, traps sediment, stabilizes bund — deep roots, non-invasive', fit_slope: ['gentle', 'moderate', 'steep'] },
  { id: 'cover_cropping', name: 'Cover cropping in off-season', role: 'Roots hold soil, reduces raindrop-impact erosion, adds organic matter', fit_slope: ['nearly_level', 'gentle', 'moderate'] },
  { id: 'strip_cropping', name: 'Strip cropping (alternating erosion-prone and soil-binding crops)', role: 'Breaks up long erosion-prone slope runs', fit_slope: ['gentle', 'moderate'] },
  { id: 'agroforestry_buffer', name: 'Agroforestry / tree buffer strips', role: 'Root systems anchor soil on steep/marginal land, added biomass income', fit_slope: ['steep', 'very_steep'] },
  { id: 'mulching', name: 'Residue/organic mulching', role: 'Reduces raindrop impact and surface runoff velocity on any slope', fit_slope: ['nearly_level', 'gentle', 'moderate', 'steep'] },
]);

function conservationPlan(input = {}) {
  const slopePct = Number(input.slope_pct);
  const band = SLOPE_MEASURES.find((s) => {
    if (Number.isNaN(slopePct)) return false;
    const [lo, hi] = s.slope_pct.replace('>', '').split('-').map(Number);
    return hi ? slopePct >= lo && slopePct <= hi : slopePct > lo;
  }) || null;

  const vegetative = band ? VEGETATIVE_MEASURES.filter((v) => v.fit_slope.includes(band.band)) : VEGETATIVE_MEASURES;

  return {
    engine: 'SoilConservationEngine',
    slope_pct: Number.isNaN(slopePct) ? null : slopePct,
    slope_band: band,
    recommended_vegetative_measures: vegetative,
    disclaimer: SOIL_CONSERVATION_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { conservationPlan, SLOPE_MEASURES, VEGETATIVE_MEASURES, SOIL_CONSERVATION_DISCLAIMER };
