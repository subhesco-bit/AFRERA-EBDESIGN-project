/**
 * Allergy · intolerance · drug–food safety layer for Rituraj medical branch
 */

const pack = require('./knowledge/allergy_drug_food.json');

/** WHO Asian BMI public-health cutoffs (informative) */
function bmiAsian(weight_kg, height_cm) {
  const h = Number(height_cm) / 100;
  if (!(h > 0 && weight_kg > 0)) return null;
  const v = weight_kg / (h * h);
  let band_who = 'healthy';
  if (v < 18.5) band_who = 'underweight';
  else if (v >= 25 && v < 30) band_who = 'overweight';
  else if (v >= 30) band_who = 'obesity_range';
  let band_asian = 'healthy';
  if (v < 18.5) band_asian = 'underweight';
  else if (v >= 23 && v < 27.5) band_asian = 'increased_risk_asian_cutoff';
  else if (v >= 27.5) band_asian = 'higher_risk_asian_cutoff';
  return {
    value: Math.round(v * 10) / 10,
    band_who_standard: band_who,
    band_asian_public_health: band_asian,
    note: 'Asian cutoffs are public-health risk bands used in many Indian clinical contexts; individual assessment still required',
  };
}

function assessAllergies(userAllergies = [], mealTags = []) {
  const hits = [];
  const allergenIds = userAllergies.map((a) => String(a).toLowerCase());
  for (const a of pack.allergens) {
    if (allergenIds.includes(a.id) || allergenIds.includes(a.label.toLowerCase())) {
      const mealHit = mealTags.some((t) =>
        a.label_watch.some((w) => String(t).toLowerCase().includes(w)),
      );
      hits.push({ allergen: a, conflict_with_meal_tags: mealHit });
    }
  }
  return hits;
}

function assessDrugFood(medications = []) {
  const meds = medications.map((m) => String(m).toLowerCase());
  return (pack.drug_food_flags || []).filter((f) =>
    f.drugs.some((d) => meds.some((m) => m.includes(d) || d.includes(m))),
  );
}

function buildSafetySeat(profile = {}) {
  const allergies = profile.allergies || [];
  const medications = profile.medications || [];
  const intolerances = profile.intolerances || [];
  const bmi = bmiAsian(profile.weight_kg, profile.height_cm);
  return {
    seat: 'Clinical Safety — Allergy · Drug–Food · Asian BMI',
    bmi_dual: bmi,
    allergy_matches: assessAllergies(allergies, profile.meal_tags || []),
    intolerance_ids: intolerances,
    intolerance_strategies: (pack.intolerances || []).filter((i) =>
      intolerances.map((x) => String(x).toLowerCase()).includes(i.id),
    ),
    drug_food_flags: assessDrugFood(medications),
    policy: 'Allergy conflicts are hard stops for meal suggestions when flagged. Drug–food is alert-only — prescriber/pharmacist final.',
  };
}

module.exports = {
  bmiAsian,
  assessAllergies,
  assessDrugFood,
  buildSafetySeat,
  ALLERGENS: pack.allergens,
  DRUG_FOOD_FLAGS: pack.drug_food_flags,
};
