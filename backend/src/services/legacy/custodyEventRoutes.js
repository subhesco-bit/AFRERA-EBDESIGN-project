/**
 * Custody Event Routes
 * 
 * API endpoints for custody chain management and settlement instructions.
 * 
 * Routes:
 * - POST /api/v1/custody/events - Append custody event (basic auth)
 * - GET /api/v1/custody/chain/:shipmentId - Get custody chain with verification
 * - POST /api/v1/custody/settlement/instructions - Issue settlement instruction (admin only)
 * - POST /api/v1/custody/settlement/:instructionId/confirm - Confirm settlement execution (admin only)
 * - GET /api/v1/custody/settlement/:instructionId - Get settlement instruction status
 */

'use strict';

const express = require('express');
const router = express.Router();
const { logger } = require('../../utils/logger');
const { authMiddleware } = require('../../middleware/auth');
const custodyEventService = require('./custodyEventService');

/**
 * POST /api/v1/custody/events
 * Append a custody event to the chain
 * Requires basic authentication
 */
router.post('/events', authMiddleware, async (req, res) => {
  try {
    const { shipment_id, event_type, event_data } = req.body;
    const recorded_by = req.user.id;
    
    // Validation
    if (!shipment_id || !event_type) {
      return res.status(400).json({
        error: 'Missing required fields: shipment_id, event_type'
      });
    }
    
    const event = await custodyEventService.appendEvent({
      shipment_id,
      event_type,
      event_data,
      recorded_by
    });
    
    res.status(201).json({
      success: true,
      event
    });
  } catch (error) {
    logger.error('Error appending custody event', { error: error.message });
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * GET /api/v1/custody/chain/:shipmentId
 * Get custody chain for a shipment with hash verification
 * Requires basic authentication
 */
router.get('/chain/:shipmentId', authMiddleware, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { verify } = req.query;
    
    const verifyHash = verify !== 'false'; // Default to true
    
    const chain = await custodyEventService.getChain(shipmentId, verifyHash);
    
    res.json({
      success: true,
      chain
    });
  } catch (error) {
    logger.error('Error getting custody chain', { error: error.message });
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/v1/custody/settlement/instructions
 * Issue a settlement instruction (admin only)
 * Records what should happen without moving actual money
 */
router.post('/settlement/instructions', authMiddleware, async (req, res) => {
  try {
    // Admin-only check
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required for settlement instructions'
      });
    }
    
    const {
      shipment_id,
      custody_event_id,
      amount,
      settlement_type,
      currency,
      payer_account,
      payee_account,
      notes
    } = req.body;
    
    // Validation
    if (!shipment_id || !custody_event_id || !amount || !settlement_type) {
      return res.status(400).json({
        error: 'Missing required fields: shipment_id, custody_event_id, amount, settlement_type'
      });
    }
    
    const instruction = await custodyEventService.issueSettlementInstruction({
      shipment_id,
      custody_event_id,
      amount,
      settlement_type,
      currency,
      payer_account,
      payee_account,
      notes
    });
    
    res.status(201).json({
      success: true,
      instruction
    });
  } catch (error) {
    logger.error('Error issuing settlement instruction', { error: error.message });
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * POST /api/v1/custody/settlement/:instructionId/confirm
 * Confirm settlement execution (admin only)
 * Marks execution as verified without moving actual money
 */
router.post('/settlement/:instructionId/confirm', authMiddleware, async (req, res) => {
  try {
    // Admin-only check
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required to confirm settlement execution'
      });
    }
    
    const { instructionId } = req.params;
    const confirmedBy = req.user.id;
    
    let instruction = await custodyEventService.confirmSettlementExecution(
      instructionId,
      confirmedBy
    );
    
    res.json({
      success: true,
      instruction
    });
  } catch (error) {
    logger.error('Error confirming settlement execution', { error: error.message });
    res.status(400).json({
      error: error.message
    });
  }
});

/**
 * GET /api/v1/custody/settlement/:instructionId
 * Get settlement instruction status
 * Requires basic authentication
 */
router.get('/settlement/:instructionId', authMiddleware, async (req, res) => {
  try {
    const { instructionId } = req.params;
    
    let instruction = await custodyEventService.getSettlementInstruction(instructionId);
    
    res.json({
      success: true,
      instruction
    });
  } catch (error) {
    logger.error('Error getting settlement instruction', { error: error.message });
    res.status(404).json({
      error: error.message
    });
  }
});

/**
 * GET /api/v1/custody/state-machine
 * Get state machine transition rules (for UI reference)
 * Requires basic authentication
 */
router.get('/state-machine', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      state_transitions: custodyEventService.STATE_TRANSITIONS
    });
  } catch (error) {
    logger.error('Error getting state machine rules', { error: error.message });
    res.status(500).json({
      error: error.message
    });
  }
});

/**
 * Setup function to register routes with Express app
 */
function setupRoutes(app) {
  app.use('/api/v1/custody', router);
  logger.info('Custody event routes registered');
}

module.exports = {
  router,
  setupRoutes
};
