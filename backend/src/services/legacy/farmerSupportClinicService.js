/**
 * Farmer Support Clinic — multi-specialist AI doctors & scientists for farmers.
 *
 * Upgrades:
 *   1. Deep species packs (e.g. dairy_mastitis, poultry_nd_suspect, leaf_blight)
 *   2. Multi-turn chat history (sessionId)
 *   3. Real leaf/animal image vision hook (OpenAI vision when OPENAI_ENABLED + key)
 *
 * Still advisory only — not a licensed diagnosis or prescription.
 * See DOCUMENTATION/FARMER_SUPPORT_CLINIC.md
 */

'use strict';

const fetch = require('node-fetch');
const { logger } = require('../../utils/logger');
const { aiAPI } = require('./aiBackboneService');

const nowIso = () => new Date().toISOString();
const unavailable = (note) => ({ source: 'unavailable', verified: false, asOf: nowIso(), note: note || null });
const catalog = (note) => ({ source: 'calculated', verified: true, asOf: nowIso(), note: note || 'Catalog' });
const fromAi = (note) => ({ source: 'ai', verified: false, asOf: nowIso(), note: note || 'Advisory only' });
const fromVision = (note) => ({ source: 'vision', verified: false, asOf: nowIso(), note: note || 'Vision model advisory — not lab confirmation' });

/** In-memory multi-turn sessions (replace with Redis/DB in production scale). */
const chatSessions = new Map();
const MAX_TURNS = 12;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

function pruneSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, s] of chatSessions.entries()) {
    if (s.updatedAt < cutoff) chatSessions.delete(id);
  }
}

