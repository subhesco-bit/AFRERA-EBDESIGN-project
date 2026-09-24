/**
 * VeterinarySpecialistPanel — Grok-tier multi-specialist case conference
 *
 * Nine virtual specialist seats produce a structured CaseConferenceReport
 * with differentials, vital-sign interpretation, herd risk, vaccination
 * gap analysis, production-stage modifiers, evidence-graded therapies,
 * ethnoveterinary options, and mandatory safety disclaimers.
 *
 * Decision-support only. Not a licence to practise veterinary medicine.
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

const NORMS = {
  cow: {
    tempMin: 38.0, tempMax: 39.3, fever: 39.5, critical: 40.5,
    hrMin: 40, hrMax: 80, rrMin: 10, rrMax: 30,
  },
  pig: {
    tempMin: 38.5, tempMax: 40.0, fever: 40.2, critical: 41.0,
    hrMin: 60, hrMax: 100, rrMin: 10, rrMax: 30,
  },
  goat: {
    tempMin: 38.5, tempMax: 40.5, fever: 40.6, critical: 41.5,
    hrMin: 70, hrMax: 90, rrMin: 12, rrMax: 30,
  },
  poultry: {
    tempMin: 40.5, tempMax: 42.0, fever: 42.5, critical: 43.5,
    hrMin: 250, hrMax: 300, rrMin: 15, rrMax: 30,
  },
};

/** Illustrative India-oriented vaccination anchors (confirm local authority). */
const VAX_CALENDARS = {
  cow: [
    { id: 'fmd', name: 'FMD', interval_days: 180, notes: 'National/state schedule' },
    { id: 'hs', name: 'Haemorrhagic Septicaemia', interval_days: 365, notes: 'Pre-monsoon often preferred' },
    { id: 'bq', name: 'Black Quarter', interval_days: 365, notes: 'Endemic areas' },
    { id: 'lsd', name: 'Lumpy Skin Disease', interval_days: 365, notes: 'Where approved/indicated' },
  ],
  pig: [
    { id: 'csf', name: 'Classical Swine Fever', interval_days: 365, notes: 'Where permitted' },
    { id: 'erysipelas', name: 'Erysipelas', interval_days: 180, notes: 'Breeding stock emphasis' },
    { id: 'fmd_pig', name: 'FMD', interval_days: 180, notes: 'Susceptible species' },
  ],
  goat: [
    { id: 'ppr', name: 'PPR', interval_days: 365, notes: 'Foundational in endemic zones' },
    { id: 'et', name: 'Enterotoxaemia', interval_days: 180, notes: 'Diet-change risk periods' },
    { id: 'fmd_goat', name: 'FMD', interval_days: 180, notes: 'Regional programmes' },
  ],
  poultry: [
    { id: 'marek', name: "Marek's disease", interval_days: null, notes: 'Hatchery / day-old' },
    { id: 'nd', name: 'Newcastle Disease', interval_days: 60, notes: 'Programme-dependent boosters' },
    { id: 'ibd', name: 'IBD (Gumboro)', interval_days: 28, notes: 'Maternal Ab–aware timing' },
    { id: 'ib', name: 'Infectious Bronchitis', interval_days: 60, notes: 'As per integrator schedule' },
    { id: 'pox', name: 'Fowl pox', interval_days: 365, notes: 'Wing-web where used' },
  ],
};

function normaliseSpecies(species) {
  const s = String(species || '').toLowerCase().trim();
  if (['cattle', 'dairy', 'buffalo', 'ox', 'bull'].includes(s)) return 'cow';
  if (['chicken', 'hen', 'broiler', 'layer', 'cock', 'bird'].includes(s)) return 'poultry';
  if (['swine', 'hog', 'boar', 'sow'].includes(s)) return 'pig';
  if (['caprine', 'doe', 'buck'].includes(s)) return 'goat';
  return s;
}

function tokenise(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length > 1);
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

