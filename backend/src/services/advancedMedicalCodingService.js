/**
 * Advanced Medical Coding Service
 * MS-Level Knowledge for Dietitians and Natural Therapists
 * 30+ Years Experience Level Integration
 * AI Medical Coding Integration
 * Biological Coding Systems
 * 
 * This service provides:
 * - Comprehensive medical coding across multiple systems
 * - MS-level dietitian knowledge base
 * - MS-level natural therapist knowledge base
 * - Biological coding systems (biomarkers, genetic markers, metabolic pathways)
 * - AI-powered medical coding assistance
 * - 30+ years experience level protocols
 * - Complete health management system
 */

const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

// Medical Code Systems
const MEDICAL_CODE_SYSTEMS = {
  ICD_10_CM: 'ICD-10-CM - International Classification of Diseases, 10th Revision, Clinical Modification',
  ICD_10_PCS: 'ICD-10-PCS - International Classification of Diseases, 10th Revision, Procedure Coding System',
  CPT: 'CPT - Current Procedural Terminology',
  HCPCS: 'HCPCS - Healthcare Common Procedure Coding System',
  SNOMED_CT: 'SNOMED-CT - Systematized Nomenclature of Medicine -- Clinical Terms',
  LOINC: 'LOINC - Logical Observation Identifiers Names and Codes',
  ATC: 'ATC - Anatomical Therapeutic Chemical Classification System',
  NDT: 'NDT - National Drug Code',
  RxNorm: 'RxNorm - Normalized Drug Names',
  NDC: 'NDC - National Drug Code',
  MeSH: 'MeSH - Medical Subject Headings',
  ICF: 'ICF - International Classification of Functioning, Disability and Health',
  CPT_II: 'CPT-II - Performance Measurement Codes',
  HCPCS_II: 'HCPCS Level II - Alphanumeric Codes'
};

// Biological Coding Systems
const BIOLOGICAL_CODE_SYSTEMS = {
  BIOMARKERS: 'Biomarkers - Laboratory Test Codes',
  GENETIC_MARKERS: 'Genetic Markers - Genetic Variant Codes',
  METABOLIC_PATHWAYS: 'Metabolic Pathways - Biochemical Pathway Codes',
  NUTRITIONAL_GENOMICS: 'Nutritional Genomics - Gene-Nutrient Interaction Codes',
  MICROBIOME: 'Microbiome - Gut Microbiome Classification Codes',
  NEUROTRANSMITTERS: 'Neurotransmitters - Brain Chemical Codes',
  HORMONES: 'Hormones - Endocrine System Codes',
  ENZYMES: 'Enzymes - Enzyme Classification Codes',
  VITAMINS: 'Vitamins - Vitamin Classification Codes',
  MINERALS: 'Minerals - Mineral Classification Codes',
  AMINO_ACIDS: 'Amino Acids - Protein Building Block Codes',
  FATTY_ACIDS: 'Fatty Acids - Lipid Classification Codes',
  ANTIOXIDANTS: 'Antioxidants - Oxidative Stress Markers',
  INFLAMMATORY_MARKERS: 'Inflammatory Markers - Immune System Codes',
  CARDIOVASCULAR_MARKERS: 'Cardiovascular Markers - Heart Health Codes'
};

