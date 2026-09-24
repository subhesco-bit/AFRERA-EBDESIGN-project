/**
 * Rituraj Doctor · Master Chef · Nutrition + Diet Culture module entry
 */

const engine = require('./RiturajNutritionEngine');
const culture = require('./DietCultureEngine');

function runNutritionConferenceEnriched(input = {}) {
  const base = engine.runNutritionConference(input);
  const profile = input.profile || input;
  const cultureSeat = culture.buildCultureSeat({
    tradition: input.tradition || profile.tradition,
    community_foodway_id: input.community_foodway_id || profile.community_foodway_id,
    genz_pattern_ids: input.genz_pattern_ids || profile.genz_pattern_ids || [],
    conditions: profile.conditions || input.conditions || [],
    region: (input.location || profile.location || {}).state,
  });
  return {
    ...base,
    specialist_seats: {
      ...base.specialist_seats,
      culture_faith_genz_medical: cultureSeat,
    },
    regional_superfoods: cultureSeat.regional_superfoods,
    religious_calendar: cultureSeat.religious_calendar_matches,
    genz_patterns: cultureSeat.genz_patterns,
    medical_diet_branches: cultureSeat.medical_diet_branches,
    culture_ethics: culture.ethics,
  };
}

module.exports = {
  ...engine,
  ...culture,
  runConference: runNutritionConferenceEnriched,
  runNutritionConference: runNutritionConferenceEnriched,
};