/** Vital signs interpretation — Physiology / Internal Medicine seat */
function interpretVitals(species, clinical = {}) {
  const n = NORMS[species];
  if (!n) return { status: 'unknown', findings: [], severity: 'none' };
  const findings = [];
  let severity = 'none';

  const temp = clinical.body_temperature_c;
  if (temp != null) {
    if (temp >= n.critical) {
      findings.push({ parameter: 'temperature', value: temp, flag: 'critical_hyperthermia', detail: `≥ ${n.critical}°C critical for ${species}` });
      severity = 'critical';
    } else if (temp >= n.fever) {
      findings.push({ parameter: 'temperature', value: temp, flag: 'fever', detail: `Above fever threshold ${n.fever}°C` });
      severity = severity === 'critical' ? 'critical' : 'significant';
    } else if (temp < n.tempMin - 0.5) {
      findings.push({ parameter: 'temperature', value: temp, flag: 'hypothermia', detail: 'Below expected range — shock/environment/metabolic' });
      severity = severity === 'critical' ? 'critical' : 'significant';
    } else if (temp >= n.tempMin && temp <= n.tempMax) {
      findings.push({ parameter: 'temperature', value: temp, flag: 'normal', detail: 'Within reference range' });
    }
  }

  const hr = clinical.heart_rate_bpm;
  if (hr != null && n.hrMin != null) {
    if (hr > n.hrMax * 1.25) {
      findings.push({ parameter: 'heart_rate', value: hr, flag: 'tachycardia', detail: 'Elevated — pain, fever, shock, heat' });
      if (severity === 'none') severity = 'moderate';
    } else if (hr < n.hrMin * 0.75) {
      findings.push({ parameter: 'heart_rate', value: hr, flag: 'bradycardia', detail: 'Low — metabolic, terminal, measurement error' });
      if (severity === 'none') severity = 'moderate';
    }
  }

  const rr = clinical.respiratory_rate_bpm;
  if (rr != null && n.rrMin != null) {
    if (rr > n.rrMax * 1.4) {
      findings.push({ parameter: 'respiratory_rate', value: rr, flag: 'tachypnoea', detail: 'Elevated — respiratory disease, heat, pain, acidosis' });
      if (severity === 'none') severity = 'moderate';
    }
  }

  const bcs = clinical.body_condition_score;
  if (bcs != null) {
    if (bcs <= 1.5) {
      findings.push({ parameter: 'bcs', value: bcs, flag: 'emaciated', detail: 'Severe under-condition — nutrition/chronic disease' });
      if (severity === 'none') severity = 'moderate';
    } else if (bcs >= 4.5 && species !== 'poultry') {
      findings.push({ parameter: 'bcs', value: bcs, flag: 'obese', detail: 'Over-condition — metabolic and calving risk' });
    }
  }

  const appetite = clinical.appetite;
  if (appetite === 'anorexic') {
    findings.push({ parameter: 'appetite', value: appetite, flag: 'anorexia', detail: 'Complete appetite loss — escalate workup' });
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
  const species = normaliseSpecies(caseInput.species);
  const symptoms = (caseInput.clinical?.symptoms || []).map((x) => String(x).toLowerCase());
  const owner = tokenise(caseInput.owner_observations);
  const stage = String(caseInput.signalment?.production_stage || '').toLowerCase();
  const bag = new Set([...symptoms, ...owner, ...tokenise(stage)]);
  const keys = disease.key_signs || [];
  let hits = 0;
  const supporting = [];
  const against = [];

  for (const k of keys) {
    const parts = tokenise(k);
    const matched = parts.some((p) => [...bag].some((b) => b.includes(p) || p.includes(b)));
    if (matched) {
      hits += 1;
      supporting.push(k);
    }
  }

  const base = keys.length ? hits / keys.length : 0;
  let confidence = Math.min(0.9, base * 0.8 + (hits >= 2 ? 0.12 : 0) + (hits >= 3 ? 0.08 : 0));

  // Vitals modifiers
  if (vitals.severity === 'critical' || vitals.severity === 'significant') {
    if ((disease.tags || []).some((t) => ['infectious', 'metabolic', 'clostridial'].includes(t))) {
      confidence = Math.min(0.95, confidence + 0.1);
      supporting.push('abnormal vitals compatible');
    }
  }

  const temp = caseInput.clinical?.body_temperature_c;
  const norms = NORMS[species];
  if (temp != null && norms && temp >= norms.fever) {
    if ((disease.tags || []).includes('infectious') || (disease.tags || []).includes('metabolic')) {
      confidence = Math.min(0.95, confidence + 0.07);
    }
  }

  // Herd pattern
  const affected = Number(caseInput.history?.affected_count || 0);
  const mortality = Number(caseInput.history?.mortality_count || 0);
  const herdSize = Number(caseInput.history?.herd_size || 0);
  if (affected > 1 || mortality > 0) {
    if ((disease.tags || []).includes('infectious')) {
      confidence = Math.min(0.96, confidence + 0.12);
      supporting.push('multi-animal / mortality pattern');
    }
    if ((disease.tags || []).includes('metabolic') && affected === 1) {
      // metabolic often individual
    }
  } else if (affected <= 1 && (disease.tags || []).includes('infectious') && (disease.notifiable)) {
    against.push('only single animal reported — contagious disease still possible');
  }

  // Production stage hints
  if (stage.includes('lactat') || stage.includes('fresh') || stage.includes('partur')) {
    if (['milk_fever', 'ketosis', 'mastitis_clinical', 'mma'].includes(disease.id)) {
      confidence = Math.min(0.95, confidence + 0.1);
      supporting.push(`production stage: ${stage}`);
    }
  }
  if (stage.includes('pregnant') || stage.includes('gestat')) {
    if (['pregnancy_toxaemia_goat', 'milk_fever'].includes(disease.id)) {
      confidence = Math.min(0.95, confidence + 0.08);
      supporting.push('late production / pregnancy context');
    }
  }
  if (stage.includes('chick') || stage.includes('piglet') || stage.includes('calf') || stage.includes('kid')) {
    if ((disease.tags || []).includes('neonatal')) {
      confidence = Math.min(0.95, confidence + 0.1);
      supporting.push('neonatal / young stock stage');
    }
  }

  // Vaccination status soft prior
  const vax = String(caseInput.history?.vaccination_status || '').toLowerCase();
  if (vax === 'none' || vax === 'partial' || vax === 'unknown') {
    if (disease.notifiable || (disease.tags || []).includes('infectious')) {
      confidence = Math.min(0.95, confidence + 0.05);
      supporting.push('incomplete vaccination history');
    }
  }

  // Heat / weather
  const weather = String(caseInput.history?.weather_notes || caseInput.owner_observations || '').toLowerCase();
  if (weather.includes('heat') || weather.includes('summer') || weather.includes('humid')) {
    if ((disease.id || '').includes('heat_stress')) {
      confidence = Math.min(0.95, confidence + 0.15);
      supporting.push('environmental heat context');
    }
  }

  // Attack rate soft signal
  if (herdSize > 0 && affected > 0) {
    const rate = affected / herdSize;
    if (rate >= 0.2 && (disease.tags || []).includes('infectious')) {
      confidence = Math.min(0.96, confidence + 0.08);
      supporting.push(`attack rate ~${Math.round(rate * 100)}%`);
    }
  }

  return {
    confidence: Math.round(confidence * 100) / 100,
    supporting: uniq(supporting),
    against: uniq(against),
  };
}

function rankDifferentials(species, caseInput, vitals) {
  const diseases = listDiseases(species);
  return diseases
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
        specialist_notes: {
          infectious_disease: (d.tags || []).includes('infectious') ? d.herd : null,
          epidemiology: d.herd || null,
          pathology_lab: (d.lab || []).join('; ') || null,
        },
      };
    })
    .filter((d) => d.confidence >= 0.1 || d.supporting.length > 0)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

