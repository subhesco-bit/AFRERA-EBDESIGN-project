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

function runNutritionEnhanced(input = {}) {
  const wf = workflow.createWorkflow({ module: 'nutrition' });
  workflow.advance(wf, 'analyze', 'nutri_start');

  const nutri = tryRequire('./index') || tryRequire('../nutrition');
  const life = tryRequire('../platform/UnifiedIntelligenceOS');

  let conference = null;
  try {
    if (nutri?.runNutritionConference) conference = nutri.runNutritionConference(input);
  } catch (e) {
    conference = { error: e.message };
  }

  const lifeFlags = life?.lifeStageNutritionFlags ? life.lifeStageNutritionFlags(input.profile || input) : [];

  workflow.advance(wf, 'interpret', 'conference_done');

  // `confidence_overall` never existed on the conference output — this
  // previously always evaluated false and silently fell through to the
  // engine's "no signals" default, with nothing to indicate the gap. The
  // real, honest signal available here is whether the Mifflin-St Jeor
  // calculation actually ran on valid inputs (tdee_kcal non-null) rather
  // than a fabricated confidence number.
  const signals = [];
  if (conference?.calculator?.tdee_kcal != null) {
    signals.push({ value: 0.75, weight: 1, source: 'calculator_computed' });
  }
  if (Array.isArray(conference?.clinical_flags) && conference.clinical_flags.length > 0) {
    signals.push({ value: 0.6, weight: 0.5, source: 'clinical_flags_present' });
  }

  const majorInteraction = !!(conference?.pharmacy_flags?.major || conference?.drug_food_alerts?.some((a) => a.severity === 'major'));
  const clinicalHigh = lifeFlags.some((f) => f.priority === 'high') || !!input.diabetes || !!input.ckd;

  workflow.advance(wf, 'decide', 'decision');
  const decision = decisionEng.buildDecisionPackage({
    action: majorInteraction ? 'REVIEW_DRUG_FOOD_WITH_CLINICIAN' : clinicalHigh ? 'CLINICAL_NUTRITION_PRIORITY' : 'FOLLOW_RITURAJ_PLAN',
    confidence_signals: signals,
    urgency: clinicalHigh ? 'soon' : 'routine',
    major_interaction: majorInteraction,
    summary: conference?.panel_summary || 'Nutrition conference',
    rationale: 'Educational nutrition support — not a medical prescription',
    modules_touched: ['nutrition', majorInteraction ? 'pharmacy' : null, 'embedded_ai', 'erp'].filter(Boolean),
    next_steps: [...(conference?.next_actions || []), ...lifeFlags.map((f) => `Life stage: ${f.stage}`)].slice(0, 5),
    safety_floor: 'Physician / registered dietitian for disease-specific medical nutrition therapy',
  });

  workflow.advance(wf, 'communicate', 'bundle');

  const events = [];
  if (clinicalHigh) {
    events.push(bus.publish(bus.EVENT_TYPES.NUTRI_CLINICAL_FLAG, { flags: lifeFlags }, { source_module: 'nutrition' }));
  }
  if (majorInteraction) {
    events.push(bus.publish(bus.EVENT_TYPES.PHARMACY_MAJOR_INTERACTION, {}, { source_module: 'nutrition' }));
  }

  const interactionBundle = interaction.buildInteractionBundle({
    decision,
    bmi_dual: conference?.calculator?.bmi_dual || conference?.bmi_dual,
    workflow: wf,
    lang: input.lang || 'en',
  });

  const base = {
    case_id: randomUUID(),
    module: 'nutrition',
    enhancement_tier: 'full+embedded_ai+erp',
    conference,
    life_stage_flags: lifeFlags,
    workflow: wf,
    decision_quality: decision,
    inter_module_events: events.map((e) => e.event),
    interaction: interactionBundle,
    analysis: { clinical_high: clinicalHigh, major_interaction: majorInteraction, confidence_fused: decision.confidence },
    generatedAt: new Date().toISOString(),
  };

  return attachAIERP('nutrition', base, input);
}

module.exports = { runNutritionEnhanced };
