/**
 * AFRERA Nervous System Controller
 * 
 * Enterprise route control with biological architecture:
 * - Brain decision making
 * - Heart beat monitoring
 * - Neural pathway management
 * - Reflex triggers
 * - Sensor data collection
 * - Motor function execution
 */

const {
  centralBrain,
  heartBeat,
  nervousSystem,
  sensorNetwork,
  motorFunctions,
  enterpriseRouteControl
} = require('../core/nervousSystem');
const { logger } = require('../utils/logger');

// ============================================================================
// BRAIN CONTROL ENDPOINTS
// ============================================================================

/**
 * POST /api/nervous/brain/process-event
 * Process event through central brain
 */
async function processEventThroughBrain(req, res) {
  try {
    const result = await centralBrain.processEvent(req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error processing event through brain', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process event through brain'
    });
  }
}

/**
 * GET /api/nervous/brain/decision-history
 * Get brain decision history
 */
async function getBrainDecisionHistory(req, res) {
  try {
    const { limit } = req.query;
    
    const history = centralBrain.decisionHistory.slice(-parseInt(limit) || 10);
    
    res.json({
      success: true,
      history,
      total_decisions: centralBrain.decisionHistory.length
    });
  } catch (error) {
    logger.error('Error getting brain decision history', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get brain decision history'
    });
  }
}

/**
 * GET /api/nervous/brain/focus
 * Get current brain focus
 */
async function getBrainFocus(req, res) {
  try {
    res.json({
      success: true,
      current_focus: centralBrain.currentFocus,
      consciousness: centralBrain.consciousness,
      thought_queue_size: centralBrain.thoughtQueue.length
    });
  } catch (error) {
    logger.error('Error getting brain focus', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get brain focus'
    });
  }
}

// ============================================================================
// HEART BEAT ENDPOINTS
// ============================================================================

/**
 * POST /api/nervous/heart/start
 * Start heart beat
 */
async function startHeartBeat(req, res) {
  try {
    heartBeat.start();
    
    res.json({
      success: true,
      message: 'Heart beat started',
      heart_rate: heartBeat.heartRate
    });
  } catch (error) {
    logger.error('Error starting heart beat', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start heart beat'
    });
  }
}

/**
 * POST /api/nervous/heart/stop
 * Stop heart beat
 */
async function stopHeartBeat(req, res) {
  try {
    heartBeat.stop();
    
    res.json({
      success: true,
      message: 'Heart beat stopped'
    });
  } catch (error) {
    logger.error('Error stopping heart beat', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop heart beat'
    });
  }
}

/**
 * GET /api/nervous/heart/status
 * Get heart beat status
 */
async function getHeartBeatStatus(req, res) {
  try {
    res.json({
      success: true,
      is_beating: heartBeat.isBeating,
      heart_rate: heartBeat.heartRate,
      last_beat: heartBeat.lastBeat,
      pump_operations: heartBeat.pumpOperations.length
    });
  } catch (error) {
    logger.error('Error getting heart beat status', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get heart beat status'
    });
  }
}

// ============================================================================
// NEURAL PATHWAY ENDPOINTS
// ============================================================================

/**
 * POST /api/nervous/neural/create-pathway
 * Create neural pathway between modules
 */
async function createNeuralPathway(req, res) {
  try {
    const { fromModule, toModule, strength } = req.body;
    
    nervousSystem.createNeuralPathway(fromModule, toModule, strength);
    
    res.json({
      success: true,
      message: 'Neural pathway created',
      pathway: { from: fromModule, to: toModule, strength }
    });
  } catch (error) {
    logger.error('Error creating neural pathway', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create neural pathway'
    });
  }
}

/**
 * GET /api/nervous/neural/pathways
 * Get all neural pathways
 */
async function getNeuralPathways(req, res) {
  try {
    const pathways = Array.from(nervousSystem.neuralPathways.entries()).map(([id, pathway]) => ({
      id,
      ...pathway
    }));
    
    res.json({
      success: true,
      pathways,
      total_pathways: pathways.length
    });
  } catch (error) {
    logger.error('Error getting neural pathways', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get neural pathways'
    });
  }
}

/**
 * POST /api/nervous/neural/strengthen/:pathwayId
 * Strengthen neural pathway
 */
