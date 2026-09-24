/**
 * Clinical Medical Nutrition Therapy (MNT) protocol library — 10/10 depth
 * Decision-support only. Not a substitute for RD/MD care.
 */

'use strict';

const PROTOCOLS = {
  t2dm: {
    id: 't2dm',
    name: 'Type 2 Diabetes Mellitus',
    icd_hint: 'E11',
    goals: ['glycaemic control', 'weight if indicated', 'CVD risk reduction'],
    energy: 'Individualise; modest deficit if overweight (250–500 kcal/d)',
    carb: 'Consistent CHO pattern; prefer low-GI whole grains; monitor response',
    protein: '0.8–1.0 g/kg unless nephropathy — then per renal protocol',
    fat: 'Limit saturated fat; emphasise MUFA/PUFA; avoid trans',
    fibre_g: '25–40 g/d',
    sodium_mg: '<2300; stricter if HTN',
    key_foods: ['dal', 'millets', 'non-starchy veg', 'curd', 'nuts in portion'],
    avoid_or_limit: ['sugar-sweetened beverages', 'refined sweets', 'large refined-rice loads'],
    monitoring: ['FBG/PPBG or CGM trends', 'HbA1c', 'weight', 'hypoglycaemia if on insulin/SU'],
    drug_food: ['metformin: GI tolerance, B12 long-term', 'SU/insulin: CHO consistency'],
    escalation: 'Uncontrolled sugars, ketones, pregnancy → physician/endocrinology',
    confidence_base: 0.88,
  },
  ckd: {
    id: 'ckd',
    name: 'Chronic Kidney Disease (non-dialysis)',
    icd_hint: 'N18',
    goals: ['slow progression', 'electrolyte safety', 'nutrition status'],
    energy: 'Adequate to prevent PEW; often 25–35 kcal/kg',
    protein: 'Often 0.6–0.8 g/kg under specialist; higher if dialysis — confirm stage',
    potassium: 'Adjust to labs; limit high-K if hyperkalaemia',
    phosphorus: 'Limit processed foods, colas; binder timing if prescribed',
    sodium_mg: 'Often <2000–2300',
    fluid: 'Per residual urine and cardiology advice',
    key_foods: ['controlled portions of dal/egg white as advised', 'low-K veg after leaching if taught'],
    avoid_or_limit: ['excess red meat', 'processed snacks', 'unmonitored herbal products'],
    monitoring: ['eGFR', 'K', 'PO4', 'albumin', 'weight'],
    drug_food: ['ACEI/ARB + K foods', 'phosphate binders with meals'],
    escalation: 'Rapid eGFR drop, hyperK, PEW → nephrology + RD',
    confidence_base: 0.86,
  },
  htn: {
    id: 'htn',
    name: 'Hypertension (DASH-aligned)',
    icd_hint: 'I10',
    goals: ['BP control', 'CVD risk'],
    energy: 'Weight loss if overweight improves BP',
    sodium_mg: 'Ideal <1500–2300 mg/d',
    potassium: 'Food-first K if not on K-sparing issues / CKD',
    dash: true,
    key_foods: ['vegetables', 'fruits', 'low-fat dairy', 'nuts', 'whole grains'],
    avoid_or_limit: ['pickles', 'papad excess', 'processed meats', 'excess alcohol'],
    monitoring: ['home BP log', 'weight'],
    drug_food: ['diuretics: electrolyte awareness'],
    escalation: 'Hypertensive urgency/emergency → medical care',
    confidence_base: 0.87,
  },
  hypothyroidism: {
    id: 'hypothyroidism',
    name: 'Hypothyroidism (stable, treated)',
    icd_hint: 'E03',
    goals: ['support euthyroid state', 'weight management'],
    energy: 'Avoid chronic severe deficit; protein-adequate',
    iodine: 'Adequate iodised salt; avoid megadose seaweed without advice',
    goitrogens: 'Cook crucifers; normal dietary amounts usually fine',
    key_foods: ['adequate protein', 'selenium-rich foods in normal diet'],
    avoid_or_limit: ['soy concentrates with levothyroxine timing issues'],
    monitoring: ['TSH as ordered', 'weight'],
    drug_food: ['levothyroxine: empty stomach; separate from calcium/iron by 4h'],
    escalation: 'Unstable TSH, pregnancy → endocrinology',
    confidence_base: 0.84,
  },
  pcos: {
    id: 'pcos',
    name: 'PCOS metabolic support',
    icd_hint: 'E28.2',
    goals: ['insulin sensitivity', 'cycle support via medical plan', 'body composition'],
    energy: 'Modest deficit if indicated; avoid extreme restriction',
    carb: 'Lower refined CHO; higher fibre; balanced plate',
    protein: 'Adequate at each meal',
    key_foods: ['pulses', 'millets', 'vegetables', 'fermented dairy if tolerated'],
    avoid_or_limit: ['SSBs', 'ultra-processed snacks'],
    monitoring: ['weight/waist', 'cycles with clinician', 'glucose if ordered'],
    drug_food: ['metformin GI tips if prescribed'],
    escalation: 'Fertility goals, severe IR → gynaecology/endocrinology + RD',
    confidence_base: 0.83,
  },
  pregnancy: {
    id: 'pregnancy',
    name: 'Pregnancy nutrition',
    icd_hint: 'Z34',
    goals: ['foetal growth', 'maternal stores', 'GDM prevention/management'],
    energy: 'Trimester-specific; avoid under-eating',
    protein: 'Increased needs — food-first',
    micronutrients: ['folate', 'iron', 'calcium', 'iodine', 'B12 if vegan'],
    key_foods: ['diverse plate', 'dal', 'green veg', 'dairy/alt calcium', 'eggs/fish as safe'],
    avoid_or_limit: ['alcohol', 'high-mercury fish', 'unpasteurised', 'excess caffeine'],
    monitoring: ['weight gain trajectory', 'Hb', 'GDM screen per protocol'],
    drug_food: ['iron with vitamin C food; separate from calcium if tolerated poorly'],
    escalation: 'Hyperemesis, GDM, pre-eclampsia risk → obstetric team',
    confidence_base: 0.9,
  },
  geriatric_sarcopenia: {
    id: 'geriatric_sarcopenia',
    name: 'Geriatric / sarcopenia risk',
    icd_hint: 'M62.84',
    goals: ['preserve muscle', 'prevent under-nutrition', 'hydration'],
    energy: 'Avoid inadvertent low intake',
    protein: 'Often 1.0–1.2 g/kg if appropriate clinically; distribute across meals',
    key_foods: ['dal', 'eggs', 'dairy', 'soft-texture high-protein options'],
    avoid_or_limit: ['prolonged clear-liquid diets without plan'],
    monitoring: ['weight', 'grip/function', 'appetite'],
    drug_food: ['polypharmacy review with clinician'],
    escalation: 'Unintentional weight loss >5% → geriatric/RD',
    confidence_base: 0.85,
  },
};

