/**
 * Nutrition (Rituraj) module — full enhancement layer
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

  const lifeFlags = life?.lifeStageNutritionFlags
    ? life.lifeStageNutritionFlags(input.profile || input)
    : [];

  workflow.advance(wf, 'interpret', 'conference_done');

  const signals = [];
  if (conference?.confidence_overall != null) {
    signals.push({ value: conference.confidence_overall, weight: 1.3, source: 'conference' });
  }
  if (conference?.calculator?.tdee) {
    signals.push({ value: 0.7, weight: 0.5, source: 'calculator_present' });
  }
  if (input.labs || input.lab_values) {
    signals.push({ value: 0.75, weight: 0.8, source: 'labs_provided' });
  }

  const majorInteraction = !!(
    conference?.pharmacy_flags?.major ||
    conference?.drug_food_alerts?.some((a) => a.severity === 'major')
  );
  const clinicalHigh = lifeFlags.some((f) => f.priority === 'high') || !!input.diabetes || !!input.ckd;

  workflow.advance(wf, 'decide', 'decision');
  const decision = decisionEng.buildDecisionPackage({
    action: majorInteraction
      ? 'REVIEW_DRUG_FOOD_WITH_CLINICIAN'
      : clinicalHigh
        ? 'CLINICAL_NUTRITION_PRIORITY'
        : 'FOLLOW_RITURAJ_PLAN',
    confidence_signals: signals,
    urgency: clinicalHigh ? 'soon' : 'routine',
    major_interaction: majorInteraction,
    summary: conference?.panel_summary || 'Nutrition conference',
    rationale: 'Educational nutrition support — not a medical prescription',
    modules_touched: ['nutrition', majorInteraction ? 'pharmacy' : null].filter(Boolean),
    next_steps: [
      ...(conference?.next_actions || []),
      ...(lifeFlags.map((f) => `Life stage: ${f.stage}`)),
    ].slice(0, 5),
    safety_floor: 'Physician / registered dietitian for disease-specific medical nutrition therapy',
  });

  workflow.advance(wf, 'communicate', 'bundle');

  const events = [];
  if (clinicalHigh) {
    events.push(
      bus.publish(
        bus.EVENT_TYPES.NUTRI_CLINICAL_FLAG,
        { flags: lifeFlags, clinical: clinicalHigh },
        { source_module: 'nutrition' },
      ),
    );
  }
  if (majorInteraction) {
    events.push(
      bus.publish(
        bus.EVENT_TYPES.PHARMACY_MAJOR_INTERACTION,
        { source: 'nutrition_conference' },
        { source_module: 'nutrition' },
      ),
    );
  }

  const bmiDual = conference?.calculator?.bmi_dual || conference?.bmi_dual;

  const interactionBundle = interaction.buildInteractionBundle({
    decision,
    bmi_dual: bmiDual,
    workflow: wf,
    lang: input.lang || 'en',
    key_point: majorInteraction ? 'Important drug–food interaction — confirm with clinician.' : null,
  });

  return {
    case_id: randomUUID(),
    module: 'nutrition',
    enhancement_tier: 'full',
    conference,
    life_stage_flags: lifeFlags,
    workflow: wf,
    decision_quality: decision,
    inter_module_events: events.map((e) => e.event),
    interaction: interactionBundle,
    analysis: {
      clinical_high: clinicalHigh,
      major_interaction: majorInteraction,
      confidence_fused: decision.confidence,
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { runNutritionEnhanced };
