/**
 * Rituraj Doctor · Master Chef · Nutrition Calculator Engine
 *
 * Benchmarked against (and designed to exceed) the Veterinary Specialist Panel:
 * multi-seat conference, evidence grades, geo-local foods, seasonal (Ritu) care,
 * natural therapy, clinical nutrient targets, and culinary meal composition.
 *
 * Decision-support only — not a medical prescription or licence to practise.
 */

const { randomUUID } = require('crypto');

let NUTRITION_WELLNESS_DISCLAIMER =
  'Wellness and nutrition guidance is educational decision-support only. It is not a diagnosis, prescription, or substitute for care by a licensed physician, registered dietitian, or qualified clinical professional. Seek urgent medical care for severe symptoms.';
try {
  ({ NUTRITION_WELLNESS_DISCLAIMER } = require('../../utils/disclaimers'));
} catch (_) {
  /* fallback string above */
}

const ACTIVITY = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Indian Ritu calendar (approx. Gregorian mapping) */
const RITUS = [
  { id: 'shishira', name: 'Shishira (late winter)', months: [1, 2], agni: 'moderate', rasa_prefer: ['madhura', 'amla', 'lavana'], avoid_hint: 'excess cold raw foods', foods: ['sesame', 'jaggery', 'wheat', 'urad', 'ginger', 'ghee'] },
  { id: 'vasanta', name: 'Vasanta (spring)', months: [3, 4], agni: 'variable', rasa_prefer: ['katu', 'tikta', 'kashaya'], avoid_hint: 'heavy sweet oily excess', foods: ['barley', 'honey', 'bitter greens', 'moong', 'turmeric'] },
  { id: 'grishma', name: 'Grishma (summer)', months: [5, 6], agni: 'low', rasa_prefer: ['madhura', 'sheetala'], avoid_hint: 'excess heat spices alcohol', foods: ['rice', 'milk', 'coconut', 'cucumber', 'melon', 'buttermilk', 'mint'] },
  { id: 'varsha', name: 'Varsha (monsoon)', months: [7, 8], agni: 'weak', rasa_prefer: ['madhura', 'amla', 'lavana'], avoid_hint: 'raw salads heavy fermented excess', foods: ['old rice', 'ginger', 'moong soup', 'light khichdi', 'ajwain', 'warm soups'] },
  { id: 'sharad', name: 'Sharad (autumn)', months: [9, 10], agni: 'strong', rasa_prefer: ['madhura', 'tikta', 'kashaya'], avoid_hint: 'excess pitta (chili, oil, sour)', foods: ['rice', 'wheat', 'ghee moderate', 'sweet fruits', 'bitter gourd', 'amla'] },
  { id: 'hemanta', name: 'Hemanta (early winter)', months: [11, 12], agni: 'strong', rasa_prefer: ['madhura', 'amla', 'lavana'], avoid_hint: 'excess cold drinks', foods: ['wheat', 'jaggery', 'sesame', 'nuts', 'ghee', 'root vegetables'] },
];

const GOAL_CALORIE_DELTA = {
  lose: -500,
  maintain: 0,
  gain: 400,
  recomposition: -200,
  pregnancy: 300,
  lactation: 450,
  athletic: 300,
};

