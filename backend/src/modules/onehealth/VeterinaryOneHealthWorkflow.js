/**
 * Deep Veterinary One Health — operational process, analysis, interpretation, decision
 * Grounded in India PCICDA 2009 reporting concepts + NADRS-style flow + WOAH stages.
 * Decision-support only; competent authorities execute legal powers.
 */

const { randomUUID } = require('crypto');

const OH_DISCLAIMER =
  'One Health workflow is operational decision-support aligned with Indian animal disease control concepts (PCICDA 2009 reporting duties, state AH systems, NADRS-style information flow) and international staging ideas. It does not replace the Veterinarian, Village Officer, Director AH, or human public health authority.';

/** Process stages — how the system operates end-to-end */
const PROCESS_STAGES = [
  {
    id: 'S0_SIGNAL',
    name: 'Signal detection',
    actors: ['owner', 'panchayat', 'paravet', 'lab', 'market'],
    analysis: 'Unusual mortality, abortion storm, vesicles, sudden poultry deaths, handler fever after exposure',
    output: 'Signal ticket with species, location, onset, counts',
  },
  {
    id: 'S1_TRIAGE',
    name: 'Field triage & isolation',
    actors: ['veterinarian', 'owner'],
    analysis: 'Urgency, isolation need, notifiable suspicion score, PPE',
    output: 'Triage grade + immediate control actions',
  },
  {
    id: 'S2_REPORT',
    name: 'Mandatory reporting path (PCICDA-oriented)',
    actors: ['owner', 'village_officer', 'veterinarian', 'veterinary_officer'],
    analysis: 'Scheduled disease belief → report upward; cross-notify neighbouring jurisdictions if outbreak',
    output: 'FIR / incidence report structure',
  },
  {
    id: 'S3_INVESTIGATE',
    name: 'Outbreak investigation',
    actors: ['VO', 'lab', 'epidemiologist'],
    analysis: 'Case definition, attack rate, spatial spread, risk factors, sample plan',
    output: 'Investigation brief',
  },
  {
    id: 'S4_LAB',
    name: 'Laboratory confirmation',
    actors: ['designated_lab', 'NIHSAD_or_state_lab_as_applicable'],
    analysis: 'Official tests only for notifiable; biosafety',
    output: 'Confirmed / negative / inconclusive',
  },
  {
    id: 'S5_NOTIFY_CONTROL',
    name: 'Notification & control measures',
    actors: ['Director_AH', 'District_Collector', 'public_health'],
    analysis: 'Zoning, movement restriction, vaccination emergency policy, culling if ordered',
    output: 'Legal control orders',
  },
  {
    id: 'S6_ONE_HEALTH_CROSS',
    name: 'Human health cross-notification',
    actors: ['DAH', 'DMO', 'IDSP_IHIP', 'NCDC_as_needed'],
    analysis: 'Zoonotic potential, handler illness, food chain risk',
    output: 'Joint risk assessment',
  },
  {
    id: 'S7_RECOVERY',
    name: 'Recovery & freedom pathway',
    actors: ['state_AH', 'surveillance'],
    analysis: 'Restocking rules, surveillance windows, compensation processes if applicable',
    output: 'Closure report',
  },
];

const DECISION_TABLE = [
  {
    when: 'notifiable_suspect && multi_animal',
    decision: 'ACTIVATE_S2_REPORT_AND_ISOLATE',
    priority: 1,
  },
  {
    when: 'zoonotic_tag && human_exposure',
    decision: 'ACTIVATE_S6_CROSS_NOTIFY_HUMAN_HEALTH',
    priority: 1,
  },
  {
    when: 'urgency_emergency',
    decision: 'FIELD_EMERGENCY_VET_NOW',
    priority: 1,
  },
  {
    when: 'lab_confirmed_notifiable',
    decision: 'S5_OFFICIAL_CONTROL_ONLY',
    priority: 1,
  },
  {
    when: 'single_animal_metabolic',
    decision: 'CLINICAL_VET_PATH_NO_OUTBREAK_APPARATUS',
    priority: 3,
  },
  {
    when: 'routine',
    decision: 'MONITOR_AND_RECORD',
    priority: 4,
  },
];

