/**
 * Custody Event Service
 * 
 * Implements custody chain tracking with state machine validation and hash-based integrity.
 * 
 * ASSUMPTIONS FLAGGED:
 * The state machine transitions and event vocabulary below are based on assumed
 * logistics patterns since the original source only specified 5 named milestones
 * and mentioned 11 status + 8 exception types without full detail.
 * 
 * Key Features:
 * - State machine validation for custody event transitions
 * - Hash-chain integrity verification (tamper evidence)
 * - Settlement instruction creation (records only, no actual money movement)
 * - Chain retrieval with verification
 */

'use strict';

const crypto = require('crypto');
const pool = require('../../../database/pool');
const { logger } = require('../../../utils/logger');

// State machine transitions - defines valid event type sequences
// ASSUMED: Based on common logistics custody patterns
const STATE_TRANSITIONS = {
  // Initial state can transition to these
  null: ['job_offered'],
  
  // Lifecycle transitions
  job_offered: ['job_accepted', 'carrier_rejected'],
  job_accepted: ['pickup_scheduled', 'carrier_rejected'],
  pickup_scheduled: ['pickup_confirmed', 'pickup_delayed'],
  pickup_confirmed: ['in_transit', 'pickup_delayed'],
  in_transit: ['out_for_delivery', 'transit_delayed', 'goods_damaged', 'goods_lost'],
  out_for_delivery: ['delivery_attempted', 'delivery_failed', 'transit_delayed'],
  delivery_attempted: ['delivery_confirmed', 'delivery_failed', 'dispute_raised'],
  delivery_confirmed: ['settlement_pending'],
  settlement_pending: ['settlement_ready'],
  settlement_ready: ['settlement_complete'],
  settlement_complete: [], // Terminal state
  
  // Exception transitions (can be raised from multiple states)
  pickup_delayed: ['pickup_confirmed', 'carrier_rejected'],
  transit_delayed: ['out_for_delivery', 'delivery_failed', 'goods_damaged'],
  delivery_failed: ['out_for_delivery', 'delivery_confirmed', 'dispute_raised'],
  goods_damaged: ['dispute_raised'],
  goods_lost: ['dispute_raised'],
  carrier_rejected: [], // Terminal state - job cancelled
  documentation_missing: ['pickup_confirmed', 'carrier_rejected'],
  dispute_raised: ['settlement_pending', 'settlement_complete']
};