function currentRitu(date = new Date()) {
  const m = date.getMonth() + 1;
  return RITUS.find((r) => r.months.includes(m)) || RITUS[0];
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Mifflin–St Jeor BMR */
function bmrMifflin({ sex, weight_kg, height_cm, age_years }) {
  const w = Number(weight_kg);
  const h = Number(height_cm);
  const a = Number(age_years);
  if (!(w > 0 && h > 0 && a > 0)) return null;
  const s = String(sex || '').toLowerCase();
  if (s === 'female' || s === 'f') return 10 * w + 6.25 * h - 5 * a - 161;
  return 10 * w + 6.25 * h - 5 * a + 5;
}

function tdee(bmr, activity_level) {
  if (bmr == null) return null;
  const f = ACTIVITY[String(activity_level || 'moderate').toLowerCase()] || ACTIVITY.moderate;
  return Math.round(bmr * f);
}

function macroSplit(goal, calories) {
  const g = String(goal || 'maintain').toLowerCase();
  let p = 0.25;
  let c = 0.45;
  let f = 0.3;
  if (g === 'lose' || g === 'recomposition') {
    p = 0.3;
    c = 0.4;
    f = 0.3;
  } else if (g === 'gain' || g === 'athletic') {
    p = 0.25;
    c = 0.5;
    f = 0.25;
  } else if (g === 'pregnancy' || g === 'lactation') {
    p = 0.2;
    c = 0.5;
    f = 0.3;
  }
  const protein_g = Math.round((calories * p) / 4);
  const carb_g = Math.round((calories * c) / 4);
  const fat_g = Math.round((calories * f) / 9);
  return {
    protein_pct: p,
    carb_pct: c,
    fat_pct: f,
    protein_g,
    carb_g,
    fat_g,
    calories,
  };
}

/** Illustrative micronutrient floors (adult) — clinical override always wins */
function microTargets({ sex, age_years, goal }) {
  const female = ['female', 'f'].includes(String(sex || '').toLowerCase());
  const pregnant = String(goal || '').toLowerCase() === 'pregnancy';
  const lactating = String(goal || '').toLowerCase() === 'lactation';
  return {
    iron_mg: pregnant ? 27 : female ? 18 : 8,
    calcium_mg: age_years >= 50 ? 1200 : 1000,
    vitamin_d_iu: 600,
    vitamin_b12_mcg: 2.4,
    folate_mcg: pregnant ? 600 : 400,
    iodine_mcg: pregnant || lactating ? 220 : 150,
    zinc_mg: female ? 8 : 11,
    fiber_g: 25,
    water_ml: 2500,
    note: 'Illustrative adult targets; pediatric/geriatric/disease-state need clinician adjustment',
  };
}

function bmi(weight_kg, height_cm) {
  const h = Number(height_cm) / 100;
  if (!(h > 0 && weight_kg > 0)) return null;
  const v = weight_kg / (h * h);
  let band = 'healthy';
  if (v < 18.5) band = 'underweight';
  else if (v >= 25 && v < 30) band = 'overweight';
  else if (v >= 30) band = 'obesity_range';
  return { value: Math.round(v * 10) / 10, band };
}

/** Master nutrition calculator */
function calculateNutrition(profile = {}) {
  // Accept the natural-language field names a real caller is likely to send
  // (age/weight/height) as fallbacks for the canonical *_years/_kg/_cm names.
  // Previously an unrecognized name (e.g. `weight` instead of `weight_kg`)
  // silently produced every downstream field as null with no error —
  // exactly the "confident but false" gap the evidence standard exists to
  // catch, except here the bug was upstream of provenance ever seeing it.
  const {
    sex,
    age_years = profile.age,
    weight_kg = profile.weight,
    height_cm = profile.height,
    activity_level = 'moderate',
    goal = 'maintain',
  } = profile;

  const bmr = bmrMifflin({ sex, weight_kg, height_cm, age_years });
  const baseTdee = tdee(bmr, activity_level);
  const delta = GOAL_CALORIE_DELTA[String(goal).toLowerCase()] ?? 0;
  const target_calories = baseTdee != null ? clamp(Math.round(baseTdee + delta), 1200, 5000) : null;
  const macros = target_calories != null ? macroSplit(goal, target_calories) : null;
  const micros = microTargets({ sex, age_years, goal });
  const body = bmi(weight_kg, height_cm);

  return {
    calculator: 'rituraj_mifflin_st_jeor_v1',
    bmr_kcal: bmr != null ? Math.round(bmr) : null,
    tdee_kcal: baseTdee,
    goal,
    goal_calorie_delta: delta,
    target_calories,
    macros,
    micros,
    bmi: body,
    activity_level,
    methodology:
      'Mifflin–St Jeor BMR × activity factor; goal delta applied; macros goal-aware. Not for eating disorders without clinical supervision.',
  };
}

// --- Regional food intelligence (India) ---
const GEO_FOODS = [
  {
    id: 'north_wheat_dairy',
    states: ['punjab', 'haryana', 'delhi', 'uttar pradesh', 'up', 'rajasthan', 'himachal'],
    staples: ['wheat roti', 'dairy', 'mustard greens', 'pulses'],
    chef_notes: 'Balance refined flour with millets; watch saturated fat from excess ghee/cream',
  },
  {
    id: 'rice_coastal_south',
    states: ['tamil nadu', 'tn', 'kerala', 'kl', 'andhra', 'ap', 'telangana', 'ts', 'karnataka', 'ka', 'goa'],
    staples: ['rice', 'coconut', 'fish coastal', 'fermented batters', 'sambar vegetables'],
    chef_notes: 'Pair polished rice with protein + fibre; coconut oil portion control',
  },
  {
    id: 'east_rice_fish',
    states: ['west bengal', 'wb', 'odisha', 'or', 'assam', 'as', 'bihar'],
    staples: ['rice', 'fish', 'mustard', 'leafy greens'],
    chef_notes: 'Omega-3 opportunity from small fish; temper mustard oil heat for pitta seasons',
  },
  {
    id: 'west_millet_legume',
    states: ['gujarat', 'gj', 'maharashtra', 'mh', 'rajasthan', 'rj'],
    staples: ['millets', 'groundnut', 'legumes', 'buttermilk'],
    chef_notes: 'Excellent complex carb base; watch deep-fried farsan frequency',
  },
  {
    id: 'northeast_fermented',
    states: ['nagaland', 'nl', 'manipur', 'mn', 'meghalaya', 'ml', 'mizoram', 'mz', 'sikkim', 'sk'],
    staples: ['rice', 'fermented bamboo/soy', 'leafy forages', 'pork regional'],
    chef_notes: 'Fermented foods support diversity; balance sodium and smoke-cured excess',
  },
];

function matchGeoFoods(location = {}) {
  const state = String(location.state || '').toLowerCase();
  return GEO_FOODS.filter((g) => g.states.some((s) => state.includes(s) || s.includes(state)));
}

// --- Natural therapy catalogue (evidence-graded) ---
const NATURAL_THERAPIES = [
  {
    id: 'hydration_protocol',
    name: 'Structured hydration',
    evidence_level: 'strong',
    uses: ['general wellness', 'heat', 'constipation mild'],
    cautions: ['fluid restriction disease states need clinician'],
  },
  {
    id: 'fibre_vegetables',
    name: 'Vegetable and legume fibre pattern',
    evidence_level: 'strong',
    uses: ['glycemic support', 'satiety', 'gut regularity'],
    cautions: ['IBS may need FODMAP clinician path'],
  },
  {
    id: 'sleep_meal_timing',
    name: 'Meal timing + sleep hygiene',
    evidence_level: 'moderate',
    uses: ['metabolic health', 'weight goals'],
    cautions: ['shift workers need individual plan'],
  },
  {
    id: 'turmeric_blackpepper',
    name: 'Haldi–kali mirch culinary use',
    evidence_level: 'limited',
    uses: ['traditional anti-inflammatory culinary'],
    cautions: ['not drug substitute', 'gallbladder disease caution'],
  },
  {
    id: 'jeera_ajwain_digestive',
    name: 'Jeera / ajwain digestive culinary',
    evidence_level: 'traditional_only',
    uses: ['meal-related bloating folklore'],
    cautions: ['persistent GI symptoms need medical evaluation'],
  },
  {
    id: 'buttermilk_probiotic_folk',
    name: 'Chaas / moru traditional cultured dairy',
    evidence_level: 'moderate',
    uses: ['digestive comfort', 'summer cooling'],
    cautions: ['lactose intolerance', 'hygiene of preparation'],
  },
  {
    id: 'millet_swap',
    name: 'Millet substitution for refined grain',
    evidence_level: 'moderate',
    uses: ['glycemic diversity', 'mineral density'],
    cautions: ['thyroid–goitrogen myth often overstated; balance diet'],
  },
  {
    id: 'meditation_meal',
    name: 'Mindful eating practice',
    evidence_level: 'moderate',
    uses: ['over-eating patterns', 'stress eating'],
    cautions: ['eating disorders — specialist care only'],
  },
];

function naturalTherapySeat(profile, conditions = []) {
  const tags = (conditions || []).map((c) => String(c).toLowerCase());
  return NATURAL_THERAPIES.filter((t) => {
    if (tags.some((x) => /diabetes|glycemic|sugar/.test(x)) && t.id === 'fibre_vegetables') return true;
    if (tags.some((x) => /heat|summer/.test(x)) && t.id === 'buttermilk_probiotic_folk') return true;
    if (tags.some((x) => /digest|bloat/.test(x)) && /jeera|buttermilk/.test(t.id)) return true;
    return ['hydration_protocol', 'sleep_meal_timing', 'mindful', 'millet_swap'].some((k) => t.id.includes(k.split('_')[0]) || t.id === k);
  }).slice(0, 6);
}

// --- Master Chef plate builder ---
function masterChefPlate({ calories, macros, ritu, geo, cuisine_pref }) {
  if (!calories || !macros) {
    return { meals: [], note: 'Insufficient calculator inputs for plate design' };
  }
  const perMeal = Math.round(calories / 3);
  const staples = geo[0]?.staples || ['roti/rice', 'dal', 'seasonal vegetable', 'curd'];
  const rituFoods = (ritu && ritu.foods) || [];
  const meals = ['breakfast', 'lunch', 'dinner'].map((slot, i) => ({
    slot,
    target_kcal: perMeal + (i === 1 ? 50 : 0),
    structure: {
      carbohydrate: staples[0] || 'whole grain',
      protein: staples.find((s) => /dal|fish|dairy|legume|pulse|egg|paneer|meat/i.test(s)) || 'dal / curd / egg',
      vegetables: '½ plate seasonal vegetables / salad as tolerated',
      fat: 'measured ghee/oil + seeds/nuts small',
    },
    ritu_accent: rituFoods.slice(0, 3),
    chef_technique:
      i === 0
        ? 'Cook once: soak millets/dals overnight; temper spices in minimal oil'
        : i === 1
          ? 'One-pot khichdi or thali balance: grain + pulse + sabzi + fermented'
          : 'Lighter dinner; finish cooking 2–3h before sleep when possible',
    cuisine_pref: cuisine_pref || 'regional_indian',
  }));
  return {
    meals,
    plating_rule: '½ vegetables · ¼ protein · ¼ whole grain (visual plate method)',
    chef_philosophy: 'Master Chef seat: flavour from spices and technique, not excess fat/sugar; respect seasonal produce',
    geo_chef_notes: geo.map((g) => g.chef_notes),
  };
}

function clinicalFlags(profile = {}) {
  const flags = [];
  const cond = (profile.conditions || []).map((c) => String(c).toLowerCase());
  if (cond.some((c) => /diabetes|t2dm|sugar/.test(c))) {
    flags.push({ id: 'glycemic', severity: 'clinical', note: 'Coordinate carbohydrate distribution with treating clinician; monitor glucose' });
  }
  if (cond.some((c) => /ckd|kidney|renal/.test(c))) {
    flags.push({ id: 'renal', severity: 'clinical', note: 'Protein/potassium/phosphorus need renal dietitian — do not auto-high-protein' });
  }
  if (cond.some((c) => /pregnant|pregnancy/.test(c)) || profile.goal === 'pregnancy') {
    flags.push({ id: 'pregnancy', severity: 'clinical', note: 'Prenatal vitamins and food-safety (listeria) under obstetric guidance' });
  }
  if (cond.some((c) => /eating disorder|anorexia|bulimia/.test(c))) {
    flags.push({ id: 'ed', severity: 'urgent', note: 'Calculator calorie deficits contraindicated without specialist ED team' });
  }
  if (profile.bmi?.band === 'underweight') {
    flags.push({ id: 'underweight', severity: 'clinical', note: 'Avoid aggressive deficit; assess medical causes' });
  }
  return flags;
}

/**
 * Multi-specialist nutrition conference (Doctor · Nutritionist · Ritu · Natural · Chef · Geo)
 */
function runNutritionConference(input = {}) {
  const profile = input.profile || input;
  const location = input.location || profile.location || {};
  const calc = calculateNutrition(profile);
  const ritu = currentRitu(input.as_of ? new Date(input.as_of) : new Date());
  const geo = matchGeoFoods(location);
  const natural = naturalTherapySeat(profile, profile.conditions);
  const flags = clinicalFlags({ ...profile, bmi: calc.bmi });
  const chef = masterChefPlate({
    calories: calc.target_calories,
    macros: calc.macros,
    ritu,
    geo,
    cuisine_pref: profile.cuisine_pref,
  });

  const seats = {
    chair_rituraj_doctor: {
      seat: 'Rituraj Doctor (Integrative Nutrition Chair)',
      summary: `Season ${ritu.name}; agni ${ritu.agni}; goal ${profile.goal || 'maintain'}. Clinical flags: ${flags.length}`,
      ritu,
    },
    clinical_nutritionist: {
      seat: 'Clinical Nutritionist',
      calculator: calc,
      flags,
      notes: flags.length
        ? 'Clinical conditions present — align with treating clinician before aggressive targets'
        : 'No high-severity clinical flags from intake; still not a prescription',
    },
    dietitian_macros: {
      seat: 'Dietitian — Macro/Micro Targets',
      macros: calc.macros,
      micros: calc.micros,
    },
    ritu_ayurveda_seasonal: {
      seat: 'Ritu / Seasonal Wisdom',
      current: ritu,
      guidance: `Prefer rasas: ${(ritu.rasa_prefer || []).join(', ')}; mind: ${ritu.avoid_hint}`,
      seasonal_foods: ritu.foods,
    },
    natural_therapy: {
      seat: 'Natural Therapy',
      practices: natural,
      policy: 'Evidence-graded; traditional_only never replaces medical therapy',
    },
    master_chef: {
      seat: 'Master Chef — Culinary Composition',
      plate: chef,
    },
    geo_local_foods: {
      seat: 'Geo-Local Food Systems',
      matched: geo,
      match_quality: geo.length ? 'regional' : 'national_generic',
    },
  };

  const panel_summary = [
    `Rituraj conference: ${ritu.name}.`,
    calc.target_calories != null ? `Target ~${calc.target_calories} kcal; P/C/F ${calc.macros?.protein_g}/${calc.macros?.carb_g}/${calc.macros?.fat_g} g.` : 'Incomplete anthropometrics for calorie target.',
    flags.length ? `Clinical flags: ${flags.map((f) => f.id).join(', ')}.` : 'No critical clinical flags from intake.',
    geo.length ? `Geo foods: ${geo.map((g) => g.id).join(', ')}.` : 'No state match — general Indian pattern.',
    'Not a medical prescription.',
  ].join(' ');

  return {
    case_id: randomUUID(),
    engine: 'RiturajNutritionEngine',
    engine_tier: 'grok-highest',
    specialist_seats: seats,
    calculator: calc,
    ritu,
    natural_therapies: natural,
    master_chef_plan: chef,
    geo_foods: geo,
    clinical_flags: flags,
    panel_summary,
    disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
    provenance: {
      rules_fired: ['mifflin_st_jeor', 'goal_delta', 'ritu_calendar', 'geo_foods', 'natural_evidence_grade', 'chef_plate', 'clinical_flags'],
      benchmark: 'veterinary_specialist_panel_parity_or_higher',
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  calculateNutrition,
  runNutritionConference,
  currentRitu,
  matchGeoFoods,
  masterChefPlate,
  RITUS,
  NATURAL_THERAPIES,
  ACTIVITY,
  GEO_FOODS,
};
