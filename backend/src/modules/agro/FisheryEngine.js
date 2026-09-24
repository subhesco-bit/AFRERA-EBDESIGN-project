/**
 * Fishery Engine — real Indian freshwater aquaculture data: the classic
 * carp polyculture system (catla/rohu/mrigal, the three Indian major
 * carps, stocked together because they feed at different water-column
 * levels), pond water-quality parameters, and stocking density norms.
 *
 * Fills the M064 (fishery) gap identified 2026-09-24 — no aquaculture
 * domain data existed anywhere in the codebase; this is a different
 * production system from crop agriculture, not a duplicate of anything.
 */
'use strict';

const FISHERY_DISCLAIMER =
  'Parameters are general pond-culture norms (ICAR-CIFA style). Water quality varies by source and season — ' +
  'test before stocking, and consult the state fisheries department for region-specific advisories.';

// Indian major carp polyculture — the standard freshwater pond system:
// three species stocked together at different ratios because they occupy
// different feeding niches (surface/column/bottom), maximizing pond yield
// without competing for the same food.
const CARP_POLYCULTURE = Object.freeze([
  { species: 'catla', common_name: 'Catla (Catla catla)', feeding_niche: 'surface/column, zooplankton feeder', stocking_ratio_pct: 30 },
  { species: 'rohu', common_name: 'Rohu (Labeo rohita)', feeding_niche: 'column, herbivore/detritivore', stocking_ratio_pct: 30 },
  { species: 'mrigal', common_name: 'Mrigal (Cirrhinus mrigala)', feeding_niche: 'bottom, detritus feeder', stocking_ratio_pct: 40 },
]);

const POND_WATER_QUALITY_NORMS = Object.freeze({
  dissolved_oxygen_mg_l: { min: 5, ideal: '5-8', critical_below: 3, note: 'Below 3 mg/L causes fish stress/mortality — aerate immediately' },
  ph: { min: 6.5, max: 8.5, ideal: '7-8' },
  temperature_c: { min: 20, max: 32, ideal: '25-30 for Indian major carp growth' },
  ammonia_mg_l: { max: 0.1, note: 'Un-ionized ammonia above this is toxic; test after heavy feeding periods' },
  transparency_cm: { ideal: '30-40 (Secchi disk)', note: 'Below 20cm indicates algal bloom risk; above 50cm indicates low productivity' },
});

const STOCKING_NORMS = Object.freeze({
  density_per_hectare: { extensive: '3000-5000', semi_intensive: '5000-8000', intensive: '8000-10000+ (requires aeration)' },
  fingerling_size_cm: '10-15 cm recommended stocking size for survival',
  culture_period_months: '10-12 for table-size harvest (800g-1.2kg)',
});

const COMMON_DISEASE_SIGNS = Object.freeze([
  { id: 'epizootic_ulcerative_syndrome', name: 'EUS (Epizootic Ulcerative Syndrome)', signs: ['red spots', 'skin ulcers', 'fungal growth on lesions'], action: 'Isolate affected pond inflow, lime treatment, consult fisheries dept — notifiable in some states' },
  { id: 'argulus_infestation', name: 'Argulus (fish lice)', signs: ['fish rubbing against pond edges/objects', 'visible parasites on skin'], action: 'Potassium permanganate dip per label, improve water quality' },
  { id: 'gill_rot', name: 'Gill rot (fungal, Branchiomyces)', signs: ['gasping at surface', 'pale/necrotic gill tissue'], action: 'Reduce organic load, improve aeration, lime application' },
]);

function pondPlan(input = {}) {
  const areaHectare = Number(input.area_hectare) || null;
  const intensity = String(input.intensity || 'semi_intensive').toLowerCase();
  const densityRange = STOCKING_NORMS.density_per_hectare[intensity] || STOCKING_NORMS.density_per_hectare.semi_intensive;

  return {
    engine: 'FisheryEngine',
    system: 'indian_major_carp_polyculture',
    species_mix: CARP_POLYCULTURE,
    area_hectare: areaHectare,
    intensity,
    stocking_density_per_hectare: densityRange,
    water_quality_norms: POND_WATER_QUALITY_NORMS,
    common_disease_watch: COMMON_DISEASE_SIGNS,
    disclaimer: FISHERY_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { pondPlan, CARP_POLYCULTURE, POND_WATER_QUALITY_NORMS, STOCKING_NORMS, COMMON_DISEASE_SIGNS, FISHERY_DISCLAIMER };
