/**
 * One Health Surveillance — national + international staging
 *
 * Aligns farm-level events with:
 *  - India: Department of Animal Husbandry & Dairying / state veterinary services
 *  - International: WOAH (OIE) disease status concepts & outbreak response phases
 *  - WHO One Health joint risk (zoonoses)
 *
 * This is operational decision-support for escalation routing — not an
 * official notification channel. Competent authorities remain authoritative.
 */

const { computeHerdRisk } = require('../herd/HerdRiskScoring');
const { VETERINARY_CLINICAL_DISCLAIMER } = require('../../../utils/disclaimers');

/** WOAH-inspired outbreak response stages (operational mapping). */
const INTERNATIONAL_STAGES = Object.freeze([
  {
    id: 'STAGE_0_PEACE',
    label: 'Peace / free or undetected',
    description: 'No active outbreak signal; routine surveillance',
  },
  {
    id: 'STAGE_1_ALERT',
    label: 'Alert / rumour or early signal',
    description: 'Unusual morbidity/mortality or clinical cluster; verify',
  },
  {
    id: 'STAGE_2_SUSPECT',
    label: 'Suspect outbreak',
    description: 'Clinical picture compatible with priority disease; sampling',
  },
  {
    id: 'STAGE_3_CONFIRMED_LOCAL',
    label: 'Confirmed (laboratory / competent authority)',
    description: 'Official confirmation; containment zones',
  },
  {
    id: 'STAGE_4_SPREAD_CONTROL',
    label: 'Spread control / zoning',
    description: 'Movement control, stamping-out or vaccination per policy',
  },
  {
    id: 'STAGE_5_RECOVERY',
    label: 'Recovery / freedom pathway',
    description: 'Surveillance to regain or maintain free status',
  },
]);

/** Priority disease catalogue for surveillance ranking (illustrative). */
const PRIORITY_DISEASES = Object.freeze({
  cow: [
    { id: 'fmd', woah_listed: true, zoonotic: false, india_priority: true },
    { id: 'hs', woah_listed: false, zoonotic: false, india_priority: true },
    { id: 'lsd', woah_listed: true, zoonotic: false, india_priority: true },
    { id: 'anthrax', woah_listed: true, zoonotic: true, india_priority: true },
    { id: 'brucellosis', woah_listed: true, zoonotic: true, india_priority: true },
  ],
  pig: [
    { id: 'asf', woah_listed: true, zoonotic: false, india_priority: true },
    { id: 'csf', woah_listed: true, zoonotic: false, india_priority: true },
    { id: 'fmd', woah_listed: true, zoonotic: false, india_priority: true },
  ],
  goat: [
    { id: 'ppr', woah_listed: true, zoonotic: false, india_priority: true },
    { id: 'ccpp', woah_listed: true, zoonotic: false, india_priority: true },
    { id: 'brucellosis_goat', woah_listed: true, zoonotic: true, india_priority: true },
  ],
  poultry: [
    { id: 'avian_influenza', woah_listed: true, zoonotic: true, india_priority: true },
    { id: 'newcastle', woah_listed: true, zoonotic: false, india_priority: true },
  ],
});

function deriveInternationalStage({ herdRisk, differentials = [], lab_confirmed = false, authority_confirmed = false }) {
  if (authority_confirmed || lab_confirmed) {
    if (herdRisk.band === 'critical') return INTERNATIONAL_STAGES[3]; // confirmed local — may escalate to spread control externally
    return INTERNATIONAL_STAGES[3];
  }

  const notifiable = differentials.some((d) => d.notifiable && (d.confidence || 0) >= 0.25);
  const strongClinical = differentials.some((d) => d.notifiable && (d.confidence || 0) >= 0.45);

  if (strongClinical || (notifiable && herdRisk.band === 'critical')) {
    return INTERNATIONAL_STAGES[2]; // suspect
  }
  if (notifiable || herdRisk.band === 'high' || herdRisk.band === 'moderate') {
    return INTERNATIONAL_STAGES[1]; // alert
  }
  if (herdRisk.score > 0) {
    return INTERNATIONAL_STAGES[1];
  }
  return INTERNATIONAL_STAGES[0];
}

