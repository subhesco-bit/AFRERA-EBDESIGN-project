// Service for Farmer Advisory (M030) - AI Enhanced
// Comprehensive farmer advisory with AI-powered recommendations and IoT integration
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// AI-powered advisory generation
async function generateAdvisory(farmerId, advisoryType) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const farmer = await pg.query('SELECT * FROM farmers WHERE id = $1', [farmerId]);
  if (!farmer.rows.length) {
    return { success: false, error: 'Farmer not found' };
  }
  
  const farmerData = farmer.rows[0];
  
  let advisory = {};
  
  switch (advisoryType) {
    case 'crop_recommendation':
      advisory = await generateCropRecommendation(farmerData);
      break;
    case 'weather_advisory':
      advisory = await generateWeatherAdvisory(farmerData);
      break;
    case 'market_advisory':
      advisory = await generateMarketAdvisory(farmerData);
      break;
    case 'pest_alert':
      advisory = await generatePestAlert(farmerData);
      break;
    case 'government_scheme':
      advisory = await generateGovernmentSchemeAdvisory(farmerData);
      break;
    default:
      advisory = await generateGeneralAdvisory(farmerData);
  }
  
  // Store advisory
  const res = await pg.query(
    `INSERT INTO farmer_advisories (farmer_id, advisory_type, content, priority, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [farmerId, advisoryType, JSON.stringify(advisory), advisory.priority || 'medium']
  );
  
  // Emit signal for advisory generation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'farmer_advisory',
    farmerId,
    advisoryType,
    priority: advisory.priority
  }, {
    severity: advisory.priority === 'critical' ? SEVERITY.CRITICAL : SEVERITY.INFO,
    source: 'farmer_advisory_service',
    entityId: farmerId
  });
  
  return { success: true, data: advisory, advisoryId: res.rows[0].id };
}

async function generateCropRecommendation(farmerData) {
  const recommendations = [];
  
  // Based on land size
  if (farmerData.land_size < 2) {
    recommendations.push({
      type: 'crop',
      name: 'Vegetable Farming',
      reason: 'Suitable for small land holdings with high value per area',
      expectedYield: 'High value, low volume',
      priority: 'high'
    });
    recommendations.push({
      type: 'crop',
      name: 'Poultry',
      reason: 'Requires minimal land, high profitability',
      expectedYield: 'Medium volume, high profit',
      priority: 'medium'
    });
  } else if (farmerData.land_size < 5) {
    recommendations.push({
      type: 'crop',
      name: 'Cereal Cultivation',
      reason: 'Medium land suitable for staple crop production',
      expectedYield: 'Medium volume, stable profit',
      priority: 'high'
    });
    recommendations.push({
      type: 'crop',
      name: 'Fruit Orchards',
      reason: 'Long-term investment with high returns',
      expectedYield: 'Medium volume, high value',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      type: 'crop',
      name: 'Cash Crops',
      reason: 'Large land suitable for commercial cash crop farming',
      expectedYield: 'High volume, market-dependent profit',
      priority: 'high'
    });
    recommendations.push({
      type: 'crop',
      name: 'Dairy Operations',
      reason: 'Large land suitable for integrated dairy farming',
      expectedYield: 'High volume, consistent profit',
      priority: 'medium'
    });
  }
  
  // Based on existing primary crop
  if (farmerData.primary_crop) {
    recommendations.push({
      type: 'diversification',
      name: `Crop Rotation with ${farmerData.primary_crop}`,
      reason: 'Improve soil health and reduce pest pressure',
      expectedYield: 'Sustainable long-term yield',
      priority: 'medium'
    });
  }
  
  return {
    type: 'crop_recommendation',
    recommendations,
    confidence: 0.85,
    urgency: 'normal'
  };
}

async function generateWeatherAdvisory(farmerData) {
  // This would integrate with weather API
  const advisories = [
    {
      type: 'weather',
      message: 'Monitor upcoming weather patterns for optimal planting time',
      action: 'Check weather forecasts weekly',
      priority: 'medium'
    },
    {
      type: 'weather',
      message: 'Prepare irrigation systems for expected rainfall variations',
      action: 'Ensure water storage capacity',
      priority: 'high'
    }
  ];
  
  return {
    type: 'weather_advisory',
    advisories,
    confidence: 0.75,
    urgency: 'seasonal'
  };
}

async function generateMarketAdvisory(farmerData) {
  const advisories = [
    {
      type: 'market',
      message: 'Monitor market prices for primary crops before harvest',
      action: 'Set up price alerts for key commodities',
      priority: 'high'
    },
    {
      type: 'market',
      message: 'Consider forward contracts to lock in prices',
      action: 'Contact agricultural commodity exchanges',
      priority: 'medium'
    }
  ];
  
  return {
    type: 'market_advisory',
    advisories,
    confidence: 0.8,
    urgency: 'continuous'
  };
}

async function generatePestAlert(farmerData) {
  // This would integrate with pest monitoring systems
  const alerts = [
    {
      type: 'pest',
      message: 'Seasonal pest activity expected in region',
      action: 'Prepare pest control measures',
      priority: 'high'
    },
    {
      type: 'pest',
      message: 'Monitor for early signs of disease in primary crop',
      action: 'Regular field inspections recommended',
      priority: 'medium'
    }
  ];
  
  return {
    type: 'pest_alert',
    alerts,
    confidence: 0.7,
    urgency: 'immediate'
  };
}

async function generateGovernmentSchemeAdvisory(farmerData) {
  const schemes = [
    {
      type: 'scheme',
      name: 'PM-KISAN',
      description: 'Pradhan Mantri Krishi Sinchai Yojana - Irrigation subsidy',
      eligibility: 'Small and marginal farmers',
      action: 'Apply through local agriculture office',
      priority: 'high'
    },
    {
      type: 'scheme',
      name: 'PM-KISAN Samridhi',
      description: 'Soil health card and fertilizer subsidy',
      eligibility: 'All farmers with registered land',
      action: 'Register for soil health card',
      priority: 'high'
    }
  ];
  
  return {
    type: 'government_scheme',
    schemes,
    confidence: 0.9,
    urgency: 'limited_time'
  };
}

async function generateGeneralAdvisory(farmerData) {
  return {
    type: 'general',
    recommendations: [
      {
        type: 'practice',
        message: 'Follow sustainable farming practices for long-term soil health',
        priority: 'medium'
      },
      {
        type: 'practice',
        message: 'Maintain farm records for better financial planning',
        priority: 'high'
      }
    ],
    confidence: 0.8,
    urgency: 'continuous'
  };
}

// Advisory history and management
async function getFarmerAdvisories(farmerId, { limit = 20, advisoryType } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM farmer_advisories WHERE farmer_id = $1';
  const params = [farmerId];
  let paramIndex = 2;
  
  if (advisoryType) {
    query += ` AND advisory_type = $${paramIndex++}`;
    params.push(advisoryType);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const res = await pg.query(query, params);
  return res.rows;
}

async function getAdvisory(advisoryId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query('SELECT * FROM farmer_advisories WHERE id = $1', [advisoryId]);
  return res.rows[0] || null;
}

// IoT sensor integration
async function registerIoTDevice(farmerId, deviceData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { deviceId, deviceType, location, capabilities } = deviceData;
  
  const res = await pg.query(
    `INSERT INTO iot_devices (farmer_id, device_id, device_type, location, capabilities, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
     ON CONFLICT (farmer_id, device_id) DO UPDATE SET
       device_type = EXCLUDED.device_type,
       location = EXCLUDED.location,
       capabilities = EXCLUDED.capabilities,
       updated_at = NOW()
     RETURNING *`,
    [farmerId, deviceId, deviceType, JSON.stringify(location), JSON.stringify(capabilities || [])]
  );
  
  // Emit signal for IoT device registration
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'iot_device',
    farmerId,
    deviceId,
    deviceType
  }, {
    severity: SEVERITY.INFO,
    source: 'farmer_advisory_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getIoTDeviceData(farmerId, deviceId, { timeframe = '24h' } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const device = await pg.query(
    'SELECT * FROM iot_devices WHERE farmer_id = $1 AND device_id = $2',
    [farmerId, deviceId]
  );

  if (!device.rows.length) {
    return {
      deviceId,
      timeframe,
      implemented: false,
      reason: 'No registered IoT device exists for this farmer/device pair.'
    };
  }

  return {
    deviceId,
    timeframe,
    device: device.rows[0],
    data: [],
    implemented: false,
    reason: 'Device registry is connected, but no real IoT telemetry table/provider is wired to this module yet.'
  };
}

// Real-time alerts
async function createAlert(alertData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { farmerId, alertType, severity, message, actionRequired } = alertData;
  
  const res = await pg.query(
    `INSERT INTO farmer_alerts (farmer_id, alert_type, severity, message, action_required, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW())
     RETURNING *`,
    [farmerId, alertType, severity, message, actionRequired]
  );
  
  // Emit signal for critical alerts
  if (severity === 'critical') {
    signalBus.emitSignal(SIGNAL.EMERGENCY_RAISED, {
      farmerId,
      alertType,
      message,
      actionRequired
    }, {
      severity: SEVERITY.CRITICAL,
      source: 'farmer_advisory_service',
      entityId: farmerId
    });
  }
  
  return res.rows[0];
}

async function getFarmerAlerts(farmerId, { unreadOnly = false, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM farmer_alerts WHERE farmer_id = $1';
  const params = [farmerId];
  let paramIndex = 2;
  
  if (unreadOnly) {
    query += ` AND is_read = false`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  const res = await pg.query(query, params);
  return res.rows;
}

async function markAlertAsRead(alertId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query('UPDATE farmer_alerts SET is_read = true, read_at = NOW() WHERE id = $1', [alertId]);
  return { success: true };
}

// Advisory analytics
async function getAdvisoryAnalytics({ startDate, endDate, advisoryType } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      advisory_type,
      priority,
      COUNT(*) as count,
      DATE(created_at) as date
    FROM farmer_advisories
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  if (advisoryType) {
    query += ` AND advisory_type = $${paramIndex++}`;
    params.push(advisoryType);
  }
  
  query += ` GROUP BY advisory_type, priority, DATE(created_at) ORDER BY date DESC`;
  
  const res = await pg.query(query, params);
  
  return {
    data: res.rows,
    totalAdvisories: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    byType: groupBy(res.rows, 'advisory_type'),
    byPriority: groupBy(res.rows, 'priority')
  };
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

function scorePerformance(payload = {}) {
  const harvestQuality = Number(payload.harvestQualityScore ?? 0);
  const marketReliability = Number(payload.marketReliabilityScore ?? 0);
  const compliance = Number(payload.complianceScore ?? 0);
  const training = Number(payload.trainingReadinessScore ?? 0);
  const health = Number(payload.healthRiskScore ?? 0);

  const weighted =
    harvestQuality * 0.28 +
    marketReliability * 0.22 +
    compliance * 0.22 +
    training * 0.18 -
    health * 0.10;

  return Math.max(0, Math.min(100, Math.round(weighted)));
}

function normalizePerformanceSnapshot(payload = {}) {
  const performanceScore = scorePerformance(payload);
  const improvementActions = [];

  if (Number(payload.complianceScore ?? 0) < 70) {
    improvementActions.push('Close certification and documentation gaps');
  }
  if (Number(payload.trainingReadinessScore ?? 0) < 70) {
    improvementActions.push('Complete priority skill training modules');
  }
  if (Number(payload.marketReliabilityScore ?? 0) < 70) {
    improvementActions.push('Improve fulfilment timeliness and buyer communication');
  }
  if (Number(payload.healthRiskScore ?? 0) > 50) {
    improvementActions.push('Resolve health and welfare risk signals');
  }

  return {
    moduleId: 'M030',
    farmerId: payload.farmerId ?? payload.farmer_id ?? null,
    periodStart: payload.periodStart ?? payload.period_start ?? null,
    periodEnd: payload.periodEnd ?? payload.period_end ?? null,
    harvestQualityScore: Number(payload.harvestQualityScore ?? 0),
    marketReliabilityScore: Number(payload.marketReliabilityScore ?? 0),
    complianceScore: Number(payload.complianceScore ?? 0),
    trainingReadinessScore: Number(payload.trainingReadinessScore ?? 0),
    healthRiskScore: Number(payload.healthRiskScore ?? 0),
    performanceScore,
    band: performanceScore >= 80 ? 'leader' : performanceScore >= 60 ? 'stable' : 'needs_support',
    improvementActions,
    sourceSignals: payload.sourceSignals ?? {},
    updatedAt: new Date().toISOString()
  };
}

async function createPerformanceSnapshot(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const snapshot = normalizePerformanceSnapshot(payload);
  const res = await pg.query(
    `INSERT INTO farmer_m030_items (data, created_at, updated_at)
     VALUES ($1, NOW(), NOW())
     RETURNING *`,
    [snapshot]
  );

  return res.rows[0];
}

async function getFarmerPerformance(farmerId, { limit = 12 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
  const res = await pg.query(
    `SELECT * FROM farmer_m030_items
     WHERE data->>'farmerId' = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [farmerId, safeLimit]
  );
  const snapshots = res.rows.map(row => ({ ...row, data: normalizePerformanceSnapshot(row.data || {}) }));

  return {
    farmerId,
    latest: snapshots[0] || null,
    history: snapshots,
    trend: snapshots.length >= 2
      ? snapshots[0].data.performanceScore - snapshots[snapshots.length - 1].data.performanceScore
      : 0
  };
}

