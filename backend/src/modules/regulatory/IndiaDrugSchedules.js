/**
 * India Drug Schedules — Drugs and Cosmetics Rules, 1945 (educational)
 * Covers Schedule G, H, H1, X operational meaning, sale workflow, labeling.
 * NOT a complete statutory gazette list — always verify current CDSCO/Gazette.
 */

const REGULATORY_DISCLAIMER =
  'Educational summary of India drug-schedule concepts under the Drugs and Cosmetics Act, 1940 and Rules, 1945. Schedule lists are amended by Gazette notification. This module does not authorise sale, purchase, or prescription. Confirm current law with CDSCO / State FDA / licensed pharmacist.';

const SCHEDULES = {
  G: {
    id: 'G',
    name: 'Schedule G',
    purpose: 'Drugs to be taken under medical supervision',
    label_caution: 'Caution: it is dangerous to take this preparation except under medical supervision',
    prescription_required: true,
    retail_register: false,
    symbol: null,
    examples_illustrative: ['Some hormonal / potent systemic agents historically listed — verify current entry'],
    operational_notes: [
      'Patient counselling on supervised use',
      'Not OTC self-selection',
    ],
  },
  H: {
    id: 'H',
    name: 'Schedule H',
    purpose: 'Prescription-only medicines sold against RMP prescription',
    label_caution: 'Schedule H Drug – Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only',
    prescription_required: true,
    retail_register: false,
    symbol: 'Rx',
    examples_illustrative: [
      'Large class of antibacterials, antihypertensives, antidiabetics, steroids, etc. (hundreds of substances — list is dynamic)',
      'Most systemic prescription meds fall here unless escalated to H1 or X',
    ],
    operational_notes: [
      'Retail sale only on prescription of Registered Medical Practitioner (RMP)',
      'Label: Rx in red box per Rule 97 patterns',
      'Pharmacist verifies prescription authenticity and validity practices per state FDA',
      'No OTC sale',
    ],
  },
  H1: {
    id: 'H1',
    name: 'Schedule H1',
    purpose: 'Stricter prescription control — AMR, habit-forming, select high-risk agents',
    label_caution:
      'Schedule H1 Drug – Caution: It is dangerous to take this preparation except in accordance with medical advice – Not to be sold by retail without prescription of RMP',
    prescription_required: true,
    retail_register: true,
    register_retention_years: 3,
    symbol: 'Rx',
    examples_illustrative: [
      'Many 3rd/4th gen cephalosporins (cefixime, ceftriaxone, etc.)',
      'Anti-TB agents: isoniazid, rifampicin, ethambutol, pyrazinamide, etc.',
      'Select fluoroquinolones (levofloxacin, moxifloxacin, …)',
      'Habit-forming: alprazolam, diazepam, tramadol, zolpidem, codeine, …',
      'Pregabalin (moved to H1 — verify Gazette)',
      'High-alcohol oral formulations thresholds as amended (e.g. 2026 alcohol tonic rules — verify)',
    ],
    operational_notes: [
      'Prescription of RMP mandatory',
      'Retailer must maintain SEPARATE Schedule H1 register (patient, drug, qty, prescriber, bill) typically 3 years',
      'Stronger enforcement against OTC antimicrobial misuse',
      'Label warning box mandatory',
    ],
  },
  X: {
    id: 'X',
    name: 'Schedule X',
    purpose: 'Highest control — narcotic/psychotropic high abuse potential',
    label_caution: 'Schedule X — special custody and prescription controls',
    prescription_required: true,
    retail_register: true,
    symbol: 'XRx',
    examples_illustrative: ['Select barbiturates and high-control psychotropics — verify current list'],
    operational_notes: [
      'Duplicate prescription retained (commonly 2 years practices)',
      'Strict storage and accounting',
      'Intersection with NDPS Act may apply for narcotics — dual compliance',
    ],
  },
};