function getOrCreateSession(sessionId, speciesKey) {
  pruneSessions();
  if (sessionId && chatSessions.has(sessionId)) {
    const s = chatSessions.get(sessionId);
    s.updatedAt = Date.now();
    return s;
  }
  const id = sessionId || `clinic_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const s = {
    id,
    speciesKey: speciesKey || null,
    turns: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  chatSessions.set(id, s);
  return s;
}

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

/** Deep clinical packs — extra questions + focus, still not diagnosis. */
const DEEP_PACKS = {
  dairy_mastitis: {
    id: 'dairy_mastitis',
    label: 'Dairy mastitis triage',
    species: ['cow', 'buffalo'],
    specialistId: 'livestock_vet',
    questions: [
      'Which quarter(s) affected? Hot, hard, or painful udder?',
      'Milk: watery, clots, blood, or foul smell?',
      'Cow appetite and rectal temperature if measured?',
      'Days in milk / recent calving?',
      'Teat end condition and milking hygiene (hand vs machine)?',
      'Any prior mastitis this lactation?',
    ],
    redFlags: [
      'Cow down or severe systemic illness',
      'Gangrenous or cold quarter',
      'Sudden high fever with swollen udder',
    ],
    focus: 'Observe hygiene and isolate milk; licensed vet decides treatment — no drug doses here.',
  },
  livestock_fmd_suspect: {
    id: 'livestock_fmd_suspect',
    label: 'FMD-suspect observation pack',
    species: ['cow', 'buffalo', 'goat', 'sheep', 'pig'],
    specialistId: 'livestock_vet',
    questions: [
      'Salivation, mouth lesions, or foot lesions?',
      'Number of animals affected and how fast it spread?',
      'Recent animal movement or market exposure?',
      'Vaccination history for FMD?',
    ],
    redFlags: [
      'Cluster of animals with mouth/foot lesions — notify veterinary officer',
      'Sudden lameness with fever in multiple animals',
    ],
    focus: 'Possible notifiable disease — contact government veterinary services; do not move animals.',
  },
  poultry_nd_suspect: {
    id: 'poultry_nd_suspect',
    label: 'Poultry ND / respiratory high-mortality pack',
    species: ['poultry'],
    specialistId: 'poultry_vet',
    questions: [
      'Mortality count in last 24–48 hours?',
      'Respiratory signs, twisted necks, green diarrhoea?',
      'Vaccination schedule (ND/IB/IBD) status?',
      'New birds introduced recently?',
    ],
    redFlags: ['High mortality in 24–48h', 'Neurological signs in many birds'],
    focus: 'Flock isolation and licensed poultry vet / disease investigation lab.',
  },
  fish_do_stress: {
    id: 'fish_do_stress',
    label: 'Fish dissolved-oxygen / stress pack',
    species: ['fish'],
    specialistId: 'fish_vet',
    questions: [
      'Surface gasping or gathering at inlet?',
      'Water temperature and recent weather (cloudy/hot)?',
      'Last water exchange and stocking density?',
      'Recent heavy feeding?',
    ],
    redFlags: ['Mass surface gasping', 'Mass mortality overnight'],
    focus: 'Emergency aeration / stop feed — fisheries officer for water tests.',
  },
  leaf_blight_suspect: {
    id: 'leaf_blight_suspect',
    label: 'Leaf spot / blight observation pack',
    species: ['plant', 'tree'],
    specialistId: 'plant_doctor',
    questions: [
      'Crop and variety?',
      'Spot colour, shape, and whether centres fall out?',
      'Upper vs lower leaf surface?',
      'Recent rain / overhead irrigation?',
      'Spread rate across field?',
    ],
    redFlags: ['Whole-field rapid burn', 'Suspected quarantine pest'],
    focus: 'Agronomist confirms pathogen; avoid random pesticide mixes.',
  },
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
  if (key === 'design') return SPECIALISTS.find((s) => s.id === 'design_engineer');
  if (!SPECIES[key]) return null;
  const group = SPECIES[key].group;
  if (group === 'plant') return SPECIALISTS.find((s) => s.id === 'plant_doctor');
  if (group === 'soil') return SPECIALISTS.find((s) => s.id === 'soil_scientist');
  if (group === 'poultry') return SPECIALISTS.find((s) => s.id === 'poultry_vet');
  if (group === 'fish') return SPECIALISTS.find((s) => s.id === 'fish_vet');
  if (group === 'livestock') return SPECIALISTS.find((s) => s.id === 'livestock_vet');
  return null;
}

function listDeepPacksForSpecies(speciesKey) {
  const key = String(speciesKey || '').toLowerCase();
  return Object.values(DEEP_PACKS).filter((p) => p.species.includes(key));
}

function buildTriagePackage(speciesKey, packId) {
  const specialist = resolveSpecialist(speciesKey);
  if (!specialist) {
    throw new Error(`Unknown species/domain. Use one of: ${Object.keys(SPECIES).join(', ')}, design`);
  }
  if (specialist.id === 'design_engineer') {
    return {
      specialist,
      species: null,
      pack: null,
      deepPacksAvailable: [],
      triageQuestions: ['Open AI Engineering Design Team for structural / MEP / cost packages'],
      redFlags: [],
      specialistLinks: [
        { label: 'AI Engineering Design Team', href: '/ai-engineering-design' },
        { label: 'MEP Design Studio', href: '/mep-design' },
      ],
      disclaimer: 'Design packages are checklists — licensed engineers verify.',
      provenance: { 'clinic.triage': catalog('Design handoff catalog') },
    };
  }

  const species = SPECIES[speciesKey];
  const deepPacksAvailable = listDeepPacksForSpecies(speciesKey);
  let pack = null;
  let triageQuestions = TRIAGE[specialist.id] || [];
  let redFlags = RED_FLAGS[specialist.id] || [];

  if (packId && DEEP_PACKS[packId]) {
    pack = DEEP_PACKS[packId];
    if (!pack.species.includes(String(speciesKey).toLowerCase())) {
      throw new Error(`Pack ${packId} does not apply to species ${speciesKey}`);
    }
    triageQuestions = [...pack.questions, ...triageQuestions.filter((q) => !pack.questions.includes(q))];
    redFlags = [...new Set([...(pack.redFlags || []), ...redFlags])];
  }

  return {
    specialist,
    species: { key: speciesKey, ...species },
    pack: pack ? { id: pack.id, label: pack.label, focus: pack.focus } : null,
    deepPacksAvailable: deepPacksAvailable.map((p) => ({ id: p.id, label: p.label })),
    triageQuestions,
    redFlags,
    specialistLinks: [
      { label: 'Animal Health records', href: '/animal-health' },
      { label: 'Poultry management', href: '/poultry-management' },
      { label: 'Soil management', href: '/soil-management' },
      { label: 'Crop monitoring', href: '/crop-monitoring' },
      { label: 'AI Engineering Design', href: '/ai-engineering-design' },
    ],
    disclaimer:
      'This clinic provides educational triage only. It is not a veterinary diagnosis, medical prescription, or phytosanitary certificate. Consult a licensed professional before treatment.',
    provenance: {
      'clinic.triage': catalog(pack ? `Deep pack ${pack.id}` : 'Base triage catalog'),
    },
  };
}

/**
 * Vision hook: if OpenAI is enabled and imageUrl provided, ask vision model for description.
 * Never invents a disease label as definitive diagnosis.
 */
async function analyzeImageWithVision({ imageUrl, speciesKey, context }) {
  if (!imageUrl) {
    return { description: null, provenance: unavailable('No imageUrl provided') };
  }

  const enabled = process.env.OPENAI_ENABLED === 'true' && process.env.OPENAI_API_KEY;
  if (!enabled) {
    return {
      description: null,
      provenance: unavailable(
        'Vision not configured. Set OPENAI_ENABLED=true and OPENAI_API_KEY, or describe the photo in text.',
      ),
    };
  }

  const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o';
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  const systemHint = [
    'You describe agricultural images for triage support.',
    'Describe visible features only (colour, spots, lesions, soil texture).',
    'Do NOT state a definitive disease name or prescribe treatment.',
    'List up to 5 neutral visual observations.',
  ].join(' ');

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemHint },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Domain: ${speciesKey || 'unknown'}. Context: ${context || 'none'}. Describe what you see.`,
              },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
      timeout: 45000,
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.warn('Vision API failed', { status: res.status, errText: errText.slice(0, 200) });
      return { description: null, provenance: unavailable(`Vision API HTTP ${res.status}`) };
    }

    const data = await res.json();
    const text = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : null;

    return {
      description: text,
      provenance: fromVision(`Model ${model} — visual description only`),
    };
  } catch (error) {
    logger.warn('Vision analyze failed', { error: error.message });
    return { description: null, provenance: unavailable(error.message) };
  }
}

