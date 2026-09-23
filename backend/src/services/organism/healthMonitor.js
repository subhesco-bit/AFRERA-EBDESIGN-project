/**
 * Organism Health Monitor - Subsystem Health Tracking
 *
 * Treats platform as living organism with organs (subsystems).
 * From pine-shadow: organism/boot.server.ts, organism/fns.ts
 */

'use strict';

class HealthMonitor {
  constructor() {
    this.organs = new Map();      // organId → organ (subsystem)
    this.healthHistory = new Map(); // organId → [{ timestamp, status, metrics }]
  }

  /**
   * Register a subsystem (organ) for monitoring
   */
  registerOrgan(organId, organ) {
    this.organs.set(organId, {
      id: organId,
      name: organ.name,
      type: organ.type, // 'service', 'database', 'cache', 'queue'
      healthCheck: organ.healthCheck, // async function
      dependencies: organ.dependencies || [],
      criticalityLevel: organ.criticalityLevel || 'medium', // low, medium, high
      registeredAt: new Date(),
      status: 'unknown',
    });
    if (!this.healthHistory.has(organId)) {
      this.healthHistory.set(organId, []);
    }
    return this.organs.get(organId);
  }

  /**
   * Check health of an organ
   */
  async checkOrganHealth(organId) {
    const organ = this.organs.get(organId);
    if (!organ) {
      throw new Error(`Organ ${organId} not found`);
    }

    try {
      const result = await organ.healthCheck();

      const health = {
        organ: organId,
        status: result.status || 'healthy', // healthy, degraded, unhealthy
        metrics: result.metrics || {},
        timestamp: new Date(),
        responseTime: result.responseTime || 0,
      };

      organ.status = health.status;
      this.healthHistory.get(organId).push(health);

      // Keep only last 100 records
      const history = this.healthHistory.get(organId);
      if (history.length > 100) {
        history.shift();
      }

      return health;
    } catch (e) {
      const health = {
        organ: organId,
        status: 'unhealthy',
        error: e.message,
        timestamp: new Date(),
      };
      organ.status = 'unhealthy';
      this.healthHistory.get(organId).push(health);
      return health;
    }
  }

  /**
   * Check health of all organs
   */
  async checkAllOrgans() {
    const results = [];
    for (const organId of this.organs.keys()) {
      const health = await this.checkOrganHealth(organId);
      results.push(health);
    }

    return {
      advisory: true,
      timestamp: new Date(),
      organs: results,
      summary: {
        healthy: results.filter(h => h.status === 'healthy').length,
        degraded: results.filter(h => h.status === 'degraded').length,
        unhealthy: results.filter(h => h.status === 'unhealthy').length,
      },
      overall: results.every(h => h.status === 'healthy') ? 'healthy' : 'degraded',
    };
  }

  /**
   * Get organ status
   */
  getOrganStatus(organId) {
    const organ = this.organs.get(organId);
    if (!organ) {
      throw new Error(`Organ ${organId} not found`);
    }

    const history = this.healthHistory.get(organId) || [];
    const recentHistory = history.slice(-20);

    return {
      advisory: true,
      organ: organId,
      currentStatus: organ.status,
      type: organ.type,
      criticality: organ.criticalityLevel,
      recentHistory,
      uptime: this._calculateUptime(recentHistory),
      dependencies: organ.dependencies,
    };
  }

  /**
   * Calculate uptime percentage from history
   */
  _calculateUptime(history) {
    if (history.length === 0) return 100;
    const healthy = history.filter(h => h.status === 'healthy').length;
    return (healthy / history.length) * 100;
  }

  /**
   * Get critical organs that are unhealthy
   */
  getCriticalIssues() {
    const issues = [];
    for (const organ of this.organs.values()) {
      if (organ.criticalityLevel === 'high' && organ.status === 'unhealthy') {
        issues.push({
          organ: organ.id,
          name: organ.name,
          status: organ.status,
          action: `${organ.name} is critical and unhealthy. Immediate attention required.`,
        });
      }
    }
    return {
      advisory: true,
      critical: issues.length > 0,
      issues,
      timestamp: new Date(),
    };
  }

  /**
   * Suggested adaptive routing (which organs to use)
   */
  getSuggestedRouting() {
    const routes = {};
    for (const organ of this.organs.values()) {
      if (organ.status === 'healthy') {
        routes[organ.type] = organ.id;
      } else if (organ.status === 'degraded') {
        routes[`${organ.type}_backup`] = organ.id;
      }
      // unhealthy organs not routed to
    }

    return {
      advisory: true,
      primaryRoutes: routes,
      failoverPolicy: 'Use backup for degraded, skip unhealthy',
      timestamp: new Date(),
    };
  }
}

module.exports = { HealthMonitor };
