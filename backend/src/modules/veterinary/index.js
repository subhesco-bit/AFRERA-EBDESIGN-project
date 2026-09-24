/**
 * AFRERA Veterinary Intelligence — Grok-tier module entry
 * Includes geo-fenced ancestral/customary, natural & dietary care (module-scoped).
 */

const panel = require('./panel/VeterinarySpecialistPanel');
const knowledge = require('./knowledge');
const { createVeterinaryRouter } = require('./routes');
const { computeHerdRisk, WEIGHTS: HERD_WEIGHTS } = require('./herd/HerdRiskScoring');
const oneHealth = require('./onehealth/OneHealthSurveillance');
const geoCare = require('./geo/GeoFencedCare');
const cow = require('./species/cow');
const pig = require('./species/pig');
const goat = require('./species/goat');
const poultry = require('./species/poultry');

const speciesPacks = { cow, pig, goat, poultry };

function getSpeciesPack(species) {
  const key = panel.normaliseSpecies(species);
  return speciesPacks[key] || null;
}

/** Full conference + geo local care enrichment */
function runConferenceWithLocalCare(caseInput = {}) {
  const report = panel.runConference(caseInput);
  const local_care = geoCare.buildLocalCarePackage({
    species: report.species,
    location: caseInput.location || {},
    clinical: caseInput.clinical || {},
    history: caseInput.history || {},
  });
  return {
    ...report,
    local_care,
    ancestral_therapies: local_care.ancestral_customary_medicine,
    natural_care: local_care.natural_care,
    dietary_care: {
      species_principles: local_care.dietary_care,
      geo_local: local_care.dietary_local,
      context_notes: local_care.context_notes,
    },
  };
}

module.exports = {
  runConference: panel.runConference,
  runConferenceWithLocalCare,
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
  computeHerdRisk,
  HERD_WEIGHTS,
  oneHealth,
  assessSurveillance: oneHealth.assessSurveillance,
  INTERNATIONAL_STAGES: oneHealth.INTERNATIONAL_STAGES,
  geoCare,
  buildLocalCarePackage: geoCare.buildLocalCarePackage,
};