function listProtocols() {
  return Object.values(PROTOCOLS).map((p) => ({
    id: p.id,
    name: p.name,
    icd_hint: p.icd_hint,
  }));
}

function getProtocol(id) {
  if (!id) return null;
  const key = String(id).toLowerCase().replace(/\s+/g, '_');
  return PROTOCOLS[key] || PROTOCOLS[id] || null;
}

function matchProtocolsFromFlags(flags = [], diagnoses = []) {
  const text = [...flags, ...diagnoses].join(' ').toLowerCase();
  const hits = [];
  if (/diabet|t2dm|sugar/.test(text)) hits.push(PROTOCOLS.t2dm);
  if (/ckd|kidney|renal|nephro/.test(text)) hits.push(PROTOCOLS.ckd);
  if (/hypertens|bp\b|blood pressure/.test(text)) hits.push(PROTOCOLS.htn);
  if (/thyroid|hypothyroid/.test(text)) hits.push(PROTOCOLS.hypothyroidism);
  if (/pcos|polycystic/.test(text)) hits.push(PROTOCOLS.pcos);
  if (/pregnan|antenatal|gdm/.test(text)) hits.push(PROTOCOLS.pregnancy);
  if (/geriatr|elderly|sarcopen|frail/.test(text)) hits.push(PROTOCOLS.geriatric_sarcopenia);
  return hits;
}

module.exports = {
  PROTOCOLS,
  listProtocols,
  getProtocol,
  matchProtocolsFromFlags,
};
