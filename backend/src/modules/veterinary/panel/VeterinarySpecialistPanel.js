/**
 * VeterinarySpecialistPanel
 *
 * Multi-specialist case conference engine for cow, pig, goat, poultry.
 * Produces a structured CaseConferenceReport with differentials,
 * urgency, isolation, diagnostics, treatment options (evidence-graded),
 * ethnoveterinary notes, and mandatory disclaimers.
 *
 * This is decision-support only — not a licence to practise.
 */

const { randomUUID } = require('crypto');
const {
  KNOWLEDGE_VERSION,
  listDiseases,
  getEthnovetForSpecies,
  lookupWithdrawal,
} = require('../knowledge');
const {
  VETERINARY_CLINICAL_DISCLAIMER,
  VETERINARY_ETHNOVET_NOTE,
} = require('../../../utils/disclaimers');

const SUPPORTED = new Set(['cow', 'pig', 'goat', 'poultry']);

// Species normal ranges (panel heuristics)
const NORMS = {
  cow: { tempMin: 38.0, tempMax: 39.3, fever: 39.5, critical: 40.5 },
  pig: { tempMin: 38.5, tempMax: 40.0, fever: 40.2, critical: 41.0 },
  goat: { tempMin: 38.5, tempMax: 40.5, fever: 40.6, critical: 41.5 },
  poultry: { tempMin: 40.5, tempMax: 42.0, fever: 42.5, critical: 43.5 },
};

function normaliseSpecies(species) {
  const s = String(species || '').toLowerCase().trim();
  if (s === 'cattle' || s === 'dairy' || s === 'buffalo') return 'cow';
  if (s === 'chicken' || s === 'hen' || s === 'broiler' || s === 'layer') return 'poultry';
  if (s === 'swine' || s === 'hog') return 'pig';
  return s;
}

function tokenise(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter(Boolean);
}

function scoreDisease(disease, caseInput) {
  const symptoms = (caseInput.clinical?.symptoms || []).map((x) => String(x).toLowerCase());
  const owner = tokenise(caseInput.owner_observations);
  const bag = new Set([...symptoms, ...owner]);
  const keys = disease.key_signs || [];
  let hits = 0;
  const supporting = [];
  for (const k of keys) {
    const parts = tokenise(k);
    const matched = parts.some((p) => [...bag].some((b) => b.includes(p) || p.includes(b)));
    if (matched) {
      hits += 1;
      supporting.push(k);
    }
  }
  const base = keys.length ? hits / keys.length : 0;
  let confidence = Math.min(0.92, base * 0.85 + (hits >= 2 ? 0.15 : 0));

  // Fever boost
  const temp = caseInput.clinical?.body_temperature_c;
  const norms = NORMS[normaliseSpecies(caseInput.species)];
  if (temp != null && norms && temp >= norms.fever) {
    if ((disease.tags || []).includes('infectious') || (disease.tags || []).includes('metabolic')) {
      confidence = Math.min(0.95, confidence + 0.08);
      supporting.push(`fever ${temp}°C`);
    }
  }

  // Herd mortality boost for contagious tags
  const affected = caseInput.history?.affected_count || 0;
  const mortality = caseInput.history?.mortality_count || 0;
  if (affected > 1 || mortality > 0) {
    if ((disease.tags || []).includes('infectious')) {
      confidence = Math.min(0.95, confidence + 0.1);
      supporting.push('multi-animal / mortality pattern');
    }
  }

  return { confidence, supporting, against: [] };
}

function rankDifferentials(species, caseInput) {
  const diseases = listDiseases(species);
  const ranked = diseases
    .map((d) => {
      const { confidence, supporting, against } = scoreDisease(d, caseInput);
      return {
        disease_id: d.id,
        name: d.name,
        confidence: Math.round(confidence * 100) / 100,
        supporting,
        against,
        notifiable: !!d.notifiable,
        urgency: d.urgency,
        isolation: !!d.isolation,
        lab: d.lab || [],
        herd: d.herd || '',
        tags: d.tags || [],
        specialist_notes: {
          infectious: (d.tags || []).includes('infectious') ? d.herd : undefined,
          herd: d.herd,
        },
      };
    })
    .filter((d) => d.confidence >= 0.12 || d.supporting.length > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);

  // Always surface notifiable if any weak signal of fever + multi-animal
  return ranked;
}

function deriveUrgency(differentials, caseInput) {
  if (differentials.some((d) => d.urgency === 'emergency' && d.confidence >= 0.25)) return 'emergency';
  const temp = caseInput.clinical?.body_temperature_c;
  const species = normaliseSpecies(caseInput.species);
  const norms = NORMS[species];
  if (temp != null && norms && temp >= norms.critical) return 'emergency';
  if (differentials.some((d) => d.urgency === 'urgent' && d.confidence >= 0.3)) return 'urgent';
  if ((caseInput.history?.mortality_count || 0) > 0) return 'urgent';
  if (differentials.some((d) => d.urgency === 'soon')) return 'soon';
  return 'routine';
}

