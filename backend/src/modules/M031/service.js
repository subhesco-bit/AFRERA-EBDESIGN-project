/**
 * Land Registry Service (M031)
 * Comprehensive land parcel management with AI-powered land valuation
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

async function createLandParcel(parcelData) {
  try {
    const {
      farmer_id,
      village_id,
      survey_number,
      area,
      area_unit,
      location,
      land_type,
      ownership_type,
      boundary_details,
      soil_type,
      irrigation_source,
      current_crop,
      land_use_classification
    } = parcelData;

    const parcel = {
      parcel_id: generateId(),
      farmer_id,
      village_id,
      survey_number,
      area,
      area_unit: area_unit || 'hectares',
      location: location || {},
      land_type,
      ownership_type,
      boundary_details: boundary_details || {},
      soil_type,
      irrigation_source,
      current_crop,
      land_use_classification,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered land valuation
    const aiRequest = {
      task: 'land_valuation',
      parameters: {
        parcel_data: parcelData,
        location_data: await getLocationData(location),
        soil_analysis: await getSoilAnalysis(soil_type),
        market_trends: await getMarketTrends(land_type),
        comparable_sales: await getComparableSales(village_id, area)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    parcel.market_value = aiResponse.estimated_value;
    parcel.ai_valuation_data = aiResponse;

    const result = await pool.query(
      `INSERT INTO land_parcels 
       (parcel_id, farmer_id, village_id, survey_number, area, area_unit, location, 
        land_type, ownership_type, boundary_details, soil_type, irrigation_source, 
        current_crop, land_use_classification, market_value, ai_valuation_data, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        parcel.parcel_id, parcel.farmer_id, parcel.village_id, parcel.survey_number,
        parcel.area, parcel.area_unit, JSON.stringify(parcel.location), parcel.land_type,
        parcel.ownership_type, JSON.stringify(parcel.boundary_details), parcel.soil_type,
        parcel.irrigation_source, parcel.current_crop, parcel.land_use_classification,
        parcel.market_value, JSON.stringify(parcel.ai_valuation_data), parcel.status, parcel.created_at
      ]
    );

    logger.info(`Land parcel created: ${parcel.parcel_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating land parcel', { error: error.message, stack: error.stack });
    throw new Error('Failed to create land parcel');
  }
}

async function transferLandOwnership(parcelId, fromFarmerId, toFarmerId, transferData) {
  try {
    const { transfer_type, transfer_amount, transfer_details, documents } = transferData;

    const transfer = {
      transfer_id: generateId(),
      parcel_id: parcelId,
      from_farmer_id: fromFarmerId,
      to_farmer_id: toFarmerId,
      transfer_date: new Date().toISOString().split('T')[0],
      transfer_type,
      transfer_amount,
      transfer_details: transfer_details || {},
      documents: documents || [],
      approval_status: 'pending',
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO land_transfers 
       (transfer_id, parcel_id, from_farmer_id, to_farmer_id, transfer_date, transfer_type, 
        transfer_amount, transfer_details, documents, approval_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        transfer.transfer_id, transfer.parcel_id, transfer.from_farmer_id,
        transfer.to_farmer_id, transfer.transfer_date, transfer.transfer_type,
        transfer.transfer_amount, JSON.stringify(transfer.transfer_details),
        JSON.stringify(transfer.documents), transfer.approval_status, transfer.created_at
      ]
    );

    logger.info(`Land transfer initiated: ${transfer.transfer_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error transferring land ownership', { error: error.message, stack: error.stack });
    throw new Error('Failed to transfer land ownership');
  }
}

async function getLandByFarmer(farmerId) {
  try {
    const result = await pool.query(
      'SELECT * FROM land_parcels WHERE farmer_id = $1 ORDER BY created_at DESC',
      [farmerId]
    );

    return {
      farmer_id: farmerId,
      total_parcels: result.rows.length,
      total_area: result.rows.reduce((sum, parcel) => sum + parseFloat(parcel.area || 0), 0),
      total_value: result.rows.reduce((sum, parcel) => sum + parseFloat(parcel.market_value || 0), 0),
      parcels: result.rows
    };
  } catch (error) {
    logger.error('Error getting land by farmer', { error: error.message });
    throw new Error('Failed to get land by farmer');
  }
}

async function getLandAnalytics({ district, land_type, startDate, endDate } = {}) {
  try {
    const analytics = {
      period: { startDate, endDate },
      total_parcels: await getTotalParcels(district, land_type),
      total_area: await getTotalArea(district, land_type),
      average_value_per_hectare: await getAverageValue(district, land_type),
      land_type_distribution: await getLandTypeDistribution(district),
      ownership_distribution: await getOwnershipDistribution(district),
      ai_insights: await generateLandInsights(district, land_type)
    };

    return analytics;
  } catch (error) {
    logger.error('Error getting land analytics', { error: error.message, stack: error.stack });
    throw new Error('Failed to get land analytics');
  }
}

function generateId() {
  return `LAND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getLocationData(location) {
  return {
    soil_quality: 'high',
    water_access: 'good',
    climate_suitability: 'excellent'
  };
}

async function getSoilAnalysis(soilType) {
  return {
    fertility: 'high',
    drainage: 'good',
    organic_matter: 3.5
  };
}

async function getMarketTrends(landType) {
  return {
    price_trend: 'increasing',
    demand: 'high',
    appreciation_rate: 0.08
  };
}

async function getComparableSales(villageId, area) {
  return {
    recent_sales: 5,
    average_price: 500000,
    price_range: { min: 400000, max: 600000 }
  };
}

async function getTotalParcels(district, landType) {
  try {
    let query = 'SELECT COUNT(*) as count FROM land_parcels WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND location->>'district' = $${paramIndex++}`;
      params.push(district);
    }
    if (landType) {
      query += ` AND land_type = $${paramIndex++}`;
      params.push(landType);
    }

    const result = await pool.query(query, params);
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalArea(district, landType) {
  try {
    let query = 'SELECT SUM(area) as total FROM land_parcels WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND location->>'district' = $${paramIndex++}`;
      params.push(district);
    }
    if (landType) {
      query += ` AND land_type = $${paramIndex++}`;
      params.push(landType);
    }

    const result = await pool.query(query, params);
    return result.rows[0]?.total || 0;
  } catch (error) {
    return 0;
  }
}

async function getAverageValue(district, landType) {
  try {
    let query = 'SELECT AVG(market_value) as avg FROM land_parcels WHERE market_value IS NOT NULL';
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND location->>'district' = $${paramIndex++}`;
      params.push(district);
    }
    if (landType) {
      query += ` AND land_type = $${paramIndex++}`;
      params.push(landType);
    }

    const result = await pool.query(query, params);
    return result.rows[0]?.avg || 0;
  } catch (error) {
    return 0;
  }
}

async function getLandTypeDistribution(district) {
  try {
    let query = 'SELECT land_type, COUNT(*) as count FROM land_parcels WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND location->>'district' = $${paramIndex++}`;
      params.push(district);
    }

    query += ' GROUP BY land_type';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getOwnershipDistribution(district) {
  try {
    let query = 'SELECT ownership_type, COUNT(*) as count FROM land_parcels WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (district) {
      query += ` AND location->>'district' = $${paramIndex++}`;
      params.push(district);
    }

    query += ' GROUP BY ownership_type';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function generateLandInsights(district, landType) {
  const aiRequest = {
    task: 'land_analytics_insights',
    parameters: {
      district,
      land_type: landType,
      market_data: await getMarketTrends(landType),
      ownership_data: await getOwnershipDistribution(district)
    }
  };

  const aiResponse = await aiAPI.generateRecommendation(aiRequest);
  return aiResponse;
}

module.exports = {
  createLandParcel,
  transferLandOwnership,
  getLandByFarmer,
  getLandAnalytics
};
