/**
 * Equipment Rental Service (M104)
 * Equipment rental marketplace, booking management, and revenue tracking
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * List equipment for rental
 */
async function listEquipmentForRental(rentalData) {
  try {
    const {
      equipment_id,
      owner_id,
      equipment_name,
      category,
      specifications,
      daily_rate,
      availability_start,
      availability_end,
      location,
      state,
      district,
      security_deposit,
      terms_conditions
    } = rentalData;

    const rental = {
      rental_listing_id: generateId(),
      equipment_id,
      owner_id,
      equipment_name,
      category,
      specifications,
      daily_rate,
      availability_start,
      availability_end,
      location,
      state,
      district,
      security_deposit,
      terms_conditions,
      status: 'available',
      created_at: new Date().toISOString()
    };

    // AI-powered rental pricing optimization
    const aiRequest = {
      task: 'rental_pricing_optimization',
      parameters: {
        rental_data: rentalData,
        market_rates: await getMarketRates(category, state, district),
        demand_forecast: await getDemandForecast(category, state),
        seasonality: await analyzeSeasonality(category),
        competitor_pricing: await getCompetitorPricing(category, state)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    rental.ai_pricing = aiResponse;

    const result = await pool.query(
      `INSERT INTO equipment_rental_listings 
       (rental_listing_id, equipment_id, owner_id, equipment_name, category, 
        specifications, daily_rate, availability_start, availability_end, location, 
        state, district, security_deposit, terms_conditions, status, ai_pricing, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        rental.rental_listing_id,
        rental.equipment_id,
        rental.owner_id,
        rental.equipment_name,
        rental.category,
        JSON.stringify(rental.specifications),
        rental.daily_rate,
        rental.availability_start,
        rental.availability_end,
        rental.location,
        rental.state,
        rental.district,
        rental.security_deposit,
        rental.terms_conditions,
        rental.status,
        JSON.stringify(rental.ai_pricing),
        rental.created_at
      ]
    );

    logger.info(`Equipment listed for rental: ${rental.rental_listing_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error listing equipment for rental', { error: error.message, stack: error.stack });
    throw new Error('Failed to list equipment for rental');
  }
}

/**
 * Book equipment rental
 */
async function bookEquipmentRental(bookingData) {
  try {
    const {
      rental_listing_id,
      renter_id,
      start_date,
      end_date,
      delivery_required,
      delivery_location,
      operator_required,
      special_requirements
    } = bookingData;

    const booking = {
      booking_id: generateId(),
      rental_listing_id,
      renter_id,
      start_date,
      end_date,
      delivery_required,
      delivery_location,
      operator_required,
      special_requirements,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // AI-powered booking optimization
    const aiRequest = {
      task: 'rental_booking_optimization',
      parameters: {
        booking_data: bookingData,
        listing_details: await getListingDetails(rental_listing_id),
        renter_profile: await getRenterProfile(renter_id),
        availability_check: await checkAvailability(rental_listing_id, start_date, end_date),
        risk_assessment: await assessRentalRisk(renter_id, rental_listing_id)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    booking.ai_assessment = aiResponse;

    const result = await pool.query(
      `INSERT INTO equipment_rental_bookings 
       (booking_id, rental_listing_id, renter_id, start_date, end_date, 
        delivery_required, delivery_location, operator_required, special_requirements, 
        status, ai_assessment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        booking.booking_id,
        booking.rental_listing_id,
        booking.renter_id,
        booking.start_date,
        booking.end_date,
        booking.delivery_required,
        booking.delivery_location,
        booking.operator_required,
        booking.special_requirements,
        booking.status,
        JSON.stringify(booking.ai_assessment),
        booking.created_at
      ]
    );

    logger.info(`Equipment rental booked: ${booking.booking_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error booking equipment rental', { error: error.message, stack: error.stack });
    throw new Error('Failed to book equipment rental');
  }
}

/**
 * Track rental performance
 */
async function trackRentalPerformance(listingId, period) {
  try {
    const performance = {
      tracking_id: generateId(),
      listing_id: listingId,
      period,
      timestamp: new Date().toISOString(),
      booking_count: await getBookingCount(listingId, period),
      utilization_rate: await calculateUtilizationRate(listingId, period),
      revenue: await calculateRevenue(listingId, period),
      customer_satisfaction: await getCustomerSatisfaction(listingId, period),
      recommendations: await generatePerformanceRecommendations(listingId, period)
    };

    return performance;
  } catch (error) {
    logger.error('Error tracking rental performance', { error: error.message, stack: error.stack });
    throw new Error('Failed to track rental performance');
  }
}

/**
 * Generate rental report
 */
async function generateRentalReport(ownerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      owner_id: ownerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      total_listings: await getTotalListings(ownerId),
      total_bookings: await getTotalBookings(ownerId),
      revenue_summary: await getRevenueSummary(ownerId),
      utilization_summary: await getUtilizationSummary(ownerId),
      customer_feedback: await getCustomerFeedback(ownerId),
      recommendations: await generateOwnerRecommendations(ownerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating rental report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate rental report');
  }
}

function generateId() {
  return `RENT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getMarketRates(category, state, district) {
  return {
    average_daily_rate: 500,
    rate_range: { min: 300, max: 800 },
    demand_level: 'high'
  };
}

async function getDemandForecast(category, state) {
  return {
    forecast: 'increasing',
    peak_season: 'kharif',
    demand_score: 85
  };
}

async function analyzeSeasonality(category) {
  return {
    seasonal_variation: 'high',
    peak_months: [6, 7, 8, 9, 10, 11],
    off_peak_months: [1, 2, 3, 4, 5, 12]
  };
}

async function getCompetitorPricing(category, state) {
  return [
    { competitor: 'A', rate: 450 },
    { competitor: 'B', rate: 550 },
    { competitor: 'C', rate: 500 }
  ];
}

async function getListingDetails(listingId) {
  try {
    const result = await pool.query(
      'SELECT * FROM equipment_rental_listings WHERE rental_listing_id = $1',
      [listingId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function getRenterProfile(renterId) {
  return {
    rating: 4.5,
    booking_count: 10,
    reliability_score: 90
  };
}

async function checkAvailability(listingId, startDate, endDate) {
  return {
    available: true,
    conflicts: []
  };
}

async function assessRentalRisk(renterId, listingId) {
  return {
    risk_level: 'low',
    risk_factors: [],
    recommended_deposit: 5000
  };
}

async function getBookingCount(listingId, period) {
  return {
    total_bookings: 15,
    completed: 12,
    cancelled: 2,
    pending: 1
  };
}

async function calculateUtilizationRate(listingId, period) {
  return {
    utilization_rate: 70,
    available_days: 30,
    booked_days: 21
  };
}

async function calculateRevenue(listingId, period) {
  return {
    total_revenue: 10500,
    daily_rate: 500,
    booked_days: 21
  };
}

async function getCustomerSatisfaction(listingId, period) {
  return {
    average_rating: 4.3,
    total_reviews: 12,
    positive_reviews: 10
  };
}

async function generatePerformanceRecommendations(listingId, period) {
  return [
    'Adjust pricing during peak season',
    'Improve equipment presentation',
    'Offer flexible booking options'
  ];
}

async function getTotalListings(ownerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM equipment_rental_listings WHERE owner_id = $1',
      [ownerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalBookings(ownerId) {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM equipment_rental_bookings br
       JOIN equipment_rental_listings rl ON br.rental_listing_id = rl.rental_listing_id
       WHERE rl.owner_id = $1`,
      [ownerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getRevenueSummary(ownerId) {
  return {
    total_revenue: 45000,
    average_monthly: 15000,
    growth_rate: 15
  };
}

async function getUtilizationSummary(ownerId) {
  return {
    average_utilization: 65,
    top_performing: 80,
    underperforming: 40
  };
}

async function getCustomerFeedback(ownerId) {
  return {
    average_rating: 4.2,
    total_reviews: 45,
    positive_percentage: 85
  };
}

async function generateOwnerRecommendations(ownerId) {
  return [
    'Expand rental inventory during peak season',
    'Implement dynamic pricing',
    'Improve equipment maintenance'
  ];
}

/**
 * List rental listings. `listEquipmentForRental` is misleadingly named -
 * despite the name it creates a listing, it does not browse them. No real
 * browse route existed at all before this (2026-08-24).
 */
async function listRentalListings({ page = 1, limit = 20, owner_id = null, status = null } = {}) {
  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [];
  const params = [];
  if (owner_id) { params.push(owner_id); conditions.push(`owner_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRes = await pool.query(`SELECT COUNT(*) FROM equipment_rental_listings ${where}`, params);
  const total = parseInt(totalRes.rows[0].count, 10);

  const listParams = [...params, limit, offset];
  const res = await pool.query(
    `SELECT * FROM equipment_rental_listings ${where} ORDER BY created_at DESC LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

async function getRentalListing(id) {
  const res = await pool.query('SELECT * FROM equipment_rental_listings WHERE rental_listing_id = $1', [id]);
  return res.rows[0] || null;
}

module.exports = {
  listRentalListings,
  getRentalListing,
  listEquipmentForRental,
  bookEquipmentRental,
  trackRentalPerformance,
  generateRentalReport
};
