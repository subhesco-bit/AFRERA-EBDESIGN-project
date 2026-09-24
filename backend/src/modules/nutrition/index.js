let core = {};
try {
  core = require('./RiturajNutritionEngine');
} catch (_) {
  try {
    core = require('../veterinary/RiturajNutritionEngine');
  } catch (_) {}
}
const enhanced = require('./NutritionEnhancedOperate');

module.exports = {
  ...core,
  runNutritionEnhanced: enhanced.runNutritionEnhanced,
  runNutritionConference: core.runNutritionConference || core.runConference,
};
