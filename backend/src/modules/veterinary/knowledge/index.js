/**
 * Veterinary knowledge index — species disease packs, ethnovet, withdrawal.
 */

const diseasesCow = require('./diseases_cow.json');
const diseasesPig = require('./diseases_pig.json');
const diseasesGoat = require('./diseases_goat.json');
const diseasesPoultry = require('./diseases_poultry.json');
const diseasesSheep = require('./diseases_sheep.json');
const ethnovet = require('./ethnovet_india.json');
const withdrawal = require('./withdrawal_reference.json');

const DISEASE_PACKS = {
  cow: diseasesCow,
  pig: diseasesPig,
  goat: diseasesGoat,
  poultry: diseasesPoultry,
  sheep: diseasesSheep,
};

function getDiseasePack(species) {
  let key = String(species || '').toLowerCase();
  if (key === 'cattle' || key === 'buffalo' || key === 'dairy') key = 'cow';
  if (key === 'chicken' || key === 'hen' || key === 'bird') key = 'poultry';
  if (key === 'lamb' || key === 'ovine') key = 'sheep';
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
  let key = String(species || '').toLowerCase();
  if (key === 'sheep') key = 'goat'; // shared small-ruminant ethnovet filter often
  return (ethnovet.remedies || []).filter(
    (r) => !r.species || r.species.includes(key) || r.species.includes('sheep') || r.species.includes('*'),
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
  KNOWLEDGE_VERSION: '2026.09.2',
  DISEASE_PACKS,
  ethnovet,
  withdrawal,
  getDiseasePack,
  listDiseases,
  findDisease,
  getEthnovetForSpecies,
  lookupWithdrawal,
};