async function runAdvisoryConsult({
  speciesKey,
  symptoms,
  photoDescription,
  imageUrl,
  locationState,
  notes,
  packId,
  sessionId,
}) {
  const triage = buildTriagePackage(speciesKey, packId);
  const specialist = triage.specialist;
  const session = getOrCreateSession(sessionId, speciesKey);
  if (speciesKey) session.speciesKey = speciesKey;

  if (specialist.id === 'design_engineer') {
    return {
      sessionId: session.id,
      ...triage,
      vision: null,
      consult: {
        summary: 'Use the AI Engineering Design Team workspace for infrastructure design packages.',
        nextSteps: ['Open /ai-engineering-design'],
        urgency: 'routine',
      },
      history: session.turns.slice(-MAX_TURNS),
      provenance: {
        ...triage.provenance,
        'clinic.consult': catalog('Design handoff'),
      },
    };
  }

  const vision = await analyzeImageWithVision({
    imageUrl,
    speciesKey,
    context: symptoms || photoDescription,
  });

  const combinedPhoto = [
    photoDescription && String(photoDescription).trim(),
    vision.description && `Vision model notes: ${vision.description}`,
  ].filter(Boolean).join('\n');

  if (!symptoms || !String(symptoms).trim()) {
    if (!combinedPhoto) {
      return {
        sessionId: session.id,
        ...triage,
        vision,
        consult: null,
        history: session.turns.slice(-MAX_TURNS),
        provenance: {
          ...triage.provenance,
          'clinic.vision': vision.provenance,
          'clinic.consult': unavailable('symptoms or photoDescription/imageUrl required'),
        },
      };
    }
  }

  const historyBlock = session.turns
    .slice(-6)
    .map((t) => `Farmer: ${t.user}\nAdvisor: ${t.assistant}`)
    .join('\n');

  const prompt = [
    `You are an advisory ${specialist.title} supporting Indian smallholder farmers.`,
    triage.pack ? `Active deep pack: ${triage.pack.label}. Focus: ${triage.pack.focus}` : '',
    `Domain: ${triage.species?.label || speciesKey}.`,
    locationState ? `State/region (operator-declared): ${locationState}.` : '',
    symptoms ? `Current symptoms: ${symptoms}.` : '',
    combinedPhoto ? `Photo / vision notes: ${combinedPhoto}.` : 'No photo notes.',
    notes ? `Extra notes: ${notes}.` : '',
    historyBlock ? `Prior turns in this session:\n${historyBlock}` : 'First turn in session.',
    'Respond in clear plain language (max 220 words) with:',
    '1) Possible common causes (2–4 possibilities, not a diagnosis)',
    '2) Immediate observation / isolation / hygiene steps',
    '3) When to call a licensed vet or agronomist urgently',
    '4) What information to bring to the professional',
    'Rules: Do NOT prescribe specific drug brands, doses, or pesticides by name.',
    'Do NOT claim certainty. Educational triage only.',
  ].filter(Boolean).join(' ');

  try {
    const result = await aiAPI.generateRecommendation({ prompt, maxTokens: 400 });
    const text = typeof result === 'string'
      ? result
      : (result && (result.text || result.recommendation)) || JSON.stringify(result);

    const urgencyHints = /sudden|multiple death|mass mortality|notifiable|quarantine|neurolog|gangrenous/i.test(
      `${symptoms || ''} ${combinedPhoto || ''}`,
    );

    const consult = {
      summary: text,
      urgency: urgencyHints ? 'seek_professional_now' : 'monitor_and_consult',
      nextSteps: [
        'Answer remaining triage questions if not already covered',
        'Contact local veterinary / agriculture officer if red flags apply',
        'Keep records of symptoms, photos, and dates',
      ],
    };

    session.turns.push({
      at: nowIso(),
      user: symptoms || combinedPhoto || '(image/pack only)',
      assistant: text,
      packId: packId || null,
    });
    if (session.turns.length > MAX_TURNS) {
      session.turns = session.turns.slice(-MAX_TURNS);
    }
    session.updatedAt = Date.now();

    return {
      sessionId: session.id,
      ...triage,
      vision,
      consult,
      history: session.turns.slice(-MAX_TURNS),
      provenance: {
        ...triage.provenance,
        'clinic.vision': vision.provenance,
        'clinic.consult': fromAi('Multi-turn advisory consult'),
      },
    };
  } catch (error) {
    logger.warn('Farmer clinic consult failed', { error: error.message });
    return {
      sessionId: session.id,
      ...triage,
      vision,
      consult: null,
      history: session.turns.slice(-MAX_TURNS),
      provenance: {
        ...triage.provenance,
        'clinic.vision': vision.provenance,
        'clinic.consult': unavailable(error.message),
      },
    };
  }
}

