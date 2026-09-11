'use strict';

/** Production IoT application service. Device protocol adapters are injected. */
class IoTService {
  constructor({ deviceRepository = null, telemetryRepository = null, adapter = null, clock = () => new Date() } = {}) {
    this.deviceRepository = deviceRepository; this.telemetryRepository = telemetryRepository; this.adapter = adapter; this.clock = clock;
  }

  validateTelemetry(payload) {
    if (!payload || !payload.deviceId || !payload.metric) throw Object.assign(new Error('deviceId and metric are required'), { code: 'VALIDATION_ERROR' });
    const value = Number(payload.value);
    if (!Number.isFinite(value)) throw Object.assign(new Error('telemetry value must be numeric'), { code: 'VALIDATION_ERROR' });
    return { ...payload, value, observedAt: payload.observedAt || this.clock().toISOString() };
  }

  async registerDevice(device) {
    if (!device?.deviceId || !device?.type) throw Object.assign(new Error('deviceId and type are required'), { code: 'VALIDATION_ERROR' });
    if (!this.deviceRepository?.upsert) throw Object.assign(new Error('device repository is not configured'), { code: 'DEPENDENCY_NOT_CONFIGURED' });
    return this.deviceRepository.upsert(device);
  }

  async ingestTelemetry(payload) {
    const event = this.validateTelemetry(payload);
    if (!this.telemetryRepository?.append) throw Object.assign(new Error('telemetry repository is not configured'), { code: 'DEPENDENCY_NOT_CONFIGURED' });
    return this.telemetryRepository.append(event);
  }

  async commandDevice({ deviceId, command, parameters = {} }) {
    if (!deviceId || !command) throw Object.assign(new Error('deviceId and command are required'), { code: 'VALIDATION_ERROR' });
    if (!this.adapter?.command) throw Object.assign(new Error('IoT device adapter is not configured'), { code: 'DEPENDENCY_NOT_CONFIGURED' });
    return this.adapter.command({ deviceId, command, parameters });
  }
}

module.exports = new IoTService();
module.exports.IoTService = IoTService;
