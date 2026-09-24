/**
 * Pharmacy Intelligence Engine — deep, non-generic
 * Educational decision-support only. Does NOT prescribe or dispense.
 * India-aware class knowledge, interaction matrix, food-drug, veterinary AMS notes.
 */

const { randomUUID } = require('crypto');

const PHARMACY_DISCLAIMER =
  'Pharmacy intelligence is educational decision-support only. It is not a prescription, not a substitute for a registered pharmacist or licensed prescriber, and must not be used to self-medicate. Schedule H/H1/X and controlled drugs require lawful prescription. Verify every product label and local regulation.';

/** Major therapeutic classes with clinical intelligence */
const DRUG_CLASSES = [
  {
    id: 'antimicrobial_beta_lactam',
    name: 'Beta-lactam antimicrobials',
    examples_generic: ['amoxicillin', 'amoxicillin-clavulanate', 'ceftriaxone', 'cefixixime'],
    india_note: 'Many oral agents Schedule H; injectables often institutional',
    stewardship: 'Prefer narrow spectrum after culture when possible; complete course as prescribed',
    food: 'Some with food for GI tolerance; check specific product',
    major_interactions: ['allopurinol_rash_risk_with_aminopenicillins', 'warfarin_INR_shifts_possible'],
    red_flags: ['anaphylaxis_history', 'severe_penicillin_allergy_cross_reactivity'],
  },
  {
    id: 'antimicrobial_fluoroquinolone',
    name: 'Fluoroquinolones',
    examples_generic: ['ciprofloxacin', 'levofloxacin', 'ofloxacin'],
    stewardship: 'Reserve for indicated infections; tendon/CNS/aortic risk awareness',
    food: 'Avoid dairy/antacids within 2h — chelation',
    major_interactions: ['warfarin', 'theophylline', 'QT_prolonging_agents'],
    red_flags: ['pregnancy', 'children_growth_cartilage_caution', 'tendinopathy'],
  },
  {
    id: 'antimicrobial_macrolide',
    name: 'Macrolides',
    examples_generic: ['azithromycin', 'clarithromycin', 'erythromycin'],
    major_interactions: ['QT_drugs', 'statins_some', 'warfarin'],
    red_flags: ['significant_QT_history'],
  },
  {
    id: 'antidiabetic_metformin',
    name: 'Metformin / biguanide',
    examples_generic: ['metformin'],
    food: 'With meals reduces GI upset',
    major_interactions: ['iodinated_contrast_hold_protocol', 'alcohol_lactic_acidosis_risk'],
    red_flags: ['eGFR_severe_impairment', 'acute_illness_dehydration'],
  },
  {
    id: 'antidiabetic_sulfonylurea',
    name: 'Sulfonylureas',
    examples_generic: ['glimepiride', 'gliclazide', 'glipizide'],
    red_flags: ['hypoglycemia', 'elderly', 'renal_impairment'],
    food: 'Consistent carbohydrate pattern critical',
  },
  {
    id: 'antihypertensive_acei_arb',
    name: 'ACEI / ARB',
    examples_generic: ['ramipril', 'enalapril', 'telmisartan', 'losartan'],
    major_interactions: ['potassium_sparing_diuretics', 'NSAIDs_renal', 'lithium'],
    red_flags: ['pregnancy_contraindicated', 'bilateral_RAS', 'hyperkalemia'],
  },
  {
    id: 'anticoagulant_warfarin',
    name: 'Warfarin',
    examples_generic: ['warfarin'],
    food: 'Consistent vitamin K (greens); avoid crash diet changes',
    major_interactions: ['NSAIDs', 'antibiotics_many', 'amiodarone', 'herbals_ginkgo_garlic_high'],
    red_flags: ['bleeding', 'INR_out_of_range', 'pregnancy'],
  },
  {
    id: 'antiplatelet_aspirin',
    name: 'Aspirin antiplatelet',
    examples_generic: ['aspirin'],
    red_flags: ['active_ulcer', 'bleeding', 'children_viral_illness_reye'],
    major_interactions: ['other_anticoagulants', 'NSAIDs'],
  },
  {
    id: 'statin',
    name: 'Statins',
    examples_generic: ['atorvastatin', 'rosuvastatin', 'simvastatin'],
    food: 'Grapefruit with some agents (simvastatin/lovastatin especially)',
    major_interactions: ['strong_CYP3A4_inhibitors', 'gemfibrozil'],
    red_flags: ['myopathy', 'pregnancy'],
  },
  {
    id: 'thyroid_levothyroxine',
    name: 'Levothyroxine',
    examples_generic: ['levothyroxine'],
    food: 'Empty stomach; separate from calcium/iron/soy/coffee by hours',
    major_interactions: ['calcium', 'iron', 'PPI_absorption_context'],
    red_flags: ['over_replacement_AF_risk'],
  },
  {
    id: 'nsaid',
    name: 'NSAIDs',
    examples_generic: ['ibuprofen', 'diclofenac', 'naproxen', 'mefenamic_acid'],
    red_flags: ['CKD', 'heart_failure', 'ulcer', 'third_trimester_pregnancy', 'elderly'],
    major_interactions: ['ACEI_ARB', 'diuretics', 'warfarin', 'lithium'],
  },
  {
    id: 'ppi',
    name: 'Proton pump inhibitors',
    examples_generic: ['omeprazole', 'pantoprazole', 'esomeprazole'],
    major_interactions: ['clopidogrel_some_PPI', 'methotrexate_high_dose'],
    red_flags: ['long_term_without_review'],
  },
  {
    id: 'ssri',
    name: 'SSRI antidepressants',
    examples_generic: ['sertraline', 'escitalopram', 'fluoxetine'],
    major_interactions: ['MAOI', 'tramadol_serotonin', 'NSAID_bleed'],
    red_flags: ['suicidal_ideation_youth_monitor', 'serotonin_syndrome'],
  },
  {
    id: 'corticosteroid',
    name: 'Systemic corticosteroids',
    examples_generic: ['prednisolone', 'dexamethasone'],
    red_flags: ['infection_masking', 'hyperglycemia', 'adrenal_suppression_long_course'],
    food: 'With food; calcium vitamin D discussion long-term',
  },
  {
    id: 'antihistamine',
    name: 'Antihistamines',
    examples_generic: ['cetirizine', 'loratadine', 'chlorpheniramine'],
    red_flags: ['sedation_first_generation_driving'],
  },
  {
    id: 'oral_contraceptive',
    name: 'Combined oral contraceptives',
    examples_generic: ['ethinylestradiol_combinations'],
    major_interactions: ['enzyme_inducing_antibiotics_select', 'st_johns_wort', 'rifampicin'],
    red_flags: ['thrombosis_risk_factors', 'migraine_aura', 'smoker_age'],
  },
  {
    id: 'veterinary_antimicrobial_food_animal',
    name: 'Food-animal antimicrobials (veterinary)',
    examples_generic: ['label_dependent_only'],
    stewardship: 'Culture when possible; NEVER use human leftover antibiotics in animals without vet',
    red_flags: ['withdrawal_period_unknown', 'notifiable_disease_context'],
    india_note: 'Withdrawal and MRL — label and competent authority only',
  },
];

