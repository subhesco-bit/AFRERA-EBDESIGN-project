/**
 * Deep India legal compliance — animal health / One Health
 * Educational decision-support. Not legal advice. Statutes prevail.
 *
 * Anchors:
 *  - Prevention and Control of Infectious and Contagious Diseases in Animals Act, 2009 (PCICDA)
 *  - State Animal Husbandry (AH) operational chains
 *  - NADRS-style digital disease reporting concepts (DAHD/NIC)
 *  - Human side: IDSP / IHIP cross-notification for zoonoses
 *  - WOAH / WAHIS: Central / competent authority only — platform never files
 */

const { randomUUID } = require('crypto');

const LEGAL_DISCLAIMER =
  'This module summarises public legal and programme concepts for operational decision-support. It is not legal advice, not a filing system, and does not create statutory notices. Official text of PCICDA 2009, State rules, DAHD circulars, and CDSCO/FDA law prevail. Only designated public authorities may notify WOAH/WAHIS.';

/** PCICDA 2009 — core duty map (educational paraphrase) */
const PCICDA_DUTIES = {
  act: 'Prevention and Control of Infectious and Contagious Diseases in Animals Act, 2009',
  act_no: 'Act No. 27 of 2009',
  purpose: [
    'Prevent, control and eradicate infectious/contagious animal diseases',
    'Prevent inter-State spread',
    'Support international obligations on animal/animal-product movement',
  ],
  reporting_obligatory: {
    section_theme: 'Reporting scheduled diseases obligatory',
    chain: [
      {
        actor: 'Owner / person in charge / NGO / public body / village panchayat',
        duty: 'If reason to believe animal is infective of a scheduled disease → report to Village Officer or panchayat in-charge',
      },
      {
        actor: 'Village Officer',
        duty: 'May report in writing to nearest available Veterinarian; shall visit area in jurisdiction for outbreak reporting',
      },
      {
        actor: 'Veterinarian',
        duty: 'On receipt of report or own belief of scheduled disease → report to Veterinary Officer',
      },
      {
        actor: 'Director (State)',
        duty: 'On occurrence → intimate Directors of neighbouring States for preventive measures',
      },
    ],
    control_powers_themes: [
      'Segregation of infected animals',
      'Declaration of disease control / infected areas',
      'Compulsory vaccination where ordered',
      'Animal identification',
      'Restriction of movement',
      'Quarantine camps and check posts',
      'Vaccination certificates',
      'Offences and penalties for non-compliance',
    ],
  },
  scheduled_disease_note:
    'Exact Schedule of diseases is under the Act/notifications — treat high-impact transboundary diseases (FMD, ASF, avian influenza, PPR, etc.) as report-first; confirm current Schedule with State AH.',
};

/** NADRS-style information flow (programme concept) */
const NADRS_STYLE_FLOW = {
  name: 'National Animal Disease Reporting System (NADRS) — conceptual flow',
  authority_context: 'DAHD with NIC — block/district/State linked reporting of animal diseases',
  veterinary_officer_functions: [
    'Daily incidence disease case reporting',
    'Creation of First Information Report (FIR) on outbreak',
    'Escalation of daily case to outbreak when criteria met',
    'Follow-up on outbreak',
  ],
  daily_incidence_fields: [
    'Location (State, district, block, veterinary centre)',
    'Case date, species, owner',
    'Habitat, breed, numbers',
    'Symptoms',
    'Age/sex class',
    'Treatment / vaccination notes',
  ],
  outbreak_escalation_criteria_examples: [
    'Unusual mortality cluster',
    'Rapid spatial spread',
    'Suspect scheduled / notifiable pattern',
    'Lab signal pending or positive',
  ],
  platform_role:
    'AFRERA can prepare structured incidence/FIR payloads for the official VO — it does NOT submit to NADRS on behalf of the State.',
};

/** Human public health cross-notify */
const IDSP_IHIP_CROSS = {
  name: 'IDSP / IHIP human health surveillance cross-notification',
  when: 'Zoonotic suspicion, handler illness, food-borne livestock signal, laboratory zoonosis',
  animal_side_actors: ['Veterinarian', 'District AH Officer', 'State AH Directorate', 'DAHD as escalated'],
  human_side_actors: ['Treating clinician', 'District Surveillance Officer (DSO)', 'State Surveillance Officer', 'NCDC pathways as needed'],
  cross_notify_principle:
    'Animal and human health authorities exchange verified signals; joint risk assessment; neither side waits for perfect lab if urgent public risk',
  forms_concept: {
    idsp_style: 'S (suspect) / P (presumptive) / L (lab confirmed) style reporting in human surveillance',
    joint_fields: ['Exposure history', 'Occupation (farmer, butcher, vet)', 'Animal species', 'Timeline', 'PPE gaps'],
  },
  platform_role: 'Flag cross-notify; list contacts; never impersonate DSO filing',
};

/** WOAH / WAHIS boundary */
const WOAH_BOUNDARY = {
  name: 'WOAH / WAHIS',
  rule: 'ONLY competent national / delegated authority files international notifications',
  platform_forbidden: [
    'Direct WAHIS submission',
    'Public claim of official WOAH notification',
    'Bypassing State/Central AH chain',
  ],
  platform_allowed: [
    'Internal staging language aligned to outbreak readiness',
    'Remind users that international notification is authority function',
    'Prepare dossier fields for official use',
  ],
};

