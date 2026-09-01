/**
 * M001 Platform Core Service
 * Foundation service for platform-wide configuration and core functionality
 */

const { getPostgreSQL } = require('../../database/connection');

class PlatformCoreService {
  get pool() {
    return getPostgreSQL();
  }

  /**
   * Get platform configuration
   */
  async getPlatformConfig() {
    try {
      const query = `
        SELECT key, value, description, category
        FROM platform_config
        WHERE active = true
        ORDER BY category, key
      `;
      
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting platform config:', error);
      throw new Error('Failed to get platform configuration');
    }
  }

  /**
   * Update platform configuration
   */
  async updatePlatformConfig(key, value, updatedBy) {
    try {
      const query = `
        UPDATE platform_config
        SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE key = $3
        RETURNING *
      `;
      
      const result = await this.pool.query(query, [value, updatedBy, key]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating platform config:', error);
      throw new Error('Failed to update platform configuration');
    }
  }

  /**
   * Get platform health status
   */
  async getPlatformHealth() {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {}
      };
      
      // Check database connection
      try {
        await this.pool.query('SELECT 1');
        health.services.database = { status: 'healthy', message: 'Database connection OK' };
      } catch (error) {
        health.services.database = { status: 'unhealthy', message: 'Database connection failed' };
        health.status = 'degraded';
      }
      
      // Check other services
      health.services.api = { status: 'healthy', message: 'API running' };
      health.services.authentication = { status: 'healthy', message: 'Auth service running' };
      
      return health;
    } catch (error) {
      console.error('Error getting platform health:', error);
      throw new Error('Failed to get platform health');
    }
  }

  /**
   * Get platform statistics.
   *
   * (2026-08-29) active_sessions/api_calls_today were hardcoded to 0 and
   * labeled a "placeholder" in a comment that never surfaced to the API
   * response - callers had no way to tell a real zero from "not tracked".
   * No session-store or request-counter table exists anywhere in this
   * codebase to compute real values for these two fields (checked:
   * no such table in backend/src/database/migrations/). Reporting that
   * absence explicitly (null + a note) instead of a fabricated 0, same
   * discipline core/aiOrchestrator.js holds itself to.
   */
  async getPlatformStats() {
    try {
      const stats = {
        users: 0,
        organizations: 0,
        active_sessions: null,
        api_calls_today: null,
        untracked_fields_note: 'active_sessions and api_calls_today are not '
          + 'currently tracked anywhere in this codebase (no session-store or '
          + 'request-counter table exists) - reported as null rather than a '
          + 'fabricated 0.',
      };

      // Get user count
      const userCount = await this.pool.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
      stats.users = parseInt(userCount.rows[0].count);

      // Get organization count
      const orgCount = await this.pool.query('SELECT COUNT(*) FROM organizations');
      stats.organizations = parseInt(orgCount.rows[0].count);

      return stats;
    } catch (error) {
      console.error('Error getting platform stats:', error);
      throw new Error('Failed to get platform statistics');
    }
  }

  /**
   * Platform optimization recommendations.
   *
   * (2026-08-29) Was labeled "AI Integration" / "AI-powered ... recommendations"
   * despite being a static, hardcoded list with no AI call anywhere in this
   * method - a real instance of the same "fabricated confident answer"
   * pattern found and fixed in core/ai/aiOrchestratorCore.js this session.
   * Relabeled honestly as static best-practice guidance. Wiring this through
   * the real AI backbone (core/aiOrchestrator.js's `module_dispatch` or
   * `llm` engines) to generate recommendations from actual platform metrics
   * is real future work, not something to fake here.
   */
  async getPlatformOptimizations() {
    try {
      // Static best-practice recommendations, NOT AI-generated - see note above.
      const optimizations = [
        {
          category: 'Performance',
          recommendation: 'Enable Redis caching for frequently accessed data',
          impact: 'HIGH',
          effort: 'MEDIUM',
          source: 'static',
        },
        {
          category: 'Security',
          recommendation: 'Implement rate limiting on all public endpoints',
          impact: 'HIGH',
          effort: 'LOW',
          source: 'static',
        },
        {
          category: 'Scalability',
          recommendation: 'Implement horizontal scaling for API services',
          impact: 'HIGH',
          effort: 'HIGH',
          source: 'static',
        },
      ];

      return optimizations;
    } catch (error) {
      console.error('Error getting platform optimizations:', error);
      throw new Error('Failed to get platform optimizations');
    }
  }
}

module.exports = new PlatformCoreService();
