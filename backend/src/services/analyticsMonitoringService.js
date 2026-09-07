/**
 * Analytics and Monitoring Service
 * 
 * Provides comprehensive analytics, monitoring, and observability
 * for production-ready system health and performance tracking
 */

const { logger } = require('../utils/logger');
const pool = require('../database/pool');

class AnalyticsMonitoringService {
  constructor() {
    this.metrics = {
      requests: { total: 0, success: 0, error: 0 },
      responseTime: [],
      errors: [],
      activeUsers: new Set(),
      systemHealth: {}
    };
    this.startTime = Date.now();
  }

  async initialize() {
    try {
      // Create analytics tables if they don't exist
      await this.createAnalyticsTables();
      
      logger.info('Analytics monitoring service initialized');
      
      // Start periodic metrics collection
      this.startMetricsCollection();
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize analytics monitoring', { error: error.message });
      return false;
    }
  }

  async createAnalyticsTables() {
    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        user_id INTEGER,
        session_id VARCHAR(255),
        properties JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        response_time INTEGER NOT NULL,
        status_code INTEGER NOT NULL,
        user_id INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_health (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        response_time INTEGER,
        error_message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON performance_metrics(endpoint);
      CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name);
      CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON system_health(timestamp);
    `;

    await pool.query(createTablesQuery);
  }

  trackEvent(eventType, properties = {}, userId = null, sessionId = null) {
    try {
      // Store in memory for real-time analytics
      this.metrics.requests.total++;
      
      // Store in database for historical analysis
      const query = `
        INSERT INTO analytics_events (event_type, user_id, session_id, properties)
        VALUES ($1, $2, $3, $4)
      `;
      
      pool.query(query, [eventType, userId, sessionId, JSON.stringify(properties)])
        .catch(error => logger.error('Failed to store analytics event', { error: error.message }));
      
      logger.debug('Event tracked', { eventType, userId });
    } catch (error) {
      logger.error('Failed to track event', { error: error.message });
    }
  }

  trackPerformance(endpoint, responseTime, statusCode, userId = null) {
    try {
      // Store in memory
      this.metrics.responseTime.push({
        endpoint,
        responseTime,
        statusCode,
        timestamp: Date.now()
      });

      // Keep only last 1000 response times in memory
      if (this.metrics.responseTime.length > 1000) {
        this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
      }

      // Update success/error counters
      if (statusCode >= 200 && statusCode < 400) {
        this.metrics.requests.success++;
      } else {
        this.metrics.requests.error++;
      }

      // Store in database
      const query = `
        INSERT INTO performance_metrics (endpoint, response_time, status_code, user_id)
        VALUES ($1, $2, $3, $4)
      `;
      
      pool.query(query, [endpoint, responseTime, statusCode, userId])
        .catch(error => logger.error('Failed to store performance metric', { error: error.message }));
    } catch (error) {
      logger.error('Failed to track performance', { error: error.message });
    }
  }

  trackError(error, context = {}) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now()
      };

      this.metrics.errors.push(errorData);

      // Keep only last 100 errors in memory
      if (this.metrics.errors.length > 100) {
        this.metrics.errors = this.metrics.errors.slice(-100);
      }

      logger.error('Error tracked', { error: error.message, context });
    } catch (error) {
      logger.error('Failed to track error', { error: error.message });
    }
  }

  trackActiveUser(userId, sessionId) {
    this.metrics.activeUsers.add(sessionId);
  }

  removeActiveUser(sessionId) {
    this.metrics.activeUsers.delete(sessionId);
  }

  async getRealtimeMetrics() {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Calculate average response time
    const recentResponseTimes = this.metrics.responseTime.slice(-100);
    const avgResponseTime = recentResponseTimes.length > 0
      ? Math.round(recentResponseTimes.reduce((sum, m) => sum + m.responseTime, 0) / recentResponseTimes.length)
      : 0;

    // Calculate error rate
    const totalRequests = this.metrics.requests.total || 1;
    const errorRate = (this.metrics.requests.error / totalRequests) * 100;

    return {
      uptime: Math.floor(uptime / 1000),
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        error: this.metrics.requests.error,
        errorRate: errorRate.toFixed(2)
      },
      performance: {
        avgResponseTime,
        p95ResponseTime: this.calculatePercentile(recentResponseTimes, 95),
        p99ResponseTime: this.calculatePercentile(recentResponseTimes, 99)
      },
      users: {
        active: this.metrics.activeUsers.size
      },
      system: this.metrics.systemHealth
    };
  }

  calculatePercentile(metrics, percentile) {
    if (metrics.length === 0) return 0;
    
    const sorted = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  async getHistoricalAnalytics(timeRange = '24h') {
    try {
      const timeRangeMap = {
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days'
      };

      const timeCondition = timeRangeMap[timeRange] || '24 hours';

      // Get event analytics
      const eventsQuery = `
        SELECT 
          event_type,
          COUNT(*) as count,
          DATE_TRUNC('hour', timestamp) as hour
        FROM analytics_events
        WHERE timestamp >= NOW() - INTERVAL '${timeCondition}'
        GROUP BY event_type, DATE_TRUNC('hour', timestamp)
        ORDER BY hour DESC
      `;

      // Get performance analytics
      const performanceQuery = `
        SELECT 
          endpoint,
          AVG(response_time) as avg_response_time,
          COUNT(*) as request_count,
          AVG(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100 as error_rate
        FROM performance_metrics
        WHERE timestamp >= NOW() - INTERVAL '${timeCondition}'
        GROUP BY endpoint
        ORDER BY avg_response_time DESC
      `;

      // Get system health
      const healthQuery = `
        SELECT 
          service_name,
          status,
          AVG(response_time) as avg_response_time,
          COUNT(*) as check_count,
          AVG(CASE WHEN status = 'unhealthy' THEN 1 ELSE 0 END) * 100 as failure_rate
        FROM system_health
        WHERE timestamp >= NOW() - INTERVAL '${timeCondition}'
        GROUP BY service_name, status
        ORDER BY service_name
      `;

      const [eventsResult, performanceResult, healthResult] = await Promise.all([
        pool.query(eventsQuery),
        pool.query(performanceQuery),
        pool.query(healthQuery)
      ]);

      return {
        events: eventsResult.rows,
        performance: performanceResult.rows,
        systemHealth: healthResult.rows,
        timeRange
      };
    } catch (error) {
      logger.error('Failed to get historical analytics', { error: error.message });
      throw error;
    }
  }

  async getDashboardData() {
    try {
      const [realtimeMetrics, historicalAnalytics] = await Promise.all([
        this.getRealtimeMetrics(),
        this.getHistoricalAnalytics('24h')
      ]);

      return {
        realtime: realtimeMetrics,
        historical: historicalAnalytics,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get dashboard data', { error: error.message });
      throw error;
    }
  }

  startMetricsCollection() {
    // Collect system health metrics every 5 minutes
    setInterval(async () => {
      try {
        await this.collectSystemHealth();
      } catch (error) {
        logger.error('Failed to collect system health', { error: error.message });
      }
    }, 5 * 60 * 1000);

    // Clean up old analytics data daily
    setInterval(async () => {
      try {
        await this.cleanupOldData();
      } catch (error) {
        logger.error('Failed to cleanup old data', { error: error.message });
      }
    }, 24 * 60 * 60 * 1000);
  }

  async collectSystemHealth() {
    const services = [
      'database',
      'redis',
      'auth',
      'ai',
      'logistics',
      'financial'
    ];

    for (const service of services) {
      try {
        const startTime = Date.now();
        
        // Check service health (this would be expanded based on actual service health checks)
        const isHealthy = await this.checkServiceHealth(service);
        const responseTime = Date.now() - startTime;

        const query = `
          INSERT INTO system_health (service_name, status, response_time)
          VALUES ($1, $2, $3)
        `;
        
        await pool.query(query, [service, isHealthy ? 'healthy' : 'unhealthy', responseTime]);

        this.metrics.systemHealth[service] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        logger.error(`Failed to check ${service} health`, { error: error.message });
      }
    }
  }

  async checkServiceHealth(service) {
    // This would be expanded with actual health checks for each service
    // For now, return true as a placeholder
    return true;
  }

  async cleanupOldData() {
    try {
      // Delete analytics data older than 90 days
      const cleanupQuery = `
        DELETE FROM analytics_events 
        WHERE timestamp < NOW() - INTERVAL '90 days';
        
        DELETE FROM performance_metrics 
        WHERE timestamp < NOW() - INTERVAL '90 days';
        
        DELETE FROM system_health 
        WHERE timestamp < NOW() - INTERVAL '90 days';
      `;

      await pool.query(cleanupQuery);
      logger.info('Old analytics data cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup old data', { error: error.message });
    }
  }

  setupRoutes(app) {
    // Get realtime metrics
    app.get('/api/v1/analytics/realtime', async (req, res) => {
      try {
        const metrics = await this.getRealtimeMetrics();
        res.json({ success: true, data: metrics });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get historical analytics
    app.get('/api/v1/analytics/historical', async (req, res) => {
      try {
        const { timeRange = '24h' } = req.query;
        const analytics = await this.getHistoricalAnalytics(timeRange);
        res.json({ success: true, data: analytics });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get dashboard data
    app.get('/api/v1/analytics/dashboard', async (req, res) => {
      try {
        const dashboardData = await this.getDashboardData();
        res.json({ success: true, data: dashboardData });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Track event endpoint
    app.post('/api/v1/analytics/events', async (req, res) => {
      try {
        const { eventType, properties, userId, sessionId } = req.body;
        this.trackEvent(eventType, properties, userId, sessionId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }
}

// Export singleton instance
const analyticsMonitoringService = new AnalyticsMonitoringService();

module.exports = analyticsMonitoringService;
