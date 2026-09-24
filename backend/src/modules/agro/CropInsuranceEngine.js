/**
 * Crop Insurance Engine — real PMFBY (Pradhan Mantri Fasal Bima Yojana)
 * premium structure, India's actual national crop insurance scheme.
 * Farmer premium share is fixed by the scheme itself, not estimated:
 *   Kharif food & oilseed crops:  2.0% of sum insured (farmer share)
 *   Rabi food & oilseed crops:    1.5% of sum insured (farmer share)
 *   Annual commercial/horticultural crops: 5.0% of sum insured (farmer share)
 * The balance up to the actuarial premium is government-subsidized.
 *
 * Fills the M058 (crop_insurance) gap identified 2026-09-24 — no insurance
 * domain logic existed anywhere in the codebase (the separate 'insurance'
 * engines elsewhere in this platform cover corporate risk/PolicyBazaar-style
 * products, not this specific farm-crop scheme).
 */
'use strict';

const catalogue = require('./knowledge/india_crops_catalogue.json');

const INSURANCE_DISCLAIMER =
  'Premium rates shown are the fixed PMFBY farmer-share percentages as published by the scheme. ' +
  'Actual sum insured, cut-off dates, and notified-crop status vary by state and season — confirm with the ' +
  'implementing agency / bank / CSC before relying on this for an actual application.';

const PMFBY_FARMER_SHARE_PCT = Object.freeze({
  kharif_food_oilseed: 2.0,
  rabi_food_oilseed: 1.5,
  annual_commercial_horticultural: 5.0,
});

// Crop classification for premium-band lookup (kharif/rabi food & oilseed
// crops get the cheapest farmer share; commercial/horticultural crops like
// cotton, turmeric, banana, mango, tomato, onion, potato, chilli fall in
// the 5% band under PMFBY's own crop categorization).
const CROP_CLASS = Object.freeze({
  tomato: 'annual_commercial_horticultural',
  paddy: 'kharif_food_oilseed',
  wheat: 'rabi_food_oilseed',
  mango: 'annual_commercial_horticultural',
  chilli: 'annual_commercial_horticultural',
  onion: 'annual_commercial_horticultural',
  potato: 'annual_commercial_horticultural',
  banana: 'annual_commercial_horticultural',
  cotton: 'annual_commercial_horticultural',
  turmeric: 'annual_commercial_horticultural',
  maize: 'kharif_food_oilseed',
  mustard: 'rabi_food_oilseed',
});

function estimatePremium(input = {}) {
  const cropId = String(input.crop || '').toLowerCase();
  const profile = catalogue.crop_profiles.find((p) => p.id === cropId);
  const cropClass = CROP_CLASS[cropId];
  const sumInsured = Number(input.sum_insured_inr) || null;

  if (!cropClass) {
    return {
      engine: 'CropInsuranceEngine',
      crop: cropId || null,
      crop_known: !!profile,
      classified: false,
      note: 'Crop not yet classified into a PMFBY premium band — confirm notified-crop status with the implementing agency.',
      disclaimer: INSURANCE_DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  const farmerSharePct = PMFBY_FARMER_SHARE_PCT[cropClass];
  const farmerPremiumInr = sumInsured != null ? Math.round(sumInsured * (farmerSharePct / 100)) : null;

  return {
    engine: 'CropInsuranceEngine',
    crop: cropId,
    crop_known: !!profile,
    classified: true,
    scheme: 'PMFBY',
    crop_class: cropClass,
    farmer_share_pct: farmerSharePct,
    sum_insured_inr: sumInsured,
    estimated_farmer_premium_inr: farmerPremiumInr,
    eligibility_note: 'Notified crop + notified area/season + application before the cut-off date, via bank/CSC/insurer portal.',
    disclaimer: INSURANCE_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { estimatePremium, PMFBY_FARMER_SHARE_PCT, CROP_CLASS, INSURANCE_DISCLAIMER };
