const knowledge = require('./AgroKnowledgeEngine');
const farming = require('./FarmingSystemsEngine');
const vision = require('./AgroVisionAnalysis');
const orchestra = require('./AgroIntelligenceOrchestra');
const cropIntel = require('./CropIntelligenceEngine');
const soil = require('./SoilMicrobiomeEngine');
const apk = require('./ApkFeatureMatrix');
const cert = require('./OrganicCertificationEngine');
const micro = require('./DeepMicrobiomeAI');
const multi = require('./AgroMultiAIOrchestra');
const gaps = require('./AgroGapAnalysisInternational');

module.exports = {
  ...knowledge,
  ...farming,
  ...vision,
  ...orchestra,
  ...cropIntel,
  ...soil,
  ...apk,
  ...cert,
  ...micro,
  ...multi,
  ...gaps,
  runAgroConference: knowledge.runAgroConference,
  runCropDeepAnalysis: cropIntel.runCropDeepAnalysis,
  interpretMicrobiome: micro.interpretMicrobiome,
  runCertificationConference: cert.runCertificationConference,
  runAgroMultiAI: multi.runAgroMultiAI,
};
