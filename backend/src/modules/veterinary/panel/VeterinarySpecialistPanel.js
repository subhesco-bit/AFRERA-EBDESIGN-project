/**
 * VeterinarySpecialistPanel — full species: livestock, poultry, duck, rabbit, dog, cat, fish
 */

const { randomUUID } = require('crypto');
const {
  KNOWLEDGE_VERSION,
  listDiseases,
  getEthnovetForSpecies,
  lookupWithdrawal,
  normaliseKey,
  SUPPORTED_SPECIES: KNOWLEDGE_SPECIES,
} = require('../knowledge');
const { computeHerdRisk } = require('../herd/HerdRiskScoring');
const {
  VETERINARY_CLINICAL_DISCLAIMER,
  VETERINARY_ETHNOVET_NOTE,
} = require('../../../utils/disclaimers');

const SUPPORTED = new Set(KNOWLEDGE_SPECIES);

const NORMS = {
  cow: { tempMin: 38.0, tempMax: 39.3, fever: 39.5, critical: 40.5, hrMin: 40, hrMax: 80, rrMin: 10, rrMax: 30 },
  pig: { tempMin: 38.5, tempMax: 40.0, fever: 40.2, critical: 41.0, hrMin: 60, hrMax: 100, rrMin: 10, rrMax: 30 },
  goat: { tempMin: 38.5, tempMax: 40.5, fever: 40.6, critical: 41.5, hrMin: 70, hrMax: 90, rrMin: 12, rrMax: 30 },
  sheep: { tempMin: 38.5, tempMax: 40.0, fever: 40.5, critical: 41.5, hrMin: 60, hrMax: 90, rrMin: 12, rrMax: 30 },
  poultry: { tempMin: 40.5, tempMax: 42.0, fever: 42.5, critical: 43.5, hrMin: 250, hrMax: 300, rrMin: 15, rrMax: 30 },
  duck: { tempMin: 40.5, tempMax: 42.5, fever: 42.8, critical: 43.5, hrMin: 180, hrMax: 250, rrMin: 10, rrMax: 30 },
  rabbit: { tempMin: 38.5, tempMax: 40.0, fever: 40.2, critical: 41.0, hrMin: 130, hrMax: 325, rrMin: 30, rrMax: 60 },
  dog: { tempMin: 37.5, tempMax: 39.2, fever: 39.5, critical: 41.0, hrMin: 60, hrMax: 140, rrMin: 10, rrMax: 35 },
  cat: { tempMin: 37.7, tempMax: 39.2, fever: 39.5, critical: 41.0, hrMin: 140, hrMax: 220, rrMin: 20, rrMax: 40 },
  fish: { tempMin: null, tempMax: null, fever: null, critical: null, note: 'Use water quality parameters not body temp' },
};

const VAX_CALENDARS = {
  cow: [
    { id: 'fmd', name: 'FMD', interval_days: 180 },
    { id: 'hs', name: 'HS', interval_days: 365 },
    { id: 'bq', name: 'BQ', interval_days: 365 },
  ],
  pig: [
    { id: 'csf', name: 'CSF', interval_days: 365 },
    { id: 'erysipelas', name: 'Erysipelas', interval_days: 180 },
  ],
  goat: [
    { id: 'ppr', name: 'PPR', interval_days: 365 },
    { id: 'et', name: 'Enterotoxaemia', interval_days: 180 },
  ],
  sheep: [
    { id: 'ppr_sheep', name: 'PPR', interval_days: 365 },
    { id: 'et_sheep', name: 'Enterotoxaemia', interval_days: 180 },
  ],
  poultry: [
    { id: 'nd', name: 'Newcastle', interval_days: 60 },
    { id: 'ibd', name: 'IBD', interval_days: 28 },
    { id: 'marek', name: 'Marek', interval_days: null },
  ],
  duck: [
    { id: 'duck_plague_vax', name: 'Duck plague where used', interval_days: 365 },
  ],
  rabbit: [
    { id: 'rhd_vax', name: 'RHD', interval_days: 365 },
    { id: 'myxo_vax', name: 'Myxomatosis', interval_days: 365 },
  ],
  dog: [
    { id: 'rabies', name: 'Rabies', interval_days: 365 },
    { id: 'dhpp', name: 'Core DHPP', interval_days: 365 },
  ],
  cat: [
    { id: 'rabies_cat', name: 'Rabies', interval_days: 365 },
    { id: 'fvrcp', name: 'Core FVRCP', interval_days: 365 },
  ],
  fish: [],
};

function normaliseSpecies(species) {
  return normaliseKey(species);
}

