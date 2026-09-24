/**
 * Deep Soil Microbiome AI — interpretation layer
 * Gap-fill vs BeCrop / Trace / Elaniti / FA Bio style platforms:
 * functional guilds, pathogen risk, fertility functions, carbon, prescriptions.
 * Accepts lab metagenomic summaries OR proxy field indicators when DNA absent.
 */

const { randomUUID } = require('crypto');

const MB_DISCLAIMER =
  'Microbiome AI is decision-support. DNA lab reports and soil chemistry labs override proxies. Biofertilizer claims require registered products. Not a diagnostic medical/veterinary test.';

/** Functional guilds used by commercial soil intelligence platforms */
const FUNCTIONAL_GUILDS = [
  { id: 'n_fixers', name: 'Nitrogen fixers', indicators: ['rhizobium', 'azotobacter', 'frankia'], crop_boost: ['pulses', 'cereals'] },
  { id: 'p_solubilizers', name: 'Phosphate solubilizers', indicators: ['psb', 'bacillus', 'pseudomonas'], crop_boost: ['*'] },
  { id: 'mycorrhiza', name: 'Arbuscular mycorrhizal fungi', indicators: ['amf', 'glomus'], crop_boost: ['vegetables', 'fruits', 'spices'] },
  { id: 'biocontrol', name: 'Disease-suppressive taxa', indicators: ['trichoderma', 'pseudomonas_fluorescens', 'bacillus_subtilis'], crop_boost: ['nursery', 'vegetables'] },
  { id: 'decomposers', name: 'Organic matter decomposers', indicators: ['actinobacteria', 'saprophytic_fungi'], crop_boost: ['*'] },
  { id: 'pathogen_load', name: 'Pathogen / antagonist balance', indicators: ['fusarium', 'rhizoctonia', 'pythium', 'phytophthora', 'nematode_markers'], crop_boost: [] },
  { id: 'nitrifiers_denitrifiers', name: 'N cycling balance', indicators: ['nitrosomonas', 'nitrobacter', 'denitrifier_genes'], crop_boost: ['*'] },
];

function scoreFromLab(lab = {}) {
  // lab may include relative abundances 0-1 or qualitative high/med/low
  const scores = {};
  for (const g of FUNCTIONAL_GUILDS) {
    let s = 0.5;
    if (lab[g.id] != null) s = Number(lab[g.id]);
    else if (lab.guilds && lab.guilds[g.id] != null) s = Number(lab.guilds[g.id]);
    scores[g.id] = Math.max(0, Math.min(1, s));
  }
  return scores;
}

function scoreFromProxies(input = {}) {
  const oc = Number(input.organic_carbon_pct ?? input.soil?.organic_carbon_pct);
  const ph = Number(input.ph ?? input.soil?.ph);
  const mode = String(input.farming_mode || '').toLowerCase();
  const scores = {
    n_fixers: 0.45,
    p_solubilizers: 0.45,
    mycorrhiza: 0.4,
    biocontrol: 0.4,
    decomposers: 0.45,
    pathogen_load: 0.35,
    nitrifiers_denitrifiers: 0.45,
  };
  if (oc >= 0.75) {
    scores.decomposers += 0.2;
    scores.mycorrhiza += 0.1;
    scores.biocontrol += 0.1;
  } else if (oc > 0 && oc < 0.4) {
    scores.decomposers -= 0.15;
    scores.mycorrhiza -= 0.1;
  }
  if (mode === 'organic' || mode === 'integrated') {
    scores.biocontrol += 0.1;
    scores.n_fixers += 0.05;
  }
  if (mode === 'inorganic' && input.heavy_biocide) scores.biocontrol -= 0.15;
  if (ph < 5.5 || ph > 8.5) {
    scores.n_fixers -= 0.1;
    scores.mycorrhiza -= 0.1;
  }
  for (const k of Object.keys(scores)) scores[k] = Math.max(0.05, Math.min(0.95, scores[k]));
  return { scores, method: 'proxy_field_indicators', confidence: 0.35 };
}

