/**
 * Shared Infrastructure and Equipment Rental Service
 * Manages shared assets, equipment rental, and second-life equipment marketplace
 */

const { logger } = require('../utils/logger');
const { aiAPI } = require('./aiService');
const { authMiddleware } = require('../middleware/auth');

/**
 * Register shared infrastructure asset
 */
async function registerSharedAsset(assetData) {
  try {
    const {
      asset_name,
      asset_type,
      category,
      location,
      state,
      district,
      specifications,
      capacity,
      availability,
      rental_rate,
      owner_type,
      owner_id,
      gst_applicable,
      gst_rate
    } = assetData;

    const asset = {
      asset_id: generateId(),
      asset_name: asset_name,
      asset_type: asset_type,
      category: category,
      location: location,
      state: state,
      district: district,
      specifications: specifications,
      capacity: capacity,
      availability: availability,
      rental_rate: rental_rate,
      owner_type: owner_type,
      owner_id: owner_id,
      gst_applicable: gst_applicable,
      gst_rate: gst_rate || 18,
      status: 'available',
      created_at: new Date().toISOString(),
      utilization_rate: 0,
      total_bookings: 0,
      rating: 0
    };

    // In production, save to database
    
    logger.info(`Shared asset registered: ${asset.asset_id}`);
    return asset;
  } catch (error) {
    logger.error('Error registering shared asset', { error: error.message, stack: error.stack });
    throw new Error('Failed to register shared asset');
  }
}

/**
 * Search available shared infrastructure
 */