function interpretCase(input = {}) {
  const differentials = input.differentials || [];
  const notifiable = !!(input.notifiable_suspect || differentials.some((d) => d.notifiable && (d.confidence || 0) >= 0.2));
  const zoonotic = differentials.some((d) => (d.tags || []).includes('zoonotic_risk') && (d.confidence || 0) >= 0.2);
  const multi = Number(input.history?.affected_count || 0) > 1 || Number(input.history?.mortality_count || 0) > 0;
  const urgency = input.urgency || 'routine';
  const human_exposure = !!(input.human_exposure || input.handler_ill);
  const lab_confirmed = !!input.lab_confirmed;

  const facts = { notifiable, zoonotic, multi, urgency, human_exposure, lab_confirmed };

  // Decision engine
  let decision = 'MONITOR_AND_RECORD';
  let priority = 99;
  const fired = [];
  if (lab_confirmed && notifiable) {
    decision = 'S5_OFFICIAL_CONTROL_ONLY';
    priority = 1;
    fired.push('lab_confirmed_notifiable');
  } else if (notifiable && multi) {
    decision = 'ACTIVATE_S2_REPORT_AND_ISOLATE';
    priority = 1;
    fired.push('notifiable_suspect && multi_animal');
  } else if (zoonotic && human_exposure) {
    decision = 'ACTIVATE_S6_CROSS_NOTIFY_HUMAN_HEALTH';
    priority = 1;
    fired.push('zoonotic_tag && human_exposure');
  } else if (urgency === 'emergency') {
    decision = 'FIELD_EMERGENCY_VET_NOW';
    priority = 1;
    fired.push('urgency_emergency');
  } else if (!multi && differentials.some((d) => (d.tags || []).includes('metabolic'))) {
    decision = 'CLINICAL_VET_PATH_NO_OUTBREAK_APPARATUS';
    priority = 3;
    fired.push('single_animal_metabolic');
  }

  const active_stages = [];
  if (decision.includes('S2') || notifiable) active_stages.push('S0_SIGNAL', 'S1_TRIAGE', 'S2_REPORT');
  if (decision.includes('S5') || lab_confirmed) active_stages.push('S3_INVESTIGATE', 'S4_LAB', 'S5_NOTIFY_CONTROL');
  if (decision.includes('S6') || (zoonotic && human_exposure)) active_stages.push('S6_ONE_HEALTH_CROSS');
  if (urgency === 'emergency') active_stages.push('S1_TRIAGE');

  const workflow_steps = [];
  // Detailed interaction sequence
  workflow_steps.push({
    phase: 'analysis',
    description: 'Ingest clinical signs, counts, location, vaccination, introductions',
    system: 'VeterinarySpecialistPanel + HerdRisk',
  });
  workflow_steps.push({
    phase: 'interpretation',
    description: `Notifiable=${notifiable}; Zoonotic=${zoonotic}; Multi=${multi}; Urgency=${urgency}`,
    system: 'OneHealthInterpreter',
  });
  workflow_steps.push({
    phase: 'decision',
    description: decision,
    priority,
    rules_fired: fired,
  });
  workflow_steps.push({
    phase: 'interaction',
    actors_to_contact: buildContacts(decision, input.location),
    human_messages: buildMessages(decision, facts),
  });
  workflow_steps.push({
    phase: 'execution_checklist',
    items: buildChecklist(decision, facts),
  });

  return {
    case_id: randomUUID(),
    engine: 'VeterinaryOneHealthWorkflow',
    engine_tier: 'grok-highest-industry',
    facts,
    decision,
    priority,
    process_stages_catalogue: PROCESS_STAGES,
    active_process_stages: [...new Set(active_stages)],
    workflow_steps,
    legal_anchor: {
      india: 'Prevention and Control of Infectious and Contagious Diseases in Animals Act, 2009 — reporting scheduled diseases obligatory (owner / village officer / veterinarian pathways)',
      systems: 'State AH · NADRS-style digital reporting concepts · IDSP/IHIP human cross-notify for zoonoses',
      international: 'WOAH notification is authority function — platform does not file WAHIS',
    },
    disclaimer: OH_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

function buildContacts(decision, location = {}) {
  const state = location.state || 'State';
  const base = ['Licensed veterinarian (local)'];
  if (decision.includes('S2') || decision.includes('S5')) {
    base.push('Block/District Veterinary Officer', `${state} Animal Husbandry control room`);
  }
  if (decision.includes('S6') || decision.includes('CROSS')) {
    base.push('District Medical Officer / IDSP unit', 'Handler occupational health advice');
  }
  if (decision.includes('EMERGENCY')) base.push('Emergency veterinary facility');
  return base;
}

function buildMessages(decision, facts) {
  const msgs = [];
  if (facts.notifiable) msgs.push('Do not move animals; isolate; await official instructions');
  if (facts.zoonotic) msgs.push('PPE for handlers; separate household water; seek care if handler febrile');
  if (decision === 'CLINICAL_VET_PATH_NO_OUTBREAK_APPARATUS') msgs.push('Individual clinical case — schedule veterinary visit; outbreak apparatus not indicated from current facts');
  if (!msgs.length) msgs.push('Continue monitoring; record observations; consult vet if worsens');
  return msgs;
}

function buildChecklist(decision, facts) {
  const items = ['Identify affected and in-contact animals', 'Record onset, mortality, introductions, vaccination'];
  if (facts.notifiable || decision.includes('S2')) {
    items.push('Isolate premises access', 'Stop livestock movement', 'Notify village officer / veterinarian in writing if possible');
  }
  if (facts.zoonotic) items.push('List exposed humans', 'No unprotected slaughter/butchering');
  if (decision.includes('S5')) items.push('Comply only with official sampling and control orders');
  return items;
}

/** Full operate() — analysis → interpretation → interaction → decision */
function operate(input = {}) {
  // Optionally pull panel first if species+clinical provided
  let panel = input.panel_result || null;
  if (!panel && input.species) {
    try {
      const vet = require('../veterinary');
      const runner = vet.runConferenceWithLocalCare || vet.runConference;
      if (runner) panel = runner(input);
    } catch (_) {
      /* panel optional */
    }
  }
  const merged = {
    ...input,
    differentials: input.differentials || panel?.differentials,
    notifiable_suspect: input.notifiable_suspect ?? panel?.notifiable_suspect,
    urgency: input.urgency || panel?.urgency,
    history: input.history || {},
    location: input.location,
  };
  const interpretation = interpretCase(merged);
  return {
    ...interpretation,
    panel_snapshot: panel
      ? {
          species: panel.species,
          urgency: panel.urgency,
          herd_risk: panel.herd_risk,
          top_differentials: (panel.differentials || []).slice(0, 3),
        }
      : null,
    operate_pipeline: ['signal', 'analyze', 'interpret', 'decide', 'interact', 'checklist'],
  };
}

module.exports = {
  operate,
  interpretCase,
  PROCESS_STAGES,
  DECISION_TABLE,
  OH_DISCLAIMER,
};
