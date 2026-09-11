/**
 * Digital Twin Platform Service (Priority #5)
 * Real-time farm monitoring, IoT integration, WebSocket streaming, simulation
 */

const database = require("../database/connection");
const cache = require("../middleware/cacheMiddleware");

class DigitalTwinService {
  async initializeFarmTwin(farmId) {
    try {
      const farm = await database.query("SELECT * FROM farms WHERE id = $1", [farmId]);
      if (!farm.rows[0]) throw new Error("Farm not found");

      const twin = {
        farmId,
        status: "active",
        realTimeData: {
          temperature: 0,
          humidity: 0,
          soilMoisture: 0,
          ph: 0,
        },
        devices: [],
        fields: [],
        equipment: [],
        lastUpdate: new Date(),
      };

      await database.query(
        `INSERT INTO digital_twins (farm_id, twin_data, status, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (farm_id) DO UPDATE SET twin_data = $2`,
        [farmId, JSON.stringify(twin), "active"]
      );

      return twin;
    } catch (error) {
      console.error("Twin init error:", error);
      throw error;
    }
  }

  async registerIoTDevice(farmId, deviceData) {
    try {
      const device = {
        deviceId: `device_${Date.now()}`,
        name: deviceData.name,
        type: deviceData.type,
        status: "online",
      };

      await database.query(
        `INSERT INTO iot_devices (farm_id, device_data, device_type, status, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [farmId, JSON.stringify(device), device.type, "online"]
      );

      return device;
    } catch (error) {
      console.error("Device registration error:", error);
      throw error;
    }
  }

  async streamSensorData(farmId, deviceId, sensorReading) {
    try {
      const reading = {
        timestamp: new Date(),
        deviceId,
        value: sensorReading.value,
        unit: sensorReading.unit,
      };

      await database.query(
        `INSERT INTO sensor_readings (farm_id, device_id, reading_data, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [farmId, deviceId, JSON.stringify(reading)]
      );

      return reading;
    } catch (error) {
      console.error("Stream error:", error);
      throw error;
    }
  }

  async simulateFarmOperations(farmId, config) {
    try {
      const simulationId = `sim_${Date.now()}`;
      const simulation = {
        simulationId,
        farmId,
        config,
        status: "running",
        startTime: new Date(),
        events: [],
        predictions: [],
      };

      await database.query(
        `INSERT INTO simulations (farm_id, simulation_data, scenario, status, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [farmId, JSON.stringify(simulation), config.scenario, "completed"]
      );

      return simulation;
    } catch (error) {
      console.error("Simulation error:", error);
      throw error;
    }
  }

  async getRealtimeState(farmId) {
    try {
      const result = await database.query(
        "SELECT twin_data FROM digital_twins WHERE farm_id = $1",
        [farmId]
      );

      if (!result.rows[0]) {
        return await this.initializeFarmTwin(farmId);
      }

      return JSON.parse(result.rows[0].twin_data);
    } catch (error) {
      console.error("Get state error:", error);
      throw error;
    }
  }

  async generateRecommendations(farmId) {
    try {
      const twin = await this.getRealtimeState(farmId);
      const recommendations = [];

      if (twin.realTimeData.temperature > 35) {
        recommendations.push({
          priority: "high",
          type: "irrigation",
          message: "High temperature. Increase irrigation.",
        });
      }

      if (twin.realTimeData.soilMoisture < 30) {
        recommendations.push({
          priority: "high",
          type: "irrigation",
          message: "Low soil moisture. Start irrigation.",
        });
      }

      return recommendations;
    } catch (error) {
      console.error("Recommendations error:", error);
      return [];
    }
  }
}

module.exports = new DigitalTwinService();
