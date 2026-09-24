const panel = require('./panel/VeterinarySpecialistPanel');
const enhanced = require('./VeterinaryEnhancedOperate');

module.exports = {
  ...panel,
  runVeterinaryEnhanced: enhanced.runVeterinaryEnhanced,
  runConference: panel.runConference,
};
