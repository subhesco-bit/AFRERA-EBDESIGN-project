/**
 * Shared Infrastructure and Equipment Rental Service
 * Manages shared assets, equipment rental, and second-life equipment marketplace
 *
 * DATA LAYER (2026-08-07): every write in this file used to end in
 * `// In production, save to database` and every "search" read a mock array.
 * Wired against the real schema instead:
 *
 *   assets / asset_types (000_base_schema.sql)   physical asset registry —
 *     machinery_access AND shared_infrastructure_access (041) both point their
 *     *_id foreign keys at `assets`, so it is the canonical place a shared
 *     infrastructure item is registered.
 *   shared_infrastructure_access (041_rural_life_os_schema.sql)             the
 *     Layer-4 "SHARED RURAL INFRASTRUCTURE" booking/access-log table this
 *     service's route prefix (/api/v1/shared-infra) is named after.
 *
 * KNOWN SCHEMA GAPS (deliberately not papered over with invented columns):
 *   - `assets` has no gst_applicable/gst_rate/owner_type/state/district/
 *     availability columns. Those are folded into `description` as a small
 *     JSON blob (documented inline) rather than invented as new columns.
 *   - `shared_infrastructure_access` is scoped to a Rural Economic Unit
 *     (reu_id), not a user_id. bookSharedAsset() resolves the caller's REU;
 *     if none exists it fails with a clear, explicit error instead of
 *     fabricating one.
 *   - `shared_infrastructure_access` has no gst_amount/payment_status
 *     columns; they ride in the `specifications` JSONB column (documented as
 *     a flexible bag: "{temperature, humidity, quality_requirements, etc.}").
 *   - There is no second-life equipment or second-life battery marketplace
 *     table anywhere in the schema (checked 000_base_schema.sql and every
 *     migration matching /second.life|battery/i). getSecondLifeListings()
 *     says so explicitly instead of silently returning a mock empty array.
 */

const { logger } = require('..\/utils\/logger');
const { aiAPI } = require('./aiService');
const { authMiddleware } = require('..\/middleware\/auth');
const pool = require('..\/database\/pool');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_ACCESS_MODELS = [
  'storage_as_a_service', 'processing_as_a_service', 'infrastructure_as_a_service',
  'cooperative', 'fpo_owned', 'village_owned'
];

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

/** Marks a thrown error as an expected/operational failure (bad input, not
 * found, business-rule violation) so the outer catch can surface its message
 * instead of collapsing it into a generic "Failed to ..." string. */
function expectedError(message) {
  const err = new Error(message);
  err.isExpected = true;
  return err;
}