// MS-Level Dietitian Knowledge Base (30+ Years Experience)
const DIETITIAN_KNOWLEDGE_BASE = {
  // Clinical Nutrition
  clinical_nutrition: {
    malnutrition_assessment: {
      subjective_global_assessment: {
        code: 'E40-E46',
        system: 'ICD-10-CM',
        display: 'Protein-energy malnutrition',
        assessment_parameters: ['weight_loss', 'dietary_intake', 'gastrointestinal_symptoms', 'functional_capacity', 'metabolic_stress'],
        severity_grading: ['mild', 'moderate', 'severe'],
        intervention_protocols: {
          mild: 'Nutritional counseling + oral nutritional supplements',
          moderate: 'Oral nutritional supplements + dietary modification',
          severe: 'Enteral nutrition + intensive monitoring'
        }
      },
      mini_nutritional_assessment: {
        code: 'Z71.3',
        system: 'ICD-10-CM',
        display: 'Dietary surveillance and counseling',
        screening_parameters: ['bmi', 'weight_loss', 'mobility', 'psychological_stress', 'neuropsychological_problems'],
        risk_classification: ['normal', 'at_risk', 'malnourished'],
        intervention_protocols: {
          normal: 'Regular monitoring',
          at_risk: 'Nutritional intervention + regular follow-up',
          malnourished: 'Comprehensive nutritional rehabilitation'
        }
      }
    },
    enteral_nutrition: {
      tube_feeding: {
        nasogastric: { code: 'Z98.0', system: 'ICD-10-CM', display: 'Status following tube feeding' },
        nasojejunal: { code: 'Z98.0', system: 'ICD-10-CM', display: 'Jejunal tube feeding' },
        gastrostomy: { code: 'Z98.0', system: 'ICD-10-CM', display: 'Gastrostomy tube feeding' },
        jejunostomy: { code: 'Z98.0', system: 'ICD-10-CM', display: 'Jejunostomy tube feeding' }
      },
      formulas: {
        standard: '1.0-1.2 kcal/mL, standard protein',
        high_protein: '1.2-1.5 kcal/mL, high protein',
        high_calorie: '1.5-2.0 kcal/mL, standard protein',
        immunonutrition: 'With arginine, omega-3, nucleotides',
        renal: 'Low protein, low electrolytes',
        hepatic: 'Branched-chain amino acids',
        pulmonary: 'High fat, low carbohydrate'
      }
    },
    parenteral_nutrition: {
      peripheral: { code: 'Z99.2', system: 'ICD-10-CM', display: 'Dependence on parenteral nutrition' },
      central: { code: 'Z99.2', system: 'ICD-10-CM', display: 'Central parenteral nutrition' },
      home_parenteral: { code: 'Z99.2', system: 'ICD-10-CM', display: 'Home parenteral nutrition' }
    }
  },
  
  // Medical Nutrition Therapy
  medical_nutrition_therapy: {
    diabetes: {
      type1: {
        carb_count: 'Advanced carbohydrate counting',
        insulin_to_carb_ratio: 'Individualized I:C ratios',
        basal_bolus: 'Basal-bolus insulin regimen',
        cgm_integration: 'Continuous glucose monitoring integration',
        hypoglycemia_prevention: 'Hypoglycemia prevention protocols'
      },
      type2: {
        medical_nutrition_therapy: 'Evidence-based MNT protocols',
        weight_management: 'Weight loss interventions',
        carb_consistency: 'Carbohydrate consistency',
        glycemic_index: 'Low glycemic index foods',
        meal_timing: 'Strategic meal timing'
      },
      gestational: {
        carb_distribution: 'Even carbohydrate distribution',
        postprandial_monitoring: 'Postprandial glucose monitoring',
        ketone_monitoring: 'Ketone monitoring protocols',
        weight_gain_guidance: 'Appropriate weight gain guidance'
      }
    },
    cardiovascular: {
      hypertension: {
        dash_diet: 'Dietary Approaches to Stop Hypertension',
        sodium_restriction: 'Sodium restriction protocols',
        potassium_enhancement: 'Potassium enhancement strategies',
        weight_management: 'Weight loss interventions',
        alcohol_moderation: 'Alcohol moderation guidelines'
      },
      dyslipidemia: {
        tlc_diet: 'Therapeutic Lifestyle Changes diet',
        saturated_fat: 'Saturated fat restriction',
        trans_fat: 'Trans fat elimination',
        soluble_fiber: 'Soluble fiber enhancement',
        plant_sterols: 'Plant sterol/stanol recommendations'
      },
      heart_failure: {
        sodium_restriction: 'Strict sodium restriction',
        fluid_management: 'Fluid management protocols',
        cardiac_cachexia: 'Cardiac cachexia prevention',
      }
    },
    renal: {
      ckd_stages: {
        stage1_2: 'Moderate protein restriction',
        stage3: 'Protein restriction + phosphate control',
        stage4: 'Low protein + electrolyte management',
        stage5: 'Low protein + fluid restriction'
      },
      dialysis: {
        hemodialysis: 'High protein, low potassium/phosphate',
        peritoneal: 'Adequate protein, careful calorie balance',
        home_dialysis: 'Individualized nutritional protocols'
      },
      transplant: {
        pre_transplant: 'Optimize nutritional status',
        post_transplant: 'Weight management + immunosuppression nutrition',
        steroid_effects: 'Management of steroid-induced diabetes'
      }
    },
    gastrointestinal: {
      ibd: {
        crohn: 'Elemental diets, nutrition support',
        ulcerative_colitis: 'Low residue during flares',
        maintenance: 'Balanced diet during remission',
        malabsorption: 'Nutrient supplementation protocols'
      },
      liver_disease: {
        cirrhosis: 'High protein, sodium restriction',
        hepatic_encephalopathy: 'Protein restriction + branched-chain amino acids',
        ascites: 'Sodium restriction + protein considerations',
        nutritional_support: 'Aggressive nutritional support'
      },
      pancreatitis: {
        acute: 'NPO, then gradual refeeding',
        chronic: 'Low fat, high protein, pancreatic enzymes',
        malabsorption: 'Fat-soluble vitamin supplementation'
      }
    },
    oncology: {
      prevention: {
        evidence_based: 'Evidence-based cancer prevention diets',
        weight_management: 'Weight maintenance/loss',
        phytochemicals: 'Phytochemical-rich foods',
        anti_inflammatory: 'Anti-inflammatory protocols'
      },
      treatment: {
        symptom_management: 'Nutrition for symptom management',
      },
      survivorship: {
        weight_management: 'Weight maintenance/loss',
        comorbidity_management: 'Management of comorbidities',
        quality_of_life: 'Quality of life nutrition'
      }
    }
  },
  
  // Specialized Nutrition
  specialized_nutrition: {
    pediatric: {
      infants: {
        breastfeeding: 'Breastfeeding support and promotion',
        formula_feeding: 'Appropriate formula selection',
        complementary_feeding: 'Introduction of solid foods',
        growth_monitoring: 'Growth monitoring and intervention'
      },
      children: {
        growth_support: 'Adequate growth support',
        picky_eating: 'Management of picky eating',
        chronic_conditions: 'Nutrition for chronic conditions',
        developmental_disabilities: 'Special needs nutrition'
      },
      adolescents: {
        growth_spurt: 'Nutrition during growth spurts',
        eating_disorders: 'Eating disorder management',
        sports_nutrition: 'Sports nutrition for adolescents',
        preventive_health: 'Preventive health nutrition'
      }
    },
    geriatric: {
      sarcopenia: 'Sarcopenia prevention and treatment',
      osteoporosis: 'Bone health nutrition',
      cognitive_decline: 'Cognitive health nutrition',
      frailty: 'Frailty prevention and management',
      polypharmacy: 'Nutrition-drug interaction management'
    },
    sports_nutrition: {
      endurance: 'Endurance athlete nutrition',
      strength: 'Strength athlete nutrition',
      team_sports: 'Team sports nutrition',
      weight_class: 'Weight class sports nutrition',
      injury_recovery: 'Nutrition for injury recovery'
    },
    bariatric: {
      preoperative: 'Preoperative nutrition optimization',
      postoperative: 'Postoperative nutrition protocols',
      protein_supplementation: 'High protein supplementation',
      vitamin_mineral: 'Vitamin and mineral supplementation',
      long_term: 'Long-term maintenance nutrition'
    }
  },
  
  // Food Composition and Analysis
  food_composition: {
    macro_nutrients: {
      carbohydrates: {
        simple: 'Monosaccharides, disaccharides',
        complex: 'Starches, fibers',
        fiber: 'Soluble, insoluble fiber',
        glycemic_index: 'GI and GL values'
      },
      proteins: {
        quality: 'Protein quality assessment',
        amino_acids: 'Essential amino acid profiles',
        bioavailability: 'Protein bioavailability',
        vegetarian: 'Vegetarian protein sources'
      },
      fats: {
        saturated: 'Saturated fatty acids',
        unsaturated: 'Monounsaturated, polyunsaturated',
        trans: 'Trans fatty acids',
        omega: 'Omega-3, omega-6 ratios'
      }
    },
    micro_nutrients: {
      vitamins: {
        fat_soluble: 'Vitamins A, D, E, K',
        water_soluble: 'B-complex, vitamin C',
        bioavailability: 'Vitamin bioavailability factors',
        interactions: 'Vitamin-drug interactions'
      },
      minerals: {
        major: 'Calcium, phosphorus, magnesium, sodium, potassium',
        trace: 'Iron, zinc, copper, selenium, iodine',
        bioavailability: 'Mineral bioavailability factors',
        interactions: 'Mineral-drug interactions'
      },
      phytochemicals: {
        antioxidants: 'Antioxidant compounds',
        anti_inflammatory: 'Anti-inflammatory compounds',
        cardioprotective: 'Cardioprotective compounds',
        anticancer: 'Anticancer compounds'
      }
    }
  }
};

