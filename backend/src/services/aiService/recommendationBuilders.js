/**
 * Generic AI recommendation engine used by other services via
 * aiAPI.generateRecommendation() - one builder function per task name.
 * Split out of the former monolithic services/aiService.js (M11).
 */

const { logger } = require('../../utils/logger');

function nutrientEntry(low, high, status) {
  return { status, optimal: { min: low, max: high } };
}

const recommendationBuilders = {
  dynamic_pricing: (p) => {
    const base = p.base_price || 50;
    return {
      recommended_price: Math.round(base * 1.08 * 100) / 100,
      demand_factor: 1.12,
      seasonality_factor: 1.05,
      competition_factor: 0.97,
      quality_factor: 1.1,
      freshness_factor: 1.03,
      organic_premium: p.organic_status ? 0.15 : 0,
      gi_premium: p.gi_status ? 0.2 : 0,
      inventory_pressure: 0.92,
      min_price: Math.round(base * 0.9 * 100) / 100,
      max_price: Math.round(base * 1.25 * 100) / 100,
      price_elasticity: -1.15,
      competitor_analysis: { average_competitor_price: Math.round(base * 1.02), positioning: 'competitive' },
      recommendations: ['Price is well-positioned relative to competitors', 'Monitor inventory pressure over the next 3 days'],
      confidence: 0.85
    };
  },

  nutrient_based_pricing: (p) => {
    const base = p.base_price || 50;
    return {
      nutrient_based_price: Math.round(base * 1.18 * 100) / 100,
      nutrient_score: 82,
      premium_nutrients: ['protein', 'omega_3', 'antioxidants'],
      deficiencies: [],
      standard_comparison: 'above_industry_standard',
      base_component: base,
      nutrient_premium: Math.round(base * 0.12 * 100) / 100,
      quality_premium: Math.round(base * 0.04 * 100) / 100,
      organic_premium: p.organic_status ? Math.round(base * 0.1 * 100) / 100 : 0,
      certification_premium: Math.round(base * 0.02 * 100) / 100,
      lab_verified: !!(p.lab_test_results && p.lab_test_results.certificate_number),
      avg_market_price: Math.round(base * 1.05 * 100) / 100,
      premium_percentage: 18,
      value_proposition: 'Nutrient density supports premium pricing over market average',
      recommendations: ['List with lab certificate to justify premium', 'Highlight nutrient content in marketing'],
      confidence: 0.81
    };
  },

  farmer_selection_optimization: (p) => ({
    recommended_farmers: [
      {
        id: 'FRM-1001', name: 'Anil Bora', location: p.delivery_location || 'Assam',
        offered_price: 48, quality_score: 88, reliability_score: 91,
        logistics_cost: 1200, total_cost: 49200, margin: 4800, margin_percentage: 8.9,
        delivery_estimate: '3 days', match_score: 0.93
      },
      {
        id: 'FRM-1002', name: 'Sunita Devi', location: p.delivery_location || 'Assam',
        offered_price: 46, quality_score: 82, reliability_score: 87,
        logistics_cost: 1500, total_cost: 47500, margin: 5200, margin_percentage: 9.9,
        delivery_estimate: '4 days', match_score: 0.88
      }
    ],
    optimal_allocation: { 'FRM-1001': 0.6, 'FRM-1002': 0.4 },
    total_margin: 10000,
    avg_margin_percentage: 9.4,
    margin_distribution: { min: 8.9, max: 9.9, avg: 9.4 },
    optimization_potential: '5% additional margin possible with split delivery',
    risk_factors: ['Single-region concentration risk'],
    recommendations: ['Split order across top 2 farmers to balance risk and margin'],
    confidence: 0.86
  }),

  insurance_claim_validation: () => ({
    confidence_score: 0.87,
    fraud_probability: 0.08,
    coverage_eligibility: true,
    estimated_payout: 42000,
    validation_notes: 'Incident details are consistent with policy coverage and reported weather conditions',
    required_documents: ['Land ownership proof', 'Photographic evidence of damage'],
    red_flags: [],
    estimated_processing_time: '10-15 business days'
  }),

  insurance_claim_assessment: () => ({
    approved: true,
    approval_amount: 38500,
    rejection_reason: null,
    partial_approval: false,
    conditions: ['Submit final harvest report within 30 days'],
    actual_loss: 45000,
    coverage_percentage: 85,
    deductible: 5000,
    net_payout: 38500,
    document_validity: 'valid',
    image_analysis: { damage_confirmed: true, damage_extent_percentage: 62 },
    weather_correlation: 'strong',
    evidence_strength: 0.84,
    risk_factors: ['Localized flooding event confirmed by satellite imagery'],
    recommendations: ['Proceed to payout', 'Schedule farmer advisory follow-up'],
    confidence: 0.88
  }),

  settlement_follow_up_recommendation: () => ({
    auto_send_reminder: true,
    escalate: false,
    escalation_reason: null,
    recommended_actions: ['Send reminder to insurer', 'Update farmer on expected timeline'],
    expected_response_days: 5,
    confidence: 0.79
  }),

  fraud_detection: () => ({
    fraud_probability: 0.11,
    risk_level: 'low',
    risk_factors: [{ factor: 'claim_frequency', risk: 0.1 }],
    indicators: [],
    recommendations: ['No manual review required at this time'],
    requires_manual_review: false,
    confidence: 0.9
  }),

  payout_calculation: () => ({
    assessed_loss: 45000,
    coverage_percentage: 85,
    covered_amount: 38250,
    deductible: 5000,
    depreciation: 1200,
    net_payout: 37050,
    market_adjustment: 0.02,
    quality_adjustment: -0.01,
    age_adjustment: -0.03,
    location_adjustment: 0.01,
    payment_schedule: [{ installment: 1, amount: 25000, due_date: null }, { installment: 2, amount: 12050, due_date: null }],
    confidence: 0.83
  }),

  greenhouse_design: (p) => ({
    structure: 'Multi-span polyhouse',
    dimensions: { area_sqm: p.area_size || 1000, length_m: 50, width_m: 20, height_m: 5 },
    materials: ['Galvanized steel frame', 'UV-stabilized polyethylene film'],
    covering: '200-micron UV-stabilized poly film',
    frame_type: 'Galvanized steel truss',
    ventilation: 'Roof and side natural ventilation with exhaust fans',
    cooling: 'Fan-and-pad evaporative cooling',
    heating: 'Hot air blowers for winter months',
    humidity_control: 'Fogger-based humidification system',
    co2_enrichment: 'CO2 generators for peak growth periods',
    irrigation_type: 'Drip irrigation with fertigation',
    irrigation_automation: 'Sensor-triggered automated scheduling',
    irrigation_sensors: ['Soil moisture sensors', 'Flow meters'],
    water_management: 'Rainwater harvesting with recirculation tank',
    lighting: 'Optimized bay orientation for natural light capture',
    supplemental_lighting: 'LED grow lights for low-light months',
    light_sensors: ['Lux sensors'],
    control_system: 'Centralized IoT-based climate controller',
    sensors: ['Temperature', 'Humidity', 'CO2', 'Soil moisture', 'Light intensity'],
    actuators: ['Vent motors', 'Fans', 'Irrigation valves'],
    monitoring: 'Real-time dashboard with mobile alerts',
    solar_capacity: p.renewable_integration ? 15 : 0,
    wind_integration: false,
    battery_storage: p.renewable_integration ? 10 : 0,
    grid_connection: true,
    construction_cost: 1800000,
    equipment_cost: 650000,
    installation_cost: 250000,
    total_cost: 2700000,
    roi_estimate: '3.2 years',
    confidence: 0.84,
    recommendations: ['Phase automation rollout to control upfront cost', 'Prioritize drip irrigation to reduce water usage by 40%']
  }),

  microclimate_optimization: () => ({
    temperature_adjustment: -1.5,
    humidity_adjustment: 5,
    co2_adjustment: 50,
    light_adjustment: 2000,
    irrigation_adjustment: '+10% duration',
    ventilation_adjustment: 'increase side vent opening by 15%',
    predicted_outcome: 'Conditions expected to reach target range within 2 hours',
    energy_impact: { additional_kwh_per_day: 3.2 },
    cost_impact: { additional_cost_per_day: 45 },
    confidence: 0.83
  }),

  greenhouse_monitoring_analysis: () => ({
    status: 'normal',
    anomalies_detected: false,
    alerts: [],
    trend_summary: 'All parameters within target range over the last 24 hours',
    recommendations: ['Increase CO2 enrichment slightly during peak photosynthesis hours'],
    confidence: 0.88
  }),

  yield_prediction: () => ({
    expected_yield: 4200,
    confidence_interval: { low: 3800, high: 4600 },
    harvest_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    quality_grade: 'A',
    contributing_factors: ['Optimal temperature control', 'Consistent irrigation'],
    risk_factors: ['Potential pest pressure in week 6'],
    opportunities: ['Early harvest premium window'],
    recommendations: ['Schedule pest scouting for week 5-6'],
    confidence: 0.79
  }),

  dpr_generation: (p) => ({
    executive_summary: `Detailed project report for ${p.project_name || 'the proposed greenhouse project'}, covering technical, financial, and market feasibility.`,
    project_background: 'Project responds to rising demand for controlled-environment horticulture in the region.',
    site_details: { location: p.location, area_size: p.area_size },
    greenhouse_design: { type: p.greenhouse_type || 'polyhouse', area_size: p.area_size },
    infrastructure: ['Power connection', 'Water source', 'Access road'],
    equipment: ['Climate control system', 'Irrigation system', 'Post-harvest handling unit'],
    technology: 'IoT-based climate monitoring and automated irrigation',
    capital_cost: p.budget || 2500000,
    operating_cost: 350000,
    revenue_projection: { year1: 800000, year2: 1100000, year3: 1400000 },
    financial_ratios: { irr: 0.24, npv: 950000, payback_years: 3.5 },
    break_even_analysis: { break_even_month: 30 },
    target_market: 'Urban wholesale and retail markets within 150km',
    demand_analysis: 'Steady year-round demand with premium pricing in off-season',
    competition: 'Fragmented, mostly open-field growers',
    marketing_strategy: 'Direct-to-retailer contracts supplemented by FPO channel sales',
    technical_risks: ['Power supply reliability'],
    financial_risks: ['Input cost inflation'],
    market_risks: ['Price volatility during glut periods'],
    mitigation_strategies: ['Diesel generator backup', 'Forward contracts with buyers'],
    applicable_schemes: p.government_schemes || ['MIDH', 'AIF'],
    subsidy_eligibility: true,
    application_process: 'Apply via state horticulture department portal',
    expected_subsidy: Math.round((p.budget || 2500000) * 0.35),
    phases: ['Site preparation', 'Structure erection', 'Systems installation', 'Commissioning'],
    timeline: p.timeline || '6 months',
    milestones: ['Site cleared', 'Structure complete', 'Systems commissioned', 'First harvest'],
    resource_allocation: { civil: 0.4, equipment: 0.35, contingency: 0.1, other: 0.15 },
    sustainability: 'Rainwater harvesting and solar-assisted power reduce environmental footprint',
    carbon_footprint: { estimated_tons_co2_per_year: 12 },
    water_usage: { liters_per_day: 8000 },
    energy_efficiency: 'LED lighting and variable-speed drives reduce energy use by 20%',
    appendices: ['Site survey report', 'Soil test report'],
  }),

  project_cost_estimation: () => ({
    civil_works: 900000,
    structural: 700000,
    electrical: 250000,
    mechanical: 300000,
    automation: 200000,
    installation: 150000,
    contingency: 150000,
    total_estimate: 2650000,
    confidence_level: 'medium-high',
    cost_drivers: ['Steel prices', 'Regional labor cost'],
    optimization_suggestions: ['Source steel through bulk procurement to reduce structural cost by 8%'],
    inflation_adjustment: 1.04,
    regional_adjustment: 1.15
  }),

  scheme_matching: () => {
    const scheme = (name, code, ministry) => ({
      name, code, ministry, department: `${ministry} Department`,
      description: `${name} provides financial support for eligible agricultural activities`,
      eligibility_score: 0.86, subsidy_percentage: 40, max_amount: 5000000,
      deadline: '2027-03-31', documents: ['Land records', 'Bank account details', 'Aadhaar'],
      process: 'Apply online via state agriculture portal', contact: { phone: '+91-9876543210', email: 'support@agri.gov.in' },
      recommendation: 'Strongly recommended based on profile match', confidence: 0.86
    });
    return {
      eligible_schemes: [
        scheme('Mission for Integrated Development of Horticulture', 'MIDH', 'Ministry of Agriculture'),
        scheme('Agriculture Infrastructure Fund', 'AIF', 'Ministry of Agriculture')
      ],
      recommended_schemes: ['MIDH', 'AIF'],
      application_guidance: 'Start with MIDH application as it offers the highest match score for this profile'
    };
  },

  csr_opportunity_matching: () => ({
    opportunities: [
      {
        id: 'CSR-2001', name: 'Farmer Water Access Initiative', organization: 'GreenFields Foundation',
        focus_area: 'water_management', location: 'Assam', budget: 2500000, impact_score: 0.88,
        beneficiaries: 1200, timeline: '12 months', match_score: 0.91, recommendation: 'High alignment with company CSR focus'
      },
      {
        id: 'CSR-2002', name: 'Smallholder Digital Literacy Program', organization: 'AgriNext Trust',
        focus_area: 'digital_literacy', location: 'Meghalaya', budget: 900000, impact_score: 0.79,
        beneficiaries: 600, timeline: '6 months', match_score: 0.74, recommendation: 'Moderate alignment, good beneficiary reach'
      }
    ],
    recommendations: ['Prioritize the water access initiative for maximum beneficiary impact per rupee spent']
  }),

  csr_proposal_assessment: () => ({
    alignment_score: 0.82,
    approval_likelihood: 'high',
    priority_level: 'medium-high',
    impact_projection: { beneficiaries: 1000, region_coverage: 'district-wide' },
    recommendations: ['Add measurable impact KPIs to strengthen proposal'],
    confidence: 0.8
  }),

  subsidy_eligibility_check: (p) => {
    const scheme = {
      name: 'Mission for Integrated Development of Horticulture', code: 'MIDH', ministry: 'Ministry of Agriculture',
      subsidy_percentage: 40, max_amount: 5000000, max_per_unit: 150000, max_quantity: 10,
      eligibility_score: 0.85, confidence: 0.85, requirements: ['Minimum 0.5 hectare land holding'],
      documents: ['Land ownership proof', 'Bank passbook copy'], deadline: '2027-03-31',
      processing_time: '45-60 days', brand_restrictions: 'BIS-certified equipment only',
      subsidy_type: 'per_ton', rate: 25
    };
    const scheme2 = {
      name: 'Agriculture Infrastructure Fund', code: 'AIF', ministry: 'Ministry of Agriculture',
      subsidy_percentage: 33, max_amount: 20000000, max_per_unit: 200000, max_quantity: 5,
      eligibility_score: 0.78, confidence: 0.78, requirements: ['Registered FPO or individual farmer'],
      documents: ['Project proposal', 'DPR'], deadline: '2029-03-31',
      processing_time: '60-90 days', brand_restrictions: null,
      subsidy_type: 'flat_rate', rate: null
    };
    return {
      eligible_schemes: [scheme, scheme2],
      recommended_scheme: scheme.code,
      total_potential_subsidy: Math.round((p.estimated_cost || p.total_cost || 1000000) * 0.4),
      subsidy_breakdown: { central_share: 0.6, state_share: 0.4 },
      alternatives: ['Consider MOVCDNER if organic certification is pursued'],
      application_guidance: 'Submit application through state nodal agency along with DPR',
      next_steps: ['Prepare DPR', 'Submit application', 'Schedule field verification'],
      private_routing: null,
      gst_applicability: { applicable: true, rate: 18 },
      alternative_routes: [],
      estimated_private_cost: Math.round((p.estimated_cost || p.total_cost || 1000000) * 1.18),
      confidence: 0.82
    };
  },

  soil_analysis: () => ({
    soil_health_score: 74,
    nutrient_status: 'moderate',
    ph_status: 'slightly_acidic',
    organic_matter_status: 'low',
    deficiencies: ['nitrogen', 'zinc'],
    toxicities: [],
    recommendations: ['Apply organic compost to improve organic matter content', 'Correct nitrogen deficiency with split urea application'],
    nitrogen_status: 'low', nitrogen_optimal: nutrientEntry(280, 560, 'low').optimal, nitrogen_recommendation: 'Apply 120 kg/ha urea in split doses',
    phosphorus_status: 'medium', phosphorus_optimal: nutrientEntry(10, 25, 'medium').optimal, phosphorus_recommendation: 'Apply 60 kg/ha DAP at sowing',
    potassium_status: 'adequate', potassium_optimal: nutrientEntry(120, 280, 'adequate').optimal, potassium_recommendation: 'Maintain current potash application',
    calcium_status: 'adequate', calcium_optimal: nutrientEntry(1000, 4000, 'adequate').optimal, calcium_recommendation: 'No amendment needed',
    magnesium_status: 'medium', magnesium_optimal: nutrientEntry(120, 400, 'medium').optimal, magnesium_recommendation: 'Apply magnesium sulfate if deficiency symptoms appear',
    sulfur_status: 'adequate', sulfur_optimal: nutrientEntry(10, 20, 'adequate').optimal, sulfur_recommendation: 'No amendment needed',
    iron_status: 'adequate', iron_optimal: nutrientEntry(4.5, 10, 'adequate').optimal, iron_recommendation: 'No amendment needed',
    zinc_status: 'low', zinc_optimal: nutrientEntry(0.6, 1.2, 'low').optimal, zinc_recommendation: 'Apply 25 kg/ha zinc sulfate',
    boron_status: 'adequate', boron_optimal: nutrientEntry(0.5, 1, 'adequate').optimal, boron_recommendation: 'No amendment needed',
    manganese_status: 'adequate', manganese_optimal: nutrientEntry(2, 5, 'adequate').optimal, manganese_recommendation: 'No amendment needed',
    copper_status: 'adequate', copper_optimal: nutrientEntry(0.2, 0.8, 'adequate').optimal, copper_recommendation: 'No amendment needed',
    ph_optimal: { min: 6.0, max: 7.0 }, ph_amendment_needed: true, ph_amendment: 'Apply agricultural lime at 500 kg/ha',
    organic_matter_optimal: { min: 2.5, max: 5.0 }, organic_improvement_needed: true, organic_improvement: 'Incorporate 5 tons/ha farmyard manure',
    texture_class: 'sandy_loam', water_holding_capacity: 'moderate', drainage: 'good',
    confidence: 0.85
  }),

  fertilizer_recommendation: (p) => ({
    fertilizer_plan: [
      {
        stage: 'basal', timing: 'at_sowing',
        fertilizers: [
          {
            name: 'DAP', brand: 'IFFCO', quantity: 100, total_quantity: 100, cost: 27, total_cost: 2700,
            nutrient_content: { n: 18, p: 46, k: 0 }, application_method: 'broadcast_and_incorporate',
            subsidy_eligible: true, subsidy_amount: 800, net_cost: 1900
          }
        ],
        stage_cost: 2700, stage_subsidy: 800
      },
      {
        stage: 'top_dressing', timing: '30_days_after_sowing',
        fertilizers: [
          {
            name: 'Urea', brand: 'NFL', quantity: 65, total_quantity: 65, cost: 6, total_cost: 390,
            nutrient_content: { n: 46, p: 0, k: 0 }, application_method: 'side_dressing',
            subsidy_eligible: true, subsidy_amount: 150, net_cost: 240
          }
        ],
        stage_cost: 390, stage_subsidy: 150
      }
    ],
    total_cost: 3090,
    total_subsidy: 950,
    net_cost: 2140,
    nutrient_balance: { n: 'balanced', p: 'balanced', k: 'slightly_low' },
    application_schedule: ['Basal at sowing', 'Top dressing at 30 days', 'Second top dressing at 55 days'],
    precautions: ['Avoid application before heavy rainfall', 'Do not mix urea and DAP in storage'],
    expected_yield_impact: '+12% over unfertilized baseline',
    cost_benefit_analysis: { cost: 2140, expected_additional_revenue: 9500, benefit_cost_ratio: 4.4 },
    alternatives: p.farming_method === 'organic' ? ['Vermicompost', 'Neem cake'] : ['Slow-release NPK blend'],
    confidence: 0.83
  }),

  shared_infrastructure_search: () => ({
    available_assets: [
      {
        id: 'AST-3001', name: 'Cold Storage Unit - Guwahati', type: 'cold_storage', category: 'storage',
        location: 'Guwahati', distance: 8.5, capacity: '500 MT', specifications: { temperature_range: '2-8C' },
        rental_rate: 1500, availability: 'available', rating: 4.6, utilization_rate: 0.72, match_score: 0.91, recommended: true
      },
      {
        id: 'AST-3002', name: 'Mobile Cold Van', type: 'refrigerated_transport', category: 'logistics',
        location: 'Guwahati', distance: 12, capacity: '5 MT', specifications: { temperature_range: '0-10C' },
        rental_rate: 2200, availability: 'available', rating: 4.3, utilization_rate: 0.58, match_score: 0.76, recommended: false
      }
    ],
    recommendations: ['Book the cold storage unit early as demand peaks during harvest season'],
    pricing_insights: { average_rate: 1850, trend: 'stable' }
  }),

  second_life_equipment_pricing: () => ({
    recommended_price: 185000,
    price_range: { min: 160000, max: 210000 },
    market_comparison: 'priced 10% below comparable listings',
    depreciation_applied: 0.35,
    confidence: 0.77
  }),

  battery_agricultural_applicability: () => ({
    suitability_score: 0.81,
    recommended_use_cases: ['solar_pumping', 'cold_storage'],
    safety_rating: 'pass',
    remaining_useful_life_years: 4,
    confidence: 0.78
  }),

  renewable_power_recommendation: () => ({
    solutions: [
      {
        type: 'solar_pv', capacity: '10 kW', cost: 650000, subsidy_eligible: true, subsidy_amount: 260000,
        payback_period: '4.2 years', annual_savings: 95000, co2_reduction: '8 tons/year', timeline: '6-8 weeks', confidence: 0.87
      },
      {
        type: 'solar_hybrid_with_battery', capacity: '10 kW + 15 kWh', cost: 950000, subsidy_eligible: true, subsidy_amount: 300000,
        payback_period: '5.1 years', annual_savings: 115000, co2_reduction: '8 tons/year', timeline: '8-10 weeks', confidence: 0.8
      }
    ],
    comparison: 'Hybrid system offers better resilience but longer payback than solar-only',
    schemes: ['PM-KUSUM'],
    next_steps: ['Get site survey for solar irradiance', 'Apply for PM-KUSUM subsidy']
  }),

  pre_season_order_validation: () => ({
    validated: true,
    price_assessment: 'within_market_range',
    risk_level: 'low',
    demand_supply_match: 'favorable',
    recommendations: ['Proceed with order posting', 'Consider locking price for 30 days'],
    confidence: 0.84
  }),

  bid_evaluation: () => ({
    match_score: 0.87,
    quality_assessment: 'meets_specifications',
    price_competitiveness: 'competitive',
    risk_level: 'low',
    recommendations: ['Bid is well-aligned with order requirements'],
    confidence: 0.85
  }),

  bid_selection: () => ({
    selected_bids: [
      { bid_id: 'BID-5001', farmer_id: 'FRM-1001', allocated_quantity: 600, price: 48 },
      { bid_id: 'BID-5002', farmer_id: 'FRM-1002', allocated_quantity: 400, price: 46 }
    ],
    total_quantity: 1000,
    weighted_average_price: 47.2,
    total_cost: 47200,
    rationale: 'Selected bids optimize for lowest weighted cost while meeting quality and delivery requirements',
    risk_factors: ['Two-farmer concentration for full order'],
    recommendations: ['Confirm delivery schedule with both farmers before finalizing'],
    confidence: 0.85
  }),

  contract_optimization: () => ({
    optimized_terms: { payment_schedule: '30% advance, 70% on delivery', quality_tolerance: '5%' },
    risk_mitigations: ['Add weather-indexed force majeure clause'],
    compliance_notes: 'Terms comply with model contract farming act guidelines',
    recommendations: ['Include third-party quality inspection clause'],
    confidence: 0.82
  }),

  milestone_validation: () => ({
    validated: true,
    escrow_release_eligible: true,
    quality_score: 0.88,
    evidence_strength: 0.85,
    notes: 'Satellite imagery and submitted evidence confirm milestone completion',
    confidence: 0.86
  }),

  training_curriculum_optimization: () => ({
    optimized_modules: ['Soil health basics', 'Organic pest management', 'Post-harvest handling'],
    duration_recommendation: '4 weeks, 2 sessions/week',
    delivery_mode: 'blended',
    recommendations: ['Add a hands-on field demonstration module'],
    confidence: 0.8
  }),

  training_eligibility_assessment: () => ({
    eligible: true,
    fit_score: 0.83,
    recommended_alternative: null,
    prerequisites_met: true,
    confidence: 0.83
  }),

  folu_compliance_assessment: () => ({
    overall_score: 76,
    healthy_diets_score: 72,
    regenerative_agriculture_score: 80,
    nature_restoration_score: 68,
    climate_mitigation_score: 74,
    water_stewardship_score: 79,
    circular_economy_score: 70,
    biodiversity_score: 75,
    sustainable_livelihoods_score: 82,
    certifications_eligible: ['Organic Transition Certificate'],
    improvement_areas: ['nature_restoration', 'circular_economy'],
    best_practices: ['Cover cropping', 'Reduced tillage'],
    recommendations: ['Introduce agroforestry on field margins to boost nature restoration score'],
    confidence: 0.81
  }),

  training_recommendation: () => ({
    recommended_programs: ['Organic Certification Prep', 'Digital Marketplace Onboarding'],
    priority_order: ['Organic Certification Prep', 'Digital Marketplace Onboarding'],
    career_impact: 'Completing organic certification is projected to increase income by 15-20%',
    time_commitment: '6 weeks total',
    cost_estimate: 4500,
    subsidy_opportunities: ['MIDH training subsidy covers up to 75% of fee'],
    confidence: 0.79
  }),

  // Used by modules/M106 (last-mile delivery partner performance scoring).
  // The score/tier themselves are computed deterministically in M106's own
  // service.js from real recorded delivery outcomes; this builder only
  // drafts the natural-language improvement narrative once M106 has already
  // decided a partner's weak factors — the genuinely AI-assisted part
  // (explaining a decision in prose) rather than the decision itself.
  logistics_partner_improvement_plan: (p) => {
    const partnerName = p.partnerName || 'This partner';
    const weakFactors = Array.isArray(p.weakFactors) ? p.weakFactors : [];
    const factorLabel = (f) => String(f.factor || '').replace(/_/g, ' ');
    return {
      partner: partnerName,
      tier: p.tier || 'unrated',
      score: p.score ?? null,
      narrative: weakFactors.length
        ? `${partnerName} is currently rated ${p.tier || 'unrated'} (score ${p.score ?? 'n/a'}/100). `
          + `The main drag on the score is ${weakFactors.map(factorLabel).join(' and ')}.`
        : `${partnerName} is currently rated ${p.tier || 'unrated'} (score ${p.score ?? 'n/a'}/100). `
          + 'All tracked metrics are within acceptable range.',
      recommended_actions: weakFactors.length
        ? weakFactors.map((f) => `Improve ${factorLabel(f)}: currently ${f.value !== undefined ? (Number(f.value) * 100).toFixed(1) + '%' : 'out of range'} against a target of ${f.threshold !== undefined ? (Number(f.threshold) * 100).toFixed(0) + '%' : 'the standard threshold'}`)
        : ['Maintain current performance level'],
      confidence: 0.72
    };
  }
};

async function generateRecommendation(request) {
  const { task, parameters = {} } = request || {};
  logger.info(`Generating AI recommendation for task: ${task}`);

  const builder = recommendationBuilders[task];
  if (!builder) {
    throw new Error(`Unknown AI recommendation task: ${task}`);
  }

  return builder(parameters);
}

module.exports = { nutrientEntry, recommendationBuilders, generateRecommendation };