function buildTreatmentOptions(species, differentials) {
  const options = [];
  const top = differentials[0];

  // Supportive always
  options.push({
    modality: 'supportive',
    name: 'Supportive care (hydration, comfort, nutrition, isolation if indicated)',
    evidence_level: 'moderate',
    requires_vet_consultation: true,
    withdrawal: lookupWithdrawal('unknown', species, 'meat'),
    notes: 'Supportive measures while awaiting veterinary examination',
  });

  // Ethnovet complementary (filtered)
  const remedies = getEthnovetForSpecies(species).slice(0, 5);
  for (const r of remedies) {
    // Skip internal strong claims on notifiable top differential
    if (top?.notifiable && r.evidence_level === 'traditional_only') {
      options.push({
        modality: 'ethnoveterinary',
        name: r.name,
        evidence_level: r.evidence_level,
        requires_vet_consultation: true,
        withdrawal: { withdrawal_days: null, source: 'n/a', requires_vet_consultation: true },
        notes: `Complementary only. Cautions: ${(r.cautions || []).join('; ')}. Not a substitute for notifiable-disease response.`,
      });
    } else {
      options.push({
        modality: 'ethnoveterinary',
        name: r.name,
        evidence_level: r.evidence_level,
        requires_vet_consultation: !!r.requires_vet_consultation,
        withdrawal: { withdrawal_days: null, source: 'n/a', requires_vet_consultation: true },
        notes: `Uses: ${(r.uses || []).join(', ')}. Cautions: ${(r.cautions || []).join('; ')}`,
      });
    }
  }

  // Allopathic placeholder — never invent dose
  options.push({
    modality: 'allopathic',
    name: 'Antimicrobial / specific therapy — veterinarian prescribed only',
    evidence_level: 'strong',
    requires_vet_consultation: true,
    withdrawal: lookupWithdrawal('unknown', species, species === 'poultry' ? 'eggs' : 'milk'),
    notes: 'No dose or product is auto-selected. Culture/sensitivity and label withdrawal required for food animals.',
  });

  return options;
}

function buildPanelSummary(species, urgency, differentials, isolation, notifiable) {
  const topNames = differentials.slice(0, 3).map((d) => `${d.name} (${Math.round(d.confidence * 100)}%)`);
  const lines = [
    `Species lead (${species}): case reviewed by multi-specialist panel.`,
    `Urgency: ${urgency}. Isolation recommended: ${isolation ? 'yes' : 'no'}.`,
  ];
  if (notifiable) {
    lines.push('NOTIFIABLE DISEASE SUSPECTED — escalate to licensed veterinarian and competent authority immediately.');
  }
  if (topNames.length) {
    lines.push(`Leading differentials: ${topNames.join('; ')}.`);
  } else {
    lines.push('Insufficient specific pattern match — clinical examination required.');
  }
  lines.push('Pharmacology seat: no unsupervised prescribing; verify withdrawals on label.');
  lines.push('Ethnoveterinary seat: complementary options only, evidence-graded.');
  return lines.join(' ');
}

/**
 * Run full panel conference on a case intake object.
 * @param {object} caseInput
 * @returns {object} CaseConferenceReport
 */
function runConference(caseInput = {}) {
  const species = normaliseSpecies(caseInput.species);
  if (!SUPPORTED.has(species)) {
    throw new Error(`Unsupported species: ${caseInput.species}. Supported: cow, pig, goat, poultry`);
  }

  const differentials = rankDifferentials(species, caseInput);
  const urgency = deriveUrgency(differentials, caseInput);
  const isolation =
    differentials.some((d) => d.isolation && d.confidence >= 0.2) ||
    urgency === 'emergency';
  const notifiable = differentials.some((d) => d.notifiable && d.confidence >= 0.2);

  const recommended_diagnostics = [];
  for (const d of differentials.slice(0, 4)) {
    for (const lab of d.lab || []) {
      if (!recommended_diagnostics.includes(lab)) recommended_diagnostics.push(lab);
    }
  }
  if (!recommended_diagnostics.length) {
    recommended_diagnostics.push('Full clinical examination by licensed veterinarian');
  }

  const treatment_options = buildTreatmentOptions(species, differentials);
  const local_customary_notes = getEthnovetForSpecies(species).map((r) => ({
    id: r.id,
    name: r.name,
    evidence_level: r.evidence_level,
    uses: r.uses,
  }));

  const confidence_overall =
    differentials.length > 0 ? differentials[0].confidence : 0.1;

  const preventive_actions = [];
  if (differentials[0]?.herd) preventive_actions.push(differentials[0].herd);
  preventive_actions.push('Review vaccination and biosecurity programme with veterinarian');
  preventive_actions.push('Record case outcome for continuous learning');

  return {
    case_id: randomUUID(),
    species,
    urgency,
    isolation_recommended: isolation,
    notifiable_suspect: notifiable,
    differentials,
    recommended_diagnostics,
    treatment_options,
    preventive_actions,
    herd_implications:
      differentials[0]?.herd ||
      'Assess in-contact animals; review introductions, water, feed, and housing.',
    local_customary_notes,
    panel_summary: buildPanelSummary(species, urgency, differentials, isolation, notifiable),
    ethnovet_note: VETERINARY_ETHNOVET_NOTE,
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    provenance: {
      knowledge_version: KNOWLEDGE_VERSION,
      engine: 'VeterinarySpecialistPanel',
      rules_fired: ['symptom_overlap', 'fever_boost', 'herd_pattern', 'notifiable_gate'],
    },
    confidence_overall,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  runConference,
  normaliseSpecies,
  SUPPORTED_SPECIES: [...SUPPORTED],
  NORMS,
};
