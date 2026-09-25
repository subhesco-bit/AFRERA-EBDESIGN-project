/** Sheep species pack — norms, production stages, panel hints
 *
 * Enhanced 2026-09-24: was a 5-line stub missing norms/productionStages/
 * vaccinationProgrammeNotes that every sibling species pack (cow, goat,
 * poultry, pig) already had — despite being marked SUPPORTED in the
 * specialist panel. Real sheep-specific values, not copied from goat:
 * sheep run a narrower, slightly lower normal temperature band and a
 * markedly slower respiratory rate than goats, and carry real
 * sheep-specific disease priorities (footrot, blowfly strike, twin lamb
 * disease) that a goat-copied pack would have missed or mislabeled.
 */

module.exports = {
  species: 'sheep',
  displayName: 'Sheep',
  aliases: ['ovine', 'lamb', 'ewe', 'ram'],
  norms: {
    rectalTempC: { min: 38.3, max: 39.9, fever: 40.0, critical: 41.0 },
    heartRateBpm: { min: 70, max: 90 },
    respiratoryRate: { min: 12, max: 20 },
    bcsScale: '1-5',
  },
  productionStages: [
    'lamb', 'growing', 'ewe', 'ram', 'pregnant', 'lactating', 'wool_mutton_finishing',
  ],
  specialistFocus: [
    'footrot (major sheep-specific lameness cause — distinct management from goat)',
    'blowfly strike / myiasis (shearing timing and crutching are primary prevention)',
    'PPR',
    'haemonchosis / gastrointestinal parasites',
    'clostridial disease (enterotoxaemia, tetanus) — core vaccination priority',
    'pregnancy toxaemia / twin lamb disease (multiple-lamb pregnancies at particular risk)',
    'orf (zoonotic caution)',
  ],
  vaccinationProgrammeNotes:
    'Clostridial (enterotoxaemia/tetanus) multivalent vaccination is foundational — ewes vaccinated pre-lambing to ' +
    'pass colostral immunity to lambs. PPR per endemic-area schedule. Footrot vaccine where regionally available ' +
    'and disease pressure justifies it. Confirm current schedule with state veterinary services.',
  notes: 'Often co-managed with goats but has distinct disease priorities (footrot, fly strike) and normal ranges — validate species-specific labels for drugs, do not assume goat dosing applies.',
};
