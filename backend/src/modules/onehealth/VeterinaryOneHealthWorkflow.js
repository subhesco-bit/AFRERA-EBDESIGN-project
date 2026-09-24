/**
 * Veterinary One Health workflow — operational process + legal compliance bridge
 */

const { randomUUID } = require('crypto');
const legal = require('../legal/IndiaAnimalHealthCompliance');

const OH_DISCLAIMER =
  'One Health workflow is operational decision-support aligned with PCICDA 2009 reporting concepts, State AH / NADRS-style flow, and IDSP/IHIP cross-notify. Not legal advice. WOAH/WAHIS only via competent authority.';

const PROCESS_STAGES = [
  { id: 'S0_SIGNAL', name: 'Signal detection', actors: ['owner', 'panchayat', 'paravet', 'lab'], analysis: 'Mortality, abortion, vesicles, poultry die-off, handler fever', output: 'Signal ticket' },
  { id: 'S1_TRIAGE', name: 'Field triage & isolation', actors: ['veterinarian', 'owner'], analysis: 'Urgency, isolation, notifiable score, PPE', output: 'Triage grade' },
  { id: 'S2_REPORT', name: 'PCICDA reporting path', actors: ['owner', 'village_officer', 'veterinarian', 'veterinary_officer'], analysis: 'Scheduled disease belief → upward report; neighbour State intimation at Director level', output: 'Incidence / FIR draft for official use' },
  { id: 'S3_INVESTIGATE', name: 'Outbreak investigation', actors: ['VO', 'lab', 'epidemiologist'], analysis: 'Case definition, attack rate, samples', output: 'Investigation brief' },
  { id: 'S4_LAB', name: 'Laboratory confirmation', actors: ['designated_lab'], analysis: 'Official tests; biosafety', output: 'Confirmed / negative' },
  { id: 'S5_NOTIFY_CONTROL', name: 'State control measures', actors: ['Director_AH', 'District_Collector'], analysis: 'Zoning, movement ban, emergency vaccination/culling if ordered', output: 'Control orders' },
  { id: 'S6_ONE_HEALTH_CROSS', name: 'IDSP/IHIP human cross-notify', actors: ['DAH', 'DMO', 'DSO'], analysis: 'Zoonosis, handler illness, food chain', output: 'Joint risk note' },
  { id: 'S7_RECOVERY', name: 'Recovery', actors: ['state_AH'], analysis: 'Surveillance windows, restock rules', output: 'Closure' },
  { id: 'S8_WOAH_BOUNDARY', name: 'International notification boundary', actors: ['Central_competent_authority'], analysis: 'WAHIS only if authority decides', output: 'No platform filing' },
];

