/**
 * Farmer Support Clinic — multi-specialist AI doctors & scientists for farmers.
 *
 * Specialists:
 *   plant_doctor, soil_scientist, livestock_vet (cow/buffalo/goat/sheep/pig/horse),
 *   poultry_vet, fish_vet, design_engineer (handoff to AI Engineering Team)
 *
 * Rules:
 *   - Triage checklists and question packs are deterministic catalogs
 *   - AI consult is advisory only — never a definitive diagnosis or prescription
 *   - Always urge licensed vet / agronomist / engineer for treatment decisions
 *   - Image path: farmer describes photo (leaf/soil/animal) in text; no fake CNN scores
 *
 * See DOCUMENTATION/FARMER_SUPPORT_CLINIC.md
 */

'use strict';

const { logger } = require('../../utils/logger');
const { aiAPI } = require('./aiBackboneService');

const nowIso = () => new Date().toISOString();
const unavailable = (note) => ({ source: 'unavailable', verified: false, asOf: nowIso(), note: note || null });
const catalog = (note) => ({ source: 'calculated', verified: true, asOf: nowIso(), note: note || 'Catalog' });
const fromAi = () => ({ source: 'ai', verified: false, asOf: nowIso(), note: 'Advisory consult only — not a medical/veterinary diagnosis' });

const SPECIES = {
  cow: { group: 'livestock', label: 'Cattle / cow' },
  buffalo: { group: 'livestock', label: 'Buffalo' },
  goat: { group: 'livestock', label: 'Goat' },
  sheep: { group: 'livestock', label: 'Sheep' },
  pig: { group: 'livestock', label: 'Pig' },
  horse: { group: 'livestock', label: 'Horse' },
  poultry: { group: 'poultry', label: 'Poultry (chicken/duck)' },
  fish: { group: 'fish', label: 'Fish / aquaculture' },
  plant: { group: 'plant', label: 'Crop / plant' },
  soil: { group: 'soil', label: 'Soil' },
  tree: { group: 'plant', label: 'Tree / orchard' },
};

const SPECIALISTS = [
  {
    id: 'plant_doctor',
    title: 'Plant Doctor / Crop Pathologist',
    accepts: ['plant', 'tree'],
    focus: 'Leaves, stems, fruit, orchard trees — symptom triage',
  },
  {
    id: 'soil_scientist',
    title: 'Soil Scientist',
    accepts: ['soil'],
    focus: 'Soil colour, texture, moisture, visible problems',
  },
  {
    id: 'livestock_vet',
    title: 'Livestock Veterinary Advisor',
    accepts: ['cow', 'buffalo', 'goat', 'sheep', 'pig', 'horse'],
    focus: 'Large & small ruminants, pigs, horses — health triage',
  },
  {
    id: 'poultry_vet',
    title: 'Poultry Health Advisor',
    accepts: ['poultry'],
    focus: 'Flock-level signs, mortality, feed, housing',
  },
  {
    id: 'fish_vet',
    title: 'Aquaculture Health Advisor',
    accepts: ['fish'],
    focus: 'Water, behaviour, lesions, pond/RAS signs',
  },
  {
    id: 'design_engineer',
    title: 'Agri Infrastructure Design Engineer',
    accepts: [],
    focus: 'Housing, cold storage, polyhouse — handoff to design team',
    href: '/ai-engineering-design',
  },
];