function tokenise(text) {
  return String(text || '').toLowerCase().split(/[^a-z0-9+]+/).filter((t) => t.length > 1);
}
function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function interpretVitals(species, clinical = {}) {
  const n = NORMS[species];
  if (!n || n.tempMin == null) {
    return {
      status: species === 'fish' ? 'use_water_quality' : 'unknown',
      findings: species === 'fish' ? [{ parameter: 'water', flag: 'check_DO_ammonia', detail: 'Body temperature N/A — test DO, ammonia, nitrite, temp' }] : [],
      severity: 'none',
      reference: n,
    };
  }
  const findings = [];
  let severity = 'none';
  const temp = clinical.body_temperature_c;
  if (temp != null) {
    if (temp >= n.critical) {
      findings.push({ parameter: 'temperature', value: temp, flag: 'critical_hyperthermia', detail: `critical for ${species}` });
      severity = 'critical';
    } else if (temp >= n.fever) {
      findings.push({ parameter: 'temperature', value: temp, flag: 'fever', detail: `fever threshold ${n.fever}` });
      severity = 'significant';
    } else if (temp < n.tempMin - 0.5) {
      findings.push({ parameter: 'temperature', value: temp, flag: 'hypothermia', detail: 'below range' });
      severity = 'significant';
    } else if (temp >= n.tempMin && temp <= n.tempMax) {
      findings.push({ parameter: 'temperature', value: temp, flag: 'normal', detail: 'in range' });
    }
  }
  if (clinical.appetite === 'anorexic') {
    findings.push({ parameter: 'appetite', flag: 'anorexia', value: 'anorexic', detail: 'appetite loss' });
    if (severity === 'none') severity = 'moderate';
  }
  return {
    status: findings.some((f) => f.flag !== 'normal') ? 'abnormal' : temp != null ? 'normal' : 'incomplete',
    findings,
    severity,
    reference: n,
  };
}

function scoreDisease(disease, caseInput, vitals) {
  const symptoms = (caseInput.clinical?.symptoms || []).map((x) => String(x).toLowerCase());
  const owner = tokenise(caseInput.owner_observations);
  const bag = new Set([...symptoms, ...owner]);
  const keys = disease.key_signs || [];
  let hits = 0;
  const supporting = [];
  for (const k of keys) {
    const parts = tokenise(k);
    if (parts.some((p) => [...bag].some((b) => b.includes(p) || p.includes(b)))) {
      hits += 1;
      supporting.push(k);
    }
  }
  const base = keys.length ? hits / keys.length : 0;
  let confidence = Math.min(0.9, base * 0.8 + (hits >= 2 ? 0.12 : 0) + (hits >= 3 ? 0.08 : 0));
  if (vitals.severity === 'critical' || vitals.severity === 'significant') {
    if ((disease.tags || []).some((t) => ['infectious', 'metabolic', 'clostridial', 'toxin', 'emergency'].includes(t))) {
      confidence = Math.min(0.95, confidence + 0.1);
      supporting.push('abnormal vitals compatible');
    }
  }
  const affected = Number(caseInput.history?.affected_count || 0);
  const mortality = Number(caseInput.history?.mortality_count || 0);
  if ((affected > 1 || mortality > 0) && (disease.tags || []).includes('infectious')) {
    confidence = Math.min(0.96, confidence + 0.12);
    supporting.push('multi-animal / mortality pattern');
  }
  return { confidence: Math.round(confidence * 100) / 100, supporting: uniq(supporting), against: [] };
}

