/**
 * Agro module — full enhancement layer
 */

const { randomUUID } = require('crypto');
const decisionEng = require('../platform/DecisionQualityEngine');
const workflow = require('../platform/WorkflowOrchestrator');
const bus = require('../platform/InterModuleBus');
const interaction = require('../platform/InteractionLayer');

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
  if (indices.fertility_index != null) {
    signals.push({ value: indices.fertility_index / 100, weight: 1, source: 'fertility_index' });
  }
  if (multi?.crop_deep?.season_fit === true) {
    signals.push({ value: 0.75, weight: 0.6, source: 'season_fit' });
  }
  if (visionSev === 'high') {
    signals.push({ value: 0.35, weight: 1, source: 'vision_high_severity' });
  } else if (visionSev === 'moderate') {
    signals.push({ value: 0.55, weight: 0.7, source: 'vision_moderate' });
  }

  workflow.advance(wf, 'decide', 'decision');
  const decision = decisionEng.buildDecisionPackage({
    action:
      visionSev === 'high'
        ? 'FIELD_SANITATION_AND_SCOUT'
        : cert
          ? cert.decision?.action || 'FOLLOW_ORGANIC_PATH'
          : biochar?.recommendation?.suitability?.band === 'favourable'
            ? 'CONSIDER_CHARGED_BIOCHAR'
            : 'FOLLOW_AGRO_PLAN',
    confidence_signals: signals,
    urgency: visionSev === 'high' ? 'soon' : 'routine',
    vision_severity: visionSev,
    summary: multi?.lenses?.generative_nextgen?.plain || multi?.panel_summary || 'Agro analysis',
    rationale: multi?.consensus?.safety_floor || 'Extension and CB remain authorities',
    modules_touched: ['agro', cert ? 'organic_cert' : null, biochar ? 'biochar' : null].filter(Boolean),
    next_steps: [
      ...(multi?.consensus?.next_actions || []),
      biochar ? `Biochar charge: ${biochar.recommendation?.charging?.primary}` : null,
    ].filter(Boolean).slice(0, 5),
    safety_floor: 'Extension officer / accredited CB / soil lab for legal and prescription finality',
  });

  workflow.advance(wf, 'communicate', 'bundle');

  const events = [];
  if (visionSev === 'high' || (multi?.crop_deep?.diseases || []).some((d) => d.severity === 'high')) {
    events.push(
      bus.publish(
        bus.EVENT_TYPES.AGRO_OUTBREAK_CROP,
        { severity: visionSev, crop: input.crop },
        { source_module: 'agro' },
      ),
    );
  }
  if (cert) {
    events.push(
      bus.publish(
        bus.EVENT_TYPES.AGRO_ORGANIC_CERT,
        { scheme: cert.recommendation?.primary },
        { source_module: 'agro' },
      ),
    );
  }

  const interactionBundle = interaction.buildInteractionBundle({
    decision,
    microbiome_indices: indices,
    workflow: wf,
    lang: input.lang || 'en',
    key_point: visionSev === 'high' ? 'High severity crop signal — scout and contain.' : null,
  });

  return {
    case_id: randomUUID(),
    module: 'agro',
    enhancement_tier: 'full',
    multi,
    biochar,
    certification: cert,
    workflow: wf,
    decision_quality: decision,
    inter_module_events: events.map((e) => e.event),
    interaction: interactionBundle,
    analysis: {
      vision_severity: visionSev,
      fertility_index: indices.fertility_index,
      confidence_fused: decision.confidence,
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { runAgroEnhanced };