const TRIAGE = {
  plant_doctor: [
    'Which crop/variety and growth stage?',
    'Which part is affected (leaf, stem, root, fruit, whole plant)?',
    'Pattern: spots, yellowing, wilting, holes, mould, sticky residue?',
    'When did symptoms start? Spreading to neighbours?',
    'Recent spray, fertilizer, heavy rain, or drought?',
    'Photo of leaf upper/lower side and whole plant if possible',
  ],
  soil_scientist: [
    'Soil colour and texture (sandy, clay, loam)?',
    'Waterlogging or extreme dryness?',
    'White crust, hardpan, foul smell, or visible salts?',
    'Last soil test date and results if any',
    'Crop history on this plot',
  ],
  livestock_vet: [
    'Species, age, sex, and number affected',
    'Appetite, milk yield, mobility, breathing',
    'Fever (if measured), discharge, diarrhoea, skin lesions',
    'Vaccination and deworming history',
    'Feed change, new animals, or transport recently?',
  ],
  poultry_vet: [
    'Flock size, age, and housing type',
    'Mortality count last 7 days',
    'Droppings, respiratory signs, leg weakness',
    'Feed brand change, litter condition',
    'Vaccination schedule status',
  ],
  fish_vet: [
    'Species and system (pond / biofloc / RAS)',
    'Water temperature, colour, smell, recent water change',
    'Fish behaviour (surface gasping, flashing, lethargy)',
    'Visible lesions, gill colour, sudden deaths',
    'Feeding rate and recent treatments',
  ],
};

const RED_FLAGS = {
  plant_doctor: ['Whole-field sudden death', 'Suspected quarantine pest'],
  livestock_vet: ['Sudden multiple deaths', 'Neurological signs', 'Abortions cluster', 'Suspected notifiable disease'],
  poultry_vet: ['High mortality in 24–48h', 'Suspected notifiable disease'],
  fish_vet: ['Mass mortality', 'Suspected toxic water'],
  soil_scientist: ['Chemical spill suspected'],
};

function resolveSpecialist(speciesKey) {
  const key = String(speciesKey || '').toLowerCase();
  if (!SPECIES[key] && key !== 'design') {
    return null;
  }
  if (key === 'design') return SPECIALISTS.find((s) => s.id === 'design_engineer');
  const group = SPECIES[key].group;
  if (group === 'plant') return SPECIALISTS.find((s) => s.id === 'plant_doctor');
  if (group === 'soil') return SPECIALISTS.find((s) => s.id === 'soil_scientist');
  if (group === 'poultry') return SPECIALISTS.find((s) => s.id === 'poultry_vet');
  if (group === 'fish') return SPECIALISTS.find((s) => s.id === 'fish_vet');
  if (group === 'livestock') return SPECIALISTS.find((s) => s.id === 'livestock_vet');
  return null;
}

function buildTriagePackage(speciesKey) {
  const specialist = resolveSpecialist(speciesKey);
  if (!specialist) {
    throw new Error(`Unknown species/domain. Use one of: ${Object.keys(SPECIES).join(', ')}, design`);
  }
  if (specialist.id === 'design_engineer') {
    return {
      specialist,
      species: null,
      triageQuestions: ['Open AI Engineering Design Team for structural / MEP / cost packages'],
      redFlags: [],
      specialistLinks: [
        { label: 'AI Engineering Design Team', href: '/ai-engineering-design' },
        { label: 'MEP Design Studio', href: '/mep-design' },
        { label: 'Engineering Projects', href: '/engineering-projects' },
      ],
      disclaimer: 'Design packages are checklists — licensed engineers verify.',
      provenance: { 'clinic.triage': catalog('Design handoff catalog') },
    };
  }

  const species = SPECIES[speciesKey];
  return {
    specialist,
    species: { key: speciesKey, ...species },
    triageQuestions: TRIAGE[specialist.id] || [],
    redFlags: RED_FLAGS[specialist.id] || [],
    specialistLinks: [
      { label: 'Animal Health records', href: '/animal-health' },
      { label: 'Poultry management', href: '/poultry-management' },
      { label: 'Soil management', href: '/soil-management' },
      { label: 'Crop monitoring', href: '/crop-monitoring' },
      { label: 'AI Engineering Design', href: '/ai-engineering-design' },
    ],
    disclaimer:
      'This clinic provides educational triage only. It is not a veterinary diagnosis, medical prescription, or phytosanitary certificate. Consult a licensed professional before treatment.',
    provenance: { 'clinic.triage': catalog('Triage question catalog') },
  };
}

/**
 * AI advisory consult — uses symptoms + optional photo description (text).
 * Does not claim image-model accuracy; farmer/operator describes what they see.
 */