function rankDifferentials(species, caseInput, vitals) {
  return listDiseases(species)
    .map((d) => {
      const { confidence, supporting, against } = scoreDisease(d, caseInput, vitals);
      return {
        disease_id: d.id,
        name: d.name,
        confidence,
        supporting,
        against,
        notifiable: !!d.notifiable,
        urgency: d.urgency,
        isolation: !!d.isolation,
        lab: d.lab || [],
        herd: d.herd || '',
        tags: d.tags || [],
      };
    })
    .filter((d) => d.confidence >= 0.1 || d.supporting.length > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

function deriveUrgency(differentials, caseInput, vitals) {
  if (vitals.severity === 'critical') return 'emergency';
  if (differentials.some((d) => d.urgency === 'emergency' && d.confidence >= 0.2)) return 'emergency';
  if ((caseInput.history?.mortality_count || 0) > 0) return 'urgent';
  if (differentials.some((d) => d.urgency === 'urgent' && d.confidence >= 0.25)) return 'urgent';
  if (vitals.severity === 'significant') return 'urgent';
  if (differentials.some((d) => d.urgency === 'soon' && d.confidence >= 0.2)) return 'soon';
  return 'routine';
}

function vaccinationGapAnalysis(species, caseInput) {
  const calendar = VAX_CALENDARS[species] || [];
  const status = String(caseInput.history?.vaccination_status || 'unknown').toLowerCase();
  return {
    programme: calendar.map((v) => ({
      ...v,
      status_assumption: status,
      action: status === 'up_to_date' ? 'Maintain schedule' : 'Verify with veterinarian',
    })),
    advisory: 'Product labels and local law govern vaccines.',
  };
}

function buildTreatmentOptions(species, differentials) {
  const options = [];
  const top = differentials[0];
  options.push({
    modality: 'supportive',
    name: 'Supportive care while arranging veterinary examination',
    evidence_level: 'moderate',
    requires_vet_consultation: true,
    withdrawal: lookupWithdrawal('unknown', species, 'meat'),
  });
  if (top?.notifiable) {
    options.push({
      modality: 'regulatory',
      name: 'Notifiable pathway — competent authority',
      evidence_level: 'strong',
      requires_vet_consultation: true,
      withdrawal: { withdrawal_days: null, source: 'regulatory', requires_vet_consultation: true },
    });
  }
  for (const r of getEthnovetForSpecies(species).slice(0, 6)) {
    options.push({
      modality: 'ethnoveterinary',
      name: r.name,
      evidence_level: r.evidence_level,
      requires_vet_consultation: true,
      notes: `Uses: ${(r.uses || []).join(', ')}. Cautions: ${(r.cautions || []).join('; ')}`,
      withdrawal: { withdrawal_days: null, source: 'n/a', requires_vet_consultation: true },
    });
  }
  options.push({
    modality: 'allopathic',
    name: 'Specific therapy — licensed veterinarian only',
    evidence_level: 'strong',
    requires_vet_consultation: true,
    withdrawal: lookupWithdrawal('unknown', species, 'meat'),
  });
  return options;
}

function runConference(caseInput = {}) {
  const species = normaliseSpecies(caseInput.species);
  if (!SUPPORTED.has(species)) {
    throw new Error(`Unsupported species: ${caseInput.species}. Supported: ${[...SUPPORTED].join(', ')}`);
  }
  const vitals = interpretVitals(species, caseInput.clinical || {});
  const differentials = rankDifferentials(species, caseInput, vitals);
  const urgency = deriveUrgency(differentials, caseInput, vitals);
  const isolation = differentials.some((d) => d.isolation && d.confidence >= 0.18) || urgency === 'emergency';
  const notifiable = differentials.some((d) => d.notifiable && d.confidence >= 0.18);
  const herdRisk = computeHerdRisk({
    history: caseInput.history,
    differentials,
    context: caseInput.context,
    production_stage_summary: caseInput.signalment?.production_stage,
  });
  const vax = vaccinationGapAnalysis(species, caseInput);
  const recommended_diagnostics = uniq([
    'Full clinical examination by licensed veterinarian',
    ...differentials.slice(0, 5).flatMap((d) => d.lab || []),
  ]);
  return {
    case_id: randomUUID(),
    species,
    urgency,
    isolation_recommended: isolation,
    notifiable_suspect: notifiable,
    vitals_interpretation: vitals,
    herd_risk: herdRisk,
    vaccination_analysis: vax,
    differentials,
    recommended_diagnostics,
    treatment_options: buildTreatmentOptions(species, differentials),
    preventive_actions: uniq([differentials[0]?.herd, 'Biosecurity review', ...(herdRisk.recommended_actions || [])]),
    herd_implications: differentials[0]?.herd || 'Assess in-contacts and environment',
    local_customary_notes: getEthnovetForSpecies(species).map((r) => ({
      id: r.id, name: r.name, evidence_level: r.evidence_level, uses: r.uses,
    })),
    panel_summary: `Chair (${species}): ${urgency}; isolation ${isolation ? 'YES' : 'no'}; herd ${herdRisk.band} (${herdRisk.score}). ${notifiable ? 'NOTIFIABLE. ' : ''}${differentials.slice(0, 3).map((d) => `${d.name} (${Math.round(d.confidence * 100)}%)`).join('; ') || 'No strong match.'}`,
    ethnovet_note: VETERINARY_ETHNOVET_NOTE,
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    one_health_note: notifiable || differentials.some((d) => (d.tags || []).includes('zoonotic_risk'))
      ? 'One Health: zoonotic/reportable risk — PPE; public health as indicated'
      : 'One Health: standard hygiene',
    provenance: {
      knowledge_version: KNOWLEDGE_VERSION,
      engine: 'VeterinarySpecialistPanel',
      engine_tier: 'grok-highest',
      herd_algorithm: herdRisk.algorithm,
    },
    confidence_overall: differentials[0]?.confidence || 0.08,
    generatedAt: new Date().toISOString(),
  };
}

function runHerdScreen({ species, animals = [], shared_history = {} }) {
  const results = animals.map((a) =>
    runConference({
      species,
      signalment: a.signalment,
      clinical: a.clinical,
      history: { ...shared_history, ...(a.history || {}) },
      owner_observations: a.owner_observations,
      location: a.location,
      context: a.context,
    }),
  );
  return {
    species: normaliseSpecies(species),
    animal_count: results.length,
    max_urgency: ['emergency', 'urgent', 'soon', 'routine'].find((u) => results.some((r) => r.urgency === u)) || 'routine',
    notifiable_any: results.some((r) => r.notifiable_suspect),
    cases: results,
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  runConference,
  runHerdScreen,
  normaliseSpecies,
  interpretVitals,
  vaccinationGapAnalysis,
  SUPPORTED_SPECIES: [...SUPPORTED],
  NORMS,
  VAX_CALENDARS,
};
