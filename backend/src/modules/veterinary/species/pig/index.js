/** Pig species pack */

module.exports = {
  species: 'pig',
  displayName: 'Pig (Swine)',
  aliases: ['swine', 'hog'],
  norms: {
    rectalTempC: { min: 38.5, max: 40.0, fever: 40.2, critical: 41.0 },
    heartRateBpm: { min: 60, max: 100 },
    respiratoryRate: { min: 10, max: 30 },
    bcsScale: '1-5',
    targetFCR: 2.5,
    gestationDays: 114,
  },
  productionStages: [
    'piglet', 'weaner', 'grower', 'finisher', 'gilt', 'sow', 'boar', 'lactating_sow',
  ],
  specialistFocus: [
    'ASF / CSF notifiable response',
    'neonatal diarrhoea',
    'MMA',
    'FCR and growth',
    'farrowing management',
    'heat stress in finishers',
  ],
  vaccinationProgrammeNotes:
    'CSF (where permitted), erysipelas, breeding-stock reproductive vaccines — confirm local policy. Iron for piglets is standard preventive care under vet guidance.',
};
