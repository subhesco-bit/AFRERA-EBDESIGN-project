/**
 * AFRERA Veterinary Intelligence — Grok-tier module entry
 */

const panel = require('./panel/VeterinarySpecialistPanel');
const knowledge = require('./knowledge');
const { createVeterinaryRouter } = require('./routes');
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
  runHerdScreen: panel.runHerdScreen,
  interpretVitals: panel.interpretVitals,
  vaccinationGapAnalysis: panel.vaccinationGapAnalysis,
  normaliseSpecies: panel.normaliseSpecies,
  SUPPORTED_SPECIES: panel.SUPPORTED_SPECIES,
  NORMS: panel.NORMS,
  VAX_CALENDARS: panel.VAX_CALENDARS,
  knowledge,
  speciesPacks,
  getSpeciesPack,
  createVeterinaryRouter,
};
