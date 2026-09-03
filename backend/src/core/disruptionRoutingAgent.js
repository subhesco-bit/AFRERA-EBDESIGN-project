/**
 * Disruption Routing Agent — Civil disruption crisis handling.
 *
 * Subscribes to CIVIL_DISRUPTION_REPORTED and CIVIL_DISRUPTION_RESOLVED signals
 * from the signal bus and coordinates platform-wide response to civil disruptions
 * (economic blockades, bandhs/strikes, natural disasters, road closures).
 *
 * RESPONSIBILITIES:
 * - Notify affected stakeholders (farmers, logistics partners, buyers)
 * - Trigger automatic shipment rerouting recommendations
 * - Activate emergency procurement alternatives
 * - Log disruption impact metrics
 * - Coordinate insurance claims acceleration
 */

const { logger } = require('../utils/logger');
const { signalBus, SIGNAL, SEVERITY } = require('./signalBus');
const pool = require('../database/pool');

class DisruptionRoutingAgent {
  constructor() {
    this.subscribers = [];
    this.initialized = false;
  }

  /**
   * Initialize the routing agent by subscribing to disruption signals
   */
  initialize() {
    if (this.initialized) {
      logger.warn('DisruptionRoutingAgent already initialized');
      return;
    }

    // Subscribe to disruption reported signals
    const reportedSubscriber = signalBus.onSignal(
      SIGNAL.CIVIL_DISRUPTION_REPORTED,
      this.handleDisruptionReported.bind(this)
    );
    this.subscribers.push(reportedSubscriber);

    // Subscribe to disruption resolved signals
    const resolvedSubscriber = signalBus.onSignal(
      SIGNAL.CIVIL_DISRUPTION_RESOLVED,
      this.handleDisruptionResolved.bind(this)
    );
    this.subscribers.push(resolvedSubscriber);

    this.initialized = true;
    logger.info('DisruptionRoutingAgent initialized', {
      subscribedSignals: [SIGNAL.CIVIL_DISRUPTION_REPORTED, SIGNAL.CIVIL_DISRUPTION_RESOLVED]
    });
  }

  /**
   * Handle civil disruption reported signal
   */
  async handleDisruptionReported(signalData, metadata) {
    try {
      const { disruptionId, disruptionType, affectedState, affectedDistrict, affectedShipmentCount, affectedShipmentIds } = signalData;

      logger.info('Civil disruption reported - initiating routing response', {
        disruptionId,
        disruptionType,
        affectedState,
        affectedDistrict,
        affectedShipmentCount
      });

      // Execute routing actions in parallel
      await Promise.all([
        this.notifyAffectedStakeholders(disruptionId, affectedState, affectedDistrict, affectedShipmentIds),
        this.triggerShipmentRerouting(affectedShipmentIds, disruptionId),
        this.activateEmergencyProcurement(disruptionId, affectedState),
        this.logDisruptionImpact(disruptionId, affectedShipmentCount),
        this.accelerateInsuranceClaims(affectedShipmentIds, disruptionId)
      ]);

      logger.info('Disruption routing response completed', { disruptionId });
    } catch (error) {
      logger.error('Error handling disruption reported signal', { error: error.message, signalData });
      // Don't throw - signal subscribers must never break the emitter
    }
  }

  /**
   * Handle civil disruption resolved signal
   */
  async handleDisruptionResolved(signalData, metadata) {
    try {
      const { disruptionId, affectedState } = signalData;

      logger.info('Civil disruption resolved - cleanup routing response', { disruptionId, affectedState });

      // Execute cleanup actions
      await Promise.all([
        this.notifyStakeholdersResolution(disruptionId, affectedState),
        this.restoreNormalRouting(disruptionId),
        this.deactivateEmergencyProcurement(disruptionId),
        this.logResolutionImpact(disruptionId)
      ]);

      logger.info('Disruption resolution routing completed', { disruptionId });
    } catch (error) {
      logger.error('Error handling disruption resolved signal', { error: error.message, signalData });
    }
  }