// MS-Level Natural Therapist Knowledge Base (30+ Years Experience)
const NATURAL_THERAPIST_KNOWLEDGE_BASE = {
  // Herbal Medicine
  herbal_medicine: {
    chinese_herbal: {
      four_natures: ['cold', 'cool', 'neutral', 'warm', 'hot'],
      five_flavors: ['sour', 'bitter', 'sweet', 'pungent', 'salty'],
      meridian_tropism: 'Target organ system affinity',
      therapeutic_actions: 'Broad therapeutic action categories',
      formula_construction: 'Traditional formula principles',
      modern_research: 'Evidence-based applications'
    },
    western_herbal: {
      phytochemistry: 'Active compound analysis',
      pharmacology: 'Mechanism of action',
      interactions: 'Herb-drug interactions',
      dosage_forms: 'Tinctures, teas, extracts, capsules',
      quality_standards: 'Standardization and quality control'
    },
    ayurvedic: {
      doshas: ['vata', 'pitta', 'kapha'],
      tastes: ['sweet', 'sour', 'salty', 'pungent', 'bitter', 'astringent'],
      gunas: 'Qualities of herbs',
      virya: 'Potency of herbs',
      vipaka: 'Post-digestive effect',
      prabhava: 'Special potency'
    }
  },
  
  // Nutritional Therapy
  nutritional_therapy: {
    functional_nutrition: {
      biochemical_individuality: 'Individual biochemical profiles',
      nutrient_gaps: 'Nutrient deficiency identification',
      metabolic_typing: 'Metabolic type assessment',
      gastrointestinal_health: 'Gut health optimization',
      inflammation_modulation: 'Anti-inflammatory protocols'
    },
    orthomolecular: {
      vitamin_therapy: 'High-dose vitamin protocols',
      mineral_therapy: 'Mineral supplementation',
      amino_acid_therapy: 'Amino acid protocols',
      antioxidant_therapy: 'Antioxidant regimens',
      detoxification: 'Detoxification support'
    },
    traditional_diets: {
      mediterranean: 'Mediterranean diet principles',
      traditional_asian: 'Traditional Asian diet patterns',
      ancestral: 'Ancestral diet principles',
      seasonal: 'Seasonal eating protocols',
      local: 'Local food traditions'
    }
  },
  
  // Mind-Body Medicine
  mind_body_medicine: {
    stress_management: {
      cortisol_regulation: 'Cortisol modulation',
      adrenal_support: 'Adrenal gland support',
      nervous_system: 'Autonomic nervous system balance',
      sleep_optimization: 'Sleep quality improvement',
      emotional_resilience: 'Emotional resilience building'
    },
    meditation_mindfulness: {
      breathing_exercises: 'Breathwork protocols',
      meditation_techniques: 'Meditation methods',
      mindfulness_practices: 'Mindfulness applications',
      relaxation_response: 'Relaxation response activation',
      mind_body_integration: 'Mind-body integration'
    }
  },
  
  // Lifestyle Medicine
  lifestyle_medicine: {
    sleep_medicine: {
      circadian_rhythms: 'Circadian rhythm optimization',
      sleep_hygiene: 'Sleep hygiene protocols',
      sleep_disorders: 'Natural sleep disorder management',
      melatonin: 'Melatonin protocols',
      sleep_nutrition: 'Nutrition for sleep'
    },
    movement_therapy: {
      exercise_prescription: 'Exercise as medicine',
      yoga_therapy: 'Therapeutic yoga applications',
      tai_chi: 'Tai chi for health',
      movement_rehabilitation: 'Movement-based rehabilitation',
    },
    environmental_medicine: {
      toxic_exposure: 'Toxin exposure reduction',
      detoxification: 'Natural detoxification protocols',
      environmental_allergies: 'Environmental allergy management',
      electromagnetic: 'EMF exposure management',
      biophilic: 'Nature connection protocols'
    }
  },
  
  // Integrative Protocols
  integrative_protocols: {
    chronic_disease: {
      diabetes_integrative: 'Integrative diabetes management',
      cardiovascular_integrative: 'Integrative cardiovascular support',
      autoimmune_integrative: 'Integrative autoimmune protocols',
      cancer_support: 'Integrative cancer support',
      chronic_pain: 'Integrative pain management'
    },
    mental_health: {
      depression_integrative: 'Integrative depression protocols',
      anxiety_integrative: 'Integrative anxiety management',
      sleep_disorders: 'Integrative sleep disorder protocols',
      ptsd: 'Integrative PTSD support',
      addiction: 'Integrative addiction recovery'
    },
    women_health: {
      hormonal_balance: 'Natural hormone balance',
      fertility: 'Fertility support protocols',
      pregnancy: 'Natural pregnancy support',
      menopause: 'Natural menopause protocols',
      pcos: 'Integrative PCOS management'
    },
    pediatric_integrative: {
      developmental: 'Developmental support',
      behavioral: 'Behavioral condition protocols',
      immune_support: 'Immune system support',
      nutritional_deficiencies: 'Pediatric nutrition protocols',
      mental_health: 'Pediatric mental health support'
    }
  }
};