function interpretCase(input = {}) {
  const differentials = input.differentials || [];
  const notifiable = !!(input.notifiable_suspect || differentials.some((d) => d.notifiable && (d.confidence || 0) >= 0.2));
  const zoonotic = !!(input.zoonotic_suspect || differentials.some((d) => (d.tags || []).includes('zoonotic_risk') && (d.confidence || 0) >= 0.2));
  const multi = Number(input.history?.affected_count || 0) > 1 || Number(input.history?.mortality_count || 0) > 0;
  const urgency = input.urgency || 'routine';
  const human_exposure = !!(input.human_exposure || input.handler_ill);
  const lab_confirmed = !!input.lab_confirmed;
  const facts = { notifiable, zoonotic, multi, urgency, human_exposure, lab_confirmed };

  let decision = 'MONITOR_AND_RECORD';
  let priority = 99;
  const fired = [];
  if (lab_confirmed && notifiable) {
    decision = 'S5_OFFICIAL_CONTROL_ONLY';
    priority = 1;
    fired.push('lab_confirmed_notifiable');
  } else if (notifiable && multi) {
    decision = 'ACTIVATE_S2_PCICDA_REPORT_AND_ISOLATE';
    priority = 1;
    fired.push('notifiable_multi');
  } else if (zoonotic && human_exposure) {
    decision = 'ACTIVATE_S6_IDSP_IHIP_CROSS_NOTIFY';
    priority = 1;
    fired.push('zoonotic_human_exposure');
  } else if (urgency === 'emergency') {
    decision = 'FIELD_EMERGENCY_VET_NOW';
    priority = 1;
    fired.push('emergency');
  } else if (!multi && differentials.some((d) => (d.tags || []).includes('metabolic'))) {
    decision = 'CLINICAL_VET_PATH_NO_OUTBREAK_APPARATUS';
    priority = 3;
    fired.push('metabolic_single');
  }

  const active = [];
  if (decision.includes('S2') || notifiable) active.push('S0_SIGNAL', 'S1_TRIAGE', 'S2_REPORT');
  if (decision.includes('S5') || lab_confirmed) active.push('S3_INVESTIGATE', 'S4_LAB', 'S5_NOTIFY_CONTROL');
  if (decision.includes('S6') || (zoonotic && human_exposure)) active.push('S6_ONE_HEALTH_CROSS');
  if (notifiable) active.push('S8_WOAH_BOUNDARY');

  const compliance = legal.buildReportingDossier({
    ...input,
    notifiable_suspect: notifiable,
    zoonotic_suspect: zoonotic,
    handler_ill: human_exposure,
  });

  return {
    case_id: randomUUID(),
    engine: 'VeterinaryOneHealthWorkflow',
    engine_tier: 'grok-highest-industry',
    facts,
    decision,
    priority,
    rules_fired: fired,
    process_stages_catalogue: PROCESS_STAGES,
    active_process_stages: [...new Set(active)],
    workflow_steps: [
      { phase: 'analysis', description: 'Clinical + herd + location ingested' },
      { phase: 'interpretation', description: `notifiable=${notifiable} zoonotic=${zoonotic} multi=${multi} urgency=${urgency}` },
      { phase: 'decision', description: decision, priority },
      {
        phase: 'interaction',
        pcicda_chain: legal.PCICDA_DUTIES.reporting_obligatory.chain,
        contacts: buildContacts(decision),
        messages: buildMessages(decision, facts),
      },
      { phase: 'legal_compliance_dossier', dossier_id: compliance.dossier_id, fir: !!compliance.fir_draft, cross_notify: compliance.cross_notify.required_hint },
      { phase: 'woah', action: 'authority_only', platform_files: false },
    ],
    compliance_summary: {
      owner_must_report_path: compliance.decision.owner_must_report_path,
      fir_draft: compliance.fir_draft,
      cross_notify: compliance.cross_notify,
      woah: compliance.woah_action,
    },
    legal_anchor: {
      pcicda: legal.PCICDA_DUTIES.act,
      nadrs: legal.NADRS_STYLE_FLOW.name,
      human: legal.IDSP_IHIP_CROSS.name,
      woah: legal.WOAH_BOUNDARY.rule,
    },
    disclaimer: OH_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

function buildContacts(decision) {
  const c = ['Licensed veterinarian'];
  if (decision.includes('S2') || decision.includes('S5') || decision.includes('PCICDA')) {
    c.push('Village Officer / panchayat path', 'Veterinary Officer', 'District/State Animal Husbandry');
  }
  if (decision.includes('S6') || decision.includes('IDSP')) {
    c.push('District Medical Officer / DSO (IDSP-IHIP)', 'Handler clinical care');
  }
  if (decision.includes('EMERGENCY')) c.push('Emergency veterinary facility');
  return c;
}

function buildMessages(decision, facts) {
  const m = [];
  if (facts.notifiable) m.push('PCICDA path: isolate; stop movement; report via Village Officer / Veterinarian chain');
  if (facts.zoonotic) m.push('One Health: PPE; list exposed humans; request human surveillance awareness');
  if (decision.includes('S5')) m.push('Official control only — comply with AH orders; platform does not issue legal notices');
  if (!m.length) m.push('Monitor; record; consult veterinarian if worsens');
  m.push('WOAH/WAHIS: only competent authority — do not claim international notification from this app');
  return m;
}

function operate(input = {}) {
  let panel = input.panel_result || null;
  if (!panel && input.species) {
    try {
      const vet = require('../veterinary');
      const runner = vet.runConferenceWithLocalCare || vet.runConference;
      if (runner) panel = runner(input);
    } catch (_) {}
  }
  const merged = {
    ...input,
    differentials: input.differentials || panel?.differentials,
    notifiable_suspect: input.notifiable_suspect ?? panel?.notifiable_suspect,
    urgency: input.urgency || panel?.urgency,
    history: input.history || {},
  };
  const interpretation = interpretCase(merged);
  const fullCompliance = legal.operateCompliance({
    ...merged,
    notifiable_suspect: interpretation.facts.notifiable,
    zoonotic_suspect: interpretation.facts.zoonotic,
    handler_ill: interpretation.facts.human_exposure,
  });
  return {
    ...interpretation,
    panel_snapshot: panel
      ? { species: panel.species, urgency: panel.urgency, herd_risk: panel.herd_risk, top: (panel.differentials || []).slice(0, 3) }
      : null,
    full_legal_compliance: fullCompliance,
    operate_pipeline: ['signal', 'analyze', 'interpret', 'decide', 'interact', 'legal_dossier', 'woah_boundary'],
  };
}

module.exports = {
  operate,
  interpretCase,
  PROCESS_STAGES,
  OH_DISCLAIMER,
};