  /**
   * Notify affected stakeholders about disruption
   */
  async notifyAffectedStakeholders(disruptionId, affectedState, affectedDistrict, affectedShipmentIds) {
    try {
      // Get affected farmers, logistics partners, and buyers
      const stakeholders = await this.getAffectedStakeholders(affectedShipmentIds);

      // In a real implementation, this would send notifications via:
      // - SMS/WhatsApp for immediate alerts
      // - Email for detailed notifications
      // - In-app notifications
      // - Push notifications for mobile users

      logger.info('Stakeholder notification initiated', {
        disruptionId,
        affectedState,
        affectedDistrict,
        stakeholderCount: stakeholders.length
      });

      // Log notification activity
      await pool.query(
        `INSERT INTO disruption_notifications 
         (disruption_id, notification_type, recipient_count, status, created_at)
         VALUES ($1, 'stakeholder_alert', $2, 'initiated', NOW())`,
        [disruptionId, stakeholders.length]
      );

      return { notified: stakeholders.length };
    } catch (error) {
      logger.error('Error notifying stakeholders', { error: error.message, disruptionId });
      return { notified: 0, error: error.message };
    }
  }

  /**
   * Trigger shipment rerouting recommendations
   */
  async triggerShipmentRerouting(affectedShipmentIds, disruptionId) {
    try {
      if (!affectedShipmentIds || affectedShipmentIds.length === 0) {
        return { rerouted: 0 };
      }

      // Mark shipments for rerouting consideration
      const result = await pool.query(
        `UPDATE shipments 
         SET rerouting_required = true, 
             rerouting_reason = 'civil_disruption',
             rerouting_disruption_id = $1,
             updated_at = NOW()
         WHERE id = ANY($2) AND status NOT IN ('delivered', 'cancelled')`,
        [disruptionId, affectedShipmentIds]
      );

      logger.info('Shipment rerouting triggered', {
        disruptionId,
        affectedShipments: affectedShipmentIds.length,
        markedForRerouting: result.rowCount
      });

      return { rerouted: result.rowCount };
    } catch (error) {
      logger.error('Error triggering shipment rerouting', { error: error.message, disruptionId });
      return { rerouted: 0, error: error.message };
    }
  }

  /**
   * Activate emergency procurement alternatives
   */
  async activateEmergencyProcurement(disruptionId, affectedState) {
    try {
      // Activate alternative sourcing routes for affected region
      const result = await pool.query(
        `INSERT INTO emergency_procurement_activations 
         (disruption_id, affected_state, activation_status, created_at)
         VALUES ($1, $2, 'active', NOW())
         ON CONFLICT (disruption_id) DO UPDATE SET
           activation_status = 'active',
           updated_at = NOW()`,
        [disruptionId, affectedState]
      );

      logger.info('Emergency procurement activated', { disruptionId, affectedState });
      return { activated: true };
    } catch (error) {
      logger.error('Error activating emergency procurement', { error: error.message, disruptionId });
      return { activated: false, error: error.message };
    }
  }

  /**
   * Log disruption impact metrics
   */
  async logDisruptionImpact(disruptionId, affectedShipmentCount) {
    try {
      await pool.query(
        `INSERT INTO disruption_impact_log 
         (disruption_id, affected_shipment_count, impact_assessment, logged_at)
         VALUES ($1, $2, 'initial_assessment', NOW())`,
        [disruptionId, affectedShipmentCount]
      );

      logger.info('Disruption impact logged', { disruptionId, affectedShipmentCount });
      return { logged: true };
    } catch (error) {
      logger.error('Error logging disruption impact', { error: error.message, disruptionId });
      return { logged: false, error: error.message };
    }
  }

