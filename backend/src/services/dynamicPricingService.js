/**
 * Dynamic Pricing Engine
 * Local market-based and nutrient-based dynamic pricing
 */

const { logger } = require('../utils/logger');
const { aiAPI } = require('./aiService');
const { authMiddleware } = require('../middleware/auth');

/**
 * Calculate dynamic price based on local market conditions
 */
async function calculateLocalMarketPricing(productDetails) {
  try {
    const {
      product_id,
      product_name,
      category,
      location,
      state,
      district,
      base_price,
      current_inventory,
      demand_level,
      seasonality,
      competitor_prices,
      quality_grade,
      freshness_score,
      organic_status,
      gi_status
    } = productDetails;

    // Fetch local market data
    const marketData = await getLocalMarketData(location, category);
    
    // AI-powered pricing recommendation
    const aiRequest = {
      task: 'dynamic_pricing',
      parameters: {
        product_id,
        product_name,
        category,
        location,
        state,
        district,
        base_price,
        current_inventory,
        demand_level,
        seasonality,
        competitor_prices: competitor_prices || marketData.competitor_prices,
        quality_grade,
        freshness_score,
        organic_status,
        gi_status,
        market_trends: marketData.trends,
        historical_prices: await getHistoricalPrices(product_id, location),
        supply_demand_ratio: marketData.supply_demand_ratio
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const pricing = {
      product_id: product_id,
      location: location,
      timestamp: new Date().toISOString(),
      base_price: base_price,
      recommended_price: aiResponse.recommended_price,
      price_adjustments: {
        demand_factor: aiResponse.demand_factor,
        seasonality_factor: aiResponse.seasonality_factor,
        competition_factor: aiResponse.competition_factor,
        quality_factor: aiResponse.quality_factor,
        freshness_factor: aiResponse.freshness_factor,
        organic_premium: aiResponse.organic_premium,
        gi_premium: aiResponse.gi_premium,
        inventory_pressure: aiResponse.inventory_pressure
      },
      price_range: {
        minimum: aiResponse.min_price,
        maximum: aiResponse.max_price,
        optimal: aiResponse.recommended_price
      },
      market_insights: {
        current_demand: marketData.current_demand,
        demand_trend: marketData.demand_trend,
        supply_level: marketData.supply_level,
        price_elasticity: aiResponse.price_elasticity,
        competitor_analysis: aiResponse.competitor_analysis
      },
      recommendations: aiResponse.recommendations,
      confidence: aiResponse.confidence,
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    logger.info(`Dynamic pricing calculated for product ${product_id} in ${location}`);
    return pricing;
  } catch (error) {
    logger.error('Error calculating local market pricing', { error: error.message, stack: error.stack });
    throw new Error('Failed to calculate dynamic pricing');
  }
}

/**
 * Calculate price based on nutrient content and quality
 */
async function calculateNutrientBasedPricing(productDetails) {
  try {
    const {
      product_id,
      product_name,
      category,
      base_price,
      nutrient_data,
      lab_test_results,
      quality_certifications,
      organic_status,
      location
    } = productDetails;

    // AI-powered nutrient-based pricing
    const aiRequest = {
      task: 'nutrient_based_pricing',
      parameters: {
        product_id,
        product_name,
        category,
        base_price,
        nutrient_data: nutrient_data || {},
        lab_test_results: lab_test_results || {},
        quality_certifications: quality_certifications || [],
        organic_status,
        location,
        industry_standards: await getIndustryNutrientStandards(category),
        premium_nutrients: await getPremiumNutrients(category),
        market_premiums: await getNutrientMarketPremiums(category)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const pricing = {
      product_id: product_id,
      timestamp: new Date().toISOString(),
      base_price: base_price,
      nutrient_based_price: aiResponse.nutrient_based_price,
      nutrient_analysis: {
        overall_score: aiResponse.nutrient_score,
        premium_nutrients: aiResponse.premium_nutrients,
        deficiencies: aiResponse.deficiencies,
        comparison_with_standard: aiResponse.standard_comparison
      },
      price_breakdown: {
        base_component: aiResponse.base_component,
        nutrient_premium: aiResponse.nutrient_premium,
        quality_premium: aiResponse.quality_premium,
        organic_premium: aiResponse.organic_premium,
        certification_premium: aiResponse.certification_premium
      },
      lab_verification: {
        lab_name: lab_test_results?.lab_name,
        test_date: lab_test_results?.test_date,
        certificate_number: lab_test_results?.certificate_number,
        verified: aiResponse.lab_verified
      },
      market_comparison: {
        average_market_price: aiResponse.avg_market_price,
        premium_percentage: aiResponse.premium_percentage,
        value_proposition: aiResponse.value_proposition
      },
      recommendations: aiResponse.recommendations,
      confidence: aiResponse.confidence
    };

    logger.info(`Nutrient-based pricing calculated for product ${product_id}`);
    return pricing;
  } catch (error) {
    logger.error('Error calculating nutrient-based pricing', { error: error.message, stack: error.stack });
    throw new Error('Failed to calculate nutrient-based pricing');
  }
}

/**
 * Optimize farmer selection and order flow for maximum margin
 */
async function optimizeFarmerSelection(orderRequirements) {
  try {
    const {
      product_id,
      quantity_required,
      quality_requirements,
      delivery_location,
      delivery_deadline,
      price_sensitivity,
      buyer_preferences
    } = orderRequirements;

    // AI-powered farmer selection optimization
    const aiRequest = {
      task: 'farmer_selection_optimization',
      parameters: {
        product_id,
        quantity_required,
        quality_requirements,
        delivery_location,
        delivery_deadline,
        price_sensitivity,
        buyer_preferences,
        available_farmers: await getAvailableFarmers(product_id, quantity_required),
        farmer_performance: await getFarmerPerformanceData(product_id),
        logistics_costs: await getLogisticsCosts(delivery_location),
        historical_margins: await getHistoricalMargins(product_id)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const optimization = {
      order_id: generateId(),
      timestamp: new Date().toISOString(),
      order_requirements: orderRequirements,
      recommended_farmers: aiResponse.recommended_farmers.map(farmer => ({
        farmer_id: farmer.id,
        farmer_name: farmer.name,
        location: farmer.location,
        offered_price: farmer.offered_price,
        quality_score: farmer.quality_score,
        reliability_score: farmer.reliability_score,
        logistics_cost: farmer.logistics_cost,
        total_cost: farmer.total_cost,
        margin: farmer.margin,
        margin_percentage: farmer.margin_percentage,
        delivery_estimate: farmer.delivery_estimate,
        match_score: farmer.match_score
      })),
      optimal_allocation: aiResponse.optimal_allocation,
      margin_analysis: {
        total_margin: aiResponse.total_margin,
        average_margin_percentage: aiResponse.avg_margin_percentage,
        margin_distribution: aiResponse.margin_distribution,
        margin_optimization_potential: aiResponse.optimization_potential
      },
      risk_factors: aiResponse.risk_factors,
      recommendations: aiResponse.recommendations,
      confidence: aiResponse.confidence
    };

    logger.info(`Farmer selection optimization completed for order ${optimization.order_id}`);
    return optimization;
  } catch (error) {
    logger.error('Error optimizing farmer selection', { error: error.message, stack: error.stack });
    throw new Error('Failed to optimize farmer selection');
  }
}

/**
 * Get real-time price alerts for subscribed products
 */
async function getPriceAlerts(userId, productIds) {
  try {
    const alerts = [];

    for (const productId of productIds) {
      const currentPricing = await calculateLocalMarketPricing({
        product_id: productId,
        location: await getUserLocation(userId),
        base_price: await getBasePrice(productId)
      });

      const threshold = await getUserPriceThreshold(userId, productId);
      
      if (currentPricing.recommended_price <= threshold.max_price ||
          currentPricing.recommended_price >= threshold.min_price) {
        alerts.push({
          product_id: productId,
          alert_type: currentPricing.recommended_price <= threshold.max_price ? 'price_drop' : 'price_rise',
          current_price: currentPricing.recommended_price,
          threshold_price: threshold.max_price,
          price_change: currentPricing.recommended_price - threshold.last_price,
          percentage_change: ((currentPricing.recommended_price - threshold.last_price) / threshold.last_price) * 100,
          recommendation: currentPricing.recommendations[0],
          valid_until: currentPricing.valid_until
        });
      }
    }

    return {
      user_id: userId,
      timestamp: new Date().toISOString(),
      alerts: alerts,
      total_alerts: alerts.length
    };
  } catch (error) {
    logger.error('Error getting price alerts', { error: error.message, stack: error.stack });
    throw new Error('Failed to get price alerts');
  }
}

/**
 * Set up dynamic pricing rules for a product
 */
async function setPricingRules(productId, rules) {
  try {
    const pricingRules = {
      product_id: productId,
      rules: {
        min_price: rules.min_price,
        max_price: rules.max_price,
        price_floor: rules.price_floor,
        price_ceiling: rules.price_ceiling,
        auto_adjust: rules.auto_adjust || false,
        adjustment_frequency: rules.adjustment_frequency || 'daily',
        demand_sensitivity: rules.demand_sensitivity || 'medium',
        competition_sensitivity: rules.competition_sensitivity || 'medium',
        seasonality_enabled: rules.seasonality_enabled || false,
        quality_premium_enabled: rules.quality_premium_enabled || true,
        organic_premium_enabled: rules.organic_premium_enabled || true,
        gi_premium_enabled: rules.gi_premium_enabled || true
      },
      created_at: new Date().toISOString(),
      created_by: rules.created_by
    };

    // In production, save to database
    
    logger.info(`Pricing rules set for product ${productId}`);
    return pricingRules;
  } catch (error) {
    logger.error('Error setting pricing rules', { error: error.message, stack: error.stack });
    throw new Error('Failed to set pricing rules');
  }
}

// Helper functions
async function getLocalMarketData(location, category) {
  // In production, fetch from market data API
  return {
    competitor_prices: [45, 48, 52, 55],
    trends: 'increasing',
    supply_demand_ratio: 0.8,
    current_demand: 'high',
    demand_trend: 'upward',
    supply_level: 'moderate'
  };
}

async function getHistoricalPrices(productId, location) {
  // Fetch historical price data
  return [42, 44, 45, 47, 48, 50, 52];
}

async function getIndustryNutrientStandards(category) {
  // Fetch industry standards for nutrients
  return {
    protein: { min: 10, max: 25, unit: 'g' },
    vitamins: { min: 5, max: 50, unit: 'mg' },
    minerals: { min: 100, max: 500, unit: 'mg' }
  };
}

async function getPremiumNutrients(category) {
  // Fetch premium nutrients for category
  return ['omega_3', 'antioxidants', 'fiber', 'protein'];
}

async function getNutrientMarketPremiums(category) {
  // Fetch market premiums for nutrients
  return {
    omega_3: 0.15,
    antioxidants: 0.10,
    organic: 0.25,
    gi: 0.20
  };
}

async function getAvailableFarmers(productId, quantity) {
  // Fetch available farmers
  return [];
}

async function getFarmerPerformanceData(productId) {
  // Fetch farmer performance data
  return {};
}

async function getLogisticsCosts(location) {
  // Fetch logistics costs
  return {};
}

async function getHistoricalMargins(productId) {
  // Fetch historical margins
  return [];
}

async function getUserLocation(userId) {
  // Fetch user location
  return 'Assam';
}

async function getBasePrice(productId) {
  // Fetch base price
  return 50;
}

async function getUserPriceThreshold(userId, productId) {
  // Fetch user's price threshold
  return {
    max_price: 55,
    min_price: 40,
    last_price: 48
  };
}

function generateId() {
  return `DP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Express routes setup

// ===========================================================================
// YIELD MANAGEMENT — airline-style pricing for perishable inventory.
// Migration 059. EXTENDED INTO THIS SERVICE, not split into a parallel one:
// this file already owns pricing, and two pricing services would eventually
// quote two different prices for the same lot.
//
// The structural analogy: an airline seat and a crate of produce are both
// fixed, perishable inventory sold against uncertain demand arriving over
// time. An unsold unit costs the ENTIRE unit in both cases.
//
// Where it breaks: airlines overbook because a seat is a promise. Produce is
// physical — overselling means somebody who paid receives nothing, and here
// that is usually an FPO that already paid the farmer. There is no
// overbooking function below and there should not be one.
// ===========================================================================

const ymPool = require('../database/pool');

/**
 * Price a lot right now, given time remaining and how much is unsold.
 *
 * Returns the reasoning, not just a number. A farmer or an FPO seeing a 35%
 * markdown deserves to know it was triggered by two days of shelf life and a
 * half-empty lot, not by an algorithm's mood.
 */
async function priceForLot(lotCode) {
  const { rows: lots } = await ymPool.query(
    'SELECT * FROM pricing_lots WHERE lot_code = $1', [lotCode]
  );
  if (!lots.length) throw new Error(`Lot ${lotCode} not found`);
  const lot = lots[0];

  const daysToExpiry = Math.max(0, Math.ceil(
    (new Date(lot.expires_on) - Date.now()) / 86400000
  ));

  const { rows: buckets } = await ymPool.query(
    'SELECT * FROM pricing_buckets WHERE lot_code = $1 ORDER BY sequence_no', [lotCode]
  );
  const allocated = buckets.reduce((s, b) => s + Number(b.allocated_kg), 0);
  const sold = buckets.reduce((s, b) => s + Number(b.sold_kg), 0);
  const lotSize = Number(lot.lot_size_kg);
  const pctSold = lotSize ? (sold / lotSize) * 100 : 0;
  const pctUnsold = 100 - pctSold;

  // Applicable markdown: the deepest rule whose BOTH conditions hold. Time
  // alone is not enough — discounting a nearly-sold-out lot just gives away
  // margin on the units that were going to sell anyway.
  const { rows: rules } = await ymPool.query(
    `SELECT * FROM markdown_rules
      WHERE enabled
        AND (applies_to_all OR crop_key = $1)
        AND days_to_expiry_at_or_below >= $2
        AND pct_unsold_at_or_above <= $3
      ORDER BY discount_pct DESC
      LIMIT 1`,
    [lot.crop_key ?? null, daysToExpiry, pctUnsold]
  );

  const listPrice = Number(lot.list_price_inr_per_kg);
  const floor = Number(lot.farmer_floor_inr_per_kg);
  const rule = rules[0] ?? null;
  const discountPct = rule ? Number(rule.discount_pct) : 0;

  let price = listPrice * (1 - discountPct / 100);
  let floorApplied = false;
  if (rule?.never_below_floor !== false && price < floor) {
    price = floor;
    floorApplied = true;
  }

  // The open bucket is what a buyer actually pays if buckets are in use.
  const openBucket = buckets.find((b) => b.status === 'open');

  return {
    lotCode,
    daysToExpiry,
    lotSizeKg: lotSize,
    soldKg: sold,
    pctSold: Math.round(pctSold * 100) / 100,
    listPriceInrPerKg: listPrice,
    farmerFloorInrPerKg: floor,
    discountPct,
    priceInrPerKg: Math.round(price * 100) / 100,
    floorApplied,
    activeBucket: openBucket
      ? { code: openBucket.bucket_code, price: Number(openBucket.price_inr_per_kg),
        remainingKg: Number(openBucket.remaining_kg) }
      : null,
    reasoning: rule
      ? [`${daysToExpiry} day(s) to expiry with ${Math.round(pctUnsold)}% unsold`,
        `rule: ${discountPct}% off when <=${rule.days_to_expiry_at_or_below} days and >=${rule.pct_unsold_at_or_above}% unsold`,
        rule.rationale]
        .filter(Boolean)
      : [`${daysToExpiry} day(s) to expiry, ${Math.round(pctSold)}% sold — no markdown triggered`],
    floorNote: floorApplied
      ? 'Markdown was capped at the farmer floor. Below this the platform would be '
      + "funding the discount out of the farmer's income, which inverts the point of "
      + 'the floor.'
      : null,
    // Allocated less than the lot means unpriced stock nobody can buy.
    unallocatedKg: Math.round((lotSize - allocated) * 1000) / 1000,
  };
}

/**
 * Open the next fare bucket. Airlines call this inventory control.
 *
 * Buckets open in sequence and never re-open cheaper — a buyer who sees the
 * price fall back after committing at a higher tier will not commit early
 * again, and early commitment is the entire benefit of the mechanism.
 */
async function openNextBucket(lotCode) {
  const { rows } = await ymPool.query(
    `SELECT * FROM pricing_buckets
      WHERE lot_code = $1 AND status = 'closed'
      ORDER BY sequence_no LIMIT 1`,
    [lotCode]
  );
  if (!rows.length) return { opened: null, note: 'No closed buckets remain for this lot.' };

  const next = rows[0];
  await ymPool.query(
    `UPDATE pricing_buckets SET status = 'sold_out'
      WHERE lot_code = $1 AND status = 'open' AND remaining_kg <= 0`,
    [lotCode]
  );
  const { rows: opened } = await ymPool.query(
    `UPDATE pricing_buckets
        SET status = 'open', opens_at = COALESCE(opens_at, CURRENT_TIMESTAMP)
      WHERE id = $1 RETURNING *`,
    [next.id]
  );
  return {
    opened: opened[0],
    note: `Bucket ${next.bucket_code} open at Rs ${next.price_inr_per_kg}/kg for `
        + `${next.allocated_kg} kg. Buckets do not re-open cheaper — a price that falls `
        + 'back after someone commits teaches them never to commit early again.',
  };
}

/**
 * Learned booking curve for a crop: how much is typically sold with N days left.
 *
 * Reports `statistically_usable` honestly. Airlines build these on thousands of
 * departures; a curve from three lots is an anecdote, and treating it as a
 * model is how a pricing engine becomes confidently wrong.
 */
async function bookingCurve(cropKey) {
  const { rows } = await ymPool.query(
    'SELECT * FROM v_booking_curve WHERE crop_key = $1 ORDER BY days_to_expiry DESC',
    [cropKey]
  );
  const usable = rows.filter((r) => r.statistically_usable);
  return {
    cropKey,
    points: rows,
    usablePoints: usable.length,
    note: rows.length === 0
      ? 'No booking observations for this crop. Demand timing is unknown — markdown '
      + 'rules will fire on the calendar alone until sales history accumulates.'
      : usable.length === 0
        ? `${rows.length} point(s) recorded but none has 10+ observations. This is an `
        + 'anecdote, not a curve. Airlines build these on thousands of departures.'
        : null,
  };
}

/** Record a sale against the curve, so the model improves with use. */
async function recordBookingPoint({ lotCode, cropKey, productId, daysToExpiry, pctSold, realisedPrice, season }) {
  const { rows } = await ymPool.query(
    `INSERT INTO booking_curve_observations
       (crop_key, product_id, days_to_expiry, pct_of_lot_sold,
        realised_price_inr_per_kg, lot_code, season, data_provenance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'real') RETURNING *`,
    [cropKey ?? null, productId ?? null, daysToExpiry, pctSold,
      realisedPrice ?? null, lotCode ?? null, season ?? null]
  );
  return rows[0];
}

/** Lots approaching expiry with stock left — the ones needing a decision today. */
async function lotsNeedingAttention({ withinDays = 7 } = {}) {
  const { rows } = await ymPool.query(
    `SELECT l.*,
            (l.expires_on - CURRENT_DATE) AS days_to_expiry,
            COALESCE(SUM(b.sold_kg), 0)   AS sold_kg
       FROM pricing_lots l
       LEFT JOIN pricing_buckets b ON b.lot_code = l.lot_code
      WHERE l.status = 'active'
        AND l.expires_on <= CURRENT_DATE + ($1 || ' days')::interval
      GROUP BY l.id
      ORDER BY l.expires_on`,
    [Number(withinDays)]
  );
  return {
    lots: rows.map((r) => {
      const pctSold = Number(r.lot_size_kg)
        ? (Number(r.sold_kg) / Number(r.lot_size_kg)) * 100 : 0;
      return {
        ...r,
        pctSold: Math.round(pctSold * 100) / 100,
        atRiskKg: Math.round((Number(r.lot_size_kg) - Number(r.sold_kg)) * 1000) / 1000,
        urgency: r.days_to_expiry <= 1 ? 'today'
          : r.days_to_expiry <= 3 ? 'high' : 'watch',
      };
    }),
    count: rows.length,
    note: 'The alternative to a deep discount on these is not a lower price — it is a '
        + 'total loss plus disposal cost, with the farmer floor still owed.',
  };
}

function setupRoutes(app) {
  app.post('/api/v1/pricing/local-market', authMiddleware, async (req, res) => {
    try {
      const pricing = await calculateLocalMarketPricing(req.body);
      res.json({ success: true, data: pricing });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/pricing/nutrient-based', authMiddleware, async (req, res) => {
    try {
      const pricing = await calculateNutrientBasedPricing(req.body);
      res.json({ success: true, data: pricing });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/pricing/farmer-optimization', authMiddleware, async (req, res) => {
    try {
      const optimization = await optimizeFarmerSelection(req.body);
      res.json({ success: true, data: optimization });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/v1/pricing/alerts/:userId', async (req, res) => {
    try {
      const productIds = req.query.productIds ? req.query.productIds.split(',') : [];
      const alerts = await getPriceAlerts(req.params.userId, productIds);
      res.json({ success: true, data: alerts });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/v1/pricing/rules/:productId', authMiddleware, async (req, res) => {
    try {
      const rules = await setPricingRules(req.params.productId, req.body);
      res.json({ success: true, data: rules });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

module.exports = {
  calculateLocalMarketPricing,
  // Yield management (059) — extended into this service, not a parallel one.
  priceForLot,
  openNextBucket,
  bookingCurve,
  recordBookingPoint,
  lotsNeedingAttention,
  calculateNutrientBasedPricing,
  optimizeFarmerSelection,
  getPriceAlerts,
  setPricingRules,
  setupRoutes
};