const INTERACTION_PAIRS = [
  { a: 'warfarin', b: 'nsaid', severity: 'major', effect: 'Bleeding risk ↑', action: 'Avoid combination unless specialist supervised' },
  { a: 'warfarin', b: 'antimicrobial', severity: 'major', effect: 'INR shifts common', action: 'Monitor INR; prescriber aware' },
  { a: 'acei', b: 'nsaid', severity: 'major', effect: 'Renal function ↓ risk', action: 'Caution especially elderly/dehydrated' },
  { a: 'acei', b: 'potassium', severity: 'major', effect: 'Hyperkalemia', action: 'Monitor K+' },
  { a: 'metformin', b: 'contrast', severity: 'major', effect: 'Lactic acidosis risk protocol', action: 'Hold per radiology/renal protocol' },
  { a: 'statin', b: 'clarithromycin', severity: 'major', effect: 'Myopathy risk', action: 'Review combination' },
  { a: 'ssri', b: 'tramadol', severity: 'major', effect: 'Serotonin syndrome risk', action: 'Avoid or specialist only' },
  { a: 'levothyroxine', b: 'calcium', severity: 'moderate', effect: 'Absorption ↓', action: 'Separate dosing hours' },
  { a: 'levothyroxine', b: 'iron', severity: 'moderate', effect: 'Absorption ↓', action: 'Separate dosing hours' },
  { a: 'fluoroquinolone', b: 'dairy', severity: 'moderate', effect: 'Chelation absorption ↓', action: 'Separate 2 hours' },
  { a: 'maoi', b: 'tyramine', severity: 'major', effect: 'Hypertensive crisis risk', action: 'Strict diet protocol under psychiatry' },
];

