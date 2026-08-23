/**
 * Asset Lifecycle Management Service (M110)
 * Asset lifecycle tracking, depreciation management, and disposal optimization
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Register asset
 */
async function registerAsset(assetData) {
  try {
    const {
      farmer_id,
      asset_id,
      asset_type,
      asset_name,
      brand,
      model,
      year,
      serial_number,
      purchase_date,
      purchase_cost,
      estimated_useful_life,
      residual_value,
      location,
      state,
      district,
      status
    } = assetData;

    const asset = {
      asset_registry_id: generateId(),
      asset_id,
      farmer_id,
      asset_type,
      asset_name,
      brand,
      model,
      year,
      serial_number,
      purchase_date,
      purchase_cost,
      estimated_useful_life,
      residual_value,
      location,
      state,
      district,
      status: status || 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered lifecycle optimization
    const aiRequest = {
      task: 'lifecycle_optimization',
      parameters: {
        asset_data: assetData,
        depreciation_schedule: await calculateDepreciationSchedule(purchase_cost, estimated_useful_life, residual_value),
        replacement_timeline: await calculateReplacementTimeline(year, estimated_useful_life),
        maintenance_requirements: await getMaintenanceRequirements(asset_type),
        disposal_options: await getDisposalOptions(asset_type, year)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    asset.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO asset_lifecycle 
       (asset_registry_id, asset_id, farmer_id, asset_type, asset_name, brand, 
        model, year, serial_number, purchase_date, purchase_cost, estimated_useful_life, 
        residual_value, location, state, district, status, ai_recommendations, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        asset.asset_registry_id,
        asset.asset_id,
        asset.farmer_id,
        asset.asset_type,
        asset.asset_name,
        asset.brand,
        asset.model,
        asset.year,
        asset.serial_number,
        asset.purchase_date,
        asset.purchase_cost,
        asset.estimated_useful_life,
        asset.residual_value,
        asset.location,
        asset.state,
        asset.district,
        asset.status,
        JSON.stringify(asset.ai_recommendations),
        asset.created_at
      ]
    );

    logger.info(`Asset registered: ${asset.asset_registry_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error registering asset', { error: error.message, stack: error.stack });
    throw new Error('Failed to register asset');
  }
}

/**
 * Update asset lifecycle stage
 */
async function updateLifecycleStage(registryId, stageData) {
  try {
    const {
      lifecycle_stage,
      condition,
      utilization_hours,
      maintenance_cost,
      notes
    } = stageData;

    const stage = {
      stage_id: generateId(),
      registry_id: registryId,
      lifecycle_stage,
      condition,
      utilization_hours,
      maintenance_cost,
      notes,
      updated_at: new Date().toISOString()
    };

    // AI-powered stage analysis
    const aiRequest = {
      task: 'lifecycle_stage_analysis',
      parameters: {
        stage_data: stageData,
        current_depreciation: await calculateCurrentDepreciation(registryId),
        remaining_useful_life: await getRemainingUsefulLife(registryId),
        optimal_replacement_time: await getOptimalReplacementTime(registryId),
      resale_value: await estimateResaleValue(registryId, condition)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    stage.ai_analysis = aiResponse;

    await pool.query(
      `UPDATE asset_lifecycle 
       SET lifecycle_stage = $1, condition = $2, updated_at = CURRENT_TIMESTAMP
       WHERE asset_registry_id = $3`,
      [lifecycle_stage, condition, registryId]
    );

    const result = await pool.query(
      `INSERT INTO asset_lifecycle_stages 
       (stage_id, registry_id, lifecycle_stage, condition, utilization_hours, 
        maintenance_cost, notes, ai_analysis, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        stage.stage_id,
        stage.registry_id,
        stage.lifecycle_stage,
        stage.condition,
        stage.utilization_hours,
        stage.maintenance_cost,
        stage.notes,
        JSON.stringify(stage.ai_analysis),
        stage.updated_at
      ]
    );

    logger.info(`Asset lifecycle stage updated: ${registryId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating lifecycle stage', { error: error.message, stack: error.stack });
    throw new Error('Failed to update lifecycle stage');
  }
}

/**
 * Track asset depreciation
 */
async function trackAssetDepreciation(registryId, period) {
  try {
    const depreciation = {
      tracking_id: generateId(),
      registry_id: registryId,
      period,
      timestamp: new Date().toISOString(),
      current_value: await getCurrentValue(registryId),
      accumulated_depreciation: await getAccumulatedDepreciation(registryId),
      depreciation_rate: await getDepreciationRate(registryId),
      book_value: await getBookValue(registryId),
      recommendations: await generateDepreciationRecommendations(registryId, period)
    };

    return depreciation;
  } catch (error) {
    logger.error('Error tracking asset depreciation', { error: error.message, stack: error.stack });
    throw new Error('Failed to track asset depreciation');
  }
}

/**
 * Generate lifecycle report
 */
async function generateLifecycleReport(farmerId, reportType) {
  try {
    const report = {
      report_id: generateId(),
      farmer_id: farmerId,
      report_type: reportType,
      generated_at: new Date().toISOString(),
      total_assets: await getTotalAssets(farmerId),
      total_book_value: await getTotalBookValue(farmerId),
      total_depreciation: await getTotalDepreciation(farmerId),
      asset_distribution: await getAssetDistribution(farmerId),
      replacement_schedule: await getReplacementSchedule(farmerId),
      recommendations: await generateLifecycleRecommendations(farmerId)
    };

    return report;
  } catch (error) {
    logger.error('Error generating lifecycle report', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate lifecycle report');
  }
}

function generateId() {
  return `AST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function calculateDepreciationSchedule(purchaseCost, usefulLife, residualValue) {
  const annualDepreciation = (purchaseCost - residualValue) / usefulLife;
  const schedule = [];
  for (let i = 0; i < usefulLife; i++) {
    schedule.push({
      year: i + 1,
      depreciation: annualDepreciation,
      accumulated: annualDepreciation * (i + 1),
      book_value: purchaseCost - (annualDepreciation * (i + 1))
    });
  }
  return schedule;
}

async function calculateReplacementTimeline(year, usefulLife) {
  const currentYear = new Date().getFullYear();
  const assetAge = currentYear - year;
  const remainingLife = usefulLife - assetAge;
  return {
    current_age: assetAge,
    remaining_life: remainingLife,
    replacement_year: currentYear + remainingLife,
    urgency: remainingLife < 2 ? 'high' : remainingLife < 5 ? 'medium' : 'low'
  };
}

async function getMaintenanceRequirements(assetType) {
  return [
    { maintenance: 'routine_inspection', frequency: 'monthly' },
    { maintenance: 'preventive_maintenance', frequency: 'quarterly' },
    { maintenance: 'major_overhaul', frequency: 'annually' }
  ];
}

async function getDisposalOptions(assetType, year) {
  return [
    { option: 'sell', feasibility: 'high', expected_value: 0.3 },
    { option: 'trade_in', feasibility: 'medium', expected_value: 0.25 },
    { option: 'scrap', feasibility: 'high', expected_value: 0.1 }
  ];
}

async function calculateCurrentDepreciation(registryId) {
  try {
    const result = await pool.query(
      'SELECT purchase_date, purchase_cost, estimated_useful_life, residual_value FROM asset_lifecycle WHERE asset_registry_id = $1',
      [registryId]
    );
    const asset = result.rows[0];
    if (!asset) return 0;
    
    const age = new Date().getFullYear() - new Date(asset.purchase_date).getFullYear();
    const annualDepreciation = (asset.purchase_cost - asset.residual_value) / asset.estimated_useful_life;
    return annualDepreciation * age;
  } catch (error) {
    return 0;
  }
}

async function getRemainingUsefulLife(registryId) {
  try {
    const result = await pool.query(
      'SELECT purchase_date, estimated_useful_life FROM asset_lifecycle WHERE asset_registry_id = $1',
      [registryId]
    );
    const asset = result.rows[0];
    if (!asset) return 0;
    
    const age = new Date().getFullYear() - new Date(asset.purchase_date).getFullYear();
    return Math.max(0, asset.estimated_useful_life - age);
  } catch (error) {
    return 0;
  }
}

async function getOptimalReplacementTime(registryId) {
  const remainingLife = await getRemainingUsefulLife(registryId);
  return {
    optimal_year: new Date().getFullYear() + remainingLife,
    reason: remainingLife < 2 ? 'end_of_life' : 'planned_replacement'
  };
}

async function estimateResaleValue(registryId, condition) {
  try {
    const result = await pool.query(
      'SELECT purchase_cost, residual_value FROM asset_lifecycle WHERE asset_registry_id = $1',
      [registryId]
    );
    const asset = result.rows[0];
    if (!asset) return 0;
    
    const conditionMultiplier = condition === 'excellent' ? 0.4 : condition === 'good' ? 0.3 : 0.2;
    return asset.purchase_cost * conditionMultiplier;
  } catch (error) {
    return 0;
  }
}

async function getCurrentValue(registryId) {
  try {
    const result = await pool.query(
      'SELECT purchase_cost FROM asset_lifecycle WHERE asset_registry_id = $1',
      [registryId]
    );
    const purchaseCost = result.rows[0]?.purchase_cost || 0;
    const accumulatedDepreciation = await getAccumulatedDepreciation(registryId);
    return purchaseCost - accumulatedDepreciation;
  } catch (error) {
    return 0;
  }
}

async function getAccumulatedDepreciation(registryId) {
  return await calculateCurrentDepreciation(registryId);
}

async function getDepreciationRate(registryId) {
  try {
    const result = await pool.query(
      'SELECT purchase_cost, estimated_useful_life, residual_value FROM asset_lifecycle WHERE asset_registry_id = $1',
      [registryId]
    );
    const asset = result.rows[0];
    if (!asset) return 0;
    
    return ((asset.purchase_cost - asset.residual_value) / asset.purchase_cost) / asset.estimated_useful_life;
  } catch (error) {
    return 0;
  }
}

async function getBookValue(registryId) {
  return await getCurrentValue(registryId);
}

async function generateDepreciationRecommendations(registryId, period) {
  return [
    'Consider accelerated depreciation for tax benefits',
    'Monitor asset condition regularly',
    'Plan replacement before end of useful life'
  ];
}

async function getTotalAssets(farmerId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM asset_lifecycle WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalBookValue(farmerId) {
  try {
    const result = await pool.query(
      'SELECT SUM(purchase_cost - COALESCE(accumulated_depreciation, 0)) as total FROM asset_lifecycle WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.total || 0;
  } catch (error) {
    return 0;
  }
}

async function getTotalDepreciation(farmerId) {
  try {
    const result = await pool.query(
      'SELECT SUM(accumulated_depreciation) as total FROM asset_lifecycle WHERE farmer_id = $1',
      [farmerId]
    );
    return result.rows[0]?.total || 0;
  } catch (error) {
    return 0;
  }
}

async function getAssetDistribution(farmerId) {
  try {
    const result = await pool.query(
      'SELECT asset_type, COUNT(*) as count FROM asset_lifecycle WHERE farmer_id = $1 GROUP BY asset_type',
      [farmerId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getReplacementSchedule(farmerId) {
  return [
    { asset: 'Tractor A', year: 2028, urgency: 'medium' },
    { asset: 'Implement B', year: 2027, urgency: 'high' }
  ];
}

async function generateLifecycleRecommendations(farmerId) {
  return [
    'Review asset utilization regularly',
    'Plan replacement budget in advance',
    'Consider leasing for short-term needs'
  ];
}

module.exports = {
  registerAsset,
  updateLifecycleStage,
  trackAssetDepreciation,
  generateLifecycleReport
};