function deriveUrgency(differentials, caseInput, vitals) {
  if (vitals.severity === 'critical') return 'emergency';
  if (differentials.some((d) => d.urgency === 'emergency' && d.confidence >= 0.22)) return 'emergency';
  const temp = caseInput.clinical?.body_temperature_c;
  const species = normaliseSpecies(caseInput.species);
  const norms = NORMS[species];
  if (temp != null && norms && temp >= norms.critical) return 'emergency';
  if ((caseInput.history?.mortality_count || 0) > 0) return 'urgent';
  if (differentials.some((d) => d.urgency === 'urgent' && d.confidence >= 0.28)) return 'urgent';
  if (vitals.severity === 'significant') return 'urgent';
  if (differentials.some((d) => d.urgency === 'soon' && d.confidence >= 0.25)) return 'soon';
  return 'routine';
}

function herdRiskScore(caseInput, differentials) {
  let score = 0;
  const factors = [];
  const affected = Number(caseInput.history?.affected_count || 0);
  const mortality = Number(caseInput.history?.mortality_count || 0);
  const herdSize = Number(caseInput.history?.herd_size || 0);

  if (mortality > 0) { score += 30; factors.push('mortality present'); }
  if (affected > 1) { score += 20; factors.push('multiple animals affected'); }
  if (herdSize > 0 && affected / herdSize >= 0.1) { score += 15; factors.push('elevated attack rate'); }
  if (caseInput.history?.recent_introductions) { score += 15; factors.push('recent animal introductions'); }
  if (differentials.some((d) => d.notifiable && d.confidence >= 0.2)) { score += 25; factors.push('notifiable differential'); }
  if (String(caseInput.history?.vaccination_status || '') === 'none') { score += 10; factors.push('no vaccination history'); }

  score = Math.min(100, score);
  let band = 'low';
  if (score >= 70) band = 'critical';
  else if (score >= 45) band = 'high';
  else if (score >= 25) band = 'moderate';

  return { score, band, factors };
}