async function healthCheck() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  await pg.query('SELECT 1');
  return {
    status: 'healthy',
    moduleId: 'M030',
    moduleName: 'Farmer Performance',
    advisoryRoutes: true,
    performanceSnapshots: true
  };
}

async function execute(operation, parameters = {}) {
  switch (operation) {
    case 'createPerformanceSnapshot':
    case 'create':
      return { success: true, data: await createPerformanceSnapshot(parameters) };
    case 'performance':
    case 'analyze':
      return { success: true, data: await getFarmerPerformance(parameters.farmerId, parameters) };
    case 'generateAdvisory':
      return { success: true, data: await generateAdvisory(parameters.farmerId, parameters.advisoryType) };
    case 'alerts':
      return { success: true, data: await getFarmerAlerts(parameters.farmerId, parameters) };
    default:
      return { success: false, error: `Unsupported M030 operation: ${operation}` };
  }
}

module.exports = {
  // Advisory generation
  generateAdvisory,
  
  // Advisory management
  getFarmerAdvisories,
  getAdvisory,
  
  // IoT integration
  registerIoTDevice,
  getIoTDeviceData,
  
  // Alerts
  createAlert,
  getFarmerAlerts,
  markAlertAsRead,
  
  // Analytics
  getAdvisoryAnalytics,

  // Farmer performance
  createPerformanceSnapshot,
  getFarmerPerformance,
  healthCheck,
  execute
};
