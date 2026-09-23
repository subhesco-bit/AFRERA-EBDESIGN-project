/**
 * Operational Anatomy - Capability Registry & Constraints
 * Tracks what system can do and its constraints
 */

'use strict';

class OperationalAnatomy {
  constructor() {
    this.capabilities = new Map();
    this.constraints = new Map();
    this.health = new Map();
  }

  registerCapability(capabilityId, config) {
    this.capabilities.set(capabilityId, {
      id: capabilityId,
      name: config.name || capabilityId,
      category: config.category || 'general',
      cost: config.cost || 0,
      latency_ms: config.latency_ms || 0,
      concurrency_limit: config.concurrency_limit || 100,
      dependencies: config.dependencies || [],
      retry_policy: config.retry_policy || {max: 3, backoff: 'exponential'},
      status: 'online',
      registeredAt: new Date(),
    });

    this.health.set(capabilityId, {
      capability: capabilityId,
      status: 'online',
      lastCheck: new Date(),
      successCount: 0,
      failureCount: 0,
    });

    return this.capabilities.get(capabilityId);
  }

  setConstraint(capabilityId, constraint) {
    if (!this.capabilities.has(capabilityId)) {
      throw new Error(`Capability ${capabilityId} not found`);
    }
    this.constraints.set(capabilityId, {
      capability: capabilityId,
      maxConcurrent: constraint.maxConcurrent || 100,
      maxDaily: constraint.maxDaily || 10000,
      maxHourly: constraint.maxHourly || 1000,
      currentConcurrent: 0,
      usedToday: 0,
      usedThisHour: 0,
      lastReset: new Date(),
    });
  }

  updateHealth(capabilityId, status, success = true) {
    const health = this.health.get(capabilityId);
    if (!health) return;

    health.status = status;
    health.lastCheck = new Date();
    if (success) {
      health.successCount++;
    } else {
      health.failureCount++;
    }

    const total = health.successCount + health.failureCount;
    health.successRate = (health.successCount / total) * 100;
  }

  getCapability(capabilityId) {
    return this.capabilities.get(capabilityId) || null;
  }

  getHealth(capabilityId) {
    return this.health.get(capabilityId) || null;
  }

  canExecute(capabilityId) {
    const cap = this.capabilities.get(capabilityId);
    const con = this.constraints.get(capabilityId);
    const health = this.health.get(capabilityId);

    if (!cap || health.status !== 'online') return false;
    if (!con) return true;

    return con.currentConcurrent < con.maxConcurrent &&
           con.usedThisHour < con.maxHourly &&
           con.usedToday < con.maxDaily;
  }

  getAllCapabilities() {
    return Array.from(this.capabilities.values());
  }

  getSystemHealth() {
    const capabilities = this.getAllCapabilities();
    const online = capabilities.filter(c => this.health.get(c.id).status === 'online').length;
    const offline = capabilities.length - online;

    return {
      advisory: true,
      total: capabilities.length,
      online,
      offline,
      health_percentage: (online / capabilities.length) * 100,
      timestamp: new Date(),
    };
  }
}

module.exports = { OperationalAnatomy };