async function strengthenNeuralPathway(req, res) {
  try {
    const { pathwayId } = req.params;
    
    nervousSystem.strengthenPathway(pathwayId);
    
    res.json({
      success: true,
      message: 'Neural pathway strengthened',
      pathwayId
    });
  } catch (error) {
    logger.error('Error strengthening neural pathway', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to strengthen neural pathway'
    });
  }
}

// ============================================================================
// REFLEX ARC ENDPOINTS
// ============================================================================

/**
 * POST /api/nervous/reflex/create-arc
 * Create reflex arc
 */
async function createReflexArc(req, res) {
  try {
    const { triggerEvent, responseAction, condition } = req.body;
    
    nervousSystem.createReflexArc(triggerEvent, responseAction, condition);
    
    res.json({
      success: true,
      message: 'Reflex arc created',
      reflex: { triggerEvent, responseAction, condition }
    });
  } catch (error) {
    logger.error('Error creating reflex arc', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create reflex arc'
    });
  }
}

/**
 * GET /api/nervous/reflex/arcs
 * Get all reflex arcs
 */
async function getReflexArcs(req, res) {
  try {
    const arcs = Array.from(nervousSystem.reflexArcs.entries()).map(([trigger, reflex]) => ({
      trigger,
      ...reflex
    }));
    
    res.json({
      success: true,
      arcs,
      total_arcs: arcs.length
    });
  } catch (error) {
    logger.error('Error getting reflex arcs', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get reflex arcs'
    });
  }
}

/**
 * POST /api/nervous/reflex/trigger
 * Trigger reflex response
 */
async function triggerReflex(req, res) {
  try {
    const { triggerEvent, context } = req.body;
    
    const result = await nervousSystem.triggerReflex(triggerEvent, context);
    
    res.json(result);
  } catch (error) {
    logger.error('Error triggering reflex', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to trigger reflex'
    });
  }
}

// ============================================================================
// SENSOR ENDPOINTS
// ============================================================================

/**
 * POST /api/nervous/sensor/register
 * Register sensor
 */
async function registerSensor(req, res) {
  try {
    const { sensorId, sensorConfig } = req.body;
    
    sensorNetwork.registerSensor(sensorId, sensorConfig);
    
    res.json({
      success: true,
      message: 'Sensor registered',
      sensorId
    });
  } catch (error) {
    logger.error('Error registering sensor', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register sensor'
    });
  }
}

/**
 * GET /api/nervous/sensor/data/:sensorId
 * Get sensor data
 */
async function getSensorData(req, res) {
  try {
    const { sensorId } = req.params;
    
    const result = await sensorNetwork.collectSensorData(sensorId);
    
    res.json(result);
  } catch (error) {
    logger.error('Error getting sensor data', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sensor data'
    });
  }
}

/**
 * GET /api/nervous/sensor/status
 * Get all sensors status
 */
async function getSensorsStatus(req, res) {
  try {
    const sensors = Array.from(sensorNetwork.sensors.entries()).map(([id, sensor]) => ({
      id,
      type: sensor.type,
      is_healthy: sensor.isHealthy,
      reading_count: sensor.readingCount,
      last_reading: sensor.lastReading
    }));
    
    res.json({
      success: true,
      sensors,
      total_sensors: sensors.length
    });
  } catch (error) {
    logger.error('Error getting sensors status', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sensors status'
    });
  }
}

// ============================================================================
// MOTOR FUNCTION ENDPOINTS
// ============================================================================

/**
 * POST /api/nervous/motor/execute
 * Execute motor function
 */
async function executeMotorFunction(req, res) {
  try {
    const { functionName, parameters } = req.body;
    
    const result = await motorFunctions.executeFunction(functionName, parameters);
    
    res.json(result);
  } catch (error) {
    logger.error('Error executing motor function', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute motor function'
    });
  }
}

/**
 * GET /api/nervous/motor/active
 * Get active motor functions
 */
async function getActiveMotorFunctions(req, res) {
  try {
    const activeActions = Array.from(motorFunctions.activeActions.entries()).map(([id, action]) => ({
      id,
      ...action
    }));
    
    res.json({
      success: true,
      active_actions: activeActions,
      total_active: activeActions.length
    });
  } catch (error) {
    logger.error('Error getting active motor functions', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get active motor functions'
    });
  }
}