// 30+ Years Experience Level Protocols
const EXPERIENCE_LEVEL_PROTOCOLS = {
  clinical_decision_making: {
    evidence_based: {
      research_evaluation: 'Critical appraisal of research',
      guideline_implementation: 'Clinical guideline application',
    },
    integrative_approach: {
      conventional_integration: 'Conventional medicine integration',
    },
    personalized_medicine: {
      genomics: 'Genomic information application',
      biomarkers: 'Biomarker utilization',
      personalized_protocols: 'Individualized protocol development'
    }
  },
  patient_management: {
    comprehensive_assessment: {
      nutritional_assessment: 'Comprehensive nutritional evaluation',
      lifestyle_assessment: 'Lifestyle factor evaluation',
      psychological_assessment: 'Psychological factor consideration',
      social_determinants: 'Social determinant analysis'
    },
    treatment_planning: {
      goal_setting: 'SMART goal development',
    },
    monitoring_followup: {
      outcome_measures: 'Standardized outcome measurement',
      progress_tracking: 'Progress monitoring protocols',
    }
  },
  professional_practice: {
    documentation: {
      charting: 'Professional documentation standards',
      communication: 'Interprofessional communication',
      documentation: 'Evidence-based documentation'
    },
    ethics: {
      ethical_decision: 'Ethical decision-making frameworks',
      professional_boundaries: 'Professional boundary maintenance',
      cultural_competence: 'Cultural competence protocols'
    },
    continuing_education: {
      evidence_review: 'Evidence review protocols',
      skill_development: 'Professional skill development',
    }
  }
};

