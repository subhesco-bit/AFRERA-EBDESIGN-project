/**
 * AFRERA Veterinary Intelligence module entry
 * Specialist Panel + knowledge + species packs
 */

const panel = require('./panel/VeterinarySpecialistPanel');
const knowledge = require('./knowledge');
const cow = require('./species/cow');
const pig = require('./species/pig');
const goat = require('./species/goat');
const poultry = require('./species/poultry');

const speciesPacks = { cow, pig, goat, poultry };

function getSpeciesPack(species) {
  const key = panel.normaliseSpecies(species);
  return speciesPacks[key] || null;
}

module.exports = {
  runConference: panel.runConference,
  normaliseSpecies: panel.normaliseSpecies,
  SUPPORTED_SPECIES: panel.SUPPORTED_SPECIES,
  knowledge,
  speciesPacks,
  getSpeciesPack,
};
