const knowledge = require('./AgroKnowledgeEngine');
const farming = require('./FarmingSystemsEngine');
const vision = require('./AgroVisionAnalysis');
const orchestra = require('./AgroIntelligenceOrchestra');

module.exports = {
  ...knowledge,
  ...farming,
  ...vision,
  ...orchestra,
  runAgroConference: knowledge.runAgroConference,
  runFarmingSystemConference: farming.runFarmingSystemConference,
  analyzeVision: vision.analyzeVision,
  runFullAgroIntelligence: orchestra.runFullAgroIntelligence,
};
