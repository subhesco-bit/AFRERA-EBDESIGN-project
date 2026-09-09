/**
 * M047 Irrigation Management Routes
 * Production-level HTTP endpoints for irrigation operations
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../../middleware/roleGroups');
const IrrigationService = require('./service');

const irrigationService = new IrrigationService();

/**
 * POST /schedules
 * Create new irrigation schedule
 * Authorization: Farm Operations roles required
 */
router.post('/schedules', authenticate, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const schedule = await irrigationService.createSchedule({
      ...req.body,
      farm_id: req.query.farm_id || req.user.farm_id
    });

    res.status(201).json({
      success: true,
      message: 'Irrigation schedule created successfully',
      data: schedule
    });
  } catch (error) {
    if (error.statusCode === 422) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error.message
    });
  }
});

/**
 * GET /schedules
 * Get farmer's irrigation schedules
 */
router.get('/schedules', authenticate, async (req, res) => {
  try {
    const farmId = req.query.farm_id || req.user.farm_id;
    const result = await irrigationService.getFarmSchedules(farmId, {
      crop_type: req.query.crop_type,
      active_only: req.query.active_only !== 'false',
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    });

    res.json({
      success: true,
      data: result.schedules,
      meta: { count: result.count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedules',
      error: error.message
    });
  }
});

/**
 * GET /schedules/:id
 * Get specific irrigation schedule
 */
router.get('/schedules/:id', authenticate, async (req, res) => {
  try {
    const result = await irrigationService.getFarmSchedules(req.user.farm_id);
    const schedule = result.schedules.find(s => s.id === parseInt(req.params.id));

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedule',
      error: error.message
    });
  }
});

/**
 * PUT /schedules/:id
 * Update irrigation schedule
 */
router.put('/schedules/:id', authenticate, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const schedule = await irrigationService.updateSchedule(
      parseInt(req.params.id),
      req.body
    );

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    });
  } catch (error) {
    if (error.statusCode === 422) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
});

/**
 * DELETE /schedules/:id
 * Delete irrigation schedule
 */
router.delete('/schedules/:id', authenticate, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const deleted = await irrigationService.deleteSchedule(parseInt(req.params.id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message
    });
  }
});

/**
 * POST /deliveries/log
 * Log an irrigation delivery event
 */
router.post('/deliveries/log', authenticate, async (req, res) => {
  try {
    const log = await irrigationService.logDelivery(req.body);

    res.status(201).json({
      success: true,
      message: 'Delivery logged successfully',
      data: log
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to log delivery',
      error: error.message
    });
  }
});

/**
 * GET /analytics
 * Get irrigation analytics for farmer
 */
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const farmId = req.query.farm_id || req.user.farm_id;
    const period = parseInt(req.query.period) || 30;

    const analytics = await irrigationService.getAnalytics(farmId, period);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
});

/**
 * GET /comparison/regional
 * Compare water usage with regional average
 */
router.get('/comparison/regional', authenticate, async (req, res) => {
  try {
    const farmId = req.query.farm_id || req.user.farm_id;
    const comparison = await irrigationService.getRegionalComparison(farmId);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comparison',
      error: error.message
    });
  }
});

/**
 * POST /requirement-estimate
 * Get irrigation water requirement estimate
 */
router.post('/requirement-estimate', async (req, res) => {
  try {
    const { farm_id, crop_type, soil_type } = req.body;

    if (!farm_id || !crop_type || !soil_type) {
      return res.status(400).json({
        success: false,
        message: 'farm_id, crop_type, and soil_type are required'
      });
    }

    const requirement = await irrigationService.computeIrrigationRequirement(
      farm_id,
      crop_type,
      soil_type
    );

    res.json({
      success: true,
      data: requirement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to compute requirement',
      error: error.message
    });
  }
});

module.exports = router;

