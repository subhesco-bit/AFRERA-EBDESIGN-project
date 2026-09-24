/** Goat species pack */

module.exports = {
  species: 'goat',
  displayName: 'Goat',
  aliases: ['caprine'],
  norms: {
    rectalTempC: { min: 38.5, max: 40.5, fever: 40.6, critical: 41.5 },
    heartRateBpm: { min: 70, max: 90 },
    respiratoryRate: { min: 12, max: 30 },
    bcsScale: '1-5',
  },
  productionStages: [
    'kid', 'growing', 'doe', 'buck', 'pregnant', 'lactating',
  ],
  specialistFocus: [
    'PPR',
    'CCPP and respiratory complex',
    'haemonchosis / parasites',
    'enterotoxaemia',
    'pregnancy toxaemia',
    'orf (zoonotic caution)',
  ],
  vaccinationProgrammeNotes:
    'PPR vaccination is foundational in endemic areas; enterotoxaemia and regional programmes per state veterinary services.',
};
