/** Poultry (chicken-focused) species pack */

module.exports = {
  species: 'poultry',
  displayName: 'Poultry (Chicken)',
  aliases: ['chicken', 'hen', 'broiler', 'layer'],
  norms: {
    rectalTempC: { min: 40.5, max: 42.0, fever: 42.5, critical: 43.5 },
    heartRateBpm: { min: 250, max: 300 },
    respiratoryRate: { min: 15, max: 30 },
  },
  productionStages: [
    'chick', 'grower', 'pullet', 'layer', 'broiler', 'breeder',
  ],
  specialistFocus: [
    'Newcastle Disease',
    'Avian Influenza (notifiable)',
    'IBD / Gumboro',
    'coccidiosis',
    'CRD / mycoplasma',
    'heat stress',
    'Marek\'s (vaccination)',
  ],
  vaccinationProgrammeNotes:
    'Hatchery Marek\'s; structured ND+IBD programmes; IB, fowl pox as indicated. Confirm with poultry veterinarian / integrator schedule.',
};
