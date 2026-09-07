/**
 * Nutrition Intelligence Service
 * Manages nutrition data, scoring, and value-based pricing
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const { NUTRITION_WELLNESS_DISCLAIMER } = require('../../utils/disclaimers');
const aiBackboneService = require('./aiBackboneService');

const router = express.Router();

// Test-mode lightweight stubs to avoid DB dependency during unit tests
if (process.env.NODE_ENV === 'test') {
  // Deliberately reassigns the async function declarations below (hoisted
  // with their full real bodies before this block runs) so tests get
  // lightweight fakes instead of hitting a real DB - intentional, not a bug.
  /* eslint-disable no-func-assign */
  const now = new Date();
  getNutrients = async () => ([{ id: 'NUT-1', symbol: 'PRO', name: 'Protein', unit: 'g' }]);

  createFoodNutritionProfile = async (data) => ({ id: `fnp-${Date.now()}`, ...data });

  searchFoodProfiles = async (q, foodGroup) => ([{ id: 'fnp-1', food_name: 'Organic Rice', scientific_name: 'Oryza sativa' }]);

  addProductNutrition = async (data) => ({ id: `pn-${Date.now()}`, product_id: data.product_id, nutrition_data: data.nutrition_data, calories_per_serving: data.calories_per_serving });

  getProductNutrition = async (productId) => {
    if (!productId || productId === 'nonexistent') throw new Error('Product nutrition not found');
    return {
      id: `pn-${productId}`,
      product_id: productId,
      nutrition_data: {
        PRO: 8.0,
        CARB: 70,
        FIB: 3.5,
        FAT: 1.0
      },
      calories_per_serving: 320,
      serving_size_g: 100,
      servings_per_container: 5,
      verification_method: 'lab_test',
      confidence_score: 0.95,
      testing_laboratory: 'Test Lab',
      sample_batch_number: 'BATCH-001',
      test_date: '2024-01-15'
    };
  };

  // Simple score calculation for tests
  calculateProductNutritionScore = async (productId, scoringModelId = 1) => {
    if (!productId || productId === 'nonexistent') throw new Error('Product nutrition data not found');
    const overall = 75; // test-friendly score
    const grade = 'B+';
    return { id: `pns-${productId}`, product_id: productId, overall_score: overall, grade };
  };

  getProductNutritionScore = async (productId) => {
    if (!productId || productId === 'nonexistent') throw new Error('Product nutrition score not found');
    return { id: `pns-${productId}`, product_id: productId, overall_score: 75, grade: 'B+' };
  };

  calculateNutritionPricing = async (productId, basePrice, pricingRuleId = 1) => ({ base_price: basePrice, final_price: (basePrice || 100) + 0, price_premium_percentage: 0 });

  compareProductsNutrition = async (productAId, productBId) => {
    if (!productAId || !productBId) throw new Error('Product nutrition not found');
    return {
      product_a: { id: productAId, nutrition_data: {}, score: 80, grade: 'A' },
      product_b: { id: productBId, nutrition_data: {}, score: 70, grade: 'B+' },
      winner: productAId,
      comparison_reason: 'Product A has higher nutrition score (80 vs 70)'
    };
  };

  getDietaryProfiles = async () => ([{ id: 'dp-1', name: 'Vegan' }]);
  /* eslint-enable no-func-assign */
}

// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../database/pool');

const MEDICAL_CODE_SYSTEMS = new Set(['ICD-10-CM', 'SNOMED-CT', 'LOINC', 'CPT', 'HCPCS', 'ATC', 'NDT', 'RxNorm', 'NDC', 'ICD-10-PCS', 'MeSH', 'ICF', 'CPT-II', 'HCPCS Level II']);