  /**
   * Accelerate insurance claims for affected shipments
   */
  async accelerateInsuranceClaims(affectedShipmentIds, disruptionId) {
    try {
      if (!affectedShipmentIds || affectedShipmentIds.length === 0) {
        return { accelerated: 0 };
      }

      // Mark related insurance claims for expedited processing
      const result = await pool.query(
        `UPDATE insurance_claims 
         SET priority_level = 'expedited',
             expedited_reason = 'civil_disruption',
             expedited_disruption_id = $1,
             updated_at = NOW()
         WHERE shipment_id = ANY($2) AND status IN ('submitted', 'under_review')`,
        [disruptionId, affectedShipmentIds]
      );

      logger.info('Insurance claims accelerated', {
        disruptionId,
        affectedShipments: affectedShipmentIds.length,
        expeditedClaims: result.rowCount
      });

      return { accelerated: result.rowCount };
    } catch (error) {
      logger.error('Error accelerating insurance claims', { error: error.message, disruptionId });
      return { accelerated: 0, error: error.message };
    }
  }

  /**
   * Notify stakeholders about resolution
   */
  async notifyStakeholdersResolution(disruptionId, affectedState) {
    try {
      // Send resolution notifications
      await pool.query(
        `INSERT INTO disruption_notifications 
         (disruption_id, notification_type, status, created_at)
         VALUES ($1, 'resolution_alert', 'sent', NOW())`,
        [disruptionId]
      );

      logger.info('Resolution notifications sent', { disruptionId, affectedState });
      return { notified: true };
    } catch (error) {
      logger.error('Error sending resolution notifications', { error: error.message, disruptionId });
      return { notified: false, error: error.message };
    }
  }

  /**
   * Restore normal routing after resolution
   */
  async restoreNormalRouting(disruptionId) {
    try {
      const result = await pool.query(
        `UPDATE shipments 
         SET rerouting_required = false,
             rerouting_reason = NULL,
             rerouting_disruption_id = NULL,
             updated_at = NOW()
         WHERE rerouting_disruption_id = $1`,
        [disruptionId]
      );

      logger.info('Normal routing restored', { disruptionId, restoredShipments: result.rowCount });
      return { restored: result.rowCount };
    } catch (error) {
      logger.error('Error restoring normal routing', { error: error.message, disruptionId });
      return { restored: 0, error: error.message };
    }
  }

  /**
   * Deactivate emergency procurement
   */
  async deactivateEmergencyProcurement(disruptionId) {
    try {
      await pool.query(
        `UPDATE emergency_procurement_activations 
         SET activation_status = 'inactive',
             updated_at = NOW()
         WHERE disruption_id = $1`,
        [disruptionId]
      );

      logger.info('Emergency procurement deactivated', { disruptionId });
      return { deactivated: true };
    } catch (error) {
      logger.error('Error deactivating emergency procurement', { error: error.message, disruptionId });
      return { deactivated: false, error: error.message };
    }
  }

  /**
   * Log resolution impact
   */
  async logResolutionImpact(disruptionId) {
    try {
      await pool.query(
        `INSERT INTO disruption_impact_log 
         (disruption_id, impact_assessment, logged_at)
         VALUES ($1, 'resolution_completed', NOW())`,
        [disruptionId]
      );

      logger.info('Resolution impact logged', { disruptionId });
      return { logged: true };
    } catch (error) {
      logger.error('Error logging resolution impact', { error: error.message, disruptionId });
      return { logged: false, error: error.message };
    }
  }

  /**
   * Get affected stakeholders (farmers, logistics partners, buyers)
   */
  async getAffectedStakeholders(shipmentIds) {
    try {
      if (!shipmentIds || shipmentIds.length === 0) {
        return [];
      }

      const result = await pool.query(
        `SELECT DISTINCT 
           s.farmer_id,
           s.logistics_partner_id,
           o.buyer_id
         FROM shipments s
         LEFT JOIN orders o ON s.order_id = o.id
         WHERE s.id = ANY($1)`,
        [shipmentIds]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting affected stakeholders', { error: error.message });
      return [];
    }
  }

  /**
   * Shutdown the routing agent
   */
  shutdown() {
    this.subscribers.forEach(unsubscribe => unsubscribe());
    this.subscribers = [];
    this.initialized = false;
    logger.info('DisruptionRoutingAgent shutdown complete');
  }
}

module.exports = new DisruptionRoutingAgent();