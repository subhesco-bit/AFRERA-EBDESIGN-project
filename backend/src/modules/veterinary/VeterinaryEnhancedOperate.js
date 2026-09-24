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

function runVeterinaryEnhanced(input = {}) {
  const wf = workflow.createWorkflow({ module: 'veterinary', context: { species: input.species } });
  workflow.advance(wf, 'analyze', 'vet_start');

  const vet = tryRequire('./index') || tryRequire('../veterinary');
  const oh = tryRequire('../onehealth/VeterinaryOneHealthWorkflow');
  const panelEngine = tryRequire('./panel/VeterinarySpecialistPanel');
  const herd = tryRequire('./herd/HerdRiskScoring');

  let panel = null;
  let herdRisk = null;
  let oneHealth = null;

  try {
    if (panelEngine?.runConference) panel = panelEngine.runConference(input);
    else if (vet?.runConferenceWithLocalCare) panel = vet.runConferenceWithLocalCare(input);
    else if (vet?.runConference) panel = vet.runConference(input);
  } catch (e) {
    panel = { error: e.message };
  }

  try {
    if (herd?.scoreHerd && (input.herd || input.mortality_rate != null)) {
      herdRisk = herd.scoreHerd(input.herd || input);
    }
  } catch (_) {}

  try {
    if (oh?.operate) oneHealth = oh.operate({ ...input, panel_result: panel });
  } catch (_) {}

  workflow.advance(wf, 'interpret', 'panel_done');

  const signals = [];
  if (panel?.confidence_overall != null) {
    signals.push({ value: panel.confidence_overall, weight: 1.5, source: 'panel' });
  }
  if (herdRisk?.score != null) {
    signals.push({ value: 1 - Math.min(1, herdRisk.score / 100), weight: 0.8, source: 'herd_inverse_risk' });
  }

  const urgency = panel?.urgency || input.urgency || 'routine';
  const notifiable = !!(panel?.notifiable_suspect || oneHealth?.facts?.notifiable_suspect);

  workflow.advance(wf, 'decide', 'decision');
  const decision = decisionEng.buildDecisionPackage({
    action: notifiable
      ? 'REPORT_PER_PCICDA_AND_ISOLATE'
      : urgency === 'emergency'
        ? 'SEEK_VET_EMERGENCY'
        : 'FOLLOW_PANEL_PLAN',
    confidence_signals: signals,
    urgency,
    notifiable,
    vision_severity: input.vision_severity,
    summary: panel?.panel_summary || 'Veterinary analysis',
    rationale: panel?.safety_disclaimer || 'Licensed veterinarian is final authority',
    modules_touched: ['veterinary', notifiable ? 'legal' : null, 'one_health', 'embedded_ai', 'erp'].filter(Boolean),
    next_steps: [...(panel?.immediate_actions || []), ...(notifiable ? ['Notify village officer / VO per PCICDA'] : [])].slice(0, 5),
    safety_floor: 'Licensed veterinarian authorises diagnosis, prescription, and official reporting',
  });

  workflow.advance(wf, 'communicate', 'bundle');

  const events = [];
  if (notifiable) {
    events.push(bus.publish(bus.EVENT_TYPES.VET_NOTIFIABLE, { species: input.species }, { source_module: 'veterinary' }));
    events.push(bus.publish(bus.EVENT_TYPES.LEGAL_PCICDA, { stage: 'S2_REPORT' }, { source_module: 'veterinary' }));
  }

  const interactionBundle = interaction.buildInteractionBundle({
    decision,
    herd_risk: herdRisk,
    workflow: wf,
    lang: input.lang || 'en',
    key_point: notifiable ? 'Possible notifiable disease — official reporting path applies.' : null,
  });

  const base = {
    case_id: randomUUID(),
    module: 'veterinary',
    enhancement_tier: 'full+embedded_ai+erp',
    panel,
    herd_risk: herdRisk,
    one_health: oneHealth,
    workflow: wf,
    decision_quality: decision,
    inter_module_events: events.map((e) => e.event),
    interaction: interactionBundle,
    analysis: { differential_count: panel?.differentials?.length || 0, urgency, notifiable, confidence_fused: decision.confidence },
    generatedAt: new Date().toISOString(),
  };

  return attachAIERP('veterinary', base, input);
}

module.exports = { runVeterinaryEnhanced };
