/**
 * Biochar — soil benefits + charging (activation/inoculation) methods
 * Decision-support for AFRERA agro module. Not a product endorsement.
 */

const { randomUUID } = require('crypto');

const BIOCHAR_DISCLAIMER =
  'Biochar guidance is educational. Results depend on feedstock, pyrolysis, rate, and soil. Charging reduces short-term nutrient tie-up but does not replace soil tests or extension advice. For certified organic systems, confirm allowed inputs with NPOP/PGS/CB.';

const BENEFITS = {
  physical: [
    { id: 'bulk_density', effect: 'Often decreases bulk density', strength: 'moderate_to_strong_on_degraded_sandy' },
    { id: 'porosity_whc', effect: 'Increases porosity and water-holding capacity', strength: 'stronger_on_coarse_soils' },
    { id: 'aggregation', effect: 'Can improve macro-aggregates (feedstock/temp dependent)', strength: 'variable' },
  ],
  chemical: [
    { id: 'soc', effect: 'Raises soil organic carbon via stable aromatic C', strength: 'strong_long_term' },
    { id: 'ph_liming', effect: 'Often raises pH (useful on acid soils)', strength: 'strong_on_acidic' },
    { id: 'cec_nutrients', effect: 'Improves nutrient retention (NH4, K, Ca, Mg)', strength: 'moderate' },
  ],
  biological: [
    { id: 'microbial_habitat', effect: 'Pore habitat for microbes; synergy with compost/inoculants', strength: 'moderate' },
    { id: 'pathogen_context', effect: 'Not a standalone disease cure; support IPM and biology', strength: 'contextual' },
  ],
  agronomic: [
    { id: 'yield', effect: 'Meta-analyses often ~7–15% average gains; larger on low-fertility/acid soils; weak on fertile soils', strength: 'site_specific' },
    { id: 'ghg', effect: 'Often reduces N2O; CH4 mixed (esp. flooded rice)', strength: 'variable' },
  ],
  when_weak: [
    'Already fertile, well-aggregated soils (little physical response)',
    'Single low-quality application without charging',
    'Excessive rates (>20 t/ha in some studies) without need',
  ],
};

const INDIA_FEEDSTOCKS = [
  { id: 'rice_husk', notes: 'Common; often high Si/K; alkaline' },
  { id: 'wheat_straw', notes: 'Residue alternative to burning' },
  { id: 'maize_stover', notes: 'Widely available in maize belts' },
  { id: 'sugarcane_bagasse', notes: 'High C potential' },
  { id: 'cotton_stalk', notes: 'Useful in cotton belts / Vertisols trials' },
];

const CHARGING_METHODS = [
  {
    id: 'compost_mix',
    name: 'Compost mix / co-compost',
    time: '2–12+ weeks',
    loads: ['nutrients', 'microbes'],
    steps: [
      'Crush biochar to ~1–5 mm if coarse',
      'Moisten biochar',
      'Mix ~1 part biochar : 3–4 parts finished compost (or 5–15% biochar in active compost pile)',
      'Keep moist; turn weekly',
      'Rest minimum 2–4 weeks; 6–12 weeks preferred',
    ],
    best_for: 'Best overall quality; gardens and farms',
    rank: 1,
  },
  {
    id: 'compost_tea_soak',
    name: 'Compost tea / worm tea soak',
    time: '24–72 hours',
    loads: ['microbes', 'some_nutrients'],
    steps: [
      'Prepare aerated compost or worm tea (optional molasses)',
      'Submerge biochar 24–48 h (up to 72 h)',
      'Drain and apply moist',
    ],
    best_for: 'Fast biological charge',
    rank: 2,
  },
  {
    id: 'liquid_fertilizer_soak',
    name: 'Liquid fertilizer soak',
    time: '12–72 hours',
    loads: ['nutrients'],
    steps: [
      'Dilute liquid feed (~half strength common)',
      'Cover biochar fully',
      'Soak 24–72 h; stir occasionally',
      'Drain excess optional',
    ],
    best_for: 'Quick nutrient charge; fewer microbes unless combined',
    rank: 3,
  },
  {
    id: 'manure_slurry',
    name: 'Manure slurry',
    time: '2–14 days',
    loads: ['nutrients', 'microbes'],
    steps: [
      'Mix biochar with diluted manure slurry',
      'Rest days to two weeks',
      'Use only well-managed manure; food-crop hygiene awareness',
    ],
    best_for: 'Livestock farms',
    rank: 4,
  },
  {
    id: 'dilute_urine',
    name: 'Dilute urine charge',
    time: '~1 week',
    loads: ['nitrogen'],
    steps: [
      'Dilute urine ~1:4 to 1:10 with water',
      'Soak about one week',
      'Observe hygiene and local norms',
    ],
    best_for: 'Homestead N charge (optional)',
    rank: 5,
  },
  {
    id: 'animal_bedding_then_compost',
    name: 'Animal bedding then compost',
    time: 'weeks–months',
    loads: ['nutrients', 'microbes'],
    steps: [
      'Thin layer of biochar in livestock bedding',
      'Compost spent bedding',
      'Apply charged compost-biochar mix',
    ],
    best_for: 'Double charge on mixed farms',
    rank: 2,
  },
  {
    id: 'microbial_inoculant_carrier',
    name: 'Registered microbial inoculant carrier',
    time: 'hours–days',
    loads: ['selected_microbes'],
    steps: [
      'Dissolve registered inoculant per label',
      'Soak or coat biochar',
      'Apply promptly as carrier for survival in soil',
    ],
    best_for: 'Targeted biofertilizer strategies',
    rank: 3,
  },
  {
    id: 'in_soil_weathering',
    name: 'In-soil weathering before planting',
    time: '3–6 months',
    loads: ['soil_equilibrium'],
    steps: [
      'Incorporate biochar into soil',
      'Wait a season before sensitive planting if uncharged',
      'Prefer charging instead when possible',
    ],
    best_for: 'Fallback if charging materials unavailable',
    rank: 6,
  },
];