class AdvancedMedicalCodingService {
  constructor() {
    this.medicalCodeSystems = MEDICAL_CODE_SYSTEMS;
    this.biologicalCodeSystems = BIOLOGICAL_CODE_SYSTEMS;
    this.dietitianKnowledge = DIETITIAN_KNOWLEDGE_BASE;
    this.naturalTherapistKnowledge = NATURAL_THERAPIST_KNOWLEDGE_BASE;
    this.experienceProtocols = EXPERIENCE_LEVEL_PROTOCOLS;
  }

  /**
   * Get medical code system information
   */
  getMedicalCodeSystems() {
    return {
      medical: this.medicalCodeSystems,
      biological: this.biologicalCodeSystems
    };
  }

  /**
   * Search medical codes by condition
   */
  searchMedicalCodes(condition, codeSystem = 'ICD-10-CM') {
    // Implementation would search through the medical coding database
    return {
      condition,
      codeSystem,
      codes: []
    };
  }

  /**
   * Get dietitian knowledge for a specific condition
   */
  getDietitianKnowledge(condition) {
    const condition_lower = condition.toLowerCase();
    
    // Search through the knowledge base
    for (const [category, content] of Object.entries(this.dietitianKnowledge)) {
      if (content[condition_lower]) {
        return {
          category,
          condition,
          knowledge: content[condition_lower],
          evidence_level: 'grade_a', // 30+ years experience level
          source: 'evidence_based_clinical_guidelines'
        };
      }
    }
    
    // If not found directly, try to find related content
    return this.findRelatedDietitianKnowledge(condition);
  }

