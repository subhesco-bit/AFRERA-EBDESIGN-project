/**
 * Veterinary knowledge index — all livestock, poultry, waterfowl, pets, fish
 */

const DISEASE_PACKS = {
  cow: require('./diseases_cow.json'),
  pig: require('./diseases_pig.json'),
  goat: require('./diseases_goat.json'),
  poultry: require('./diseases_poultry.json'),
  sheep: require('./diseases_sheep.json'),
  duck: require('./diseases_duck.json'),
  rabbit: require('./diseases_rabbit.json'),
  dog: require('./diseases_dog.json'),
  cat: require('./diseases_cat.json'),
  fish: require('./diseases_fish.json'),
};

const ethnovet = require('./ethnovet_india.json');
const withdrawal = require('./withdrawal_reference.json');

const ALIASES = {
  cattle: 'cow', dairy: 'cow', buffalo: 'cow', ox: 'bull', bull: 'cow',
  chicken: 'poultry', hen: 'poultry', broiler: 'poultry', layer: 'poultry', bird: 'poultry',
  swine: 'pig', hog: 'pig', boar: 'pig', sow: 'pig',
  caprine: 'goat', doe: 'goat', buck: 'goat',
  ovine: 'sheep', lamb: 'sheep', ewe: 'sheep', ram: 'sheep',
  canine: 'dog', puppy: 'dog',
  feline: 'cat', kitten: 'cat',
  waterfowl: 'duck', duckling: 'duck',
  bunny: 'rabbit', lagomorph: 'rabbit',
  aquaculture: 'fish', pondfish: 'fish',
};

function normaliseKey(species) {
  const s = String(species || '').toLowerCase().trim();
  return ALIASES[s] || s;
}

function getDiseasePack(species) {
  const key = normaliseKey(species);
  const pack = DISEASE_PACKS[key];
  if (!pack) {
    throw new Error(`No disease pack for species: ${species}. Supported: ${Object.keys(DISEASE_PACKS).join(', ')}`);
  }
  return pack;
}

function listDiseases(species) {
  return getDiseasePack(species).diseases || [];
}

function findDisease(species, diseaseId) {
  return listDiseases(species).find((d) => d.id === diseaseId) || null;
}

function getEthnovetForSpecies(species) {
  const key = normaliseKey(species);
  const mapTo = key === 'sheep' || key === 'duck' ? 'goat' : key === 'dog' || key === 'cat' || key === 'rabbit' || key === 'fish' ? '*' : key;
  return (ethnovet.remedies || []).filter(
    (r) => !r.species || r.species.includes(key) || r.species.includes(mapTo) || r.species.includes('*'),
  );
}

function lookupWithdrawal(drugId, species, matrix) {
  const entries = withdrawal.entries || [];
  const hit = entries.find(
    (e) =>
      e.drug_id === drugId &&
      (e.species === species || e.species === '*') &&
      (e.matrix === matrix || e.matrix === '*'),
  );
  if (!hit || hit.withdrawal_days == null) {
    return {
      withdrawal_days: null,
      source: 'unknown',
      requires_vet_consultation: true,
      note: 'Withdrawal not authorised in knowledge base — verify product label with veterinarian',
    };
  }
  return { ...hit, requires_vet_consultation: false };
}

module.exports = {
  KNOWLEDGE_VERSION: '2026.09.pets-full',
  DISEASE_PACKS,
  ethnovet,
  withdrawal,
  normaliseKey,
  getDiseasePack,
  listDiseases,
  findDisease,
  getEthnovetForSpecies,
  lookupWithdrawal,
  SUPPORTED_SPECIES: Object.keys(DISEASE_PACKS),
};
