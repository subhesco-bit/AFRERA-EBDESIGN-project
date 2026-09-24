const { randomUUID } = require('crypto');
const decisionEng = require('../platform/DecisionQualityEngine');
const workflow = require('../platform/WorkflowOrchestrator');
const bus = require('../platform/InterModuleBus');
const interaction = require('../platform/InteractionLayer');
const { attachAIERP } = require('../platform/ModuleAIERPBridge');

function tryRequire(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

function runAgroEnhanced(input = {}) {
  const wf = workflow.createWorkflow({ module: 'agro' });
  workflow.advance(wf, 'analyze', 'agro_start');

  const agro = tryRequire('./index') || tryRequire('../agro');
  let multi = null;
  let biochar = null;
  let cert = null;

  try {
    if (agro?.runAgroMultiAI) multi = agro.runAgroMultiAI(input);
    else if (agro?.runFullAgroIntelligence) multi = agro.runFullAgroIntelligence(input);
  } catch (e) {
    multi = { error: e.message };
  }

  try {
    if (agro?.runBiocharConference && (input.biochar || input.goal === 'carbon' || input.include_biochar)) {
      biochar = agro.runBiocharConference(input);
    }
  } catch (_) {}

  try {
    if (agro?.runCertificationConference && (input.organic || input.farming_mode === 'organic')) {
      cert = agro.runCertificationConference(input);
    }
  } catch (_) {}

  workflow.advance(wf, 'interpret', 'multi_done');

  const indices =
    multi?.lenses?.microbiome_intelligence?.indices ||
    multi?.lenses?.systems_analytics?.microbiome_indices ||
    {};
  const visionSev = multi?.lenses?.vision_diagnosis?.severity || multi?.vision?.severity;
  const signals = [];
  if (indices.fertility_index != null) signals.push({ value: indices.fertility_index / 100, weight: 1, source: 'fertility_index' });
  if (visionSev === 'high') signals.push({ value: 0.35, weight: 1, source: 'vision_high_severity' });

  workflow.advance(wf, 'decide', 'decision');
  const decision = decisionEng.buildDecisionPackage({
    action:
      visionSev === 'high'
        ? 'FIELD_SANITATION_AND_SCOUT'
        : cert
          ? cert.decision?.action || 'FOLLOW_ORGANIC_PATH'
          : 'FOLLOW_AGRO_PLAN',
    confidence_signals: signals,
    urgency: visionSev === 'high' ? 'soon' : 'routine',
    vision_severity: visionSev,
    summary: multi?.lenses?.generative_nextgen?.plain || 'Agro analysis',
    rationale: multi?.consensus?.safety_floor || 'Extension and CB remain authorities',
    modules_touched: ['agro', 'embedded_ai', 'erp', cert ? 'organic_cert' : null].filter(Boolean),
    next_steps: [biochar ? `Biochar charge: ${biochar.recommendation?.charging?.primary}` : null].filter(Boolean),
    safety_floor: 'Extension officer / accredited CB / soil lab for finality',
  });

  workflow.advance(wf, 'communicate', 'bundle');

  const events = [];
  if (visionSev === 'high') {
    events.push(bus.publish(bus.EVENT_TYPES.AGRO_OUTBREAK_CROP, { crop: input.crop }, { source_module: 'agro' }));
  }

  const interactionBundle = interaction.buildInteractionBundle({
    decision,
    microbiome_indices: indices,
    workflow: wf,
    lang: input.lang || 'en',
  });

  const base = {
    case_id: randomUUID(),
    module: 'agro',
    enhancement_tier: 'full+embedded_ai+erp',
    multi,
    biochar,
    certification: cert,
    workflow: wf,
    decision_quality: decision,
    inter_module_events: events.map((e) => e.event),
    interaction: interactionBundle,
    analysis: { vision_severity: visionSev, fertility_index: indices.fertility_index, confidence_fused: decision.confidence },
    generatedAt: new Date().toISOString(),
  };

  return attachAIERP('agro', base, input);
}

module.exports = { runAgroEnhanced };