function normalizeDrugToken(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim();
}

function matchClasses(medications = []) {
  const meds = medications.map(normalizeDrugToken);
  const hits = [];
  for (const cls of DRUG_CLASSES) {
    for (const ex of cls.examples_generic) {
      if (meds.some((m) => m.includes(ex) || ex.includes(m))) {
        hits.push({ ...cls, matched_example: ex });
        break;
      }
    }
    // fuzzy class keywords
    if (meds.some((m) => m.includes(cls.id.split('_').pop()))) {
      if (!hits.find((h) => h.id === cls.id)) hits.push(cls);
    }
  }
  return hits;
}

function matchInteractions(medications = []) {
  const meds = medications.map(normalizeDrugToken).join(' ');
  return INTERACTION_PAIRS.filter((p) => {
    const a = meds.includes(p.a) || medications.some((m) => normalizeDrugToken(m).includes(p.a));
    const b =
      meds.includes(p.b) ||
      (p.b === 'antimicrobial' && /cillin|floxacin|mycin|cycline|azole/.test(meds)) ||
      (p.b === 'nsaid' && /ibuprofen|diclofenac|naproxen|nsaid|aspirin high/.test(meds)) ||
      (p.b === 'dairy' && /milk|curd|dairy/.test(meds)) ||
      medications.some((m) => normalizeDrugToken(m).includes(p.b));
    return a && b;
  });
}

function runPharmacyConference(input = {}) {
  const medications = input.medications || input.profile?.medications || [];
  const conditions = input.conditions || input.profile?.conditions || [];
  const species = input.species; // veterinary context optional
  const classes = matchClasses(medications);
  const interactions = matchInteractions([
    ...medications,
    ...(input.foods_or_supplements || []),
  ]);

  const stewardship_notes = [];
  if (classes.some((c) => c.id.startsWith('antimicrobial'))) {
    stewardship_notes.push('Antimicrobial stewardship: confirm indication, culture when feasible, avoid leftover sharing');
  }
  if (species && ['cow', 'pig', 'goat', 'sheep', 'poultry', 'duck'].includes(String(species))) {
    stewardship_notes.push('Food animal: withdrawal periods and label law mandatory; no human leftover antibiotics');
  }

  const condition_alerts = [];
  const condBlob = conditions.map((c) => String(c).toLowerCase()).join(' ');
  if (/pregnan/.test(condBlob) && classes.some((c) => (c.red_flags || []).includes('pregnancy') || (c.red_flags || []).includes('pregnancy_contraindicated'))) {
    condition_alerts.push('Pregnancy + flagged drug class — obstetric/prescriber review mandatory');
  }
  if (/renal|ckd|kidney/.test(condBlob)) {
    condition_alerts.push('Renal impairment: many dose adjustments required — pharmacist/prescriber');
  }

  return {
    case_id: randomUUID(),
    engine: 'PharmacyIntelligenceEngine',
    engine_tier: 'grok-highest-industry',
    medications_reviewed: medications,
    matched_classes: classes,
    interactions,
    stewardship_notes,
    condition_alerts,
    india_regulatory_note:
      'India: Schedule H/H1 medicines require prescription from registered medical practitioner. Self-medication with antimicrobials drives resistance.',
    panel_summary: `Pharmacy review: ${classes.length} class hits; ${interactions.length} interaction flags; ${condition_alerts.length} condition alerts.`,
    disclaimer: PHARMACY_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  runPharmacyConference,
  matchClasses,
  matchInteractions,
  DRUG_CLASSES,
  INTERACTION_PAIRS,
  PHARMACY_DISCLAIMER,
};
