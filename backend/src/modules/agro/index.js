const knowledge = require('./AgroKnowledgeEngine');
const farming = require('./FarmingSystemsEngine');
const vision = require('./AgroVisionAnalysis');
const orchestra = require('./AgroIntelligenceOrchestra');
const cropIntel = require('./CropIntelligenceEngine');
const soil = require('./SoilMicrobiomeEngine');
const apk = require('./ApkFeatureMatrix');

module.exports = {
  ...knowledge,
  ...farming,
  ...vision,
  ...orchestra,
  ...cropIntel,
  ...soil,
  ...apk,
  runAgroConference: knowledge.runAgroConference,
  runFarmingSystemConference: farming.runFarmingSystemConference,
  analyzeVision: vision.analyzeVision,
  runFullAgroIntelligence: orchestra.runFullAgroIntelligence,
  runCropDeepAnalysis: cropIntel.runCropDeepAnalysis,
  analyzeSoil: soil.analyzeSoil,
};