/** Illustrative substance → likely schedule tier (always re-verify) */
const SUBSTANCE_HINTS = [
  { match: /amoxicillin|azithromycin|metformin|atorvastatin|telmisartan|pantoprazole|cetirizine/i, schedule: 'H', note: 'Typical Schedule H class agent — confirm product' },
  { match: /cefixime|ceftriaxone|cefpodoxime|levofloxacin|moxifloxacin|rifampicin|isoniazid|ethambutol|pyrazinamide|alprazolam|diazepam|tramadol|zolpidem|pregabalin|codeine/i, schedule: 'H1', note: 'Often Schedule H1 — register + Rx' },
  { match: /secobarbital|glutethimide/i, schedule: 'X', note: 'Schedule X class example — strict control' },
];

function classifySubstance(name) {
  const s = String(name || '');
  for (const h of SUBSTANCE_HINTS) {
    if (h.match.test(s)) {
      return {
        substance: s,
        likely_schedule: h.schedule,
        schedule_detail: SCHEDULES[h.schedule],
        note: h.note,
        confidence: 'illustrative_hint',
        verify: 'CDSCO / current Gazette / product label',
      };
    }
  }
  return {
    substance: s,
    likely_schedule: 'unknown_or_H_default_prescription_assumption',
    schedule_detail: SCHEDULES.H,
    note: 'Unmatched — treat as prescription-only until pharmacist/label confirms',
    confidence: 'low',
    verify: 'Mandatory label and pharmacist check',
  };
}

/**
 * Operational workflow: how schedule rules operate in practice
 */
function retailSaleWorkflow(scheduleId) {
  const sch = SCHEDULES[scheduleId] || SCHEDULES.H;
  const steps = [
    { step: 1, actor: 'Patient', action: 'Presents prescription from Registered Medical Practitioner' },
    { step: 2, actor: 'Pharmacist', action: 'Verify RMP credentials pattern, drug name, dose, duration, date' },
    { step: 3, actor: 'Pharmacist', action: `Confirm schedule label (${sch.id}) and warning box present on pack` },
  ];
  if (sch.retail_register) {
    steps.push({
      step: 4,
      actor: 'Pharmacist',
      action: `Enter sale in Schedule ${sch.id} register (retain ~${sch.register_retention_years || 3} years)`,
    });
  }
  steps.push(
    { step: steps.length + 1, actor: 'Pharmacist', action: 'Dispense labeled product; counsel on use; no partial unauthorized substitution of controlled class without authority' },
    { step: steps.length + 2, actor: 'System/FDA', action: 'Subject to inspection; violations under D&C Act penalties' },
  );
  return {
    schedule: sch.id,
    prescription_required: sch.prescription_required,
    register_required: !!sch.retail_register,
    steps,
    prohibited: ['OTC sale without Rx', 'Sales without invoice trail where required', 'Advertising to public for prescription-only in prohibited ways'],
  };
}

function interpretPrescriptionRequest(input = {}) {
  const drugs = input.medications || input.drugs || [];
  const classifications = drugs.map((d) => classifySubstance(typeof d === 'string' ? d : d.name));
  const highest = classifications.reduce((acc, c) => {
    const rank = { X: 4, H1: 3, H: 2, G: 1, unknown_or_H_default_prescription_assumption: 2 };
    return (rank[c.likely_schedule] || 0) > (rank[acc] || 0) ? c.likely_schedule : acc;
  }, 'H');
  const workflow = retailSaleWorkflow(highest === 'unknown_or_H_default_prescription_assumption' ? 'H' : highest);

  return {
    engine: 'IndiaDrugSchedules',
    classifications,
    governing_schedule_for_basket: highest,
    workflow,
    decision: {
      may_self_medicate: false,
      requires_rmp_prescription: true,
      requires_h1_register: highest === 'H1' || highest === 'X',
      action: 'ROUTE_TO_LICENSED_PHARMACIST_WITH_RMP_RX',
    },
    disclaimer: REGULATORY_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  SCHEDULES,
  classifySubstance,
  retailSaleWorkflow,
  interpretPrescriptionRequest,
  REGULATORY_DISCLAIMER,
};
