'use strict';

class TrackingService {
  constructor({ repository = null, clock = () => new Date() } = {}) { this.repository = repository; this.clock = clock; }

  validateEvent(event) {
    if (!event || !event.shipmentId || !event.status || !event.location) throw Object.assign(new Error('shipmentId, status and location are required'), { code: 'VALIDATION_ERROR' });
    return { ...event, occurredAt: event.occurredAt || this.clock().toISOString() };
  }

  async recordEvent(event) {
    const normalized = this.validateEvent(event);
    if (!this.repository?.recordEvent) throw Object.assign(new Error('tracking repository is not configured'), { code: 'DEPENDENCY_NOT_CONFIGURED' });
    return this.repository.recordEvent(normalized);
  }

  async getTimeline(shipmentId) {
    if (!shipmentId) throw Object.assign(new Error('shipmentId is required'), { code: 'VALIDATION_ERROR' });
    if (!this.repository?.getTimeline) throw Object.assign(new Error('tracking repository is not configured'), { code: 'DEPENDENCY_NOT_CONFIGURED' });
    return this.repository.getTimeline(shipmentId);
  }
}

module.exports = new TrackingService();
module.exports.TrackingService = TrackingService;