function recommendCharging(input = {}) {
  const urgency = String(input.urgency || 'normal').toLowerCase();
  const hasCompost = input.has_compost !== false;
  const hasLivestock = !!input.has_livestock;
  const organic = input.farming_mode === 'organic' || input.organic;

  if (urgency === 'fast' || urgency === 'urgent') {
    return {
      primary: 'compost_tea_soak',
      secondary: ['liquid_fertilizer_soak'],
      rationale: 'Short timeline — liquid biological or nutrient soak',
    };
  }
  if (hasLivestock) {
    return {
      primary: 'animal_bedding_then_compost',
      secondary: ['manure_slurry', 'compost_mix'],
      rationale: 'Livestock path enables double charge',
    };
  }
  if (hasCompost) {
    return {
      primary: 'compost_mix',
      secondary: ['compost_tea_soak'],
      rationale: 'Compost mix is the most robust nutrient + microbe charge',
    };
  }
  return {
    primary: 'liquid_fertilizer_soak',
    secondary: organic ? ['compost_tea_soak'] : ['in_soil_weathering'],
    rationale: 'Limited materials — liquid charge or wait in soil',
  };
}

function assessSuitability(input = {}) {
  const soil = String(input.soil_type || input.soil?.type || '').toLowerCase();
  const ph = Number(input.ph ?? input.soil?.ph);
  const fertile = !!input.already_fertile;
  const notes = [];
  let score = 60;

  if (fertile) {
    score -= 25;
    notes.push('Fertile stable soils often show small agronomic response');
  }
  if (soil.includes('sand') || soil.includes('degrad') || soil.includes('acid')) {
    score += 20;
    notes.push('Coarse/degraded/acid contexts usually benefit more');
  }
  if (ph > 0 && ph < 6) {
    score += 10;
    notes.push('Acid pH: liming effect of many biochars is useful');
  }
  if (ph >= 8) {
    score -= 10;
    notes.push('Alkaline soils: liming benefit limited; focus on structure/C if needed');
  }
  if (input.goal === 'carbon' || input.goal === 'soc') {
    score += 15;
    notes.push('Carbon sequestration goal aligns well with stable biochar C');
  }

  score = Math.max(10, Math.min(95, score));
  return {
    suitability_score: score,
    band: score >= 70 ? 'favourable' : score >= 45 ? 'moderate' : 'limited_expectation',
    notes,
  };
}

function runBiocharConference(input = {}) {
  const charging = recommendCharging(input);
  const suitability = assessSuitability(input);
  const primaryMethod = CHARGING_METHODS.find((m) => m.id === charging.primary);

  return {
    case_id: randomUUID(),
    engine: 'BiocharEngine',
    engine_tier: 'grok-highest',
    benefits: BENEFITS,
    india_feedstocks: INDIA_FEEDSTOCKS,
    charging_methods: CHARGING_METHODS,
    recommendation: {
      charging,
      primary_method_detail: primaryMethod,
      suitability,
      why_charge:
        'Uncharged biochar can temporarily immobilise soluble nutrients (especially N). Charging fills pores with nutrients and/or microbes first.',
    },
    application_hints: {
      field_t_ha_typical: 'Often 2–10 t/ha in trials; site-specific',
      garden_volume: 'Charged material mixed in topsoil; containers sometimes 10–20% by volume',
      timing: 'Pre-sowing incorporation preferred',
      with_nutrients: 'Often best with compost/FYM or balanced fertility — not a full fertilizer alone',
    },
    organic_cert_note:
      'Only use feedstocks/processes allowed under your NPOP/PGS scheme; ask CB if unsure',
    panel_summary: `Biochar suitability ${suitability.band} (${suitability.score}). Charge via ${charging.primary}: ${charging.rationale}`,
    disclaimer: BIOCHAR_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  runBiocharConference,
  recommendCharging,
  assessSuitability,
  BENEFITS,
  CHARGING_METHODS,
  INDIA_FEEDSTOCKS,
  BIOCHAR_DISCLAIMER,
};
