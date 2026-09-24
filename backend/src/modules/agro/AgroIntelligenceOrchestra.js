/**
 * Agro Intelligence Orchestra — multi-seat + systems + vision + seasonal knowledge
 */

const { randomUUID } = require('crypto');
const knowledge = require('./AgroKnowledgeEngine');
const farming = require('./FarmingSystemsEngine');
const vision = require('./AgroVisionAnalysis');

function runFullAgroIntelligence(input = {}) {
  const agro = knowledge.runAgroConference(input);
  const systemId = input.system || input.farming_system || (input.roof ? 'roof_garden' : null);
  const farm = systemId || input.telemetry || input.crop
    ? farming.runFarmingSystemConference(input)
    : null;
  const vis =
    input.cv_tags || input.description || input.model_predictions || input.image_meta
      ? vision.analyzeVision(input)
      : null;

  const decision = {
    primary_system: farm?.system_id || 'open_or_unspecified',
    climate_alarms: farm?.climate_advice?.actions || [],
    vision_severity: vis?.severity || null,
    season: agro.season?.id,
    next_actions: [],
  };

  if (vis?.severity === 'high') decision.next_actions.push('Confirm diagnosis before chemical IPM');
  if ((farm?.climate_advice?.actions || []).some((a) => a.severity === 'high')) {
    decision.next_actions.push('Address climate alarm immediately');
  }
  if (!input.soil?.tested && (farm?.system_id === 'open_farming' || !farm)) {
    decision.next_actions.push('Soil test before heavy fertilizer');
  }
  if (farm?.system_id === 'roof_garden') {
    decision.next_actions.push('Verify structural load and waterproofing');
  }
  if (!decision.next_actions.length) decision.next_actions.push('Follow seasonal calendar and monitor weekly');

  return {
    case_id: randomUUID(),
    engine: 'AgroIntelligenceOrchestra',
    engine_tier: 'grok-highest',
    knowledge: agro,
    farming_system: farm,
    vision: vis,
    decision,
    panel_summary: [
      agro.panel_summary,
      farm?.panel_summary,
      vis ? `Vision severity ${vis.severity}` : null,
    ].filter(Boolean).join(' | '),
    disclaimer: knowledge.AGRO_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { runFullAgroIntelligence };