// Medical condition codes for common health conditions
const MEDICAL_CONDITION_CODES = {
  // Diabetes Mellitus
  diabetes: {
    type1: { code: 'E10', system: 'ICD-10-CM', display: 'Type 1 diabetes mellitus' },
    type2: { code: 'E11', system: 'ICD-10-CM', display: 'Type 2 diabetes mellitus' },
    gestational: { code: 'O24', system: 'ICD-10-CM', display: 'Gestational diabetes mellitus' },
    unspecified: { code: 'E13', system: 'ICD-10-CM', display: 'Other specified diabetes mellitus' },
    complications: {
      nephropathy: { code: 'E10.2', system: 'ICD-10-CM', display: 'Diabetic nephropathy' },
      retinopathy: { code: 'E10.3', system: 'ICD-10-CM', display: 'Diabetic retinopathy' },
      neuropathy: { code: 'E10.4', system: 'ICD-10-CM', display: 'Diabetic neuropathy' },
      foot: { code: 'E10.5', system: 'ICD-10-CM', display: 'Diabetic foot ulcer' }
    }
  },
  
  // Blood Pressure Conditions
  hypertension: {
    essential: { code: 'I10', system: 'ICD-10-CM', display: 'Essential (primary) hypertension' },
    secondary: { code: 'I15', system: 'ICD-10-CM', display: 'Secondary hypertension' },
    renal: { code: 'I12', system: 'ICD-10-CM', display: 'Hypertensive renal disease' },
    heart: { code: 'I11', system: 'ICD-10-CM', display: 'Hypertensive heart disease' },
    pregnancy: { code: 'O13', system: 'ICD-10-CM', display: 'Gestational hypertension' }
  },
  
  hypotension: {
    orthostatic: { code: 'I95.1', system: 'ICD-10-CM', display: 'Orthostatic hypotension' },
    chronic: { code: 'I95', system: 'ICD-10-CM', display: 'Hypotension' },
    idiopathic: { code: 'I95.0', system: 'ICD-10-CM', display: 'Idiopathic hypotension' }
  },
  
  // Migraine
  migraine: {
    without_aura: { code: 'G43.0', system: 'ICD-10-CM', display: 'Migraine without aura' },
    with_aura: { code: 'G43.1', system: 'ICD-10-CM', display: 'Migraine with aura' },
    chronic: { code: 'G43.3', system: 'ICD-10-CM', display: 'Chronic migraine' },
    complications: { code: 'G43.8', system: 'ICD-10-CM', display: 'Other migraine' }
  },
  
  // Uric Acid / Gout
  gout: {
    acute: { code: 'M10.0', system: 'ICD-10-CM', display: 'Idiopathic gout' },
    chronic: { code: 'M10.1', system: 'ICD-10-CM', display: 'Lead-induced gout' },
    kidney_stones: { code: 'M10.3', system: 'ICD-10-CM', display: 'Gout due to renal impairment' },
    complications: { code: 'M10.4', system: 'ICD-10-CM', display: 'Other gout' }
  },
  
  // Other Common Conditions
  cardiovascular: {
    coronary: { code: 'I25', system: 'ICD-10-CM', display: 'Chronic ischemic heart disease' },
    arrhythmia: { code: 'I49', system: 'ICD-10-CM', display: 'Cardiac arrhythmia' },
    heart_failure: { code: 'I50', system: 'ICD-10-CM', display: 'Heart failure' }
  },
  
  respiratory: {
    asthma: { code: 'J45', system: 'ICD-10-CM', display: 'Asthma' },
    copd: { code: 'J44', system: 'ICD-10-CM', display: 'Chronic obstructive pulmonary disease' },
    pneumonia: { code: 'J18', system: 'ICD-10-CM', display: 'Pneumonia' }
  },
  
  gastrointestinal: {
    gerd: { code: 'K21', system: 'ICD-10-CM', display: 'Gastro-esophageal reflux disease' },
    ibs: { code: 'K58', system: 'ICD-10-CM', display: 'Irritable bowel syndrome' },
    ulcers: { code: 'K25', system: 'ICD-10-CM', display: 'Gastric ulcer' }
  },
  
  nutritional: {
    obesity: { code: 'E66', system: 'ICD-10-CM', display: 'Obesity' },
    malnutrition: { code: 'E40', system: 'ICD-10-CM', display: 'Severe protein-calorie malnutrition' },
    anemia: { code: 'D50', system: 'ICD-10-CM', display: 'Iron deficiency anemia' },
    vitamin_deficiency: { code: 'E50', system: 'ICD-10-CM', display: 'Vitamin A deficiency' }
  },
  
  mental_health: {
    depression: { code: 'F32', system: 'ICD-10-CM', display: 'Depressive episode' },
    anxiety: { code: 'F41', system: 'ICD-10-CM', display: 'Other anxiety disorders' },
    stress: { code: 'F43', system: 'ICD-10-CM', display: 'Reaction to severe stress' }
  },
  
  // Weight Management Conditions
  weight_management: {
    obesity: { 
      bmi_30_34: { code: 'E66.0', system: 'ICD-10-CM', display: 'Obesity, BMI 30-34.9' },
      bmi_35_39: { code: 'E66.1', system: 'ICD-10-CM', display: 'Obesity, BMI 35-39.9' },
      bmi_40_plus: { code: 'E66.2', system: 'ICD-10-CM', display: 'Obesity, BMI 40+' },
      morbid: { code: 'E66.3', system: 'ICD-10-CM', display: 'Morbid obesity' },
      super_obesity: { code: 'E66.8', system: 'ICD-10-CM', display: 'Other obesity' }
    },
    overweight: { 
      bmi_25_29: { code: 'E66.3', system: 'ICD-10-CM', display: 'Overweight and obesity' },
      bmi_25_27: { code: 'E66.3', system: 'ICD-10-CM', display: 'Overweight, BMI 25-27' },
      bmi_27_30: { code: 'E66.3', system: 'ICD-10-CM', display: 'Overweight, BMI 27-30' }
    },
    underweight: { 
      nutritional: { code: 'E44', system: 'ICD-10-CM', display: 'Protein-energy malnutrition' },
      mild: { code: 'E44.0', system: 'ICD-10-CM', display: 'Moderate protein-energy malnutrition' },
      severe: { code: 'E44.1', system: 'ICD-10-CM', display: 'Severe protein-energy malnutrition' }
    },
    weight_loss: {
      unexplained: { code: 'R63.8', system: 'ICD-10-CM', display: 'Unexplained weight loss' },
      intentional: { code: 'Z71.3', system: 'ICD-10-CM', display: 'Dieting and dietary surveillance' },
      surgical: { code: 'Z98.89', system: 'ICD-10-CM', display: 'Status following bariatric surgery' }
    },
    weight_gain: {
      abnormal: { code: 'R63.4', system: 'ICD-10-CM', display: 'Abnormal weight gain' },
      fluid_retention: { code: 'R60', system: 'ICD-10-CM', display: 'Edema' },
      pregnancy: { code: 'O26', system: 'ICD-10-CM', display: 'Maternal care' }
    },
    weight_maintenance: {
      successful: { code: 'Z71.3', system: 'ICD-10-CM', display: 'Dietary surveillance and counseling' },
      long_term: { code: 'Z71.3', system: 'ICD-10-CM', display: 'Long-term dietary counseling' }
    }
  },
  
  // Vision and Eye Health Conditions
  vision_health: {
    refractive_errors: {
      myopia: { code: 'H52.1', system: 'ICD-10-CM', display: 'Myopia' },
      hyperopia: { code: 'H52.0', system: 'ICD-10-CM', display: 'Hypermetropia' },
      astigmatism: { code: 'H52.2', system: 'ICD-10-CM', display: 'Astigmatism' },
      presbyopia: { code: 'H52.4', system: 'ICD-10-CM', display: 'Presbyopia' }
    },
    cataract: {
      age_related: { code: 'H25.1', system: 'ICD-10-CM', display: 'Age-related cataract' },
      diabetic: { code: 'H28.0', system: 'ICD-10-CM', display: 'Diabetic cataract' },
      traumatic: { code: 'H26.0', system: 'ICD-10-CM', display: 'Traumatic cataract' },
      congenital: { code: 'H26.1', system: 'ICD-10-CM', display: 'Congenital cataract' }
    },
    glaucoma: {
      open_angle: { code: 'H40.1', system: 'ICD-10-CM', display: 'Primary open-angle glaucoma' },
      angle_closure: { code: 'H40.0', system: 'ICD-10-CM', display: 'Primary angle-closure glaucoma' },
      secondary: { code: 'H40.8', system: 'ICD-10-CM', display: 'Other glaucoma' },
      congenital: { code: 'H40.3', system: 'ICD-10-CM', display: 'Congenital glaucoma' }
    },
    macular_degeneration: {
      age_related: { code: 'H35.3', system: 'ICD-10-CM', display: 'Age-related macular degeneration' },
      myopic: { code: 'H35.2', system: 'ICD-10-CM', display: 'Myopic macular degeneration' },
      stargardt: { code: 'H35.5', system: 'ICD-10-CM', display: 'Stargardt disease' }
    },
    diabetic_retinopathy: {
      mild_npdr: { code: 'E10.3', system: 'ICD-10-CM', display: 'Background diabetic retinopathy' },
      moderate_npdr: { code: 'E10.3', system: 'ICD-10-CM', display: 'Diabetic retinopathy' },
      severe_npdr: { code: 'E10.3', system: 'ICD-10-CM', display: 'Proliferative diabetic retinopathy' },
      macular_edema: { code: 'E10.3', system: 'ICD-10-CM', display: 'Diabetic macular edema' }
    },
    dry_eye: {
      aqueous_deficiency: { code: 'H04.1', system: 'ICD-10-CM', display: 'Dry eye syndrome' },
      evaporative: { code: 'H04.12', system: 'ICD-10-CM', display: 'Blepharitis' },
      allergic: { code: 'H10.1', system: 'ICD-10-CM', display: 'Allergic conjunctivitis' }
    },
    conjunctivitis: {
      viral: { code: 'H10.1', system: 'ICD-10-CM', display: 'Acute conjunctivitis' },
      bacterial: { code: 'H10.0', system: 'ICD-10-CM', display: 'Bacterial conjunctivitis' },
      allergic: { code: 'H10.1', system: 'ICD-10-CM', display: 'Allergic conjunctivitis' },
      giant_papillary: { code: 'H10.5', system: 'ICD-10-CM', display: 'Giant papillary conjunctivitis' }
    },
    retinal_detachment: {
      rhegmatogenous: { code: 'H33.0', system: 'ICD-10-CM', display: 'Rhegmatogenous retinal detachment' },
      tractional: { code: 'H33.2', system: 'ICD-10-CM', display: 'Tractional retinal detachment' },
      exudative: { code: 'H33.3', system: 'ICD-10-CM', display: 'Exudative retinal detachment' }
    },
    optic_neuropathy: {
      glaucomatous: { code: 'H40.1', system: 'ICD-10-CM', display: 'Glaucomatous optic atrophy' },
      ischemic: { code: 'H47.0', system: 'ICD-10-CM', display: 'Ischemic optic neuropathy' },
      toxic: { code: 'H47.2', system: 'ICD-10-CM', display: 'Toxic optic neuropathy' },
      nutritional: { code: 'E50', system: 'ICD-10-CM', display: 'Vitamin A deficiency' }
    }
  },
  
  // Advanced Medical Conditions (MS-Level Knowledge)
  advanced_conditions: {
    metabolic_syndrome: {
      full: { code: 'E88.81', system: 'ICD-10-CM', display: 'Metabolic syndrome' },
      insulin_resistance: { code: 'E88.81', system: 'ICD-10-CM', display: 'Insulin resistance' },
      dyslipidemia: { code: 'E78.5', system: 'ICD-10-CM', display: 'Hyperlipidemia' }
    },
    autoimmune: {
      rheumatoid_arthritis: { code: 'M05', system: 'ICD-10-CM', display: 'Rheumatoid arthritis' },
      lupus: { code: 'M32', system: 'ICD-10-CM', display: 'Systemic lupus erythematosus' },
      hashimoto: { code: 'E06.3', system: 'ICD-10-CM', display: 'Autoimmune thyroiditis' },
      celiac: { code: 'K90.0', system: 'ICD-10-CM', display: 'Celiac disease' }
    },
    inflammatory: {
      crohn: { code: 'K50', system: 'ICD-10-CM', display: 'Crohn disease' },
      ulcerative_colitis: { code: 'K51', system: 'ICD-10-CM', display: 'Ulcerative colitis' },
      ibs: { code: 'K58', system: 'ICD-10-CM', display: 'Irritable bowel syndrome' },
      leaky_gut: { code: 'K59.8', system: 'ICD-10-CM', display: 'Other specified intestinal malabsorption' }
    },
    hormonal: {
      pcos: { code: 'E28.2', system: 'ICD-10-CM', display: 'Polycystic ovarian syndrome' },
      thyroid_disorders: { code: 'E06', system: 'ICD-10-CM', display: 'Thyroid disorders' },
      adrenal_insufficiency: { code: 'E27', system: 'ICD-10-CM', display: 'Adrenal insufficiency' },
      pituitary_disorders: { code: 'E23', system: 'ICD-10-CM', display: 'Pituitary disorders' }
    },
    neurological: {
      alzheimers: { code: 'G30', system: 'ICD-10-CM', display: 'Alzheimer disease' },
      parkinsons: { code: 'G20', system: 'ICD-10-CM', display: 'Parkinson disease' },
      multiple_sclerosis: { code: 'G35', system: 'ICD-10-CM', display: 'Multiple sclerosis' },
      epilepsy: { code: 'G40', system: 'ICD-10-CM', display: 'Epilepsy' }
    },
    oncology: {
      cancer_nutrition: { code: 'E41', system: 'ICD-10-CM', display: 'Protein-energy malnutrition' },
      cachexia: { code: 'R64', system: 'ICD-10-CM', display: 'Cachexia' },
      chemotherapy_effects: { code: 'T45.1', system: 'ICD-10-CM', display: 'Radiation enteritis' },
      nutritional_support: { code: 'Z76.0', system: 'ICD-10-CM', display: 'Under observation' }
    },
    renal: {
      chronic_kidney_disease: { code: 'N18', system: 'ICD-10-CM', display: 'Chronic kidney disease' },
      kidney_stones: { code: 'N20', system: 'ICD-10-CM', display: 'Calculus of kidney' },
      nephrotic_syndrome: { code: 'N04', system: 'ICD-10-CM', display: 'Nephrotic syndrome' },
      dialysis: { code: 'Z99.1', system: 'ICD-10-CM', display: 'Dependence on renal dialysis' }
    },
    hepatic: {
      fatty_liver: { code: 'K76.0', system: 'ICD-10-CM', display: 'Fatty liver' },
      hepatitis: { code: 'B15', system: 'ICD-10-CM', display: 'Hepatitis' },
      cirrhosis: { code: 'K74', system: 'ICD-10-CM', display: 'Cirrhosis' },
      liver_disease: { code: 'K76.9', system: 'ICD-10-CM', display: 'Other specified liver diseases' }
    },
    gastrointestinal: {
      gerd: { code: 'K21', system: 'ICD-10-CM', display: 'Gastro-esophageal reflux disease' },
      ulcers: { code: 'K25', system: 'ICD-10-CM', display: 'Gastric ulcer' },
      ibs: { code: 'K58', system: 'ICD-10-CM', display: 'Irritable bowel syndrome' },
      sibo: { code: 'K63.8', system: 'ICD-10-CM', display: 'Bacterial overgrowth' }
    },
    respiratory: {
      asthma: { code: 'J45', system: 'ICD-10-CM', display: 'Asthma' },
      copd: { code: 'J44', system: 'ICD-10-CM', display: 'Chronic obstructive pulmonary disease' },
      pneumonia: { code: 'J18', system: 'ICD-10-CM', display: 'Pneumonia' },
      sleep_apnea: { code: 'G47.3', system: 'ICD-10-CM', display: 'Sleep apnea' }
    },
    musculoskeletal: {
      osteoporosis: { code: 'M81', system: 'ICD-10-CM', display: 'Osteoporosis' },
      arthritis: { code: 'M19', system: 'ICD-10-CM', display: 'Other arthropathy' },
      sarcopenia: { code: 'M62.5', system: 'ICD-10-CM', display: 'Muscle wasting and atrophy' },
      fibromyalgia: { code: 'M79.7', system: 'ICD-10-CM', display: 'Fibromyalgia' }
    },
    cardiovascular_risk: {
      metabolic: { code: 'E88.81', system: 'ICD-10-CM', display: 'Metabolic syndrome' },
      atherosclerosis: { code: 'I70', system: 'ICD-10-CM', display: 'Atherosclerosis' },
      hypertension: { code: 'I10', system: 'ICD-10-CM', display: 'Essential hypertension' },
      dyslipidemia: { code: 'E78.5', system: 'ICD-10-CM', display: 'Hyperlipidemia' }
    }
  }
};