function vaccinationGapAnalysis(species, caseInput) {
  const calendar = VAX_CALENDARS[species] || [];
  const status = String(caseInput.history?.vaccination_status || 'unknown').toLowerCase();
  const gaps = calendar.map((v) => ({
    ...v,
    status_assumption: status,
    action:
      status === 'up_to_date'
        ? 'Confirm dates on record; maintain schedule'
        : 'Verify last dose with veterinarian; do not delay notifiable-disease vaccines in endemic areas',
  }));
  return {
    programme: gaps,
    advisory:
      'Schedules are reference anchors only. State veterinary services and product labels govern legal programmes.',
  };
}

function nutritionSeat(species, caseInput, differentials) {
  const notes = [];
  const stage = String(caseInput.signalment?.production_stage || '').toLowerCase();
  const bcs = caseInput.clinical?.body_condition_score;
  const top = differentials[0];

  if (bcs != null && bcs <= 2) {
    notes.push('Nutrition seat: low BCS — evaluate energy/protein, parasites, chronic disease.');
  }
  if (stage.includes('lactat') || stage.includes('fresh')) {
    notes.push('Nutrition seat: transition/fresh period — prioritise energy balance, DCAD/calcium programmes (cow), avoid sudden concentrate spikes.');
  }
  if (top && (top.disease_id || '').includes('ketosis')) {
    notes.push('Nutrition seat: ketosis pattern — fresh-cow energy deficit; ration and BCS at calving review.');
  }
  if (top && (top.disease_id || '').includes('heat_stress')) {
    notes.push('Nutrition seat: heat stress — shift feeding to cooler hours; water access; electrolyte support under vet guidance.');
  }
  if (species === 'pig') {
    notes.push('Nutrition seat: monitor FCR and feed quality; growth checks often multifactorial (health × diet × density).');
  }
  if (species === 'poultry') {
    notes.push('Nutrition seat: verify Ca/P/vitamin programmes in layers; heat-adjusted feed form.');
  }
  if (!notes.length) {
    notes.push('Nutrition seat: no dominant metabolic red flag from intake; maintain balanced ration and water quality.');
  }
  return notes;
}

function reproductionSeat(species, caseInput, differentials) {
  const notes = [];
  const stage = String(caseInput.signalment?.production_stage || '').toLowerCase();
  const sex = String(caseInput.signalment?.sex || '').toLowerCase();

  if (stage.includes('pregnant') || stage.includes('gestat')) {
    notes.push('Reproduction seat: pregnant animal — watch pregnancy toxaemia (goat/sheep), hypocalcaemia risk near term (cow), farrowing readiness (pig).');
  }
  if (stage.includes('lactat') && species === 'pig') {
    notes.push('Reproduction seat: lactating sow — MMA on differential if udder/piglet hunger signs.');
  }
  if (sex === 'male' && species === 'goat') {
    notes.push('Reproduction seat: male goat — urolithiasis risk with concentrate-heavy diets.');
  }
  if (differentials.some((d) => (d.tags || []).includes('reproduction'))) {
    notes.push('Reproduction seat: reproductive tag present on differential — obstetric examination may be required.');
  }
  if (!notes.length) {
    notes.push('Reproduction seat: no primary obstetric signal from intake data.');
  }
  return notes;
}