function nationalEscalationPath(species, stage, location = {}) {
  const state = location.state || 'unknown state';
  const steps = [
    'Isolate affected animals; stop unnecessary movement',
    `Notify local / block veterinary officer (${state})',
    'Preserve samples only under professional guidance; do not open carcasses if anthrax suspected',
  ];
  if (stage.id === 'STAGE_2_SUSPECT' || stage.id === 'STAGE_3_CONFIRMED_LOCAL') {
    steps.push('Engage district/state animal husbandry disease control cell');
    steps.push('Prepare movement records and visitor log for investigation');
  }
  if (stage.id === 'STAGE_3_CONFIRMED_LOCAL' || stage.id === 'STAGE_4_SPREAD_CONTROL') {
    steps.push('Follow official zoning, culling, or emergency vaccination orders exactly');
  }
  return {
    jurisdiction: 'India (state veterinary services + DAHD frameworks)',
    species,
    steps,
  };
}

function internationalContext(differentials = []) {
  const hits = [];
  for (const d of differentials) {
    if (!d.notifiable && !(d.tags || []).includes('zoonotic_risk')) continue;
    hits.push({
      disease_id: d.disease_id,
      name: d.name,
      confidence: d.confidence,
      woah_relevant: true,
      note: 'WOAH-listed or nationally notifiable — official channels only for formal reporting',
    });
  }
  return {
    framework: 'WOAH (World Organisation for Animal Health) disease status & notification concepts',
    one_health_partners: ['Veterinary services', 'Public health (if zoonotic)', 'Environment / wildlife if relevant'],
    priority_hits: hits,
    caveat: 'Platform does not submit WOAH or WAHIS reports. Competent authority does.',
  };
}

/**
 * Full One Health surveillance assessment from a panel-like payload.
 */
function assessSurveillance(payload = {}) {
  const species = String(payload.species || '').toLowerCase();
  const differentials = payload.differentials || [];
  const herdRisk = payload.herd_risk || computeHerdRisk({
    history: payload.history,
    differentials,
    context: payload.context,
    production_stage_summary: payload.production_stage_summary,
  });

  const stage = deriveInternationalStage({
    herdRisk,
    differentials,
    lab_confirmed: !!payload.lab_confirmed,
    authority_confirmed: !!payload.authority_confirmed,
  });

  const zoonotic = differentials.some((d) => (d.tags || []).includes('zoonotic_risk') && (d.confidence || 0) >= 0.2)
    || herdRisk.factors?.some((f) => f.id === 'zoonotic_tag');

  const human_health = zoonotic
    ? {
        risk: 'possible',
        actions: [
          'Handlers: PPE, hand hygiene, avoid sick-animal secretions',
          'Seek human medical care if febrile illness after exposure',
          'Do not consume milk/meat from affected animals until cleared',
        ],
      }
    : {
        risk: 'routine',
        actions: ['Standard farm hygiene', 'Separate livestock and household water where practical'],
      };

  return {
    species,
    herd_risk: herdRisk,
    international_stage: stage,
    international_stages_catalogue: INTERNATIONAL_STAGES,
    national_path: nationalEscalationPath(species, stage, payload.location || {}),
    international_context: internationalContext(differentials),
    priority_catalogue_slice: PRIORITY_DISEASES[species] || [],
    human_health,
    environment: {
      notes: payload.history?.weather_notes || null,
      actions: ['Manage manure and deadstock per local rules', 'Rodent/vector control'],
    },
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    surveillance_version: '2026.09.onehealth-v1',
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  assessSurveillance,
  deriveInternationalStage,
  INTERNATIONAL_STAGES,
  PRIORITY_DISEASES,
};