async function runAdvisoryConsult({
  speciesKey,
  symptoms,
  photoDescription,
  locationState,
  notes,
}) {
  const triage = buildTriagePackage(speciesKey);
  const specialist = triage.specialist;

  if (specialist.id === 'design_engineer') {
    return {
      ...triage,
      consult: {
        summary: 'Use the AI Engineering Design Team workspace for infrastructure design packages.',
        nextSteps: ['Open /ai-engineering-design', 'Select facility type and gather geometry inputs'],
        urgency: 'routine',
      },
      provenance: {
        ...triage.provenance,
        'clinic.consult': catalog('Design handoff — no AI consult required'),
      },
    };
  }

  if (!symptoms || !String(symptoms).trim()) {
    return {
      ...triage,
      consult: null,
      provenance: {
        ...triage.provenance,
        'clinic.consult': unavailable('symptoms text is required for advisory consult'),
      },
    };
  }

  const prompt = [
    `You are an advisory ${specialist.title} supporting Indian smallholder farmers.`,
    `Domain: ${triage.species?.label || speciesKey}.`,
    locationState ? `State/region (operator-declared): ${locationState}.` : '',
    `Farmer-reported symptoms: ${symptoms}.`,
    photoDescription ? `Photo description (what farmer sees in the image): ${photoDescription}.` : 'No photo description provided.',
    notes ? `Extra notes: ${notes}.` : '',
    'Respond in clear plain language (max 220 words) with:',
    '1) Possible common causes (list 2–4, label as possibilities not diagnosis)',
    '2) Immediate observation / isolation / hygiene steps',
    '3) When to call a licensed vet or agronomist urgently',
    '4) What information to bring to the professional',
    'Rules: Do NOT prescribe specific drug brands, doses, or pesticides by name.',
    'Do NOT claim certainty. Say this is educational triage only.',
  ].filter(Boolean).join(' ');

  try {
    const result = await aiAPI.generateRecommendation({ prompt, maxTokens: 360 });
    const text = typeof result === 'string'
      ? result
      : (result && (result.text || result.recommendation)) || JSON.stringify(result);

    const urgencyHints = /sudden|multiple death|mass mortality|notifiable|quarantine|neurolog/i.test(
      `${symptoms} ${photoDescription || ''}`,
    );

    return {
      ...triage,
      consult: {
        summary: text,
        urgency: urgencyHints ? 'seek_professional_now' : 'monitor_and_consult',
        nextSteps: [
          'Answer remaining triage questions if not already covered',
          'Contact local veterinary / agriculture officer if red flags apply',
          'Keep records of symptoms, photos, and dates',
        ],
      },
      provenance: {
        ...triage.provenance,
        'clinic.consult': fromAi(),
      },
    };
  } catch (error) {
    logger.warn('Farmer clinic consult failed', { error: error.message });
    return {
      ...triage,
      consult: null,
      provenance: {
        ...triage.provenance,
        'clinic.consult': unavailable(error.message),
      },
    };
  }
}

function getCapabilities() {
  return {
    planVersion: '1.0',
    concept: 'Multi-specialist AI clinic for farmer support (plant, soil, livestock, poultry, fish) + design engineer handoff',
    specialists: SPECIALISTS,
    species: SPECIES,
    designRules: [
      'Triage packages are deterministic catalogs',
      'AI consult is advisory only — not diagnosis or prescription',
      'No invented lab results or drug doses',
      'Photo support via farmer description of image (no fake CNN confidence)',
      'Design questions hand off to /ai-engineering-design',
    ],
    endpoints: {
      capabilities: 'GET /api/v1/farmer-support-clinic/capabilities',
      triage: 'POST /api/v1/farmer-support-clinic/triage',
      consult: 'POST /api/v1/farmer-support-clinic/consult',
    },
  };
}

module.exports = {
  SPECIES,
  SPECIALISTS,
  buildTriagePackage,
  runAdvisoryConsult,
  getCapabilities,
};