/** '7d' | '30' | '3m' | '1y' -> integer days, defaulting to 30. */
function parsePeriodToDays(period) {
  if (!period) return 30;
  const match = String(period).trim().toLowerCase().match(/^(\d+)\s*(d|day|days|m|month|months|y|year|years)?$/);
  if (!match) return 30;
  const n = parseInt(match[1], 10);
  const unit = match[2] || 'd';
  if (unit.startsWith('y')) return n * 365;
  if (unit.startsWith('m')) return n * 30;
  return n;
}

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
    } = assetData || {};

    if (!asset_name || !asset_type) {
      throw expectedError('asset_name and asset_type are required');
    }

    // asset_types (000_base_schema.sql) is a small lookup table. Resolve-or-
    // create so registrations aren't blocked on an admin pre-seeding every
    // possible infrastructure type (packhouse, cold storage, solar, battery,
    // processing unit, ...).
    const typeName = String(asset_type).trim();
    const typeCode = (typeName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').slice(0, 20)) || 'GENERAL';
    const typeResult = await pool.query(
      `INSERT INTO asset_types (name, code, description, category)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET category = COALESCE(asset_types.category, EXCLUDED.category)
       RETURNING id`,
      [typeName, typeCode, `Shared rural infrastructure type: ${typeName}`, category || null]
    );
    const typeId = typeResult.rows[0].id;

    // Fields the mock accepted that `assets` has no column for. Not invented
    // as new columns — captured as structured metadata inside `description`
    // (TEXT) so nothing is silently dropped, and called out here + in the
    // service report so it stays visible rather than quietly lossy.
    const extendedMetadata = {
      note: 'extended attributes not represented in the assets schema',
      location: location || null,
      state: state || null,
      district: district || null,
      specifications: specifications || null,
      owner_type: owner_type || null,
      owner_id: owner_id || null,
      gst_applicable: gst_applicable !== undefined ? !!gst_applicable : true,
      gst_rate: gst_rate || 18
    };

    // responsible_user_id is a real FK to users(id); only set it when owner_id
    // actually looks like a user UUID, rather than assuming the shape.
    const responsibleUserId = isUuid(owner_id) ? owner_id : null;

    const insertResult = await pool.query(
      `INSERT INTO assets
         (name, type_id, description, capacity, daily_rate, unit, is_mobile, responsible_user_id, status, utilization_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
       RETURNING *`,
      [
        asset_name,
        typeId,
        JSON.stringify(extendedMetadata),
        capacity != null ? String(capacity) : null,
        rental_rate != null ? Number(rental_rate) : null,
        (specifications && specifications.unit) || null,
        false,
        responsibleUserId,
        availability === false ? 'unavailable' : 'available'
      ]
    );

    const row = insertResult.rows[0];

    const asset = {
      asset_id: row.id,
      asset_name: row.name,
      asset_type,
      category,
      location,
      state,
      district,
      specifications,
      capacity,
      availability: row.status === 'available',
      rental_rate: row.daily_rate != null ? Number(row.daily_rate) : rental_rate,
      owner_type,
      owner_id,
      gst_applicable: extendedMetadata.gst_applicable,
      gst_rate: extendedMetadata.gst_rate,
      status: row.status,
      created_at: row.created_at,
      utilization_rate: Number(row.utilization_rate) || 0,
      total_bookings: 0,
      rating: 0
    };

    logger.info(`Shared asset registered: ${asset.asset_id}`);
    return asset;
  } catch (error) {
    logger.error('Error registering shared asset', { error: error.message, stack: error.stack });
    if (error.isExpected) throw error;
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
    } = searchParams || {};

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
    } = bookingData || {};

    if (!asset_id || !user_id || !date_from || !date_to || quantity == null || total_amount == null) {
      throw expectedError('asset_id, user_id, date_from, date_to, quantity and total_amount are required');
    }

    // shared_infrastructure_access (041) is scoped to a Rural Economic Unit,
    // not directly to a user — it has no user_id column. Resolve the caller's
    // REU rather than inventing one on the table.
    const reuResult = await pool.query(
      `SELECT id FROM rural_economic_units WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [user_id]
    );
    if (reuResult.rows.length === 0) {
      throw expectedError('No active Rural Economic Unit found for this user; register one before booking shared infrastructure');
    }
    const reuId = reuResult.rows[0].id;

    const assetResult = await pool.query('SELECT id FROM assets WHERE id = $1', [asset_id]);
    if (assetResult.rows.length === 0) {
      throw expectedError('Shared infrastructure asset not found');
    }

    const accessModel = VALID_ACCESS_MODELS.includes(booking_type) ? booking_type : 'infrastructure_as_a_service';

    const qty = Number(quantity);
    const amount = Number(total_amount);
    const gst = Number(gst_amount) || 0;
    const unitRate = qty > 0 ? amount / qty : amount;
    // shared_infrastructure_access has no gst_amount/payment_status columns;
    // total_cost is recorded as what is actually charged (amount + gst), and
    // the breakdown is preserved in `specifications` (see file header).
    const grandTotal = amount + gst;
    const bookingNumber = generateConfirmationNumber();

    let insertResult = await pool.query(
      `INSERT INTO shared_infrastructure_access
         (reu_id, infrastructure_id, access_model, booking_number, start_date, end_date,
          capacity_required, unit_rate, total_cost, specifications, purpose, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed')
       RETURNING *`,
      [
        reuId,
        asset_id,
        accessModel,
        bookingNumber,
        date_from,
        date_to,
        qty,
        unitRate,
        grandTotal,
        JSON.stringify({ gst_amount: gst, payment_status: payment_status || 'pending', booking_type: booking_type || null }),
        purpose || null
      ]
    );

    let row = insertResult.rows[0];

    const booking = {
      booking_id: row.id,
      asset_id,
      user_id,
      booking_type: accessModel,
      date_from: row.start_date,
      date_to: row.end_date,
      quantity: qty,
      purpose,
      total_amount: amount,
      gst_amount: gst,
      grand_total: Number(row.total_cost),
      payment_status: payment_status || 'pending',
      status: row.status,
      booking_date: row.created_at,
      confirmation_number: row.booking_number
    };

    logger.info(`Shared asset booked: ${booking.booking_id}`);
    return booking;
  } catch (error) {
    logger.error('Error booking shared asset', { error: error.message, stack: error.stack });
    if (error.isExpected) throw error;
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
    let aiRequest = {
      task: 'second_life_equipment_pricing',
      parameters: {
        equipment_data: equipmentData,
        market_data: await getSecondLifeMarketData(equipment_type, category),
        depreciation_analysis: await calculateDepreciation(equipmentData),
        demand_forecast: await getEquipmentDemandForecast(equipment_type)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);
    listing.ai_pricing_recommendation = aiResponse;

    // NOTE: no second-life equipment marketplace table exists in the schema
    // (checked 000_base_schema.sql and every migration matching /second.life/i),
    // so this listing is not persisted. Flagged here rather than silently
    // dropped; see file header.
    logger.warn(`Second-life equipment listing ${listing.listing_id} not persisted: no matching table in current schema`);
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

    let results = {
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
    let aiRequest = {
      task: 'battery_agricultural_applicability',
      parameters: {
        battery_data: batteryData,
        agricultural_use_cases: ['solar_pumping', 'cold_storage', 'farm_lighting', 'electric_vehicles'],
        safety_requirements: await getBatterySafetyRequirements(),
        cost_benefit_analysis: await calculateCostBenefit(batteryData)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);
    battery.ai_assessment = aiResponse;

    // NOTE: no second-life battery marketplace table exists in the schema
    // (checked 000_base_schema.sql and every migration matching /battery/i —
    // the only battery columns that exist are IoT telemetry fields on
    // shipment_tracking/iot_devices). Not persisted; see file header.
    logger.warn(`Second-life battery listing ${battery.battery_id} not persisted: no matching table in current schema`);
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
    let aiRequest = {
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

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

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
    if (!assetId) {
      throw expectedError('assetId is required');
    }

    let assetResult = await pool.query(
      `SELECT id, utilization_rate, status FROM assets WHERE id = $1`,
      [assetId]
    );
    if (assetResult.rows.length === 0) {
      throw expectedError('Asset not found');
    }
    const assetRow = assetResult.rows[0];

    const intervalDays = parsePeriodToDays(period);

    // Real usage comes from shared_infrastructure_access, the table
    // bookSharedAsset() now actually writes to.
    const statsResult = await pool.query(
      `SELECT COUNT(*) AS booking_count, COALESCE(SUM(total_cost), 0) AS revenue_generated
         FROM shared_infrastructure_access
        WHERE infrastructure_id = $1
          AND created_at >= NOW() - ($2 || ' days')::interval`,
      [assetId, String(intervalDays)]
    );
    const stats = statsResult.rows[0];

    const analytics = {
      asset_id: assetId,
      period: period || `${intervalDays}d`,
      utilization_rate: Number(assetRow.utilization_rate) || 0,
      booking_frequency: Number(stats.booking_count) || 0,
      revenue_generated: Number(stats.revenue_generated) || 0,
      // Not backed by any column/table in the current schema — left explicit
      // rather than fabricated (see file header for what "assets" has).
      peak_usage_times: [],
      user_demographics: {},
      maintenance_schedule: {},
      optimization_recommendations: []
    };

    return analytics;
  } catch (error) {
    logger.error('Error getting equipment utilization analytics', { error: error.message, stack: error.stack });
    if (error.isExpected) throw error;
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
  const { asset_type, category, max_rental_rate } = searchParams || {};

  // NOTE: `assets` (000_base_schema.sql) has no location/state/district
  // columns, so those search filters cannot be applied at this layer yet —
  // see file header. type/category/rate filters are real.
  const where = [`a.status = 'available'`];
  const params = [];

  if (asset_type) {
    params.push(`%${asset_type}%`);
    where.push(`(t.name ILIKE $${params.length} OR t.code ILIKE $${params.length})`);
  }
  if (category) {
    params.push(`%${category}%`);
    where.push(`t.category ILIKE $${params.length}`);
  }
  if (max_rental_rate) {
    params.push(Number(max_rental_rate));
    where.push(`(a.daily_rate IS NULL OR a.daily_rate <= $${params.length})`);
  }

  const { rows } = await pool.query(
    `SELECT a.id, a.name, t.name AS type_name, t.category, a.capacity, a.daily_rate,
            a.utilization_rate, a.status
       FROM assets a
       LEFT JOIN asset_types t ON t.id = a.type_id
      WHERE ${where.join(' AND ')}
      ORDER BY a.created_at DESC
      LIMIT 100`,
    params
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type_name,
    category: r.category,
    location: null,
    distance: null,
    capacity: r.capacity,
    specifications: null,
    rental_rate: r.daily_rate != null ? Number(r.daily_rate) : null,
    availability: r.status === 'available',
    rating: null,
    utilization_rate: r.utilization_rate != null ? Number(r.utilization_rate) : 0,
    match_score: null,
    recommended: false
  }));
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
  // No second-life equipment marketplace table exists anywhere in the schema
  // (checked 000_base_schema.sql and every migration matching /second.life/i —
  // machinery_access and shared_infrastructure_access are usage/booking
  // records for infrastructure the platform already owns a registry entry
  // for, not free-market listings). Rather than querying a table that does
  // not exist, or silently returning an empty array as if that meant "no
  // listings found", this is logged explicitly. See file header.
  logger.warn('getSecondLifeListings: no second-life equipment table in current schema; returning empty result set', { searchParams });
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
      const { asset_name, asset_type } = req.body || {};
      if (!asset_name || !asset_type) {
        return res.status(400).json({ success: false, error: 'asset_name and asset_type are required' });
      }
      let asset = await registerSharedAsset(req.body);
      res.json({ success: true, data: asset });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/shared-infra/assets/search', async (req, res) => {
    try {
      let results = await searchSharedInfrastructure(req.query);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/shared-infra/assets/book', authMiddleware, async (req, res) => {
    try {
      const { asset_id, user_id, date_from, date_to, quantity, total_amount } = req.body || {};
      if (!asset_id || !user_id || !date_from || !date_to || quantity == null || total_amount == null) {
        return res.status(400).json({
          success: false,
          error: 'asset_id, user_id, date_from, date_to, quantity and total_amount are required'
        });
      }
      let booking = await bookSharedAsset(req.body);
      res.json({ success: true, data: booking });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/shared-infra/second-life/list', authMiddleware, async (req, res) => {
    try {
      let listing = await listSecondLifeEquipment(req.body);
      res.json({ success: true, data: listing });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/shared-infra/second-life/search', async (req, res) => {
    try {
      let results = await searchSecondLifeEquipment(req.query);
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/shared-infra/batteries/list', authMiddleware, async (req, res) => {
    try {
      let battery = await listSecondLifeBattery(req.body);
      res.json({ success: true, data: battery });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/shared-infra/renewable/support', async (req, res) => {
    try {
      let recommendations = await getRenewablePowerSupport(req.query.location, req.query);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/shared-infra/assets/:id/analytics', async (req, res) => {
    try {
      let analytics = await getEquipmentUtilizationAnalytics(req.params.id, req.query.period);
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