function getSessionHistory(sessionId) {
  if (!sessionId || !chatSessions.has(sessionId)) {
    return { sessionId: sessionId || null, turns: [], provenance: unavailable('Session not found or expired') };
  }
  const s = chatSessions.get(sessionId);
  return {
    sessionId: s.id,
    speciesKey: s.speciesKey,
    turns: s.turns.slice(-MAX_TURNS),
    provenance: catalog('In-memory session history'),
  };
}

function getCapabilities() {
  return {
    planVersion: '1.1',
    concept: 'Multi-specialist clinic: plant, soil, livestock, poultry, fish + design handoff',
    upgrades: [
      'Deep species packs (dairy_mastitis, FMD-suspect, poultry ND, fish DO, leaf blight)',
      'Multi-turn chat via sessionId',
      'Vision hook via OpenAI when OPENAI_ENABLED + API key + imageUrl',
    ],
    specialists: SPECIALISTS,
    species: SPECIES,
    deepPacks: Object.values(DEEP_PACKS).map((p) => ({
      id: p.id,
      label: p.label,
      species: p.species,
    })),
    designRules: [
      'Triage and deep packs are deterministic catalogs',
      'AI consult is advisory only — not diagnosis or prescription',
      'Vision describes features only — never definitive disease label',
      'No invented lab results or drug doses',
      'Design questions hand off to /ai-engineering-design',
    ],
    endpoints: {
      capabilities: 'GET /api/v1/farmer-support-clinic/capabilities',
      triage: 'POST /api/v1/farmer-support-clinic/triage',
      consult: 'POST /api/v1/farmer-support-clinic/consult',
      history: 'GET /api/v1/farmer-support-clinic/session/:sessionId',
      vision: 'POST /api/v1/farmer-support-clinic/vision',
    },
    env: {
      vision: 'OPENAI_ENABLED=true, OPENAI_API_KEY, optional OPENAI_VISION_MODEL',
    },
  };
}

module.exports = {
  SPECIES,
  SPECIALISTS,
  DEEP_PACKS,
  buildTriagePackage,
  runAdvisoryConsult,
  analyzeImageWithVision,
  getSessionHistory,
  getCapabilities,
};