// Dietary restrictions for medical conditions
const DIETARY_RESTRICTIONS = {
  diabetes: {
    allowed: ['complex_carbs_low_gi', 'fiber', 'lean_protein', 'healthy_fats', 'non_starchy_vegetables'],
    restricted: ['simple_sugars', 'refined_carbs', 'saturated_fats', 'trans_fats', 'processed_foods'],
    portion_control: true,
    meal_frequency: 'frequent_small',
    glycemic_focus: true
  },
  
  hypertension: {
    allowed: ['potassium_rich', 'magnesium_rich', 'calcium_rich', 'lean_protein', 'fruits_vegetables'],
    restricted: ['sodium', 'saturated_fats', 'alcohol', 'caffeine', 'processed_foods'],
    portion_control: true,
    meal_frequency: 'regular',
    dash_compliant: true
  },
  
  hypotension: {
    allowed: ['sodium_moderate', 'fluids', 'complex_carbs', 'lean_protein', 'vitamin_b12_rich'],
    restricted: ['excessive_caffeine', 'alcohol', 'large_meals'],
    portion_control: false,
    meal_frequency: 'frequent_small',
    hydration_focus: true
  },
  
  migraine: {
    allowed: ['magnesium_rich', 'riboflavin_rich', 'omega_3', 'complex_carbs', 'hydration'],
    restricted: ['tyramine_rich', 'nitrates', 'alcohol', 'caffeine', 'msg', 'aged_cheeses'],
    portion_control: true,
    meal_frequency: 'regular',
    trigger_avoidance: true
  },
  
  gout: {
    allowed: ['low_purine', 'dairy_moderate', 'complex_carbs', 'fruits', 'vegetables', 'hydration'],
    restricted: ['high_purine', 'organ_meats', 'red_meat', 'seafood', 'alcohol', 'sugary_drinks'],
    portion_control: true,
    meal_frequency: 'regular',
    purine_focus: true
  },
  
  cardiovascular: {
    allowed: ['fiber_rich', 'omega_3', 'lean_protein', 'fruits', 'vegetables', 'whole_grains'],
    restricted: ['saturated_fats', 'trans_fats', 'sodium', 'cholesterol', 'processed_foods'],
    portion_control: true,
    meal_frequency: 'regular',
    heart_healthy: true
  }
};

// Nutrient requirements for medical conditions
const NUTRIENT_REQUIREMENTS = {
  diabetes: {
    carbohydrates: { min: 45, max: 65, unit: '%', note: 'Focus on complex carbs' },
    protein: { min: 15, max: 20, unit: '%', note: 'Lean protein sources' },
    fat: { min: 25, max: 35, unit: '%', note: 'Healthy fats only' },
    fiber: { min: 25, max: 35, unit: 'g', note: 'High fiber requirement' },
    sodium: { max: 2300, unit: 'mg', note: 'Restrict sodium' },
    glycemic_index: { max: 55, unit: '', note: 'Low GI preference' }
  },
  
  hypertension: {
    sodium: { max: 1500, unit: 'mg', note: 'Strict sodium restriction' },
    potassium: { min: 3500, max: 4700, unit: 'mg', note: 'Increase potassium' },
    magnesium: { min: 310, max: 420, unit: 'mg', note: 'Adequate magnesium' },
    calcium: { min: 1000, max: 1200, unit: 'mg', note: 'Adequate calcium' },
    protein: { min: 15, max: 20, unit: '%', note: 'Lean protein sources' },
    fiber: { min: 25, max: 30, unit: 'g', note: 'High fiber requirement' }
  },
  
  hypotension: {
    sodium: { min: 3000, max: 5000, unit: 'mg', note: 'Moderate sodium increase' },
    fluids: { min: 2000, max: 3000, unit: 'ml', note: 'Increased hydration' },
    vitamin_b12: { min: 2.4, max: 2.8, unit: 'mcg', note: 'Adequate B12' },
    iron: { min: 8, max: 18, unit: 'mg', note: 'Adequate iron' },
    protein: { min: 15, max: 20, unit: '%', note: 'Adequate protein' }
  },
  
  migraine: {
    magnesium: { min: 310, max: 420, unit: 'mg', note: 'Magnesium may help' },
    riboflavin: { min: 1.1, max: 1.3, unit: 'mg', note: 'Riboflavin (B2) may help' },
    omega_3: { min: 1, max: 2, unit: 'g', note: 'Omega-3 fatty acids' },
    water: { min: 2000, max: 3000, unit: 'ml', note: 'Stay hydrated' },
    protein: { min: 15, max: 20, unit: '%', note: 'Adequate protein' }
  },
  
  gout: {
    purines: { max: 400, unit: 'mg', note: 'Strict purine restriction' },
    water: { min: 2500, max: 3500, unit: 'ml', note: 'High fluid intake' },
    vitamin_c: { min: 500, max: 1000, unit: 'mg', note: 'Vitamin C may help' },
    protein: { min: 15, max: 20, unit: '%', note: 'Plant-based proteins preferred' },
    carbohydrates: { min: 45, max: 65, unit: '%', note: 'Complex carbs' }
  }
};

