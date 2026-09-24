/**
 * Rituraj Doctor · Master Chef · Nutrition module entry
 */

const engine = require('./RiturajNutritionEngine');

module.exports = {
  ...engine,
  runConference: engine.runNutritionConference,
};
