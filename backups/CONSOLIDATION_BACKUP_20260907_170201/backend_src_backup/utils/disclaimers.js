/**
 * Shared disclaimer text for nutrition / wellness / energy-expenditure
 * responses. A single source of truth so the wording is identical wherever
 * it is surfaced (nutritionIntelligenceService, consumerHealthService).
 *
 * Rendered directly on API responses (a `disclaimer` field), not only in
 * documentation, so it is visible at runtime next to the recommendation —
 * matching the discipline this codebase already applies to the veterinary
 * "Natural Therapy Layer" (AFRERA_CLAUDE_BUILD_DIRECTIVE.md PART 5.8).
 */

const NUTRITION_WELLNESS_DISCLAIMER =
  'This information is for general nutrition and wellness education only. ' +
  'It is not medical advice, a diagnosis, or a treatment recommendation. ' +
  'Calorie/energy estimates use standard population formulas and may not ' +
  'reflect your individual physiology. Consult a physician, registered ' +
  'dietitian, or other qualified healthcare provider before making ' +
  'significant changes to your diet, exercise, or supplement routine — ' +
  'especially if you are pregnant, nursing, managing a medical condition, ' +
  'or taking medication.';

module.exports = {
  NUTRITION_WELLNESS_DISCLAIMER
};