// ============================================================================
// ENTERPRISE ROUTE CONTROL ENDPOINTS
// ============================================================================

/**
 * POST /api/nervous/route/register
 * Register enterprise route
 */
async function registerEnterpriseRoute(req, res) {
  try {
    const routeConfig = req.body;
    
    enterpriseRouteControl.registerRoute(routeConfig);
    
    res.json({
      success: true,
      message: 'Enterprise route registered',
      route_id: routeConfig.routeId
    });
  } catch (error) {
    logger.error('Error registering enterprise route', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register enterprise route'
    });
  }
}

/**
 * POST /api/nervous/route/request
 * Route request through enterprise control
 */
async function routeRequest(req, res) {
  try {
    const { routeConfig, request } = req.body;
    
    const result = await enterpriseRouteControl.routeRequest(routeConfig, request);
    
    res.json(result);
  } catch (error) {
    logger.error('Error routing request', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to route request'
    });
  }
}

/**
 * GET /api/nervous/route/optimal
 * Get optimal route for context
 */
async function getOptimalRoute(req, res) {
  try {
    const requestContext = req.body;
    
    const optimalRoute = enterpriseRouteControl.getOptimalRoute(requestContext);
    
    res.json({
      success: true,
      optimal_route: optimalRoute
    });
  } catch (error) {
    logger.error('Error getting optimal route', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get optimal route'
    });
  }
}

/**
 * POST /api/nervous/route/deactivate/:routeId
 * Deactivate enterprise route
 */
async function deactivateEnterpriseRoute(req, res) {
  try {
    const { routeId } = req.params;
    
    enterpriseRouteControl.deactivateRoute(routeId);
    
    res.json({
      success: true,
      message: 'Enterprise route deactivated',
      routeId
    });
  } catch (error) {
    logger.error('Error deactivating enterprise route', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deactivate enterprise route'
    });
  }
}

// ============================================================================
// SYSTEM HEALTH ENDPOINTS
// ============================================================================

/**
 * GET /api/nervous/health
 * Get nervous system health
 */
async function getNervousSystemHealth(req, res) {
  try {
    const health = {
      brain: {
        consciousness: centralBrain.consciousness,
        current_focus: centralBrain.currentFocus,
        decision_count: centralBrain.decisionHistory.length
      },
      heart: {
        is_beating: heartBeat.isBeating,
        heart_rate: heartBeat.heartRate,
        last_beat: heartBeat.lastBeat
      },
      neural: {
        pathway_count: nervousSystem.neuralPathways.size,
        reflex_count: nervousSystem.reflexArcs.size
      },
      sensors: {
        sensor_count: sensorNetwork.sensors.size,
        healthy_sensors: Array.from(sensorNetwork.sensors.values()).filter(s => s.isHealthy).length
      },
      motor: {
        active_actions: motorFunctions.activeActions.size,
        queued_actions: motorFunctions.actionQueue.length
      },
      routes: {
        registered_routes: enterpriseRouteControl.routeTable.size,
        active_routes: enterpriseRouteControl.activeRoutes.size
      }
    };
    
    res.json({
      success: true,
      health,
      overall_status: 'healthy'
    });
  } catch (error) {
    logger.error('Error getting nervous system health', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get nervous system health'
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Brain Control
  processEventThroughBrain,
  getBrainDecisionHistory,
  getBrainFocus,
  
  // Heart Beat
  startHeartBeat,
  stopHeartBeat,
  getHeartBeatStatus,
  
  // Neural Pathways
  createNeuralPathway,
  getNeuralPathways,
  strengthenNeuralPathway,
  
  // Reflex Arcs
  createReflexArc,
  getReflexArcs,
  triggerReflex,
  
  // Sensors
  registerSensor,
  getSensorData,
  getSensorsStatus,
  
  // Motor Functions
  executeMotorFunction,
  getActiveMotorFunctions,
  
  // Enterprise Route Control
  registerEnterpriseRoute,
  routeRequest,
  getOptimalRoute,
  deactivateEnterpriseRoute,
  
  // System Health
  getNervousSystemHealth
};