function buildSpecialistSeats(species, caseInput, differentials, vitals, herdRisk, vax) {
  return {
    chair_species_lead: {
      seat: 'Species Lead',
      species,
      summary: `Case framed for ${species} production context (${caseInput.signalment?.production_stage || 'stage unspecified'}).`,
    },
    internal_medicine: {
      seat: 'Internal Medicine / Infectious Disease',
      vitals,
      top_infectious: differentials.filter((d) => (d.tags || []).includes('infectious')).slice(0, 3),
      notes: vitals.findings?.length
        ? 'Abnormal physiological signals incorporated into ranking.'
        : 'Limited vitals — physical exam remains essential.',
    },
    reproduction: {
      seat: 'Reproduction & Obstetrics',
      notes: reproductionSeat(species, caseInput, differentials),
    },
    nutrition_metabolic: {
      seat: 'Nutrition & Metabolic',
      notes: nutritionSeat(species, caseInput, differentials),
    },
    surgery_lameness: {
      seat: 'Surgery / Lameness',
      notes: (caseInput.clinical?.symptoms || []).some((s) => /limp|lame|hoof|fracture|wound/i.test(s))
        ? ['Lameness/wound keywords present — examine gait, claws/hooves, joints; imaging if indicated.']
        : ['No primary surgical keywords in intake.'],
    },
    pathology_lab: {
      seat: 'Pathology & Laboratory',
      recommended: uniq(differentials.flatMap((d) => d.lab || [])).slice(0, 8),
    },
    epidemiology_herd: {
      seat: 'Epidemiology / Herd Health',
      herd_risk: herdRisk,
      notes: herdRisk.factors,
    },
    pharmacology_food_safety: {
      seat: 'Pharmacology & Food Safety',
      policy: 'No unsupervised drug selection. Withdrawal periods must come from authorised label data.',
      matrix_priority: species === 'poultry' ? ['eggs', 'meat'] : species === 'cow' || species === 'goat' ? ['milk', 'meat'] : ['meat'],
    },
    ethnoveterinary: {
      seat: 'Ethnoveterinary & Complementary',
      policy: VETERINARY_ETHNOVET_NOTE,
      vaccination_gaps: vax,
    },
  };
}

function buildTreatmentOptions(species, differentials) {
  const options = [];
  const top = differentials[0];

  options.push({
    modality: 'supportive',
    name: 'Supportive care — hydration, thermoregulation, nutrition, isolation if indicated',
    evidence_level: 'moderate',
    requires_vet_consultation: true,
    withdrawal: lookupWithdrawal('unknown', species, 'meat'),
    notes: 'First principles while arranging veterinary examination',
  });

  if (top?.notifiable) {
    options.push({
      modality: 'regulatory',
      name: 'Notifiable disease pathway — report and follow competent authority instructions',
      evidence_level: 'strong',
      requires_vet_consultation: true,
      withdrawal: { withdrawal_days: null, source: 'regulatory', requires_vet_consultation: true },
      notes: 'Do not delay official notification for complementary therapies',
    });
  }

  const remedies = getEthnovetForSpecies(species);
  for (const r of remedies) {
    options.push({
      modality: 'ethnoveterinary',
      name: r.name,
      evidence_level: r.evidence_level,
      requires_vet_consultation: true,
      withdrawal: { withdrawal_days: null, source: 'n/a', requires_vet_consultation: true },
      notes: `Uses: ${(r.uses || []).join(', ')}. Cautions: ${(r.cautions || []).join('; ')}${
        top?.notifiable ? '. Secondary to notifiable-disease response.' : ''
      }`,
    });
  }

  options.push({
    modality: 'allopathic',
    name: 'Specific antimicrobial / antiparasitic / metabolic therapy — licensed veterinarian only',
    evidence_level: 'strong',
    requires_vet_consultation: true,
    withdrawal: lookupWithdrawal('unknown', species, species === 'poultry' ? 'eggs' : 'milk'),
    notes: 'No dose auto-selected. Culture/sensitivity and label withdrawal required for food-producing animals.',
  });

  options.push({
    modality: 'nutritional',
    name: 'Ration and water quality review; correct deficiencies under professional guidance',
    evidence_level: 'moderate',
    requires_vet_consultation: true,
    withdrawal: { withdrawal_days: null, source: 'n/a', requires_vet_consultation: false },
    notes: 'Metabolic disease often ration-linked; avoid abrupt concentrate increases',
  });

  return options;
}

function buildPanelSummary(species, urgency, differentials, isolation, notifiable, herdRisk) {
  const topNames = differentials
    .slice(0, 3)
    .map((d) => `${d.name} (${Math.round(d.confidence * 100)}%)`);
  const parts = [
    `Chair (${species} lead): multi-specialist conference complete.`,
    `Urgency ${urgency}; isolation ${isolation ? 'YES' : 'no'}; herd risk ${herdRisk.band} (${herdRisk.score}/100).`,
  ];
  if (notifiable) {
    parts.push('NOTIFIABLE SUSPECT — contact licensed veterinarian and competent authority now.');
  }
  parts.push(topNames.length ? `Leading differentials: ${topNames.join('; ')}.` : 'No strong pattern match — bedside examination required.');
  parts.push('Pharmacology: no unsupervised prescribing. Ethnovet: evidence-graded complementary only.');
  return parts.join(' ');
}