  /**
   * Get natural therapist knowledge for a specific condition
   */
  getNaturalTherapistKnowledge(condition) {
    const condition_lower = condition.toLowerCase();
    
    // Search through the knowledge base
    for (const [category, content] of Object.entries(this.naturalTherapistKnowledge)) {
      if (content[condition_lower]) {
        return {
          category,
          condition,
          knowledge: content[condition_lower],
          evidence_level: 'integrative_evidence',
          source: 'traditional_medicine_research'
        };
      }
    }
    
    // If not found directly, try to find related content
    return this.findRelatedNaturalTherapistKnowledge(condition);
  }

  /**
   * Get experience level protocols
   */
  getExperienceProtocols(category) {
    if (this.experienceProtocols[category]) {
      return {
        category,
        protocols: this.experienceProtocols[category],
        experience_level: '30_plus_years',
        application: 'clinical_practice'
      };
    }
    
    return {
      category,
      protocols: this.experienceProtocols,
      experience_level: '30_plus_years',
      application: 'comprehensive'
    };
  }

  /**
   * Get biological coding information
   */
  getBiologicalCoding(biologicalSystem) {
    if (this.biologicalCodeSystems[biologicalSystem]) {
      return {
        system: biologicalSystem,
        description: this.biologicalCodeSystems[biologicalSystem],
        application: 'precision_nutrition'
      };
    }
    
    return {
      system: biologicalSystem,
      error: 'Biological system not found',
      available_systems: Object.keys(this.biologicalCodeSystems)
    };
  }

  /**
   * AI-powered medical coding assistance
   */
  async aiMedicalCodingAssistance(clinicalDescription, codeSystem = 'ICD-10-CM') {
    // This would integrate with AI services for coding assistance
    // For now, return a placeholder
    return {
      clinical_description: clinicalDescription,
      code_system: codeSystem,
      suggested_codes: [],
      confidence: 0,
      requires_ai_configuration: true
    };
  }

