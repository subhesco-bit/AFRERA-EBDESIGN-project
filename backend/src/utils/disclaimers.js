/**
 * Shared disclaimer text for nutrition / wellness / energy-expenditure
 * and veterinary clinical decision-support responses. A single source of
 * truth so the wording is identical wherever it is surfaced.
 *
 * Rendered directly on API responses (a `disclaimer` field), not only in
 * documentation — matching AFRERA_CLAUDE_BUILD_DIRECTIVE.md PART 5.8 and
 * AFRERA_VETERINARY_SPECIALIST_PANEL_SPECIFICATION.md safety rules.
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

const VETERINARY_CLINICAL_DISCLAIMER =
  'This output is veterinary clinical decision-support only. It is not a ' +
  'diagnosis, prescription, or substitute for examination by a licensed ' +
  'veterinarian. Drug doses, withdrawal periods, and notifiable-disease ' +
  'actions must be confirmed against current product labels, local ' +
  'regulations, and professional judgement. For emergencies, suspected ' +
  'notifiable diseases, or food-producing animals near slaughter/milking, ' +
  'contact a licensed veterinarian and relevant authorities immediately. ' +
  'Ethnoveterinary and complementary suggestions are labelled by evidence ' +
  'level and must not replace indicated antimicrobial or emergency care.';

const VETERINARY_ETHNOVET_NOTE =
  'Traditional and ethnoveterinary practices are shown with explicit ' +
  'evidence grades (strong / moderate / limited / traditional_only / ' +
  'insufficient). traditional_only means customary use without strong ' +
  'controlled clinical evidence in this species context.';

module.exports = {
  NUTRITION_WELLNESS_DISCLAIMER,
  VETERINARY_CLINICAL_DISCLAIMER,
  VETERINARY_ETHNOVET_NOTE,
};
