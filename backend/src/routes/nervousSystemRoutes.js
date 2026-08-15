/**
 * AFRERA Nervous System Routes
 * 
 * Enterprise route control with biological architecture:
 * - Brain decision making
 * - Heart beat monitoring
 * - Neural pathway management
 * - Reflex triggers
 * - Sensor data collection
 * - Motor function execution
 */

const express = require('express');
const router = express.Router();
const nervousSystemController = require('../controllers/nervousSystemController');
const { authMiddleware } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');

// ============================================================================
// BRAIN CONTROL ROUTES
// ============================================================================

/**
 * @route   POST /api/nervous/brain/process-event
 * @desc    Process event through central brain
 * @access  Private (Admin/System)
 */
router.post('/brain/process-event', authRateLimit, authMiddleware, nervousSystemController.processEventThroughBrain);

/**
 * @route   GET /api/nervous/brain/decision-history
 * @desc    Get brain decision history
 * @access  Private (Admin)
 */
router.get('/brain/decision-history', authMiddleware, nervousSystemController.getBrainDecisionHistory);

/**
 * @route   GET /api/nervous/brain/focus
 * @desc    Get current brain focus
 * @access  Private (Admin)
 */
router.get('/brain/focus', authMiddleware, nervousSystemController.getBrainFocus);

// ============================================================================
// HEART BEAT ROUTES
// ============================================================================

/**
 * @route   POST /api/nervous/heart/start
 * @desc    Start heart beat
 * @access  Private (Admin)
 */
router.post('/heart/start', authRateLimit, authMiddleware, nervousSystemController.startHeartBeat);

/**
 * @route   POST /api/nervous/heart/stop
 * @desc    Stop heart beat
 * @access  Private (Admin)
 */
router.post('/heart/stop', authRateLimit, authMiddleware, nervousSystemController.stopHeartBeat);

/**
 * @route   GET /api/nervous/heart/status
 * @desc    Get heart beat status
 * @access  Private (Admin)
 */
router.get('/heart/status', authMiddleware, nervousSystemController.getHeartBeatStatus);

// ============================================================================
// NEURAL PATHWAY ROUTES
// ============================================================================

/**
 * @route   POST /api/nervous/neural/create-pathway
 * @desc    Create neural pathway between modules
 * @access  Private (Admin)
 */
router.post('/neural/create-pathway', authRateLimit, authMiddleware, nervousSystemController.createNeuralPathway);

/**
 * @route   GET /api/nervous/neural/pathways
 * @desc    Get all neural pathways
 * @access  Private (Admin)
 */
router.get('/neural/pathways', authMiddleware, nervousSystemController.getNeuralPathways);

/**
 * @route   POST /api/nervous/neural/strengthen/:pathwayId
 * @desc    Strengthen neural pathway
 * @access  Private (Admin)
 */
router.post('/neural/strengthen/:pathwayId', authRateLimit, authMiddleware, nervousSystemController.strengthenNeuralPathway);

// ============================================================================
// REFLEX ARC ROUTES
// ============================================================================

/**
 * @route   POST /api/nervous/reflex/create-arc
 * @desc    Create reflex arc
 * @access  Private (Admin)
 */
router.post('/reflex/create-arc', authRateLimit, authMiddleware, nervousSystemController.createReflexArc);

/**
 * @route   GET /api/nervous/reflex/arcs
 * @desc    Get all reflex arcs
 * @access  Private (Admin)
 */
router.get('/reflex/arcs', authMiddleware, nervousSystemController.getReflexArcs);

/**
 * @route   POST /api/nervous/reflex/trigger
 * @desc    Trigger reflex response
 * @access  Private (Admin/System)
 */
router.post('/reflex/trigger', authRateLimit, authMiddleware, nervousSystemController.triggerReflex);

// ============================================================================
// SENSOR ROUTES
// ============================================================================

/**
 * @route   POST /api/nervous/sensor/register
 * @desc    Register sensor
 * @access  Private (Admin)
 */
router.post('/sensor/register', authRateLimit, authMiddleware, nervousSystemController.registerSensor);

/**
 * @route   GET /api/nervous/sensor/data/:sensorId
 * @desc    Get sensor data
 * @access  Private (Admin)
 */
router.get('/sensor/data/:sensorId', authMiddleware, nervousSystemController.getSensorData);

/**
 * @route   GET /api/nervous/sensor/status
 * @desc    Get all sensors status
 * @access  Private (Admin)
 */
router.get('/sensor/status', authMiddleware, nervousSystemController.getSensorsStatus);

// ============================================================================
// MOTOR FUNCTION ROUTES
// ============================================================================

/**
 * @route   POST /api/nervous/motor/execute
 * @desc    Execute motor function
 * @access  Private (Admin/System)
 */
router.post('/motor/execute', authRateLimit, authMiddleware, nervousSystemController.executeMotorFunction);

/**
 * @route   GET /api/nervous/motor/active
 * @desc    Get active motor functions
 * @access  Private (Admin)
 */
router.get('/motor/active', authMiddleware, nervousSystemController.getActiveMotorFunctions);

// ============================================================================
// ENTERPRISE ROUTE CONTROL ROUTES
// ============================================================================

/**
 * @route   POST /api/nervous/route/register
 * @desc    Register enterprise route
 * @access  Private (Admin)
 */
router.post('/route/register', authRateLimit, authMiddleware, nervousSystemController.registerEnterpriseRoute);

/**
 * @route   POST /api/nervous/route/request
 * @desc    Route request through enterprise control
 * @access  Private (System)
 */
router.post('/route/request', authRateLimit, nervousSystemController.routeRequest);

/**
 * @route   GET /api/nervous/route/optimal
 * @desc    Get optimal route for context
 * @access  Private (System)
 */
router.get('/route/optimal', nervousSystemController.getOptimalRoute);

/**
 * @route   POST /api/nervous/route/deactivate/:routeId
 * @desc    Deactivate enterprise route
 * @access  Private (Admin)
 */
router.post('/route/deactivate/:routeId', authRateLimit, authMiddleware, nervousSystemController.deactivateEnterpriseRoute);

// ============================================================================
// SYSTEM HEALTH ROUTES
// ============================================================================

/**
 * @route   GET /api/nervous/health
 * @desc    Get nervous system health
 * @access  Private (Admin)
 */
router.get('/health', authMiddleware, nervousSystemController.getNervousSystemHealth);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
