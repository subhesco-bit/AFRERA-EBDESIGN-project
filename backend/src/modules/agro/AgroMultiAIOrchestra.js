/**
 * Agro Multi-AI Orchestra — certification + microbiome + crop + vision + systems
 * Same interpretation standard as Health MultiAI.
 */

const { randomUUID } = require('crypto');
const cert = require('./OrganicCertificationEngine');
const micro = require('./DeepMicrobiomeAI');
const crop = require('./CropIntelligenceEngine');
const orchestra = require('./AgroIntelligenceOrchestra');
const gaps = require('./AgroGapAnalysisInternational');

const AI_MODES = [
  { id: 'agronomic_decision', name: 'Agronomic Decision AI' },
  { id: 'scientific_research', name: 'Scientific Research AI' },
  { id: 'microbiome_intelligence', name: 'Microbiome Intelligence AI' },
  { id: 'organic_certification', name: 'Organic Certification AI' },
  { id: 'generative_nextgen', name: 'Generative Scenario AI' },
  { id: 'systems_analytics', name: 'Systems Analytics AI' },
  { id: 'vision_diagnosis', name: 'Vision Diagnosis AI' },
];

function runAgroMultiAI(input = {}) {
  const base = orchestra.runFullAgroIntelligence(input);
  const cropDeep = crop.runCropDeepAnalysis(input);
  const microbiome = micro.interpretMicrobiome(input);
  const certification =
    input.organic || input.certification || input.export_target || input.farming_mode === 'organic'
      ? cert.runCertificationConference(input)
      : null;

  const lenses = {
    agronomic_decision: {
      next_actions: base.decision?.next_actions || [],
      crop_summary: cropDeep.panel_summary,
    },
    scientific_research: {
      diseases: cropDeep.diseases,
      season_fit: cropDeep.season_fit,
      microbiome_method: microbiome.lenses.scientific_research,
    },
    microbiome_intelligence: microbiome,
    organic_certification: certification,
    generative_nextgen: {
      plain: [base.panel_summary, microbiome.lenses.generative_nextgen.plain_summary, certification?.panel_summary]
        .filter(Boolean)
        .join(' | '),
    },
    systems_analytics: {
      microbiome_indices: microbiome.indices,
      climate_alarms: base.farming_system?.climate_advice?.actions || [],
      vision_severity: base.vision?.severity,
    },
    vision_diagnosis: base.vision,
  };

  const consensus = {
    action: microbiome.lenses.agronomic_decision.action,
    organic_path: certification?.decision?.action || null,
    safety_floor: 'Extension officer / accredited CB / soil lab remain authorities for legal certification and prescriptions',
  };

  return {
    case_id: randomUUID(),
    engine: 'AgroMultiAIOrchestra',
    engine_tier: 'grok-highest-industry',
    ai_modes_catalogue: AI_MODES,
    lenses,
    consensus,
    gap_report: gaps.getGapReport(),
    base_intelligence: base,
    crop_deep: cropDeep,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { runAgroMultiAI, AI_MODES };
