/**
 * Full Veterinary Specialist Panel wiring — structured multi-lens conference
 */

'use strict';

const SPECIALISTS = [
  {
    id: 'medicine',
    name: 'Veterinary Medicine',
    systems: ['systemic', 'gi', 'respiratory', 'mammary'],
    focus: 'Medical differentials, supportive care, referral triggers',
  },
  {
    id: 'surgery',
    name: 'Surgery',
    systems: ['musculoskeletal', 'integument'],
    focus: 'Surgical vs medical, wound, fracture, acute abdomen flags',
  },
  {
    id: 'reproduction',
    name: 'Theriogenology',
    systems: ['repro'],
    focus: 'Abortion storms, dystocia risk, breeding soundness',
  },
  {
    id: 'pathology',
    name: 'Pathology',
    systems: ['systemic', 'gi', 'respiratory', 'neuro'],
    focus: 'Sample plan, necropsy value, lab prioritisation',
  },
  {
    id: 'epidemiology',
    name: 'Epidemiology / One Health',
    systems: ['systemic', 'gi', 'neuro', 'respiratory'],
    focus: 'Herd attack rate, reportable disease, zoonosis',
  },
  {
    id: 'ethnovet',
    name: 'Ethnoveterinary / Geo',
    systems: ['systemic', 'integument', 'gi'],
    focus: 'Local practices safety, concurrent allopathic plan',
  },
  {
    id: 'pharmacology',
    name: 'Clinical Pharmacology',
    systems: ['systemic', 'mammary'],
    focus: 'AMR stewardship, withdrawal, off-label caution',
  },
  {
    id: 'nutrition_animal',
    name: 'Animal Nutrition',
    systems: ['gi', 'systemic'],
    focus: 'Ration, deficiency, toxicity differentials',
  },
];

function rankSpecialists(symptoms = []) {
  const scores = SPECIALISTS.map((sp) => {
    let score = 0.2;
    for (const s of symptoms) {
      const systems = s.systems || [];
      if (systems.some((sys) => sp.systems.includes(sys))) score += 0.25;
      if (s.severity >= 0.85 && ['medicine', 'epidemiology', 'pathology'].includes(sp.id)) score += 0.1;
    }
    return { ...sp, relevance: Math.min(1, score) };
  });
  scores.sort((a, b) => b.relevance - a.relevance);
  return scores;
}

function buildOpinions(ranked, context = {}) {
  return ranked.slice(0, 5).map((sp) => ({
    specialist_id: sp.id,
    specialist_name: sp.name,
    relevance: Math.round(sp.relevance * 100) / 100,
    focus: sp.focus,
    opinion: _opinionTemplate(sp, context),
    safety_note: 'Advisory to attending licensed veterinarian only.',
  }));
}

function _opinionTemplate(sp, context) {
  const species = context.species || 'animal';
  const top = (context.symptoms || []).slice(0, 3).map((s) => s.key || s).join(', ') || 'unspecified signs';
  switch (sp.id) {
    case 'medicine':
      return `Medicine lens (${species}): prioritise stabilisation and differentials for ${top}. Confirm vitals, hydration, and isolation if infectious risk.`;
    case 'surgery':
      return `Surgery lens: assess for surgical abdomen, fractures, or wounds needing intervention. Imaging/exam by licensed vet before any procedure.`;
    case 'reproduction':
      return `Theriogenology: if reproductive signs or abortion history, protect herd biosecurity and investigate infectious causes with lab support.`;
    case 'pathology':
      return `Pathology: recommend targeted samples (blood, milk, faeces, tissue) based on ${top}; necropsy if sudden death cluster.`;
    case 'epidemiology':
      return `One Health / epi: compute attack rate, check human illness, water/feed common source; notify animal husbandry if reportable.`;
    case 'ethnovet':
      return `Ethnovet/geo: document local remedies for safety interactions; do not delay indicated allopathic care for severe disease.`;
    case 'pharmacology':
      return `Pharmacology: no antimicrobial without indication and vet Rx; plan milk/meat withdrawal; prefer narrow spectrum when culture available.`;
    case 'nutrition_animal':
      return `Animal nutrition: rule out deficiency/toxicity and ration errors concurrent with infectious workup.`;
    default:
      return `${sp.name}: review case in context of ${top}.`;
  }
}

function consensus(opinions, symptoms = []) {
  const maxSev = symptoms.reduce((m, s) => Math.max(m, s.severity || 0), 0);
  return {
    summary:
      maxSev >= 0.85
        ? 'Consensus: urgent licensed veterinary examination; consider lab and possible notification.'
        : 'Consensus: structured workup under licensed vet; panel views are advisory.',
    urgency: maxSev >= 0.85 ? 'emergency' : maxSev >= 0.7 ? 'urgent' : 'routine',
    agree_on: ['licensed_vet_required', 'record_vitals', 'biosecurity_if_infectious'],
    opinions_count: opinions.length,
  };
}

module.exports = {
  SPECIALISTS,
  rankSpecialists,
  buildOpinions,
  consensus,
};