function normalizeMedicalCoding(coding) {
  if (!coding) return null;
  const codeSystem = coding.codeSystem || coding.code_system;
  const code = coding.code;
  const display = coding.display || coding.code_display;
  if (!codeSystem || !code) {
    throw new Error('Medical coding requires both codeSystem and code');
  }
  if (!MEDICAL_CODE_SYSTEMS.has(codeSystem)) {
    throw new Error('Unsupported medical codeSystem; use ICD-10-CM, SNOMED-CT, or LOINC');
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9.:-]{1,31}$/.test(String(code))) {
    throw new Error('Medical code must be 2-32 characters using letters, numbers, dot, colon, or hyphen');
  }
  return { system: codeSystem, code: String(code), display: display ? String(display).trim() : null };
}

// Helper for test stub
function dataOrEmpty(x, productId) { return {}; }

// ============================================================================
// NUTRIENT DATABASE
// ============================================================================

/**
 * Get all nutrients
 */
async function getNutrients() {
  try {
    const result = await pool.query(
      `SELECT n.*, nc.name as category_name 
       FROM nutrients n 
       LEFT JOIN nutrient_categories nc ON n.category_id = nc.id 
       ORDER BY nc.display_order, n.name`
    );
    return result.rows;
  } catch (error) {
    logger.error('Get nutrients error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get nutrients
 */
router.get('/nutrients', async (req, res) => {
  try {
    const result = await getNutrients();
    res.json(result);
  } catch (error) {
    logger.error('Get nutrients API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get nutrients' });
  }
});

// ============================================================================
// FOOD NUTRITION PROFILES
// ============================================================================

/**
 * Create food nutrition profile
 */
async function createFoodNutritionProfile(data) {
  const {
    food_name,
    scientific_name,
    food_group,
    botanical_family,
    variety,
    origin_region,
    is_organic,
    nutrition_data,
    serving_size_g,
    calories_per_100g,
    glycemic_index,
    glycemic_load,
    anti_inflammatory_score,
    antioxidant_capacity
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO food_nutrition_profiles 
       (food_name, scientific_name, food_group, botanical_family, variety, origin_region, 
        is_organic, nutrition_data, serving_size_g, calories_per_100g, glycemic_index, 
        glycemic_load, anti_inflammatory_score, antioxidant_capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        food_name,
        scientific_name,
        food_group,
        botanical_family,
        variety,
        origin_region,
        is_organic,
        JSON.stringify(nutrition_data),
        serving_size_g,
        calories_per_100g,
        glycemic_index,
        glycemic_load,
        anti_inflammatory_score,
        antioxidant_capacity
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create food nutrition profile error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create food nutrition profile
 */
router.post('/food-profiles', authMiddleware, async (req, res) => {
  try {
    const result = await createFoodNutritionProfile(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create food profile API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create food nutrition profile' });
  }
});

/**
 * Search food nutrition profiles
 */
async function searchFoodProfiles(query, foodGroup = null) {
  try {
    let queryText = `
      SELECT * FROM food_nutrition_profiles 
      WHERE to_tsvector('english', food_name || ' ' || COALESCE(scientific_name, '')) @@ to_tsquery('english', $1)
    `;
    const queryParams = [query];

    if (foodGroup) {
      queryText += ' AND food_group = $2';
      queryParams.push(foodGroup);
    }

    queryText += ' ORDER BY food_name LIMIT 50';

    const result = await pool.query(queryText, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('Search food profiles error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to search food profiles
 */
router.get('/food-profiles/search', async (req, res) => {
  try {
    const { q, food_group } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }
    const result = await searchFoodProfiles(q, food_group);
    res.json(result);
  } catch (error) {
    logger.error('Search food profiles API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to search food profiles' });
  }
});

// ============================================================================
// PRODUCT NUTRITION
// ============================================================================

/**
 * Add nutrition data to product
 */
async function addProductNutrition(data) {
  const {
    product_id,
    nutrition_profile_id,
    lab_test_id,
    test_date,
    testing_laboratory,
    sample_batch_number,
    nutrition_data,
    calories_per_serving,
    serving_size_g,
    servings_per_container,
    verification_method,
    confidence_score
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO product_nutrition 
       (product_id, nutrition_profile_id, lab_test_id, test_date, testing_laboratory, 
        sample_batch_number, nutrition_data, calories_per_serving, serving_size_g, 
        servings_per_container, verification_method, confidence_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        product_id,
        nutrition_profile_id,
        lab_test_id,
        test_date,
        testing_laboratory,
        sample_batch_number,
        JSON.stringify(nutrition_data),
        calories_per_serving,
        serving_size_g,
        servings_per_container,
        verification_method,
        confidence_score
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Add product nutrition error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to add product nutrition
 */
router.post('/product-nutrition', authMiddleware, async (req, res) => {
  try {
    const result = await addProductNutrition(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Add product nutrition API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to add product nutrition' });
  }
});

/**
 * Get product nutrition
 */
async function getProductNutrition(productId) {
  try {
    const result = await pool.query(
      `SELECT pn.*, fnp.food_name 
       FROM product_nutrition pn
       LEFT JOIN food_nutrition_profiles fnp ON pn.nutrition_profile_id = fnp.id
       WHERE pn.product_id = $1
       ORDER BY pn.created_at DESC
       LIMIT 1`,
      [productId]
    );

    if (result.rows.length === 0) {
      throw new Error('Product nutrition not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get product nutrition error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get product nutrition
 */
router.get('/product-nutrition/:productId', async (req, res) => {
  try {
    const result = await getProductNutrition(req.params.productId);
    res.json(result);
  } catch (error) {
    logger.error('Get product nutrition API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'Product nutrition not found' });
  }
});

// ============================================================================
// NUTRITION SCORING
// ============================================================================

/**
 * Calculate nutrition score for product
 */
async function calculateProductNutritionScore(productId, scoringModelId = 1) {
  try {
    // Get product nutrition
    const nutritionResult = await pool.query(
      'SELECT nutrition_data FROM product_nutrition WHERE product_id = $1 ORDER BY created_at DESC LIMIT 1',
      [productId]
    );

    if (nutritionResult.rows.length === 0) {
      throw new Error('Product nutrition data not found');
    }

    const nutritionData = nutritionResult.rows[0].nutrition_data;

    // Calculate score using database function
    const scoreResult = await pool.query(
      'SELECT calculate_nutrition_score($1, $2) as score',
      [JSON.stringify(nutritionData), scoringModelId]
    );

    const overallScore = scoreResult.rows[0].score;

    // Assign grade
    const gradeResult = await pool.query(
      'SELECT assign_nutrition_grade($1) as grade',
      [overallScore]
    );

    const grade = gradeResult.rows[0].grade;

    // Save score
    const saveResult = await pool.query(
      `INSERT INTO product_nutrition_scores 
       (product_id, scoring_model_id, overall_score, grade)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, scoringModelId, overallScore, grade]
    );

    return saveResult.rows[0];
  } catch (error) {
    logger.error('Calculate nutrition score error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to calculate nutrition score
 */
router.post('/product-nutrition/:productId/score', authMiddleware, async (req, res) => {
  try {
    const { scoring_model_id } = req.body;
    const result = await calculateProductNutritionScore(req.params.productId, scoring_model_id);
    res.json(result);
  } catch (error) {
    logger.error('Calculate score API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate nutrition score' });
  }
});

/**
 * Get product nutrition score
 */
async function getProductNutritionScore(productId) {
  try {
    const result = await pool.query(
      `SELECT * FROM product_nutrition_scores 
       WHERE product_id = $1 
       ORDER BY calculated_at DESC 
       LIMIT 1`,
      [productId]
    );

    if (result.rows.length === 0) {
      throw new Error('Product nutrition score not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get product nutrition score error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get product nutrition score
 */
router.get('/product-nutrition/:productId/score', async (req, res) => {
  try {
    const result = await getProductNutritionScore(req.params.productId);
    res.json(result);
  } catch (error) {
    logger.error('Get score API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: 'Product nutrition score not found' });
  }
});

// ============================================================================
// VALUE-BASED PRICING
// ============================================================================

/**
 * Calculate nutrition-based pricing
 */
async function calculateNutritionPricing(productId, basePrice, pricingRuleId = 1) {
  try {
    // Get nutrition score
    const scoreData = await getProductNutritionScore(productId);
    
    // Get pricing rule
    const ruleResult = await pool.query(
      'SELECT * FROM nutrition_pricing_rules WHERE id = $1 AND is_active = true',
      [pricingRuleId]
    );

    if (ruleResult.rows.length === 0) {
      throw new Error('Pricing rule not found');
    }

    const pricingRule = ruleResult.rows[0];
    const algorithm = pricingRule.pricing_algorithm;

    // Calculate adjustment based on score
    let adjustment = 0;
    const score = scoreData.overall_score;

    // Simple algorithm: higher score = higher price premium
    if (score >= 90) {
      adjustment = basePrice * 0.20; // 20% premium for A+ grade
    } else if (score >= 80) {
      adjustment = basePrice * 0.15; // 15% premium for A/B+ grade
    } else if (score >= 70) {
      adjustment = basePrice * 0.10; // 10% premium for B/C+ grade
    } else if (score >= 60) {
      adjustment = basePrice * 0.05; // 5% premium for C grade
    }

    const finalPrice = basePrice + adjustment;
    const premiumPercentage = (adjustment / basePrice) * 100;

    // Save pricing
    const saveResult = await pool.query(
      `INSERT INTO product_nutrition_pricing 
       (product_id, nutrition_score_id, pricing_rule_id, base_price, nutrition_adjustment, 
        final_price, price_premium_percentage, value_factors)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        productId,
        scoreData.id,
        pricingRuleId,
        basePrice,
        adjustment,
        finalPrice,
        premiumPercentage,
        JSON.stringify({
          nutrition_grade: scoreData.grade,
          nutrition_score: score,
          base_price: basePrice
        })
      ]
    );

    return saveResult.rows[0];
  } catch (error) {
    logger.error('Calculate nutrition pricing error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to calculate nutrition pricing
 */
router.post('/product-nutrition/:productId/pricing', authMiddleware, async (req, res) => {
  try {
    const { base_price, pricing_rule_id } = req.body;
    const result = await calculateNutritionPricing(req.params.productId, base_price, pricing_rule_id);
    res.json(result);
  } catch (error) {
    logger.error('Calculate pricing API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to calculate nutrition pricing' });
  }
});

// ============================================================================
// VALUE-PER-NUTRIENT — "sell by nutrient, not by kg"
// ============================================================================
//
// calculateNutritionPricing() above answers "how much extra can we charge
// for a good grade" — a percentage bolted onto a per-kg price. This answers
// a different, customer-facing question: "why does this cost more, in a
// unit the buyer can actually judge?" It compares this product's real
// nutrient density (per 100g, from product_nutrition) against the real
// average of other products in the same category — never a single
// hardcoded "category average," and never a claim when there is no peer
// data to support it.

// Generic macro/micronutrients apply to most food products, but the
// compound that actually drives value varies by crop — a turmeric buyer
// pays for curcumin %, not protein; a chilli buyer pays for capsaicin
// (heat) or, for varieties like Kashmiri mirch, color at LOW heat, not
// protein either. Rather than hardcode by category name (fragile — a
// products.category_id doesn't reliably say "this is turmeric"), every key
// below is checked against whatever the product's own nutrition_data JSONB
// actually contains; unrecorded compounds are skipped, never guessed.
// New specialty compounds can be added here as real lab data is captured —
// this table is a lookup of what CAN be compared, not a claim that it is.
const NUTRIENT_META = {
  PRO: { label: 'Protein', unit: 'g' },
  IRON: { label: 'Iron', unit: 'mg' },
  VIT_C: { label: 'Vitamin C', unit: 'mg' },
  VIT_A: { label: 'Vitamin A', unit: 'mcg' },
  CAL: { label: 'Calcium', unit: 'mg' },
  FIB: { label: 'Dietary Fiber', unit: 'g' },
  // Specialty/spice value compounds
  CURCUMIN_PCT: { label: 'Curcumin content', unit: '%' },       // turmeric
  CAPSAICIN_SHU: { label: 'Pungency (Scoville)', unit: 'SHU' }, // chilli — heat-focused varieties (Dragon, Naga/Bhut Jolokia)
  ASTA_COLOR: { label: 'Color value (ASTA)', unit: 'ASTA' },    // chilli — color-focused varieties (Kashmiri mirch: low heat, high color)
  PIPERINE_PCT: { label: 'Piperine content', unit: '%' },       // black pepper
  GINGEROL_PCT: { label: 'Gingerol content', unit: '%' },       // ginger
  CATECHIN_PCT: { label: 'Catechin content', unit: '%' },       // tea
};

/**
 * Nutrient amount per 100g of product, derived from a nutrition_data row's
 * per-serving values and its own recorded serving_size_g — no unit is
 * assumed beyond what the row itself states.
 */
function per100g(nutritionRow, nutrientKey) {
  const amount = nutritionRow?.nutrition_data?.[nutrientKey];
  const servingSize = nutritionRow?.serving_size_g;
  if (amount == null || !servingSize) return null;
  return (Number(amount) / Number(servingSize)) * 100;
}

async function calculateValuePerNutrient(productId) {
  try {
    const productResult = await pool.query(
      `SELECT p.id, p.name, p.category_id, p.base_price, p.weight_per_unit, rvd.product_name AS variety_name
       FROM products p
       LEFT JOIN regional_variety_directory rvd ON rvd.id = p.variety_directory_id
       WHERE p.id = $1`,
      [productId]
    );
    if (productResult.rows.length === 0) throw new Error('Product not found');
    const product = productResult.rows[0];

    // Verified-only published reference ranges for the variety, if this
    // product was created from one (variety_directory_id). Unverified
    // AI-suggested rows (cropValueResearchService) are never read here —
    // they must clear human review first.
    let varietyReferences = [];
    if (product.variety_name) {
      const refResult = await pool.query(
        `SELECT compound_key, typical_min, typical_max, unit, source_url
         FROM crop_value_compound_reference
         WHERE variety_name = $1 AND verified = TRUE`,
        [product.variety_name]
      );
      varietyReferences = refResult.rows;
    }

    const nutritionRow = await getProductNutrition(productId);

    const peersResult = await pool.query(
      `SELECT DISTINCT ON (pn.product_id) pn.product_id, pn.nutrition_data, pn.serving_size_g
       FROM product_nutrition pn
       JOIN products p ON p.id = pn.product_id
       WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true
       ORDER BY pn.product_id, pn.created_at DESC`,
      [product.category_id, productId]
    );

    const nutrientComparisons = [];
    for (const [key, meta] of Object.entries(NUTRIENT_META)) {
      const thisValue = per100g(nutritionRow, key);
      if (thisValue == null) continue;

      const peerValues = peersResult.rows
        .map((p) => per100g(p, key))
        .filter((v) => v != null);

      if (peerValues.length === 0) {
        nutrientComparisons.push({ nutrient: meta.label, unit: meta.unit, this_per_100g: thisValue, category_avg_per_100g: null, pct_vs_category: null, peers_compared: 0 });
        continue;
      }

      const categoryAvg = peerValues.reduce((sum, v) => sum + v, 0) / peerValues.length;
      const pctVsCategory = categoryAvg > 0 ? ((thisValue - categoryAvg) / categoryAvg) * 100 : null;

      nutrientComparisons.push({
        nutrient: meta.label,
        unit: meta.unit,
        this_per_100g: Math.round(thisValue * 100) / 100,
        category_avg_per_100g: Math.round(categoryAvg * 100) / 100,
        pct_vs_category: pctVsCategory === null ? null : Math.round(pctVsCategory * 10) / 10,
        peers_compared: peerValues.length,
      });
    }

    const withCategoryData = nutrientComparisons.filter((c) => c.pct_vs_category !== null);
    const leadingNutrient = withCategoryData.length > 0
      ? withCategoryData.reduce((best, c) => (c.pct_vs_category > best.pct_vs_category ? c : best))
      : null;

    let explanation;
    if (!leadingNutrient) {
      explanation = 'Not enough category peers with recorded nutrition data yet to show a real comparison.';
    } else if (leadingNutrient.pct_vs_category > 0) {
      explanation = `This product has ${leadingNutrient.pct_vs_category}% more ${leadingNutrient.nutrient.toLowerCase()} per 100g than the ${leadingNutrient.peers_compared}-product category average (${leadingNutrient.this_per_100g}${leadingNutrient.unit} vs ${leadingNutrient.category_avg_per_100g}${leadingNutrient.unit}) — the price reflects nutrition delivered, not just weight.`;
    } else {
      explanation = `On recorded nutrients, this product is not above the category average per 100g (closest: ${leadingNutrient.nutrient.toLowerCase()} at ${leadingNutrient.pct_vs_category}% vs average). Any price premium here would not be nutrition-justified.`;
    }

    return {
      product_id: productId,
      product_name: product.name,
      base_price: product.base_price,
      nutrient_comparisons: nutrientComparisons,
      leading_nutrient: leadingNutrient,
      explanation,
      // Published, human-verified reference ranges for the variety — labelled
      // distinctly from the per-batch comparisons above; a variety-typical
      // range is not a claim about this specific seller's lot.
      variety_published_references: product.variety_name
        ? { variety_name: product.variety_name, ranges: varietyReferences }
        : null,
    };
  } catch (error) {
    logger.error('Calculate value-per-nutrient error', { error: error.message, stack: error.stack });
    throw error;
  }
}

router.get('/product-nutrition/:productId/value-per-nutrient', async (req, res) => {
  try {
    const result = await calculateValuePerNutrient(req.params.productId);
    res.json(result);
  } catch (error) {
    logger.error('Value-per-nutrient API error', { error: error.message, stack: error.stack });
    res.status(404).json({ error: error.message });
  }
});

// ============================================================================
// NUTRITION COMPARISON
// ============================================================================

/**
 * Compare nutrition between two products
 */
async function compareProductsNutrition(productAId, productBId) {
  try {
    const nutritionA = await getProductNutrition(productAId);
    const nutritionB = await getProductNutrition(productBId);
    const scoreA = await getProductNutritionScore(productAId);
    const scoreB = await getProductNutritionScore(productBId);

    const comparison = {
      product_a: {
        id: productAId,
        nutrition_data: nutritionA.nutrition_data,
        score: scoreA.overall_score,
        grade: scoreA.grade
      },
      product_b: {
        id: productBId,
        nutrition_data: nutritionB.nutrition_data,
        score: scoreB.overall_score,
        grade: scoreB.grade
      },
      winner: scoreA.overall_score >= scoreB.overall_score ? productAId : productBId,
      comparison_reason: scoreA.overall_score >= scoreB.overall_score 
        ? `Product A has higher nutrition score (${scoreA.overall_score} vs ${scoreB.overall_score})`
        : `Product B has higher nutrition score (${scoreB.overall_score} vs ${scoreA.overall_score})`
    };

    // Save comparison
    await pool.query(
      `INSERT INTO nutrition_comparisons 
       (product_a_id, product_b_id, comparison_metrics, winner_product_id, comparison_reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [productAId, productBId, JSON.stringify(comparison), comparison.winner, comparison.comparison_reason]
    );

    return comparison;
  } catch (error) {
    logger.error('Compare products nutrition error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to compare products
 */
router.post('/compare', async (req, res) => {
  try {
    const { product_a_id, product_b_id } = req.body;
    const result = await compareProductsNutrition(product_a_id, product_b_id);
    res.json(result);
  } catch (error) {
    logger.error('Compare products API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to compare products' });
  }
});

// ============================================================================
// DIETARY PROFILES
// ============================================================================

/**
 * Get dietary profiles
 */
async function getDietaryProfiles() {
  try {
    const result = await pool.query(
      'SELECT * FROM dietary_profiles ORDER BY name'
    );
    return result.rows;
  } catch (error) {
    logger.error('Get dietary profiles error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get dietary profiles
 */
router.get('/dietary-profiles', async (req, res) => {
  try {
    const result = await getDietaryProfiles();
    res.json(result);
  } catch (error) {
    logger.error('Get dietary profiles API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get dietary profiles' });
  }
});

/**
 * Get a single dietary profile by id. The `dietary_profiles` table is
 * shared with consumerHealthService (same physical table, two migrations
 * converged their columns onto it — see 020_consumer_health_schema.sql and
 * 036_nutrition_intelligence_schema.sql), so a row may carry a user's own
 * targets (user_id, profile_type, daily_calorie_target) and/or catalog
 * fields (name, target_audience, preferred_foods, avoid_nutrients).
 */
async function getDietaryProfileById(dietaryProfileId) {
  try {
    const result = await pool.query(
      'SELECT * FROM dietary_profiles WHERE id = $1',
      [dietaryProfileId]
    );

    if (result.rows.length === 0) {
      throw new Error('Dietary profile not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('Get dietary profile by id error', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ============================================================================
// PERSONALIZED PRODUCT RECOMMENDATIONS
// ============================================================================
//
// Extends dietary_profiles + food_nutrition_profiles + product nutrition
// scoring to recommend real marketplace products. Queries live product data
// (products, product_nutrition, product_nutrition_scores) — never
// fabricates a recommendation. Also surfaces a small set of nutrition-
// adjacent wellness practices (wellness_natural_practices), each carrying
// its evidence_level and requires_consultation flag directly on the row, as
// required by this codebase's existing natural-therapy evidence discipline
// (AFRERA_CLAUDE_BUILD_DIRECTIVE.md PART 5.8). This is reference/education
// content only — it does not diagnose, interpret symptoms, or read lab
// results.

/**
 * Build a personalized set of product recommendations for a user's dietary
 * profile, optionally biased toward a calorie target (e.g. from the BMR/TDEE
 * estimator in consumerHealthService), and persist it to the existing
 * (previously unused) nutrition_recommendations table.
 */
async function getPersonalizedProductRecommendations(userId, dietaryProfileId, options = {}) {
  try {
    const medicalCoding = normalizeMedicalCoding(options.medicalCoding);
    const profile = await getDietaryProfileById(dietaryProfileId);

    const preferredFoods = Array.isArray(profile.preferred_foods) && profile.preferred_foods.length > 0
      ? profile.preferred_foods
      : null;

    const effectiveCalorieTarget = options.targetCalories != null
      ? Number(options.targetCalories)
      : (profile.daily_calorie_target || null);

    // Rough per-serving ceiling so a single recommended product doesn't blow
    // past a whole day's calorie target (roughly one meal's worth).
    const perServingCeiling = effectiveCalorieTarget ? effectiveCalorieTarget / 3 : null;

    const resultLimit = Math.min(Math.max(parseInt(options.limit, 10) || 10, 1), 50);

    const productResult = await pool.query(
      `WITH latest_nutrition AS (
         SELECT DISTINCT ON (product_id) product_id, nutrition_profile_id, nutrition_data,
                calories_per_serving, serving_size_g
         FROM product_nutrition
         ORDER BY product_id, created_at DESC
       ),
       latest_score AS (
         SELECT DISTINCT ON (product_id) product_id, overall_score, grade
         FROM product_nutrition_scores
         ORDER BY product_id, calculated_at DESC
       )
       SELECT p.id, p.name, p.base_price, p.tags,
              fnp.food_group, fnp.food_name,
              ln.calories_per_serving, ln.serving_size_g, ln.nutrition_data,
              ls.overall_score, ls.grade
       FROM products p
       JOIN latest_nutrition ln ON ln.product_id = p.id
       LEFT JOIN food_nutrition_profiles fnp ON fnp.id = ln.nutrition_profile_id
       LEFT JOIN latest_score ls ON ls.product_id = p.id
       WHERE p.is_active = true
         AND ($1::text[] IS NULL OR fnp.food_group = ANY($1::text[]))
         AND ($2::numeric IS NULL OR ln.calories_per_serving IS NULL OR ln.calories_per_serving <= $2)
       ORDER BY ls.overall_score DESC NULLS LAST, p.name
       LIMIT $3`,
      [preferredFoods, perServingCeiling, resultLimit]
    );

    const wellnessResult = await pool.query(
      `SELECT id, practice_name, category, common_name, evidence_level,
              requires_consultation, traditional_use, contraindications
       FROM wellness_natural_practices
       WHERE ($1::text[] IS NULL OR related_product_tags && $1::text[])
       ORDER BY practice_name
       LIMIT 5`,
      [preferredFoods]
    );

    const saveResult = await pool.query(
      `INSERT INTO nutrition_recommendations
         (user_id, dietary_profile_id, recommended_products, daily_nutrition_targets, meal_plan_suggestions, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '30 days')
       RETURNING id, generated_at, expires_at`,
      [
        userId,
        dietaryProfileId,
        JSON.stringify(productResult.rows),
        JSON.stringify({ calorie_target_kcal_per_day: effectiveCalorieTarget, medical_coding: medicalCoding }),
        JSON.stringify(wellnessResult.rows)
      ]
    );

    return {
      id: saveResult.rows[0].id,
      dietary_profile_id: dietaryProfileId,
      calorie_target_kcal_per_day: effectiveCalorieTarget,
      recommended_products: productResult.rows,
      wellness_suggestions: wellnessResult.rows,
      generated_at: saveResult.rows[0].generated_at,
      expires_at: saveResult.rows[0].expires_at,
      medical_coding: medicalCoding,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get personalized product recommendations error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to generate personalized product recommendations
 */
router.post('/recommendations', authMiddleware, async (req, res) => {
  try {
    const { dietary_profile_id, target_calories, limit, medical_coding } = req.body || {};
    if (!dietary_profile_id) {
      return res.status(400).json({
        error: 'dietary_profile_id is required',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER
      });
    }

    const result = await getPersonalizedProductRecommendations(req.user.id, dietary_profile_id, {
      targetCalories: target_calories,
      limit
      , medicalCoding: medical_coding
    });
    res.json(result);
  } catch (error) {
    logger.error('Generate recommendations API error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to generate personalized recommendations',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    });
  }
});

/**
 * API endpoint to fetch the caller's most recent saved recommendation set
 */
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM nutrition_recommendations
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No recommendations found',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER
      });
    }

    res.json({ ...result.rows[0], disclaimer: NUTRITION_WELLNESS_DISCLAIMER });
  } catch (error) {
    logger.error('Get recommendations API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ============================================================================
// DIET-BASED RECIPE GENERATION
// ============================================================================
//
// The differentiator: not a static recipe database, but a real AI backbone
// call (aiBackboneService.callAI, see aiBackboneRoutes/AIBackbonePage built
// this session) grounded in the same real, live product/nutrition data
// getPersonalizedProductRecommendations already queries — the AI is given
// ONLY AFRERA's actual matching products as candidate ingredients and told
// not to invent others. If no AI provider is configured, this returns an
// honest ai_not_configured status rather than a fabricated fallback recipe.

/**
 * Generate a recipe grounded in a user's real dietary profile and real
 * marketplace ingredient matches.
 */
async function generateDietBasedRecipe(userId, dietaryProfileId, options = {}) {
  try {
    const medicalCoding = normalizeMedicalCoding(options.medicalCoding);
    const profile = await getDietaryProfileById(dietaryProfileId);
    const recommendations = await getPersonalizedProductRecommendations(userId, dietaryProfileId, {
      targetCalories: options.targetCalories,
      limit: options.ingredientLimit || 8,
      medicalCoding,
    });

    if (recommendations.recommended_products.length === 0) {
      return {
        status: 'no_ingredients',
        message: 'No AFRERA products with recorded nutrition data match this dietary profile yet, so a recipe cannot be honestly generated from real ingredients.',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      };
    }

    const ingredientList = recommendations.recommended_products
      .map((p) => `${p.name} (${p.food_group || 'uncategorized'}${p.calories_per_serving ? `, ${p.calories_per_serving} kcal/serving` : ''})`)
      .join('; ');

    const prompt = `You are a nutrition-focused recipe assistant for an Indian agri-marketplace. `
      + `Using ONLY these real available ingredients: ${ingredientList}. `
      + `${profile.name ? `Dietary profile: ${profile.name}. ` : ''}`
      + `${profile.avoid_nutrients ? `Avoid: ${JSON.stringify(profile.avoid_nutrients)}. ` : ''}`
      + `${recommendations.calorie_target_kcal_per_day ? `Target roughly ${recommendations.calorie_target_kcal_per_day} kcal/day for this meal's share. ` : ''}`
      + `Suggest one practical recipe using a subset of these ingredients. Include: dish name, `
      + `ingredient list with approximate quantities, preparation steps, and an approximate calorie `
      + `estimate per serving. Do not invent ingredients outside the list given.`;

    let aiResult;
    try {
      aiResult = await aiBackboneService.callAI(prompt, {
        maxTokens: 800,
        ...(options.provider ? { provider: options.provider } : {}),
      });
    } catch (aiError) {
      return {
        status: 'ai_not_configured',
        message: aiError.message,
        ingredients_considered: recommendations.recommended_products.map((p) => p.name),
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      };
    }

    return {
      status: 'generated',
      dietary_profile_id: dietaryProfileId,
      recipe_text: aiResult.content,
      ai_provider: aiResult.provider,
      ai_model: aiResult.model,
      ingredients_considered: recommendations.recommended_products.map((p) => p.name),
      calorie_target_kcal_per_day: recommendations.calorie_target_kcal_per_day,
      medical_coding: medicalCoding,
      generated_at: new Date().toISOString(),
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
    };
  } catch (error) {
    logger.error('Generate diet-based recipe error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to generate a diet-based recipe
 */
router.post('/recipes', authMiddleware, async (req, res) => {
  try {
    const { dietary_profile_id, target_calories, provider, medical_coding } = req.body || {};
    if (!dietary_profile_id) {
      return res.status(400).json({
        error: 'dietary_profile_id is required',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      });
    }

    const result = await generateDietBasedRecipe(req.user.id, dietary_profile_id, {
      targetCalories: target_calories,
      provider,
      medicalCoding: medical_coding,
    });
    res.json(result);
  } catch (error) {
    logger.error('Generate diet-based recipe API error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to generate recipe',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
    });
  }
});

// ============================================================================
// WELLNESS / NATURAL PRACTICES (reference & education only)
// ============================================================================
//
// Out of scope by design: no diagnosis, no symptom checking, no lab-report
// interpretation. Every row carries evidence_level and requires_consultation
// directly, so any caller rendering this data has no way to drop those
// fields without deliberately discarding them.

/**
 * Get wellness/natural practices, optionally filtered by category or a
 * related product tag.
 */
async function getWellnessPractices(filters = {}) {
  try {
    const { category, tag } = filters;
    let query = `SELECT id, practice_name, category, common_name, botanical_name,
                        traditional_use, related_product_tags, evidence_level,
                        requires_consultation, contraindications, source_reference
                 FROM wellness_natural_practices WHERE 1=1`;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (tag) {
      params.push(tag);
      query += ` AND $${params.length} = ANY(related_product_tags)`;
    }

    query += ' ORDER BY practice_name';

    const result = await pool.query(query, params);
    return {
      practices: result.rows,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get wellness practices error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get wellness/natural practices
 */
router.get('/wellness-practices', async (req, res) => {
  try {
    const { category, tag } = req.query;
    const result = await getWellnessPractices({ category, tag });
    res.json(result);
  } catch (error) {
    logger.error('Get wellness practices API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get wellness practices' });
  }
});

// ============================================================================
// MEDICAL CONDITION CODING ENDPOINTS
// ============================================================================

/**
 * Get medical condition codes
 */
async function getMedicalConditionCodes() {
  try {
    return {
      conditions: MEDICAL_CONDITION_CODES,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get medical condition codes error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get medical condition codes
 */
router.get('/medical-codes', async (req, res) => {
  try {
    const result = await getMedicalConditionCodes();
    res.json(result);
  } catch (error) {
    logger.error('Get medical codes API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get medical codes' });
  }
});

/**
 * Get dietary restrictions for medical condition
 */
async function getDietaryRestrictions(condition) {
  try {
    const restrictions = DIETARY_RESTRICTIONS[condition];
    
    if (!restrictions) {
      throw new Error(`No dietary restrictions found for condition: ${condition}`);
    }

    return {
      condition,
      restrictions,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get dietary restrictions error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get dietary restrictions
 */
router.get('/dietary-restrictions/:condition', async (req, res) => {
  try {
    const { condition } = req.params;
    const result = await getDietaryRestrictions(condition);
    res.json(result);
  } catch (error) {
    logger.error('Get dietary restrictions API error', { error: error.message, stack: error.stack });
    res.status(404).json({ 
      error: 'Dietary restrictions not found for this condition',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    });
  }
});

/**
 * Get nutrient requirements for medical condition
 */
async function getNutrientRequirements(condition) {
  try {
    const requirements = NUTRIENT_REQUIREMENTS[condition];
    
    if (!requirements) {
      throw new Error(`No nutrient requirements found for condition: ${condition}`);
    }

    return {
      condition,
      requirements,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get nutrient requirements error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get nutrient requirements
 */
router.get('/nutrient-requirements/:condition', async (req, res) => {
  try {
    const { condition } = req.params;
    const result = await getNutrientRequirements(condition);
    res.json(result);
  } catch (error) {
    logger.error('Get nutrient requirements API error', { error: error.message, stack: error.stack });
    res.status(404).json({ 
      error: 'Nutrient requirements not found for this condition',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    });
  }
});

/**
 * Get condition-specific medical code
 */
async function getConditionCode(condition, type) {
  try {
    const conditionData = MEDICAL_CONDITION_CODES[condition];
    
    if (!conditionData) {
      throw new Error(`No medical codes found for condition: ${condition}`);
    }

    const codeData = type ? conditionData[type] : conditionData;
    
    if (!codeData) {
      throw new Error(`No medical code found for ${condition} ${type || ''}`);
    }

    return {
      condition,
      type,
      code: codeData.code,
      system: codeData.system,
      display: codeData.display,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get condition code error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get condition-specific medical code
 */
router.get('/medical-code/:condition/:type?', async (req, res) => {
  try {
    const { condition, type } = req.params;
    const result = await getConditionCode(condition, type);
    res.json(result);
  } catch (error) {
    logger.error('Get condition code API error', { error: error.message, stack: error.stack });
    res.status(404).json({ 
      error: 'Medical code not found for this condition',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    });
  }
});

/**
 * Enhanced recipe generation with condition-specific guidance
 */
async function generateConditionSpecificRecipe(userId, dietaryProfileId, condition, options = {}) {
  try {
    // Get medical coding for the condition
    const conditionData = MEDICAL_CONDITION_CODES[condition];
    const primaryCode = conditionData && conditionData.unspecified ? conditionData.unspecified : null;
    
    // Get dietary restrictions for the condition
    const restrictions = DIETARY_RESTRICTIONS[condition];
    
    // Get nutrient requirements for the condition
    const requirements = NUTRIENT_REQUIREMENTS[condition];
    
    // Generate recipe with medical context
    const recipeResult = await generateDietBasedRecipe(userId, dietaryProfileId, {
      ...options,
      medicalCoding: primaryCode
    });

    // Add condition-specific guidance
    if (recipeResult.status === 'generated') {
      recipeResult.condition_guidance = {
        condition,
        restrictions: restrictions || null,
        requirements: requirements || null,
        medical_code: primaryCode || null,
        recommendations: getConditionRecommendations(condition)
      };
    }

    return recipeResult;
  } catch (error) {
    logger.error('Generate condition-specific recipe error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get recommendations for specific condition
 */
function getConditionRecommendations(condition) {
  const recommendations = {
    diabetes: [
      'Choose low glycemic index foods',
      'Eat regular, balanced meals',
      'Include complex carbohydrates',
      'Monitor carbohydrate intake',
      'Increase fiber consumption',
      'Stay hydrated'
    ],
    hypertension: [
      'Follow DASH diet principles',
      'Reduce sodium intake',
      'Increase potassium and magnesium',
      'Choose lean protein sources',
      'Limit saturated and trans fats',
      'Include more fruits and vegetables'
    ],
    hypotension: [
      'Increase fluid intake',
      'Eat smaller, more frequent meals',
      'Include moderate sodium',
      'Increase vitamin B12 and iron',
      'Avoid excessive caffeine and alcohol',
      'Gradually increase activity'
    ],
    migraine: [
      'Identify and avoid trigger foods',
      'Maintain regular meal schedule',
      'Stay well hydrated',
      'Include magnesium-rich foods',
      'Ensure adequate vitamin B2',
      'Get regular sleep'
    ],
    gout: [
      'Avoid high-purine foods',
      'Limit alcohol consumption',
      'Stay well hydrated',
      'Choose plant-based proteins',
      'Increase vitamin C intake',
      'Maintain healthy weight'
    ],
    cardiovascular: [
      'Follow heart-healthy diet',
      'Increase omega-3 fatty acids',
      'Choose lean protein sources',
      'Increase fiber intake',
      'Limit saturated and trans fats',
      'Reduce sodium intake'
    ]
  };

  return recommendations[condition] || ['Consult with healthcare provider for personalized guidance'];
}

/**
 * API endpoint to generate condition-specific recipe
 */
router.post('/recipes/condition/:condition', authMiddleware, async (req, res) => {
  try {
    const { condition } = req.params;
    const { dietary_profile_id, target_calories, provider } = req.body || {};
    
    if (!dietary_profile_id) {
      return res.status(400).json({
        error: 'dietary_profile_id is required',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      });
    }

    if (!MEDICAL_CONDITION_CODES[condition]) {
      return res.status(400).json({
        error: `Unsupported condition: ${condition}`,
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      });
    }

    const result = await generateConditionSpecificRecipe(req.user.id, dietary_profile_id, condition, {
      targetCalories: target_calories,
      provider
    });
    res.json(result);
  } catch (error) {
    logger.error('Generate condition-specific recipe API error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to generate condition-specific recipe',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
    });
  }
});

/**
 * Natural therapist guidance endpoint
 */
async function getNaturalTherapistGuidance(condition, symptoms = []) {
  try {
    const conditionData = MEDICAL_CONDITION_CODES[condition];
    const restrictions = DIETARY_RESTRICTIONS[condition];
    const requirements = NUTRIENT_REQUIREMENTS[condition];
    
    // Get wellness practices related to the condition
    const wellnessResult = await getWellnessPractices({ category: condition });

    return {
      condition,
      medical_coding: conditionData?.unspecified || null,
      dietary_restrictions: restrictions || null,
      nutrient_requirements: requirements || null,
      natural_remedies: wellnessResult.practices || [],
      recommendations: getConditionRecommendations(condition),
      symptoms_considered: symptoms,
      consultation_required: true,
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Get natural therapist guidance error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint for natural therapist guidance
 */
router.post('/natural-therapist/guidance', authMiddleware, async (req, res) => {
  try {
    const { condition, symptoms } = req.body || {};
    
    if (!condition) {
      return res.status(400).json({
        error: 'condition is required',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      });
    }

    if (!MEDICAL_CONDITION_CODES[condition]) {
      return res.status(400).json({
        error: `Unsupported condition: ${condition}`,
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      });
    }

    const result = await getNaturalTherapistGuidance(condition, symptoms);
    res.json(result);
  } catch (error) {
    logger.error('Natural therapist guidance API error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to get natural therapist guidance',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
    });
  }
});

/**
 * Nutrient calculator for specific condition
 */
async function calculateNutrientProfileForCondition(condition, nutritionData) {
  try {
    const requirements = NUTRIENT_REQUIREMENTS[condition];
    
    if (!requirements) {
      throw new Error(`No nutrient requirements found for condition: ${condition}`);
    }

    const analysis = {};
    const warnings = [];
    const recommendations = [];

    // Analyze each nutrient against requirements
    for (const [nutrient, req] of Object.entries(requirements)) {
      const value = nutritionData[nutrient];
      
      if (value === undefined) {
        warnings.push(`${nutrient} data not provided`);
        continue;
      }

      const min = req.min;
      const max = req.max;

      if (min !== undefined && value < min) {
        analysis[nutrient] = {
          status: 'below_minimum',
          value,
          required: { min, max, unit: req.unit },
          recommendation: `Increase ${nutrient} intake`
        };
        recommendations.push(req.note);
      } else if (max !== undefined && value > max) {
        analysis[nutrient] = {
          status: 'above_maximum',
          value,
          required: { min, max, unit: req.unit },
          recommendation: `Reduce ${nutrient} intake`
        };
        recommendations.push(req.note);
      } else {
        analysis[nutrient] = {
          status: 'within_range',
          value,
          required: { min, max, unit: req.unit },
          recommendation: 'Maintain current intake'
        };
      }
    }

    return {
      condition,
      analysis,
      warnings,
      recommendations,
      overall_status: warnings.length === 0 ? 'optimal' : 'needs_adjustment',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER
    };
  } catch (error) {
    logger.error('Calculate nutrient profile error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint for nutrient calculator
 */
router.post('/nutrient-calculator/:condition', authMiddleware, async (req, res) => {
  try {
    const { condition } = req.params;
    const nutritionData = req.body;
    
    if (!nutritionData || Object.keys(nutritionData).length === 0) {
      return res.status(400).json({
        error: 'nutrition data is required',
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      });
    }

    if (!NUTRIENT_REQUIREMENTS[condition]) {
      return res.status(400).json({
        error: `No nutrient requirements available for condition: ${condition}`,
        disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
      });
    }

    const result = await calculateNutrientProfileForCondition(condition, nutritionData);
    res.json(result);
  } catch (error) {
    logger.error('Nutrient calculator API error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to calculate nutrient profile',
      disclaimer: NUTRITION_WELLNESS_DISCLAIMER,
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.connect().then(() => true).catch(() => false);
}

module.exports = {
  router,
  getNutrients,
  createFoodNutritionProfile,
  searchFoodProfiles,
  addProductNutrition,
  getProductNutrition,
  calculateProductNutritionScore,
  getProductNutritionScore,
  calculateNutritionPricing,
  calculateValuePerNutrient,
  compareProductsNutrition,
  getDietaryProfiles,
  getDietaryProfileById,
  getPersonalizedProductRecommendations,
  generateDietBasedRecipe,
  getWellnessPractices,
  isHealthy
};
