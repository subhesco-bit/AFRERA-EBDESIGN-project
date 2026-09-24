/**
 * Soil condition + microbiome + organic/inorganic integration
 */

const { randomUUID } = require('crypto');

const SOIL_DISCLAIMER =
  'Soil and microbiome guidance is educational. Soil laboratory tests override generic advice. Biofertilizer quality varies — use registered products. Chemical fertilizer/pesticide: label and soil-test based only.';

const SOIL_TYPES_INDIA = [
  { id: 'alluvial', regions: ['indo_gangetic', 'coastal_deltas'], traits: ['fertile', 'variable_texture'], management: ['watch Zn S deficiency', 'organic carbon rebuild'] },
  { id: 'black_vertisol', regions: ['deccan', 'mh', 'mp', 'gj'], traits: ['high_clay', 'shrink_swell', 'moisture_retentive'], management: ['timely tillage', 'drainage in low spots', 'cotton_soy friendly'] },
  { id: 'red_laterite', regions: ['south', 'east', 'western_ghats'], traits: ['acidic_tendency', 'P_fixation', 'erosion'], management: ['lime if acid', 'organic matter', 'terracing slopes'] },
  { id: 'desert_sandy', regions: ['rajasthan', 'gujarat_arid'], traits: ['low_OC', 'low_water'], management: ['mulch', 'windbreaks', 'frequent light irrigation'] },
  { id: 'mountain', regions: ['himalaya', 'ne_hills'], traits: ['shallow', 'erosion', 'acid pockets'], management: ['terrace', 'cover crops', 'avoid overgraze'] },
];

const MICROBIOME_PRACTICES = [
  { id: 'rhizobium', crops: ['pulses'], role: 'N fixation', organic: true, note: 'Seed inoculant registered strains' },
  { id: 'azotobacter_azospirillum', crops: ['cereals', 'vegetables'], role: 'N associative', organic: true, note: 'Supplement not full N replacement' },
  { id: 'psb', crops: ['*'], role: 'P solubilisation', organic: true, note: 'With rock phosphate systems' },
  { id: 'mycorrhiza_amf', crops: ['vegetables', 'fruits', 'spices'], role: 'P and water uptake', organic: true, note: 'Avoid unnecessary fungicide drench early' },
  { id: 'trichoderma', crops: ['nursery', 'vegetables'], role: 'Disease suppression', organic: true, note: 'Quality culture critical' },
  { id: 'pseudomonas_fluorescens', crops: ['vegetables', 'paddy'], role: 'Biocontrol', organic: true, note: 'Registered formulations' },
  { id: 'compost_tea_careful', crops: ['garden'], role: 'Microbial diversity folklore+practice', organic: true, note: 'Hygiene; not for systemic disease alone' },
  { id: 'reduce_unnecessary_broad_biocide', crops: ['*'], role: 'Protect non-target soil life', organic: true, note: 'IPM first' },
];

const ORGANIC_TOOLKIT = [
  { id: 'fym_compost', name: 'FYM / compost', use: 'OC and slow nutrients' },
  { id: 'vermicompost', name: 'Vermicompost', use: 'Garden and high-value' },
  { id: 'green_manure', name: 'Green manure / dhaincha', use: 'Kharif before cereal' },
  { id: 'neem_cake', name: 'Neem cake', use: 'Organic N + nematode adjunct' },
  { id: 'mulch', name: 'Organic mulch', use: 'Moisture and soil life' },
  { id: 'biofertilizer', name: 'Registered biofertilizers', use: 'Inoculants' },
  { id: 'botanical_ipm', name: 'Neem and botanicals label', use: 'Soft IPM' },
];

const INORGANIC_TOOLKIT = [
  { id: 'soil_test_npk', name: 'Soil-test based NPK', use: 'Primary productivity' },
  { id: 'urea_split', name: 'Split N application', use: 'Reduce loss' },
  { id: 'dap_map', name: 'DAP/MAP starter P', use: 'As per test' },
  { id: 'mop', name: 'MOP / SOP K', use: 'As per test; SOP for Cl-sensitive' },
  { id: 'micronutrient', name: 'Zn Fe B as deficient', use: 'Only if deficient' },
  { id: 'fertigation', name: 'Fertigation EC/pH control', use: 'Protected culture' },
];

function analyzeSoil(input = {}) {
  const typeHint = String(input.soil_type || input.soil?.type || '').toLowerCase();
  const matched = SOIL_TYPES_INDIA.filter(
    (s) => typeHint.includes(s.id) || s.regions.some((r) => String(input.location?.state || '').toLowerCase().includes(r)),
  );
  const ph = input.soil?.ph ?? input.ph;
  const oc = input.soil?.organic_carbon_pct ?? input.oc;
  const findings = [];
  if (ph != null) {
    if (ph < 5.5) findings.push({ issue: 'acidic', action: 'Consider liming after lab advice; prefer acid-tolerant crops interim' });
    if (ph > 8.2) findings.push({ issue: 'alkaline', action: 'Organic matter; gypsum only if sodic confirmed by lab' });
  }
  if (oc != null && oc < 0.5) findings.push({ issue: 'low_OC', action: 'Compost/FYM/green manure priority' });
  if (!input.soil?.tested) findings.push({ issue: 'no_lab', action: 'Soil test before heavy fertilizer spend' });

  const mode = String(input.farming_mode || 'integrated').toLowerCase();
  const organic = mode === 'organic' || mode === 'natural';
  const inorganic = mode === 'inorganic' || mode === 'conventional';
  const integrated = !organic && !inorganic;

  return {
    case_id: randomUUID(),
    engine: 'SoilMicrobiomeEngine',
    soil_types_matched: matched.length ? matched : SOIL_TYPES_INDIA.slice(0, 1),
    findings,
    microbiome: {
      practices: MICROBIOME_PRACTICES,
      priority: organic || integrated
        ? ['Maintain OC', 'Use registered inoculants where crop fits', 'Avoid unnecessary broad biocides']
        : ['Still preserve OC', 'Inoculants optional adjunct to fertilizer'],
    },
    nutrition_path: {
      mode: organic ? 'organic' : inorganic ? 'inorganic' : 'integrated',
      organic_tools: ORGANIC_TOOLKIT,
      inorganic_tools: INORGANIC_TOOLKIT,
      recommendation: organic
        ? 'Build fertility with organic toolkit + biofertilizers; expect gradual yield transition'
        : inorganic
          ? 'Soil-test NPK + micronutrients; still return residue/OC'
          : 'Integrated: soil-test minerals + continuous organic carbon and microbiome care',
    },
    water_link: {
      note: 'Soil texture drives irrigation frequency — sandy light frequent; clay less frequent deeper',
      avoid: 'Waterlogging kills aerobic microbiome',
    },
    disclaimer: SOIL_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  analyzeSoil,
  SOIL_TYPES_INDIA,
  MICROBIOME_PRACTICES,
  ORGANIC_TOOLKIT,
  INORGANIC_TOOLKIT,
  SOIL_DISCLAIMER,
};
