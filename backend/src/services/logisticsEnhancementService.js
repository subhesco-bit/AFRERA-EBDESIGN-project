/**
 * Logistics Enhancement Service
 * Handles fleet management, real-time tracking, temperature monitoring, and warehouse integration
 */

const { logger } = require('../utils/logger');

class LogisticsEnhancementService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../database/pool');
  }

  // Fleet Management
  async addVehicle(vehicleData) {
    try {
      const { type, registrationNumber, capacity, make, model, year, driverId, features } = vehicleData;

      const query = `
        INSERT INTO fleet_vehicles 
        (type, registration_number, capacity, make, model, year, driver_id, features, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        type, registrationNumber, capacity, make, model, year, driverId,
        JSON.stringify(features)
      ]);

      logger.info(`Vehicle added to fleet: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding vehicle', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getFleet(filters = {}) {
    try {
      let query = 'SELECT * FROM fleet_vehicles WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting fleet', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getVehicle(vehicleId) {
    try {
      const query = 'SELECT * FROM fleet_vehicles WHERE id = $1';
      const result = await this.pool.query(query, [vehicleId]);

      if (result.rows.length === 0) {
        throw new Error('Vehicle not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting vehicle', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async updateVehicle(vehicleId, updateData) {
    try {
      const query = `
        UPDATE fleet_vehicles
        SET 
          status = COALESCE($1, status),
          driver_id = COALESCE($2, driver_id),
          current_location = COALESCE($3, current_location),
          mileage = COALESCE($4, mileage),
          fuel_level = COALESCE($5, fuel_level),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        updateData.status,
        updateData.driverId,
        updateData.currentLocation ? JSON.stringify(updateData.currentLocation) : null,
        updateData.mileage,
        updateData.fuelLevel,
        vehicleId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Vehicle not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating vehicle', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async scheduleMaintenance(vehicleId, maintenanceData) {
    try {
      const { type, scheduledDate, description, estimatedCost, priority } = maintenanceData;

      const query = `
        INSERT INTO vehicle_maintenance 
        (vehicle_id, type, scheduled_date, description, estimated_cost, priority, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        vehicleId, type, scheduledDate, description, estimatedCost, priority
      ]);

      logger.info(`Maintenance scheduled for vehicle ${vehicleId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error scheduling maintenance', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * getMaintenanceDueList — real "due for service" list for the fleet
   * (M105 Fleet Management, Machinery domain; the one tab in
   * MachineryManagementPage.jsx with a genuine backend — see that file's
   * header comment).
   *
   * Two real, independent signals off fleet_vehicles / vehicle_maintenance
   * (034_logistics_enhancement_schema.sql), no fabricated data:
   *
   *   1. Calendar-based: fleet_vehicles.next_maintenance_date, when it was
   *      actually set via scheduleMaintenance()/updateVehicle() — compared
   *      against today, no assumption needed.
   *   2. Open work orders: vehicle_maintenance rows with status still
   *      'scheduled' whose scheduled_date has passed — an overdue booking,
   *      not a prediction.
   *
   * A vehicle with neither a next_maintenance_date nor any maintenance
   * history is reported separately as "no maintenance schedule on record"
   * rather than silently omitted or given a guessed due date — matching how
   * getActiveDrivers() above reports `stale` instead of hiding a lost ping.
   *
   * dueSoonWithinDays is not stored anywhere in the schema, so it is a
   * named, labelled ASSUMED_* constant (financialService.farmerCreditRiskScore()
   * real/assumed convention), overridable per call.
   */
  async getMaintenanceDueList({ dueSoonWithinDays = 14 } = {}) {
    const ASSUMED_DUE_SOON_WINDOW_DAYS = dueSoonWithinDays;
    try {
      const { rows: vehicles } = await this.pool.query(
        `SELECT id, type, registration_number, status, mileage,
                last_maintenance_date, next_maintenance_date
           FROM fleet_vehicles
          WHERE status != 'retired'
          ORDER BY registration_number`
      );

      const { rows: openWork } = await this.pool.query(
        `SELECT vehicle_id, id, type, scheduled_date, priority, description
           FROM vehicle_maintenance
          WHERE status = 'scheduled'
          ORDER BY scheduled_date`
      );
      const openWorkByVehicle = new Map();
      for (const w of openWork) {
        if (!openWorkByVehicle.has(w.vehicle_id)) openWorkByVehicle.set(w.vehicle_id, []);
        openWorkByVehicle.get(w.vehicle_id).push(w);
      }

      const today = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysBetween = (from, to) => Math.round((to.getTime() - from.getTime()) / msPerDay);

      const results = vehicles.map((v) => {
        const openOrders = (openWorkByVehicle.get(v.id) || []).map((w) => {
          const scheduled = new Date(w.scheduled_date);
          const daysUntil = daysBetween(today, scheduled);
          return {
            maintenanceId: w.id,
            type: w.type,
            scheduledDate: w.scheduled_date,
            priority: w.priority,
            description: w.description,
            daysUntilScheduled: daysUntil,
            overdue: daysUntil < 0,
          };
        });

        let calendarStatus = 'no_schedule';
        let daysUntilNext = null;
        if (v.next_maintenance_date) {
          daysUntilNext = daysBetween(today, new Date(v.next_maintenance_date));
          if (daysUntilNext < 0) calendarStatus = 'overdue';
          else if (daysUntilNext <= ASSUMED_DUE_SOON_WINDOW_DAYS) calendarStatus = 'due_soon';
          else calendarStatus = 'scheduled';
        }

        const overdueWorkOrders = openOrders.filter((o) => o.overdue).length;
        const dueForService = calendarStatus === 'overdue' || calendarStatus === 'due_soon' || overdueWorkOrders > 0;

        return {
          vehicleId: v.id,
          type: v.type,
          registrationNumber: v.registration_number,
          status: v.status,
          mileage: v.mileage !== null ? Number(v.mileage) : null,
          lastMaintenanceDate: v.last_maintenance_date,
          nextMaintenanceDate: v.next_maintenance_date,
          calendarStatus,
          daysUntilNextMaintenance: daysUntilNext,
          openWorkOrders: openOrders,
          overdueWorkOrders,
          dueForService,
        };
      });

      return {
        generatedAt: new Date().toISOString(),
        dueSoonWithinDays: ASSUMED_DUE_SOON_WINDOW_DAYS,
        dueSoonWindowQuality: 'assumed — not stored in the schema',
        vehicles: results,
        dueForServiceCount: results.filter((r) => r.dueForService).length,
        noScheduleCount: results.filter((r) => r.calendarStatus === 'no_schedule' && r.openWorkOrders.length === 0).length,
      };
    } catch (error) {
      logger.error('Error computing fleet maintenance due list', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Real-time Tracking
  async updateTracking(shipmentId, trackingData) {
    try {
      const { latitude, longitude, speed, heading, timestamp, status } = trackingData;

      const query = `
        INSERT INTO shipment_tracking 
        (shipment_id, latitude, longitude, speed, heading, timestamp, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        shipmentId, latitude, longitude, speed, heading, timestamp, status
      ]);

      // Update shipment current location
      await this.pool.query(
        'UPDATE shipments SET current_location = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify({ latitude, longitude }), shipmentId]
      );

      logger.info(`Tracking updated for shipment ${shipmentId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating tracking', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getTracking(shipmentId) {
    try {
      const query = `
        SELECT * FROM shipment_tracking 
        WHERE shipment_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 100
      `;

      const result = await this.pool.query(query, [shipmentId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting tracking', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getLiveTracking(shipmentId) {
    try {
      const query = `
        SELECT 
          st.*,
          s.origin,
          s.destination,
          s.estimated_arrival
        FROM shipment_tracking st
        JOIN shipments s ON st.shipment_id = s.id
        WHERE st.shipment_id = $1 
        ORDER BY st.timestamp DESC 
        LIMIT 1
      `;

      const result = await this.pool.query(query, [shipmentId]);

      if (result.rows.length === 0) {
        throw new Error('No tracking data available');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting live tracking', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async setGeofence(shipmentId, geofenceData) {
    try {
      const { type, radius, coordinates, alertEnabled } = geofenceData;

      const query = `
        INSERT INTO shipment_geofences 
        (shipment_id, type, radius, coordinates, alert_enabled)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (shipment_id) 
        DO UPDATE SET 
          type = EXCLUDED.type,
          radius = EXCLUDED.radius,
          coordinates = EXCLUDED.coordinates,
          alert_enabled = EXCLUDED.alert_enabled
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        shipmentId, type, radius, JSON.stringify(coordinates), alertEnabled
      ]);

      logger.info(`Geofence set for shipment ${shipmentId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error setting geofence', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Temperature Monitoring
  async recordTemperature(shipmentId, temperatureData) {
    try {
      const { sensorId, temperature, humidity, timestamp, zone } = temperatureData;

      const query = `
        INSERT INTO temperature_readings 
        (shipment_id, sensor_id, temperature, humidity, timestamp, zone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        shipmentId, sensorId, temperature, humidity, timestamp, zone
      ]);

      // Check for temperature alerts
      await this.checkTemperatureAlerts(shipmentId, temperature);

      logger.info(`Temperature recorded for shipment ${shipmentId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording temperature', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getTemperatureData(shipmentId, filters = {}) {
    try {
      let query = `
        SELECT * FROM temperature_readings 
        WHERE shipment_id = $1
      `;

      const params = [shipmentId];
      let paramCount = 1;

      if (filters.startDate) {
        paramCount++;
        query += ` AND timestamp >= $${paramCount}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        paramCount++;
        query += ` AND timestamp <= $${paramCount}`;
        params.push(filters.endDate);
      }

      query += ' ORDER BY timestamp DESC';

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting temperature data', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async setTemperatureAlert(shipmentId, alertData) {
    try {
      const { minTemp, maxTemp, minHumidity, maxHumidity, alertChannels } = alertData;

      const query = `
        INSERT INTO temperature_alerts 
        (shipment_id, min_temp, max_temp, min_humidity, max_humidity, alert_channels, enabled)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (shipment_id) 
        DO UPDATE SET 
          min_temp = EXCLUDED.min_temp,
          max_temp = EXCLUDED.max_temp,
          min_humidity = EXCLUDED.min_humidity,
          max_humidity = EXCLUDED.max_humidity,
          alert_channels = EXCLUDED.alert_channels,
          enabled = EXCLUDED.enabled
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        shipmentId, minTemp, maxTemp, minHumidity, maxHumidity,
        JSON.stringify(alertChannels)
      ]);

      logger.info(`Temperature alert configured for shipment ${shipmentId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error setting temperature alert', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getTemperatureAlerts(shipmentId) {
    try {
      const query = `
        SELECT * FROM temperature_alerts 
        WHERE shipment_id = $1
      `;

      const result = await this.pool.query(query, [shipmentId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting temperature alerts', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async checkTemperatureAlerts(shipmentId, currentTemp) {
    try {
      const alerts = await this.getTemperatureAlerts(shipmentId);

      for (const alert of alerts) {
        if (!alert.enabled) continue;

        if (currentTemp < alert.min_temp || currentTemp > alert.max_temp) {
          await this.triggerTemperatureAlert(shipmentId, alert, currentTemp);
        }
      }
    } catch (error) {
      logger.error('Error checking temperature alerts', { error: error.message, stack: error.stack });
      throw new Error(`Failed to check temperature alerts for shipment ${shipmentId}: ${error.message}`);
    }
  }

  async triggerTemperatureAlert(shipmentId, alert, currentTemp) {
    try {
      const query = `
        INSERT INTO temperature_alert_log 
        (shipment_id, alert_id, temperature, triggered_at, resolved)
        VALUES ($1, $2, $3, NOW(), false)
        RETURNING *
      `;

      const result = await this.pool.query(query, [shipmentId, alert.id, currentTemp]);

      logger.warn(`Temperature alert triggered for shipment ${shipmentId}: ${currentTemp}°C`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error triggering temperature alert', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // Warehouse Integration
  async createWarehouse(warehouseData) {
    try {
      const { name, location, type, capacity, zones, features } = warehouseData;

      const query = `
        INSERT INTO warehouses 
        (name, location, type, capacity, zones, features, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        name, JSON.stringify(location), type, capacity,
        JSON.stringify(zones), JSON.stringify(features)
      ]);

      logger.info(`Warehouse created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating warehouse', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getWarehouses(filters = {}) {
    try {
      let query = 'SELECT * FROM warehouses WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (filters.type) {
        paramCount++;
        query += ` AND type = $${paramCount}`;
        params.push(filters.type);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      query += ' ORDER BY name ASC';

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting warehouses', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getWarehouse(warehouseId) {
    try {
      const query = 'SELECT * FROM warehouses WHERE id = $1';
      const result = await this.pool.query(query, [warehouseId]);

      if (result.rows.length === 0) {
        throw new Error('Warehouse not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting warehouse', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async addInventory(warehouseId, inventoryData) {
    try {
      const { productId, quantity, zone, location, expiryDate } = inventoryData;

      const query = `
        INSERT INTO warehouse_inventory 
        (warehouse_id, product_id, quantity, zone, location, expiry_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (warehouse_id, product_id, location)
        DO UPDATE SET 
          quantity = warehouse_inventory.quantity + EXCLUDED.quantity,
          updated_at = NOW()
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        warehouseId, productId, quantity, zone, location, expiryDate
      ]);

      logger.info(`Inventory added to warehouse ${warehouseId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding inventory', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getWarehouseInventory(warehouseId) {
    try {
      const query = `
        SELECT 
          wi.*,
          p.name as product_name,
          p.sku
        FROM warehouse_inventory wi
        JOIN products p ON wi.product_id = p.id
        WHERE wi.warehouse_id = $1
        ORDER BY wi.zone, wi.location
      `;

      const result = await this.pool.query(query, [warehouseId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting warehouse inventory', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async processWarehouseShipment(warehouseId, shipmentData) {
    try {
      const { type, items, referenceId } = shipmentData;

      const query = `
        INSERT INTO warehouse_shipments 
        (warehouse_id, type, items, reference_id, status)
        VALUES ($1, $2, $3, $4, 'processing')
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        warehouseId, type, JSON.stringify(items), referenceId
      ]);

      // Update inventory based on shipment type
      for (const item of items) {
        if (type === 'inbound') {
          await this.addInventory(warehouseId, {
            productId: item.productId,
            quantity: item.quantity,
            zone: item.zone,
            location: item.location,
            expiryDate: item.expiryDate
          });
        } else if (type === 'outbound') {
          await this.removeInventory(warehouseId, item.productId, item.quantity);
        }
      }

      logger.info(`Warehouse shipment processed for warehouse ${warehouseId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error processing warehouse shipment', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async removeInventory(warehouseId, productId, quantity) {
    try {
      const query = `
        UPDATE warehouse_inventory
        SET quantity = quantity - $1,
            updated_at = NOW()
        WHERE warehouse_id = $2 AND product_id = $3
        RETURNING *
      `;

      const result = await this.pool.query(query, [quantity, warehouseId, productId]);

      if (result.rows.length === 0) {
        throw new Error('Inventory not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Error removing inventory', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getLogisticsStatistics(filters = {}) {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM fleet_vehicles WHERE status = 'active') as active_vehicles,
          (SELECT COUNT(*) FROM shipments WHERE status = 'in_transit') as active_shipments,
          (SELECT COUNT(*) FROM warehouses WHERE status = 'active') as active_warehouses,
          (SELECT COUNT(*) FROM temperature_alerts WHERE enabled = true) as active_temperature_alerts,
          (SELECT AVG(CASE WHEN temperature < min_temp OR temperature > max_temp THEN 1 ELSE 0 END) 
           FROM temperature_readings tr 
           JOIN temperature_alerts ta ON tr.shipment_id = ta.shipment_id 
           WHERE tr.timestamp > NOW() - INTERVAL '24 hours') as temperature_violation_rate
      `;

      const result = await this.pool.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting logistics statistics', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // =========================================================================
  // DRIVER LOCATION — migration 991.
  //
  // ADDED TO THIS CLASS, not a new tracking service. shipment_tracking (already
  // here) records where a CONSIGNMENT is; driver_location records where a
  // PERSON is. They are joined on every dispatch decision, and splitting them
  // across two services would mean two sources of truth for "where is it now".
  // =========================================================================

  /**
   * Record a driver ping.
   *
   * Rejects (0,0). Null Island is in the Gulf of Guinea and is what a GPS
   * module reports before it has a fix — accepting it puts a driver 6,000 km
   * off the coast of Africa on the dispatch map, and it has passed for a real
   * location in this codebase before.
   */
  async recordDriverLocation({ driverId, shipmentId, latitude, longitude, speedKmph, headingDeg, accuracyM, batteryPct }) {
    if (latitude === 0 && longitude === 0) {
      throw new Error('Refusing (0,0) — this is an unfixed GPS module, not a location');
    }
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      throw new Error('Coordinates out of range');
    }
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO driver_location
           (driver_id, shipment_id, latitude, longitude, speed_kmph,
            heading_deg, accuracy_m, battery_pct, recorded_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_TIMESTAMP)
         RETURNING *`,
        [driverId, shipmentId ?? null, latitude, longitude, speedKmph ?? null,
          headingDeg ?? null, accuracyM ?? null, batteryPct ?? null]
      );
      return rows[0];
    } catch (error) {
      logger.error('Error recording driver location', { error: error.message });
      throw error;
    }
  }

  /**
   * Latest known position per active driver.
   *
   * `stale` is returned rather than hidden. A driver whose last ping was two
   * hours ago is not stationary — the tracker has lost them, and showing that
   * pin as current is how a dispatcher concludes a truck is parked when it is
   * actually out of coverage on a hill road.
   */
  async getActiveDrivers({ staleAfterMinutes = 30 } = {}) {
    try {
      const { rows } = await this.pool.query(
        `SELECT DISTINCT ON (driver_id)
                driver_id, shipment_id, latitude, longitude, speed_kmph,
                heading_deg, battery_pct, recorded_at,
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - recorded_at))/60 AS minutes_since_ping
           FROM driver_location
          WHERE recorded_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
          ORDER BY driver_id, recorded_at DESC`
      );
      return {
        drivers: rows.map((r) => ({
          ...r,
          stale: Number(r.minutes_since_ping) > staleAfterMinutes,
          note: Number(r.minutes_since_ping) > staleAfterMinutes
            ? `Last ping ${Math.round(r.minutes_since_ping)} minutes ago. Position is a `
            + 'last-known, not a current one — likely out of coverage rather than stopped.'
            : null,
          lowBattery: r.battery_pct !== null && Number(r.battery_pct) < 20,
        })),
        active: rows.filter((r) => Number(r.minutes_since_ping) <= staleAfterMinutes).length,
        stale: rows.filter((r) => Number(r.minutes_since_ping) > staleAfterMinutes).length,
      };
    } catch (error) {
      logger.error('Error getting active drivers', { error: error.message });
      throw error;
    }
  }

  /** Breadcrumb trail for one shipment, joining consignment and driver tracks. */
  async getShipmentTrail(shipmentId) {
    try {
      const [driver, consignment] = await Promise.all([
        this.pool.query(
          `SELECT latitude, longitude, speed_kmph, recorded_at
             FROM driver_location WHERE shipment_id = $1 ORDER BY recorded_at`,
          [shipmentId]
        ),
        this.pool.query(
          `SELECT * FROM shipment_tracking WHERE shipment_id = $1 ORDER BY created_at`,
          [shipmentId]
        ),
      ]);
      return {
        shipmentId,
        driverTrack: driver.rows,
        consignmentEvents: consignment.rows,
        note: driver.rows.length === 0
          ? 'No driver pings for this shipment. The consignment events below are status '
          + 'updates entered by a person, not observed positions.'
          : null,
      };
    } catch (error) {
      logger.error('Error getting shipment trail', { error: error.message });
      throw error;
    }
  }
}

module.exports = new LogisticsEnhancementService();
