/**
 * Civil Disruption / Blockade Response Chain.
 *
 * Backs migration 9999_zzzzz_civil_disruption_schema.sql. Confirmed
 * genuinely absent before building (2026-08-15) — a real, recurring
 * operational reality in Northeast India (economic blockades on national
 * highways, bandhs/strikes) that this platform had no way to record or
 * react to.
 *
 * MATCHING HONESTY: affected-shipment matching is a free-text ILIKE
 * against shipments.origin_address/destination_address for the
 * disruption's state/district/route names — not GPS routing. This
 * codebase's geospatial layer is deliberately incremental (see
 * 997_geospatial_indexes.sql's decision block), so this is a real,
 * approximate signal, never presented as precise geofencing.
 */

'use strict';

const { logger } = require('../../../utils/logger');
const pool = require('../../../database/pool');
const { signalBus, SIGNAL, SEVERITY } = require('../../../core/signalBus');

class CivilDisruptionService {
  async report(data) {
    const { disruptionType, title, description, affectedState, affectedDistrict, affectedRouteNames, startDate, reportedBy, sourceNote } = data || {};
    if (!disruptionType) throw new Error('disruptionType is required');
    if (!title) throw new Error('title is required');
    if (!affectedState) throw new Error('affectedState is required');
    if (!startDate) throw new Error('startDate is required');

    const result = await pool.query(
      `INSERT INTO civil_disruption_events
         (disruption_type, title, description, affected_state, affected_district, affected_route_names, start_date, reported_by, source_note, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unverified')
       RETURNING *`,
      [disruptionType, title, description || null, affectedState, affectedDistrict || null, affectedRouteNames || null, startDate, reportedBy || null, sourceNote || null]
    );
    const event = result.rows[0];

    const affectedShipments = await this._findAffectedShipments(event);

    signalBus.emitSignal(SIGNAL.CIVIL_DISRUPTION_REPORTED, {
      disruptionId: event.id,
      disruptionType: event.disruption_type,
      affectedState: event.affected_state,
      affectedDistrict: event.affected_district,
      affectedShipmentCount: affectedShipments.length,
      affectedShipmentIds: affectedShipments.map((s) => s.id),
    }, { severity: SEVERITY?.WARNING || 'warning', source: 'civilDisruptionService' });

    logger.info('Civil disruption reported', { disruptionId: event.id, affectedShipmentCount: affectedShipments.length });
    return { ...event, affectedShipments };
  }

  async verify(disruptionId, verifiedBy) {
    let result = await pool.query(
      `UPDATE civil_disruption_events SET status = 'active', verified_by = $1, verified_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'unverified' RETURNING *`,
      [verifiedBy, disruptionId]
    );
    if (result.rows.length === 0) throw new Error('Disruption not found or not in unverified status');
    return result.rows[0];
  }

  async resolve(disruptionId, endDate) {
    let result = await pool.query(
      `UPDATE civil_disruption_events SET status = 'resolved', end_date = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [endDate || new Date().toISOString().slice(0, 10), disruptionId]
    );
    if (result.rows.length === 0) throw new Error('Disruption not found');
    let event = result.rows[0];
    signalBus.emitSignal(SIGNAL.CIVIL_DISRUPTION_RESOLVED, { disruptionId: event.id, affectedState: event.affected_state }, { source: 'civilDisruptionService' });
    return event;
  }

  async listActive({ state, district } = {}) {
    const conditions = [`status IN ('active', 'unverified')`, `(end_date IS NULL OR end_date >= CURRENT_DATE)`];
    const params = [];
    if (state) { params.push(state); conditions.push(`affected_state ILIKE $${params.length}`); }
    if (district) { params.push(district); conditions.push(`affected_district ILIKE $${params.length}`); }
    let result = await pool.query(
      `SELECT * FROM civil_disruption_events WHERE ${conditions.join(' AND ')} ORDER BY start_date DESC`,
      params
    );
    return result.rows;
  }

  /**
   * Real ILIKE text match against real shipment addresses — see file
   * header for why this is not GPS routing.
   */
  async _findAffectedShipments(event) {
    const patterns = [event.affected_state, event.affected_district, ...(event.affected_route_names || [])].filter(Boolean);
    if (patterns.length === 0) return [];

    let conditions = [];
    let params = [];
    for (const p of patterns) {
      params.push(`%${p}%`);
      conditions.push(`(origin_address ILIKE $${params.length} OR destination_address ILIKE $${params.length})`);
    }
    let result = await pool.query(
      `SELECT id, shipment_number, origin_address, destination_address, status
         FROM shipments
        WHERE status NOT IN ('delivered', 'cancelled')
          AND (${conditions.join(' OR ')})`,
      params
    );
    return result.rows;
  }

  /** Real check for a specific shipment against currently active disruptions. */
  async checkShipmentRisk(shipmentId) {
    const shipmentResult = await pool.query('SELECT * FROM shipments WHERE id = $1', [shipmentId]);
    if (shipmentResult.rows.length === 0) throw new Error('Shipment not found');
    const shipment = shipmentResult.rows[0];

    const activeDisruptions = await this.listActive();
    const matches = [];
    for (const event of activeDisruptions) {
      let patterns = [event.affected_state, event.affected_district, ...(event.affected_route_names || [])].filter(Boolean);
      const text = `${shipment.origin_address} ${shipment.destination_address}`.toLowerCase();
      if (patterns.some((p) => text.includes(String(p).toLowerCase()))) {
        matches.push(event);
      }
    }
    return { shipmentId, atRisk: matches.length > 0, matchingDisruptions: matches };
  }
}

module.exports = new CivilDisruptionService();