// Helper: Compute SHA-256 hash of event data
function computeEventHash(eventData, previousHash) {
  const hashInput = JSON.stringify({
    shipment_id: eventData.shipment_id,
    event_type: eventData.event_type,
    event_timestamp: eventData.event_timestamp,
    event_data: eventData.event_data,
    previous_hash: previousHash
  });
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Validate state machine transition
 * @param {string} fromState - Previous event type
 * @param {string} toState - New event type
 * @returns {boolean} True if transition is valid
 */
function isValidTransition(fromState, toState) {
  const allowedTransitions = STATE_TRANSITIONS[fromState] || STATE_TRANSITIONS.null;
  return allowedTransitions.includes(toState);
}

/**
 * Append a custody event to the chain
 * @param {Object} eventData - Event data
 * @param {string} eventData.shipment_id - Shipment UUID
 * @param {string} eventData.event_type - Event type from custody_event_type enum
 * @param {Object} eventData.event_data - Additional event metadata
 * @param {string} eventData.recorded_by - User UUID recording the event
 * @returns {Promise<Object>} Created event record
 */
async function appendEvent(eventData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get latest event for this shipment to determine previous state
    const latestEventQuery = `
      SELECT event_type, current_event_hash
      FROM custody_chain_events
      WHERE shipment_id = $1
      ORDER BY event_timestamp DESC
      LIMIT 1
    `;
    const latestEventResult = await client.query(latestEventQuery, [eventData.shipment_id]);
    const latestEvent = latestEventResult.rows[0];
    
    const previousEventType = latestEvent ? latestEvent.event_type : null;
    const previousHash = latestEvent ? latestEvent.current_event_hash : null;
    
    // Validate state machine transition
    if (!isValidTransition(previousEventType, eventData.event_type)) {
      throw new Error(
        `Invalid state transition from ${previousEventType} to ${eventData.event_type}. ` +
        `Valid transitions: ${(STATE_TRANSITIONS[previousEventType] || STATE_TRANSITIONS.null).join(', ')}`
      );
    }
    
    // Compute hash for this event
    const eventTimestamp = eventData.event_timestamp || new Date().toISOString();
    const currentHash = computeEventHash({
      shipment_id: eventData.shipment_id,
      event_type: eventData.event_type,
      event_timestamp: eventTimestamp,
      event_data: eventData.event_data
    }, previousHash);
    
    // Insert the event
    const insertQuery = `
      INSERT INTO custody_chain_events (
        shipment_id, event_type, event_timestamp, event_data,
        previous_event_hash, current_event_hash, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      eventData.shipment_id,
      eventData.event_type,
      eventTimestamp,
      JSON.stringify(eventData.event_data || {}),
      previousHash,
      currentHash,
      eventData.recorded_by
    ]);
    
    await client.query('COMMIT');
    
    logger.info(`Custody event appended`, {
      shipment_id: eventData.shipment_id,
      event_type: eventData.event_type,
      event_id: result.rows[0].event_id
    });
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error appending custody event', {
      error: error.message,
      shipment_id: eventData.shipment_id,
      event_type: eventData.event_type
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get custody chain for a shipment with hash verification
 * @param {string} shipmentId - Shipment UUID
 * @param {boolean} verifyHash - Whether to verify hash chain integrity (default: true)
 * @returns {Promise<Object>} Chain data with verification status
 */
async function getChain(shipmentId, verifyHash = true) {
  try {
    const query = `
      SELECT 
        event_id,
        shipment_id,
        event_type,
        event_timestamp,
        event_data,
        previous_event_hash,
        current_event_hash,
        recorded_by,
        recorded_at,
        settlement_instruction_id
      FROM custody_chain_events
      WHERE shipment_id = $1
      ORDER BY event_timestamp ASC
    `;
    
    let result = await pool.query(query, [shipmentId]);
    const events = result.rows;
    
    if (events.length === 0) {
      return {
        shipment_id: shipmentId,
        events: [],
        chain_integrity: 'empty',
        verification_details: null
      };
    }
    
    let verificationDetails = null;
    let chainIntegrity = 'verified';
    
    if (verifyHash) {
      verificationDetails = {
        total_events: events.length,
        verified_events: 0,
        tampered_events: [],
        errors: []
      };
      
      let previousHash = null;
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        
        // Verify previous hash matches
        if (event.previous_event_hash !== previousHash) {
          chainIntegrity = 'tampered';
          verificationDetails.tampered_events.push({
            event_id: event.event_id,
            event_type: event.event_type,
            issue: 'previous_hash_mismatch',
            expected: previousHash,
            actual: event.previous_event_hash
          });
        }
        
        // Recompute and verify current hash
        const recomputedHash = computeEventHash({
          shipment_id: event.shipment_id,
          event_type: event.event_type,
          event_timestamp: event.event_timestamp,
          event_data: event.event_data
        }, previousHash);
        
        if (recomputedHash !== event.current_event_hash) {
          chainIntegrity = 'tampered';
          verificationDetails.tampered_events.push({
            event_id: event.event_id,
            event_type: event.event_type,
            issue: 'current_hash_mismatch',
            expected: recomputedHash,
            actual: event.current_event_hash
          });
        } else {
          verificationDetails.verified_events++;
        }
        
        previousHash = event.current_event_hash;
      }
      
      if (verificationDetails.tampered_events.length > 0) {
        logger.error(`Custody chain tampered`, {
          shipment_id: shipmentId,
          tampered_count: verificationDetails.tampered_events.length
        });
      }
    }
    
    return {
      shipment_id: shipmentId,
      events: events,
      chain_integrity: chainIntegrity,
      verification_details: verificationDetails,
      current_state: events.length > 0 ? events[events.length - 1].event_type : null
    };
  } catch (error) {
    logger.error('Error getting custody chain', {
      error: error.message,
      shipment_id: shipmentId
    });
    throw error;
  }
}

/**
 * Issue a settlement instruction (records only, no actual money movement)
 * @param {Object} instructionData - Settlement instruction data
 * @param {string} instructionData.shipment_id - Shipment UUID
 * @param {string} instructionData.custody_event_id - Custody event UUID triggering settlement
 * @param {number} instructionData.amount - Settlement amount
 * @param {string} instructionData.settlement_type - Type of settlement
 * @param {Object} instructionData.metadata - Additional metadata
 * @returns {Promise<Object>} Created settlement instruction
 */
async function issueSettlementInstruction(instructionData) {
  let client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Generate reference number
    const referenceNumber = `SETTLE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    let query = `
      INSERT INTO settlement_instructions (
        shipment_id, custody_event_id, amount, currency,
        payer_account, payee_account, settlement_type,
        reference_number, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'issued')
      RETURNING *
    `;
    
    let result = await client.query(query, [
      instructionData.shipment_id,
      instructionData.custody_event_id,
      instructionData.amount,
      instructionData.currency || 'INR',
      instructionData.payer_account || null,
      instructionData.payee_account || null,
      instructionData.settlement_type,
      referenceNumber,
      instructionData.notes || null
    ]);
    
    // Update custody event with settlement instruction reference
    await client.query(
      'UPDATE custody_chain_events SET settlement_instruction_id = $1 WHERE event_id = $2',
      [result.rows[0].instruction_id, instructionData.custody_event_id]
    );
    
    await client.query('COMMIT');
    
    logger.info(`Settlement instruction issued`, {
      instruction_id: result.rows[0].instruction_id,
      reference_number: referenceNumber,
      amount: instructionData.amount
    });
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error issuing settlement instruction', {
      error: error.message,
      shipment_id: instructionData.shipment_id
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Confirm settlement execution (admin only - marks execution as verified)
 * @param {string} instructionId - Settlement instruction UUID
 * @param {string} confirmedBy - User UUID confirming execution
 * @returns {Promise<Object>} Updated settlement instruction
 */
async function confirmSettlementExecution(instructionId, confirmedBy) {
  try {
    let query = `
      UPDATE settlement_instructions
      SET status = 'confirmed',
          confirmed_at = CURRENT_TIMESTAMP,
          confirmed_by = $1
      WHERE instruction_id = $2
      RETURNING *
    `;
    
    let result = await pool.query(query, [confirmedBy, instructionId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Settlement instruction not found: ${instructionId}`);
    }
    
    logger.info(`Settlement execution confirmed`, {
      instruction_id: instructionId,
      confirmed_by: confirmedBy
    });
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error confirming settlement execution', {
      error: error.message,
      instruction_id: instructionId
    });
    throw error;
  }
}

/**
 * Get settlement instruction status
 * @param {string} instructionId - Settlement instruction UUID
 * @returns {Promise<Object>} Settlement instruction details
 */
async function getSettlementInstruction(instructionId) {
  try {
    let query = `
      SELECT si.*, 
             ce.event_type as trigger_event_type,
             ce.event_timestamp as trigger_event_timestamp
      FROM settlement_instructions si
      LEFT JOIN custody_chain_events ce ON si.custody_event_id = ce.event_id
      WHERE si.instruction_id = $1
    `;
    
    let result = await pool.query(query, [instructionId]);
    
    if (result.rows.length === 0) {
      throw new Error(`Settlement instruction not found: ${instructionId}`);
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error getting settlement instruction', {
      error: error.message,
      instruction_id: instructionId
    });
    throw error;
  }
}

module.exports = {
  appendEvent,
  getChain,
  issueSettlementInstruction,
  confirmSettlementExecution,
  getSettlementInstruction,
  isValidTransition,
  STATE_TRANSITIONS
};

