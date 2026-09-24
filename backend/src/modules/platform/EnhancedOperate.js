/**
 * Enhanced operate — wires algorithms, workflow, bus, interaction on unified OS
 */

const unified = require('./UnifiedIntelligenceOS');
const decisionEng = require('./DecisionQualityEngine');
const workflow = require('./WorkflowOrchestrator');
const bus = require('./InterModuleBus');
const interaction = require('./InteractionLayer');

function operateEnhanced(input = {}) {
  const wf = workflow.createWorkflow({ module: 'unified', context: { domains: input.domains } });
  workflow.advance(wf, 'analyze', 'start_unified');

  const core = unified.operateUnified(input);

  workflow.advance(wf, 'interpret', 'unified_done');

  // Confidence signals from pillars
  const signals = [];
  const vetConf = core.pillars?.veterinary?.panel?.confidence_overall;
  if (vetConf != null) signals.push({ value: vetConf, weight: 1.2, source: 'veterinary_panel' });
  const nutri = core.pillars?.nutrition?.conference;
  if (nutri?.confidence_overall != null) {
    signals.push({ value: nutri.confidence_overall, weight: 1, source: 'nutrition' });
  }
  const agro = core.pillars?.agro?.multi;
  if (agro?.lenses?.systems_analytics?.microbiome_indices?.fertility_index != null) {
    signals.push({
      value: agro.lenses.systems_analytics.microbiome_indices.fertility_index / 100,
      weight: 0.6,
      source: 'agro_fertility_proxy',
    });
  }

  const urgency =
    core.pillars?.veterinary?.panel?.urgency ||
    (core.pillars?.veterinary?.oneHealth?.facts?.urgency);
  const notifiable = !!core.pillars?.veterinary?.panel?.notifiable_suspect;

  workflow.advance(wf, 'decide', 'decision_quality');
  const decision = decisionEng.buildDecisionPackage({
    action: notifiable
      ? 'ACTIVATE_PCICDA_REPORT_PATH'
      : core.consensus?.continuum_actions?.length
        ? 'FOLLOW_CONTINUUM_ACTIONS'
        : 'REVIEW_MODULE_OUTPUTS',
    confidence_signals: signals,
    urgency,
    notifiable,
    summary: core.continuum?.links?.join('; ') || 'Unified analysis complete',
    rationale: core.consensus?.safety_floor,
    modules_touched: Object.keys(core.pillars || {}),
    next_steps: core.continuum?.links || [],
    safety_floor: core.consensus?.safety_floor,
  });

  workflow.advance(wf, 'communicate', 'interaction_bundle');
  const busEvents = bus.fanOutFromUnified(core);

  const interactionBundle = interaction.buildInteractionBundle({
    decision,
    herd_risk: core.pillars?.veterinary?.panel?.herd_risk,
    microbiome_indices:
      core.pillars?.agro?.multi?.lenses?.systems_analytics?.microbiome_indices ||
      core.pillars?.agro?.multi?.lenses?.microbiome_intelligence?.indices,
    bmi_dual: core.pillars?.nutrition?.conference?.calculator?.bmi_dual,
    workflow: wf,
    lang: input.lang || 'en',
    modules_touched: decision.modules_touched,
    next_steps: decision.next_steps || core.continuum?.links,
  });

  return {
    ...core,
    workflow: wf,
    decision_quality: decision,
    inter_module_events: busEvents.map((p) => p.event),
    interaction: interactionBundle,
    enhancement_tier: 'algorithms+workflows+evaluation+viz+audio+bus',
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { operateEnhanced };