/** Build a compliance dossier for a farm event */
function buildReportingDossier(input = {}) {
  const species = input.species || 'unknown';
  const location = input.location || {};
  const history = input.history || {};
  const notifiable = !!input.notifiable_suspect;
  const zoonotic = !!input.zoonotic_suspect;
  const affected = Number(history.affected_count || 0);
  const mortality = Number(history.mortality_count || 0);
  const herd = Number(history.herd_size || 0);

  const incidence = {
    form_type: 'NADRS_STYLE_DAILY_INCIDENCE_DRAFT',
    location: {
      state: location.state || null,
      district: location.district || null,
      block: location.block || null,
      village: location.village || null,
      geo_region: location.geo_region || null,
    },
    case: {
      date: input.onset_date || new Date().toISOString().slice(0, 10),
      species,
      owner_ref: input.owner_ref || 'withheld',
      symptoms: input.clinical?.symptoms || input.symptoms || [],
      affected_count: affected,
      mortality_count: mortality,
      herd_size: herd,
      attack_rate: herd > 0 ? Math.round((affected / herd) * 1000) / 10 : null,
      vaccination_status: history.vaccination_status || 'unknown',
      introductions: history.recent_introductions || false,
    },
    status: notifiable ? 'ESCALATE_FIR_CANDIDATE' : 'ROUTINE_INCIDENCE_CANDIDATE',
  };

  const fir = notifiable || mortality > 0 || affected > 3
    ? {
        form_type: 'NADRS_STYLE_FIR_DRAFT',
        reason: notifiable
          ? 'Scheduled/notifiable disease suspicion'
          : mortality > 0
            ? 'Mortality event'
            : 'Multi-animal cluster',
        recommended_immediate: [
          'Isolate affected group',
          'Stop movement on/off premises',
          'PPE for handlers',
          'Contact licensed veterinarian / Village Officer path',
        ],
      }
    : null;

  const pcicda_duty_checklist = PCICDA_DUTIES.reporting_obligatory.chain.map((c) => ({
    actor: c.actor,
    duty: c.duty,
    status_hint:
      c.actor.startsWith('Owner')
        ? notifiable || mortality > 0
          ? 'DUTY_LIKELY_TRIGGERED — report now'
          : 'Monitor; report if belief of scheduled disease forms'
        : 'Official actor — platform prepares information only',
  }));

  const cross_notify = zoonotic || input.handler_ill
    ? {
        required_hint: true,
        human_message:
          'Zoonotic or handler illness signal — inform treating clinician and request district surveillance awareness; animal side continues AH report path',
        fields: IDSP_IHIP_CROSS.forms_concept.joint_fields,
        actors: {
          animal: IDSP_IHIP_CROSS.animal_side_actors,
          human: IDSP_IHIP_CROSS.human_side_actors,
        },
      }
    : { required_hint: false, human_message: 'No zoonotic/handler flag in inputs' };

  return {
    dossier_id: randomUUID(),
    engine: 'IndiaAnimalHealthCompliance',
    engine_tier: 'grok-highest-legal-ops',
    pcicda: PCICDA_DUTIES,
    nadrs_style: NADRS_STYLE_FLOW,
    idsp_ihip: IDSP_IHIP_CROSS,
    woah: WOAH_BOUNDARY,
    incidence_draft: incidence,
    fir_draft: fir,
    pcicda_duty_checklist,
    cross_notify,
    woah_action: {
      platform_files_wahis: false,
      message: WOAH_BOUNDARY.rule,
      next: 'If confirmed notifiable of international importance, State/Central AH decides WAHIS — user supplies dossier to VO only',
    },
    decision: {
      owner_must_report_path: notifiable || mortality > 0 || !!input.owner_believes_scheduled,
      prepare_fir: !!fir,
      prepare_cross_notify: cross_notify.required_hint,
      legal_filing_by_platform: false,
    },
    disclaimer: LEGAL_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

/** Full compliance operate: duties + dossier + decision narrative */
function operateCompliance(input = {}) {
  const dossier = buildReportingDossier(input);
  const narrative = [];
  narrative.push('ANALYSIS: structured incidence fields captured for official use.');
  narrative.push(
    `INTERPRETATION: FIR candidate=${!!dossier.fir_draft}; cross-notify=${dossier.cross_notify.required_hint}; owner report path=${dossier.decision.owner_must_report_path}.`,
  );
  narrative.push(
    'INTERACTION: Owner → Village Officer / Veterinarian → Veterinary Officer → District/State AH; zoonosis → human DSO/clinician parallel.',
  );
  narrative.push(
    'DECISION: Platform issues checklists and drafts only. Statutory report and WOAH/WAHIS remain human authorities.',
  );

  return {
    ...dossier,
    pipeline: ['analyze', 'interpret', 'interact', 'decide'],
    narrative,
    process_map: {
      pcicda_chain: PCICDA_DUTIES.reporting_obligatory.chain,
      nadrs_vo_functions: NADRS_STYLE_FLOW.veterinary_officer_functions,
      human_cross: IDSP_IHIP_CROSS.when,
      woah: 'authority_only',
    },
  };
}

module.exports = {
  PCICDA_DUTIES,
  NADRS_STYLE_FLOW,
  IDSP_IHIP_CROSS,
  WOAH_BOUNDARY,
  buildReportingDossier,
  operateCompliance,
  LEGAL_DISCLAIMER,
};