async function searchSharedInfrastructure(searchParams) {
  try {
    const {
      location,
      asset_type,
      category,
      capacity_required,
      date_from,
      date_to,
      max_rental_rate,
      state,
      district
    } = searchParams;

    // AI-powered search and recommendation
    const aiRequest = {
      task: 'shared_infrastructure_search',
      parameters: {
        location,
        asset_type,
        category,
        capacity_required,
        date_from,
        date_to,
        max_rental_rate,
        state,
        district,
        available_assets: await getAvailableAssets(searchParams),
        demand_forecast: await getDemandForecast(location, asset_type),
        pricing_optimization: await getPricingOptimization(asset_type, location)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const results = {
      search_id: generateId(),
      timestamp: new Date().toISOString(),
      search_params: searchParams,
      available_assets: aiResponse.available_assets.map(asset => ({
        asset_id: asset.id,
        asset_name: asset.name,
        asset_type: asset.type,
        category: asset.category,
        location: asset.location,
        distance: asset.distance,
        capacity: asset.capacity,
        specifications: asset.specifications,
        rental_rate: asset.rental_rate,
        availability: asset.availability,
        rating: asset.rating,
        utilization_rate: asset.utilization_rate,
        match_score: asset.match_score,
        recommended: asset.recommended
      })),
      recommendations: aiResponse.recommendations,
      pricing_insights: aiResponse.pricing_insights,
      total_results: aiResponse.available_assets.length
    };

    return results;
  } catch (error) {
    logger.error('Error searching shared infrastructure', { error: error.message, stack: error.stack });
    throw new Error('Failed to search shared infrastructure');
  }
}

/**
 * Book shared infrastructure
 */
async function bookSharedAsset(bookingData) {
  try {
    const {
      asset_id,
      user_id,
      booking_type,
      date_from,
      date_to,
      quantity,
      purpose,
      total_amount,
      gst_amount,
      payment_status
    } = bookingData;

    const booking = {
      booking_id: generateId(),
      asset_id: asset_id,
      user_id: user_id,
      booking_type: booking_type,
      date_from: date_from,
      date_to: date_to,
      quantity: quantity,
      purpose: purpose,
      total_amount: total_amount,
      gst_amount: gst_amount,
      grand_total: total_amount + gst_amount,
      payment_status: payment_status,
      status: 'confirmed',
      booking_date: new Date().toISOString(),
      confirmation_number: generateConfirmationNumber()
    };

    // In production, save to database and update asset availability
    
    logger.info(`Shared asset booked: ${booking.booking_id}`);
    return booking;
  } catch (error) {
    logger.error('Error booking shared asset', { error: error.message, stack: error.stack });
    throw new Error('Failed to book shared asset');
  }
}

/**
 * List second-life equipment for sale/rental
 */
async function listSecondLifeEquipment(equipmentData) {
  try {
    const {
      equipment_name,
      equipment_type,
      category,
      original_manufacturer,
      year_of_manufacture,
      condition,
      remaining_life,
      specifications,
      location,
      listing_type, // sale or rental
      price,
      seller_id,
      seller_type,
      inspection_report,
      warranty_info,
      images
    } = equipmentData;

    const listing = {
      listing_id: generateId(),
      equipment_name: equipment_name,
      equipment_type: equipment_type,
      category: category,
      original_manufacturer: original_manufacturer,
      year_of_manufacture: year_of_manufacture,
      condition: condition,
      remaining_life: remaining_life,
      specifications: specifications,
      location: location,
      listing_type: listing_type,
      price: price,
      seller_id: seller_id,
      seller_type: seller_type,
      inspection_report: inspection_report,
      warranty_info: warranty_info,
      images: images,
      status: 'active',
      created_at: new Date().toISOString(),
      views: 0,
      inquiries: 0
    };

    // AI-powered pricing recommendation
    const aiRequest = {
      task: 'second_life_equipment_pricing',
      parameters: {
        equipment_data: equipmentData,
        market_data: await getSecondLifeMarketData(equipment_type, category),
        depreciation_analysis: await calculateDepreciation(equipmentData),
        demand_forecast: await getEquipmentDemandForecast(equipment_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    listing.ai_pricing_recommendation = aiResponse;

    logger.info(`Second-life equipment listed: ${listing.listing_id}`);
    return listing;
  } catch (error) {
    logger.error('Error listing second-life equipment', { error: error.message, stack: error.stack });
    throw new Error('Failed to list second-life equipment');
  }
}

/**
 * Search second-life equipment
 */
async function searchSecondLifeEquipment(searchParams) {
  try {
    const {
      equipment_type,
      category,
      location,
      max_price,
      min_condition,
      listing_type,
      max_age
    } = searchParams;

    const results = {
      search_id: generateId(),
      timestamp: new Date().toISOString(),
      search_params: searchParams,
      listings: await getSecondLifeListings(searchParams),
      total_results: 0
    };

    results.total_results = results.listings.length;

    return results;
  } catch (error) {
    logger.error('Error searching second-life equipment', { error: error.message, stack: error.stack });
    throw new Error('Failed to search second-life equipment');
  }
}

/**
 * List second-life lithium batteries for farmers
 */
async function listSecondLifeBattery(batteryData) {
  try {
    const {
      battery_type,
      capacity_kwh,
      original_application,
      year_of_manufacture,
      cycles_used,
      remaining_capacity,
      health_score,
      manufacturer,
      location,
      price,
      seller_id,
      certification,
      warranty,
      test_report
    } = batteryData;

    const battery = {
      battery_id: generateId(),
      battery_type: battery_type,
      capacity_kwh: capacity_kwh,
      original_application: original_application,
      year_of_manufacture: year_of_manufacture,
      cycles_used: cycles_used,
      remaining_capacity: remaining_capacity,
      health_score: health_score,
      manufacturer: manufacturer,
      location: location,
      price: price,
      seller_id: seller_id,
      certification: certification,
      warranty: warranty,
      test_report: test_report,
      status: 'available',
      created_at: new Date().toISOString(),
      agricultural_applicability: await assessAgriculturalApplicability(batteryData)
    };

    // AI-powered agricultural applicability assessment
    const aiRequest = {
      task: 'battery_agricultural_applicability',
      parameters: {
        battery_data: batteryData,
        agricultural_use_cases: ['solar_pumping', 'cold_storage', 'farm_lighting', 'electric_vehicles'],
        safety_requirements: await getBatterySafetyRequirements(),
        cost_benefit_analysis: await calculateCostBenefit(batteryData)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    battery.ai_assessment = aiResponse;

    logger.info(`Second-life battery listed: ${battery.battery_id}`);
    return battery;
  } catch (error) {
    logger.error('Error listing second-life battery', { error: error.message, stack: error.stack });
    throw new Error('Failed to list second-life battery');
  }
}

/**
 * Get renewable power support options
 */
async function getRenewablePowerSupport(location, requirements) {
  try {
    const {
      power_requirement_kw,
      application_type, // irrigation, cold_storage, processing, general
      budget,
      existing_infrastructure,
      grid_availability
    } = requirements;

    // AI-powered renewable energy recommendation
    const aiRequest = {
      task: 'renewable_power_recommendation',
      parameters: {
        location,
        power_requirement_kw,
        application_type,
        budget,
        existing_infrastructure,
        grid_availability,
        solar_potential: await getSolarPotential(location),
        wind_potential: await getWindPotential(location),
        biomass_availability: await getBiomassAvailability(location),
        government_schemes: await getRenewableSchemes(location),
        cost_benefit: await calculateRenewableCostBenefit(requirements)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const recommendations = {
      recommendation_id: generateId(),
      location: location,
      requirements: requirements,
      recommended_solutions: aiResponse.solutions.map(solution => ({
        solution_type: solution.type,
        capacity: solution.capacity,
        estimated_cost: solution.cost,
        subsidy_eligible: solution.subsidy_eligible,
        subsidy_amount: solution.subsidy_amount,
        payback_period: solution.payback_period,
        annual_savings: solution.annual_savings,
        co2_reduction: solution.co2_reduction,
        implementation_timeline: solution.timeline,
        confidence: solution.confidence
      })),
      comparison: aiResponse.comparison,
      government_schemes: aiResponse.schemes,
      next_steps: aiResponse.next_steps,
      timestamp: new Date().toISOString()
    };

    return recommendations;
  } catch (error) {
    logger.error('Error getting renewable power support', { error: error.message, stack: error.stack });
    throw new Error('Failed to get renewable power support');
  }
}

/**
 * Get equipment utilization analytics
 */
async function getEquipmentUtilizationAnalytics(assetId, period) {
  try {
    const analytics = {
      asset_id: assetId,
      period: period,
      utilization_rate: 0,
      booking_frequency: 0,
      revenue_generated: 0,
      peak_usage_times: [],
      user_demographics: {},
      maintenance_schedule: {},
      optimization_recommendations: []
    };

    // In production, fetch from database
    
    return analytics;
  } catch (error) {
    logger.error('Error getting equipment utilization analytics', { error: error.message, stack: error.stack });
    throw new Error('Failed to get equipment utilization analytics');
  }
}

// Helper functions
function generateId() {
  return `INF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateConfirmationNumber() {
  return `BK-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

async function getAvailableAssets(searchParams) {
  // Fetch available assets from database
  return [];
}

async function getDemandForecast(location, assetType) {
  // Get demand forecast
  return {};
}

async function getPricingOptimization(assetType, location) {
  // Get pricing optimization data
  return {};
}

async function getSecondLifeMarketData(equipmentType, category) {
  // Get market data
  return {};
}

async function calculateDepreciation(equipmentData) {
  // Calculate depreciation
  return {};
}

async function getEquipmentDemandForecast(equipmentType) {
  // Get demand forecast
  return {};
}

async function getSecondLifeListings(searchParams) {
  // Get listings from database
  return [];
}

async function assessAgriculturalApplicability(batteryData) {
  // Assess applicability
  return {};
}

async function getBatterySafetyRequirements() {
  // Get safety requirements
  return {};
}

async function calculateCostBenefit(batteryData) {
  // Calculate cost benefit
  return {};
}

async function getSolarPotential(location) {
  // Get solar potential
  return {};
}

async function getWindPotential(location) {
  // Get wind potential
  return {};
}

async function getBiomassAvailability(location) {
  // Get biomass availability
  return {};
}

async function getRenewableSchemes(location) {
  // Get renewable energy schemes
  return [];
}

async function calculateRenewableCostBenefit(requirements) {
  // Calculate cost benefit
  return {};
}

// Express routes setup
function setupRoutes(app) {
  app.post('/api/v1/shared-infra/assets/register', authMiddleware, async (req, res) => {
    try {
      const asset = await registerSharedAsset(req.body);
      res.json({ success: true, data: asset });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/shared-infra/assets/search', async (req, res) => {
    try {
      const results = await searchSharedInfrastructure(req.query);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/shared-infra/assets/book', authMiddleware, async (req, res) => {
    try {
      const booking = await bookSharedAsset(req.body);
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/shared-infra/second-life/list', authMiddleware, async (req, res) => {
    try {
      const listing = await listSecondLifeEquipment(req.body);
      res.json({ success: true, data: listing });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/shared-infra/second-life/search', async (req, res) => {
    try {
      const results = await searchSecondLifeEquipment(req.query);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/shared-infra/batteries/list', authMiddleware, async (req, res) => {
    try {
      const battery = await listSecondLifeBattery(req.body);
      res.json({ success: true, data: battery });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/shared-infra/renewable/support', async (req, res) => {
    try {
      const recommendations = await getRenewablePowerSupport(req.query.location, req.query);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/shared-infra/assets/:id/analytics', async (req, res) => {
    try {
      const analytics = await getEquipmentUtilizationAnalytics(req.params.id, req.query.period);
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = {
  registerSharedAsset,
  searchSharedInfrastructure,
  bookSharedAsset,
  listSecondLifeEquipment,
  searchSecondLifeEquipment,
  listSecondLifeBattery,
  getRenewablePowerSupport,
  getEquipmentUtilizationAnalytics,
  setupRoutes
};
