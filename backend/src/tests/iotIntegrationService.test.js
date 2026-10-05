/**
 * IoT Integration Service Tests
 */

const request = require('supertest');
const { app } = require('../index');
const { createTestUserToken, unwrap } = require('./helpers/testAuth');
const { Pool } = require('pg');

describe('IoT Integration Service', () => {
  let pool;
  let authToken;
  let testDeviceId;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    });

    ({ token: authToken } = await createTestUserToken(pool, { email: 'iot-test@example.com', role: 'admin' }));
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/iot-integration/iot-devices', () => {
    it('should register IoT device', async () => {
      const response = await request(app)
        .post('/api/v1/iot-integration/iot-devices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          device_id: 'IOT-001',
          device_name: 'Temperature Sensor 1',
          device_type: 'sensor',
          device_category: 'temperature',
          manufacturer: 'SensorCo',
          model: 'TempSense-X1',
          firmware_version: '2.1.0',
          device_config: { sampling_rate: 60 },
          metadata: {},
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('device_id');
      expect(unwrap(response)).toHaveProperty('device_name');
      expect(unwrap(response).status).toBe('active');
      testDeviceId = unwrap(response).id;
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/iot-integration/iot-devices')
        .send({
          device_id: 'IOT-002',
          device_name: 'Test Device',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/iot-integration/iot-devices', () => {
    it('should get IoT devices', async () => {
      const response = await request(app)
        .get('/api/v1/iot-integration/iot-devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
    });

    it('should filter by device type', async () => {
      const response = await request(app)
        .get('/api/v1/iot-integration/iot-devices?device_type=sensor')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
    });
  });

  describe('PATCH /api/v1/iot-integration/iot-devices/:deviceId/status', () => {
    it('should update device status', async () => {
      const response = await request(app)
        .patch(`/api/v1/iot-integration/iot-devices/${testDeviceId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'active',
          battery_level: 85,
          signal_strength: 90,
        })
        .expect(200);

      expect(unwrap(response).battery_level).toBe(85);
      expect(unwrap(response).signal_strength).toBe(90);
    });
  });

  describe('POST /api/v1/iot-integration/sensor-data', () => {
    it('should record sensor data', async () => {
      const response = await request(app)
        .post('/api/v1/iot-integration/sensor-data')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          device_id: testDeviceId,
          sensor_type: 'temperature',
          sensor_value: 25.5,
          unit: 'C',
          quality_score: 0.95,
          metadata: {},
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('sensor_type');
      expect(unwrap(response)).toHaveProperty('sensor_value');
    });
  });

  describe('GET /api/v1/iot-integration/sensor-data/:deviceId', () => {
    it('should get sensor data', async () => {
      const response = await request(app)
        .get(`/api/v1/iot-integration/sensor-data/${testDeviceId}`)
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/iot-integration/device-commands', () => {
    it('should send device command', async () => {
      const response = await request(app)
        .post('/api/v1/iot-integration/device-commands')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          device_id: testDeviceId,
          command_type: 'configure',
          command_payload: { sampling_rate: 30 },
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('command_type');
      expect(unwrap(response).status).toBe('sent');
    });
  });

  describe('GET /api/v1/iot-integration/device-commands/:deviceId', () => {
    it('should get device commands', async () => {
      const response = await request(app)
        .get(`/api/v1/iot-integration/device-commands/${testDeviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/v1/iot-integration/device-alerts', () => {
    it('should create device alert', async () => {
      const response = await request(app)
        .post('/api/v1/iot-integration/device-alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          device_id: testDeviceId,
          alert_type: 'low_battery',
          alert_severity: 'medium',
          alert_message: 'Battery level below 20%',
          alert_data: { battery_level: 15 },
        })
        .expect(201);

      expect(unwrap(response)).toHaveProperty('alert_type');
      expect(unwrap(response)).toHaveProperty('alert_severity');
    });
  });

  describe('GET /api/v1/iot-integration/device-alerts/unacknowledged', () => {
    it('should get unacknowledged alerts', async () => {
      const response = await request(app)
        .get('/api/v1/iot-integration/device-alerts/unacknowledged')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/iot-integration/iot-devices/:deviceId/health', () => {
    it('should check device health', async () => {
      const response = await request(app)
        .get(`/api/v1/iot-integration/iot-devices/${testDeviceId}/health`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unwrap(response)).toHaveProperty('health_status');
    });
  });

  describe('POST /api/v1/iot-integration/iot-analytics', () => {
    it('should record IoT analytics', async () => {
      const response = await request(app)
        .post('/api/v1/iot-integration/iot-analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          metrics: {
            total_devices: 10,
            active_devices: 8,
            offline_devices: 2,
            total_readings: 1000,
            anomaly_count: 5,
            alert_count: 3,
            avg_signal: 85,
            avg_battery: 75,
          },
        })
        .expect(200);

      expect(unwrap(response)).toHaveProperty('total_devices');
    });
  });
});
