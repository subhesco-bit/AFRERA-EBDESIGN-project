/** Cow (dairy/beef) species pack — norms, production stages, panel hints */

module.exports = {
  species: 'cow',
  displayName: 'Cattle (Cow / Dairy / Beef)',
  aliases: ['cattle', 'dairy', 'buffalo'],
  norms: {
    rectalTempC: { min: 38.0, max: 39.3, fever: 39.5, critical: 40.5 },
    heartRateBpm: { min: 40, max: 80 },
    respiratoryRate: { min: 10, max: 30 },
    bcsScale: '1-5',
  },
  productionStages: [
    'calf', 'growing', 'heifer', 'lactating', 'dry', 'pregnant', 'fresh', 'bull',
  ],
  specialistFocus: [
    'mastitis complex',
    'metabolic disease (milk fever, ketosis)',
    'FMD / HS / BQ / LSD',
    'tick-borne (theileria, babesia, anaplasma)',
    'reproduction and transition cow',
    'heat stress',
  ],
  vaccinationProgrammeNotes:
    'Follow current national/state schedule for FMD, HS, BQ and regional programmes (LSD, brucella policy). Confirm with local veterinary authority.',
};
