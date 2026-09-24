/**
 * Rituraj Doctor · Master Chef · Nutrition + Diet Culture + Safety module entry
 */

const engine = require('./RiturajNutritionEngine');
const culture = require('./DietCultureEngine');
const safety = require('./SafetyNutritionEngine');

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
  const safetySeat = safety.buildSafetySeat(profile);
  // Prefer dual BMI when available
  if (safetySeat.bmi_dual && base.calculator) {
    base.calculator.bmi_dual = safetySeat.bmi_dual;
  }
  return {
    ...base,
    specialist_seats: {
      ...base.specialist_seats,
      culture_faith_genz_medical: cultureSeat,
      clinical_safety_allergy_drug: safetySeat,
    },
    regional_superfoods: cultureSeat.regional_superfoods,
    religious_calendar: cultureSeat.religious_calendar_matches,
    genz_patterns: cultureSeat.genz_patterns,
    medical_diet_branches: cultureSeat.medical_diet_branches,
    allergy_drug_safety: safetySeat,
    culture_ethics: culture.ethics,
  };
}

module.exports = {
  ...engine,
  ...culture,
  ...safety,
  runConference: runNutritionConferenceEnriched,
  runNutritionConference: runNutritionConferenceEnriched,
};