function runConference(caseInput = {}) {
  const species = normaliseSpecies(caseInput.species);
  if (!SUPPORTED.has(species)) {
    throw new Error(`Unsupported species: ${caseInput.species}. Supported: cow, pig, goat, poultry`);
  }

  const vitals = interpretVitals(species, caseInput.clinical || {});
  const differentials = rankDifferentials(species, caseInput, vitals);
  const urgency = deriveUrgency(differentials, caseInput, vitals);
  const isolation =
    differentials.some((d) => d.isolation && d.confidence >= 0.18) || urgency === 'emergency';
  const notifiable = differentials.some((d) => d.notifiable && d.confidence >= 0.18);
  const herdRisk = herdRiskScore(caseInput, differentials);
  const vax = vaccinationGapAnalysis(species, caseInput);
  const seats = buildSpecialistSeats(species, caseInput, differentials, vitals, herdRisk, vax);

  const recommended_diagnostics = uniq([
    'Full clinical examination by licensed veterinarian',
    ...differentials.slice(0, 5).flatMap((d) => d.lab || []),
  ]);

  const treatment_options = buildTreatmentOptions(species, differentials);
  const local_customary_notes = getEthnovetForSpecies(species).map((r) => ({
    id: r.id,
    name: r.name,
    evidence_level: r.evidence_level,
    uses: r.uses,
    cautions: r.cautions,
  }));

  const confidence_overall = differentials.length ? differentials[0].confidence : 0.08;

  const preventive_actions = uniq([
    differentials[0]?.herd,
    'Review vaccination and biosecurity with veterinarian',
    'Quarantine new arrivals ≥14 days where practical',
    'Record outcome for continuous improvement',
    herdRisk.band === 'critical' || herdRisk.band === 'high'
      ? 'Activate heightened herd surveillance and movement controls'
      : null,
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
    specialist_seats: seats,
    differentials,
    recommended_diagnostics,
    treatment_options,
    preventive_actions,
    herd_implications:
      differentials[0]?.herd ||
      'Assess in-contact animals; review introductions, water, feed, housing, and rodent/vector control.',
    local_customary_notes,
    panel_summary: buildPanelSummary(species, urgency, differentials, isolation, notifiable, herdRisk),
    ethnovet_note: VETERINARY_ETHNOVET_NOTE,
    disclaimer: VETERINARY_CLINICAL_DISCLAIMER,
    one_health_note:
      notifiable || differentials.some((d) => (d.tags || []).includes('zoonotic_risk'))
        ? 'One Health: possible zoonotic or reportable implications — protect handlers, use PPE, coordinate human health advice if exposure.'
        : 'One Health: standard hygiene; wash after animal contact; separate livestock and household water where relevant.',
    provenance: {
      knowledge_version: KNOWLEDGE_VERSION,
      engine: 'VeterinarySpecialistPanel',
      engine_tier: 'grok-highest',
      rules_fired: [
        'symptom_overlap',
        'vitals_interpretation',
        'fever_boost',
        'herd_pattern',
        'production_stage',
        'vaccination_prior',
        'notifiable_gate',
        'herd_risk_score',
        'nine_seat_conference',
      ],
    },
    confidence_overall,
    generatedAt: new Date().toISOString(),
  };
}

/** Batch conference for herd-level symptom waves */
function runHerdScreen({ species, animals = [], shared_history = {} }) {
  const results = animals.map((a) =>
    runConference({
      species,
      signalment: a.signalment,
      clinical: a.clinical,
      history: { ...shared_history, ...(a.history || {}) },
      owner_observations: a.owner_observations,
      location: a.location,
    }),
  );
  const notifiableAny = results.some((r) => r.notifiable_suspect);
  const maxUrgency = ['emergency', 'urgent', 'soon', 'routine'].find((u) =>
    results.some((r) => r.urgency === u),
  );
  return {
    species: normaliseSpecies(species),
    animal_count: results.length,
    max_urgency: maxUrgency || 'routine',
    notifiable_any: notifiableAny,
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