function interpretMicrobiome(input = {}) {
  const hasLab = !!(input.lab_microbiome || input.dna_summary || input.guild_scores);
  const labScores = hasLab
    ? { scores: scoreFromLab(input.lab_microbiome || input.dna_summary || input.guild_scores), method: 'lab_or_vendor_summary', confidence: 0.75 }
    : scoreFromProxies(input);

  const scores = labScores.scores;
  const findings = [];
  if (scores.pathogen_load >= 0.6) {
    findings.push({
      severity: 'high',
      guild: 'pathogen_load',
      interpretation: 'Elevated pathogen/antagonist signal — prioritise sanitation, resistant variety, Trichoderma/registered biocontrol; avoid sole chemical reliance without ID',
    });
  }
  if (scores.n_fixers < 0.35) {
    findings.push({
      severity: 'moderate',
      guild: 'n_fixers',
      interpretation: 'Low N-fixer signal — legume rotation / Rhizobium seed treatment for pulses; organic N sources',
    });
  }
  if (scores.p_solubilizers < 0.35) {
    findings.push({
      severity: 'moderate',
      guild: 'p_solubilizers',
      interpretation: 'Low P-solubiliser signal — PSB inoculant + organic acids pathway; soil-test P still required',
    });
  }
  if (scores.mycorrhiza < 0.35) {
    findings.push({
      severity: 'moderate',
      guild: 'mycorrhiza',
      interpretation: 'Low AMF signal — reduce unnecessary fungicide drench; AMF inoculant for vegetables/fruits; avoid long fallow bare soil',
    });
  }
  if (scores.decomposers < 0.35) {
    findings.push({
      severity: 'moderate',
      guild: 'decomposers',
      interpretation: 'Weak decomposer signal — add compost/residue; stop burning',
    });
  }
  if (scores.biocontrol >= 0.65 && scores.pathogen_load < 0.4) {
    findings.push({
      severity: 'low',
      guild: 'biocontrol',
      interpretation: 'Favourable disease-suppressive profile — maintain organic carbon and diversity',
    });
  }

  const fertility_index = Math.round(
    ((scores.n_fixers + scores.p_solubilizers + scores.mycorrhiza + scores.decomposers) / 4) * 100,
  );
  const disease_suppression_index = Math.round(
    (scores.biocontrol * 0.7 + (1 - scores.pathogen_load) * 0.3) * 100,
  );
  const carbon_biology_index = Math.round(scores.decomposers * 100);

  const prescriptions = [];
  prescriptions.push('Soil chemistry lab (NPK, OC, pH, micronutrients) remains mandatory baseline');
  if (fertility_index < 50) prescriptions.push('Build OC with compost/green manure over 2–3 seasons');
  if (scores.n_fixers < 0.4 && /pulse|gram|moong|tur|bean/.test(String(input.crop || ''))) {
    prescriptions.push('Registered Rhizobium inoculant on seed');
  }
  if (scores.pathogen_load >= 0.55) prescriptions.push('Nursery sanitation + registered Trichoderma where crop fits');
  if (input.farming_mode === 'organic') {
    prescriptions.push('Align inputs with NPOP/PGS positive lists — no dual inventory of prohibited synthetics');
  }

  // AI multi-lens interpretation (parity with health MultiAI)
  const lenses = {
    scientific_research: {
      method: labScores.method,
      confidence: labScores.confidence,
      guild_scores: scores,
      note: 'Metagenomics commercial platforms (e.g. BeCrop-class) use large reference DBs; wire vendor JSON into lab_microbiome for high confidence',
    },
    systems_analytics: {
      fertility_index,
      disease_suppression_index,
      carbon_biology_index,
    },
    generative_nextgen: {
      plain_summary: `Soil biology fertility index ${fertility_index}/100; disease suppression ${disease_suppression_index}/100. ${findings[0]?.interpretation || 'No critical guild alarm.'}`,
    },
    agronomic_decision: {
      action: findings.some((f) => f.severity === 'high') ? 'MITIGATE_PATHOGEN_PRESSURE' : fertility_index < 45 ? 'BUILD_BIOLOGY_AND_OC' : 'MAINTAIN_AND_MONITOR',
      prescriptions,
    },
  };

  return {
    case_id: randomUUID(),
    engine: 'DeepMicrobiomeAI',
    engine_tier: 'grok-highest',
    competitive_gap_fill: [
      'Functional guild scoring (fixer/PSB/AMF/biocontrol/pathogen)',
      'Fertility + disease-suppression + carbon biology indices',
      'Lab DNA summary ingest OR field proxy mode',
      'Multi-lens AI interpretation',
      'Organic scheme alignment prescriptions',
    ],
    lenses,
    findings,
    indices: { fertility_index, disease_suppression_index, carbon_biology_index },
    guilds_catalogue: FUNCTIONAL_GUILDS,
    disclaimer: MB_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  interpretMicrobiome,
  FUNCTIONAL_GUILDS,
  MB_DISCLAIMER,
};