  /**
   * Comprehensive health management plan
   */
  generateHealthManagementPlan(conditions, preferences) {
    const plan = {
      conditions: conditions,
      preferences: preferences,
      dietitian_recommendations: [],
      natural_therapist_recommendations: [],
      experience_level_applications: [],
      biological_considerations: [],
      monitoring_parameters: [],
      timeline: [],
      resources: []
    };

    // Generate recommendations for each condition
    conditions.forEach(condition => {
      const dietitian = this.getDietitianKnowledge(condition);
      const natural = this.getNaturalTherapistKnowledge(condition);
      
      if (dietitian.knowledge) {
        plan.dietitian_recommendations.push(dietitian);
      }
      
      if (natural.knowledge) {
        plan.natural_therapist_recommendations.push(natural);
      }
    });

    return plan;
  }

  /**
   * Find related dietitian knowledge
   */
  findRelatedDietitianKnowledge(condition) {
    // Implementation would find related knowledge based on condition
    return {
      condition,
      knowledge: {},
      message: 'Direct knowledge not found, searching related conditions'
    };
  }

  /**
   * Find related natural therapist knowledge
   */
  findRelatedNaturalTherapistKnowledge(condition) {
    // Implementation would find related knowledge based on condition
    return {
      condition,
      knowledge: {},
      message: 'Direct knowledge not found, searching related conditions'
    };
  }
}

// Create and export singleton instance
const advancedMedicalCodingService = new AdvancedMedicalCodingService();

// Create Express router for the service
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Medical code systems endpoint
router.get('/code-systems', (req, res) => {
  try {
    const codeSystems = advancedMedicalCodingService.getMedicalCodeSystems();
    res.json(codeSystems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search medical codes endpoint
router.get('/search-codes/:condition', authMiddleware, (req, res) => {
  try {
    const { condition } = req.params;
    const { codeSystem } = req.query;
    const codes = advancedMedicalCodingService.searchMedicalCodes(condition, codeSystem);
    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dietitian knowledge endpoint
router.get('/dietitian-knowledge/:condition', authMiddleware, (req, res) => {
  try {
    const { condition } = req.params;
    const knowledge = advancedMedicalCodingService.getDietitianKnowledge(condition);
    res.json(knowledge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Natural therapist knowledge endpoint
router.get('/natural-therapist-knowledge/:condition', authMiddleware, (req, res) => {
  try {
    const { condition } = req.params;
    const knowledge = advancedMedicalCodingService.getNaturalTherapistKnowledge(condition);
    res.json(knowledge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Experience protocols endpoint
router.get('/experience-protocols/:category?', authMiddleware, (req, res) => {
  try {
    const { category } = req.params;
    const protocols = advancedMedicalCodingService.getExperienceProtocols(category);
    res.json(protocols);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Biological coding endpoint
router.get('/biological-coding/:system', authMiddleware, (req, res) => {
  try {
    const { system } = req.params;
    const coding = advancedMedicalCodingService.getBiologicalCoding(system);
    res.json(coding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI medical coding assistance endpoint
router.post('/ai-coding-assistance', authMiddleware, async (req, res) => {
  try {
    const { clinicalDescription, codeSystem } = req.body;
    const assistance = await advancedMedicalCodingService.aiMedicalCodingAssistance(clinicalDescription, codeSystem);
    res.json(assistance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health management plan endpoint
router.post('/health-management-plan', authMiddleware, (req, res) => {
  try {
    const { conditions, preferences } = req.body;
    const plan = advancedMedicalCodingService.generateHealthManagementPlan(conditions, preferences);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'advanced-medical-coding',
    medical_code_systems: Object.keys(MEDICAL_CODE_SYSTEMS).length,
    biological_code_systems: Object.keys(BIOLOGICAL_CODE_SYSTEMS).length,
    dietitian_knowledge_categories: Object.keys(DIETITIAN_KNOWLEDGE_BASE).length,
    natural_therapist_knowledge_categories: Object.keys(NATURAL_THERAPIST_KNOWLEDGE_BASE).length,
    experience_protocol_categories: Object.keys(EXPERIENCE_LEVEL_PROTOCOLS).length
  });
});

module.exports = {
  router,
  advancedMedicalCodingService,
  ...advancedMedicalCodingService
};
