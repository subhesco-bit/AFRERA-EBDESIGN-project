/**
 * Nutrient calculator + dietitian advisory + veterinary RTC-style panel
 * Integrated hub for pages (SPA can call single surface)
 */

'use strict';

const cartoon = require('./prescriptionCartoonExplainer');

/** Simple nutrient totals from food entries */
function nutrientCalculate(foods = []) {
  // Reference approx per 100g / common units — seed table
  const DB = {
    rice_cooked: { kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4 },
    roti: { kcal: 120, protein_g: 3.1, carbs_g: 18, fat_g: 3.7, fiber_g: 2 },
    dal: { kcal: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4, fiber_g: 8 },
    milk: { kcal: 61, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.3, fiber_g: 0 },
    egg: { kcal: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11, fiber_g: 0 },
    banana: { kcal: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6 },
    spinach: { kcal: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, fiber_g: 2.2 },
    chicken: { kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0 },
  };
  const totals = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  const lines = [];
  for (const f of foods) {
    const key = (f.id || f.name || '').toLowerCase().replace(/\s+/g, '_');
    const ref = DB[key] || DB[f.id] || {
      kcal: Number(f.kcal) || 0,
      protein_g: Number(f.protein_g) || 0,
      carbs_g: Number(f.carbs_g) || 0,
      fat_g: Number(f.fat_g) || 0,
      fiber_g: Number(f.fiber_g) || 0,
    };
    const mult = (Number(f.grams) || 100) / 100;
    const row = {
      name: f.name || key,
      grams: Number(f.grams) || 100,
      kcal: Math.round(ref.kcal * mult),
      protein_g: Math.round(ref.protein_g * mult * 10) / 10,
      carbs_g: Math.round(ref.carbs_g * mult * 10) / 10,
      fat_g: Math.round(ref.fat_g * mult * 10) / 10,
      fiber_g: Math.round(ref.fiber_g * mult * 10) / 10,
    };
    lines.push(row);
    totals.kcal += row.kcal;
    totals.protein_g += row.protein_g;
    totals.carbs_g += row.carbs_g;
    totals.fat_g += row.fat_g;
    totals.fiber_g += row.fiber_g;
  }
  return {
    lines,
    totals: {
      kcal: Math.round(totals.kcal),
      protein_g: Math.round(totals.protein_g * 10) / 10,
      carbs_g: Math.round(totals.carbs_g * 10) / 10,
      fat_g: Math.round(totals.fat_g * 10) / 10,
      fiber_g: Math.round(totals.fiber_g * 10) / 10,
    },
    food_db_keys: Object.keys(DB),
    advisory: true,
    basis: 'Approximate reference composition; lab values override when available',
    confidence: 0.75,
  };
}

function dietitianAdvise(profile = {}, goals = {}) {
  const weight = Number(profile.weight_kg) || 70;
  const height = Number(profile.height_cm) || 165;
  const age = Number(profile.age) || 35;
  const sex = profile.sex || 'unspecified';
  // Mifflin-St Jeor rough
  let bmr =
    sex === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  if (sex === 'unspecified') bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  const activity = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[
    goals.activity || 'light'
  ] || 1.375;
  const tdee = Math.round(bmr * activity);
  const target = goals.mode === 'loss' ? tdee - 400 : goals.mode === 'gain' ? tdee + 300 : tdee;
  const protein_g = Math.round(weight * (goals.mode === 'gain' ? 1.6 : 1.2));
  return {
    bmr: Math.round(bmr),
    tdee,
    calorie_target: target,
    protein_g_target: protein_g,
    plate_guidance: {
      half: 'vegetables / greens',
      quarter: 'cereals / millets',
      quarter2: 'dal / eggs / curd / lean protein',
    },
    safety_floor: 'Not a medical prescription. Clinical conditions need a registered dietitian/physician.',
    advisory: true,
    confidence: 0.8,
    cartoon: cartoon.explain('nutrition', {
      item: 'balanced thali per targets',
      amount: `${target} kcal/day, protein ~${protein_g}g`,
      condition: goals.mode || 'maintain',
      why: 'Energy and protein targets from standard predictive equations',
    }),
  };
}

function veterinaryPanel(caseData = {}) {
  const species = caseData.species || 'cattle';
  const symptoms = caseData.symptoms || [];
  const severity = caseData.severity || 'moderate';
  // Rule-lite triage — not diagnosis
  const red_flags = [];
  const s = symptoms.map((x) => String(x).toLowerCase());
  if (s.some((x) => /breath|bloat|collapse|blood|fracture/.test(x))) {
    red_flags.push('Urgent — contact licensed veterinarian immediately');
  }
  const advice = {
    species,
    triage: red_flags.length ? 'urgent' : severity === 'mild' ? 'monitor' : 'schedule_vet',
    red_flags,
    general_support: [
      'Isolate if contagious suspected',
      'Ensure water access',
      'Record temperature if possible',
      'Do not start prescription drugs without a licensed vet',
    ],
    authority_floor: 'Licensed veterinarian is the decision authority for drugs and procedures.',
    advisory: true,
    confidence: 0.7,
  };
  if (caseData.prescription) {
    advice.cartoon = cartoon.explain('veterinary', {
      ...caseData.prescription,
      species,
    });
  }
  return advice;
}

async function operate(data = {}) {
  const action = data.action || data.mode || 'nutrient';
  if (action === 'nutrient' || action === 'calculate') {
    return nutrientCalculate(data.foods || data.items || []);
  }
  if (action === 'dietitian' || action === 'diet') {
    return dietitianAdvise(data.profile || data, data.goals || {});
  }
  if (action === 'veterinary' || action === 'vet' || action === 'rtc') {
    return veterinaryPanel(data.case || data);
  }
  if (action === 'cartoon' || action === 'explain_rx') {
    return cartoon.explain(data.domain, data.prescription || data);
  }
  return { error: 'Unknown action', actions: ['nutrient', 'dietitian', 'veterinary', 'cartoon'] };
}

module.exports = {
  operate,
  nutrientCalculate,
  dietitianAdvise,
  veterinaryPanel,
};
