/**
 * M025: Advanced Analytics Service
 * Provides comprehensive analytics and business intelligence capabilities
 * for the agricultural platform
 */

const db = require('../database/connection');
const logger = require('../utils/logger');

// Whitelisted analytics_data columns a custom report is allowed to select/group/filter by.
// buildCustomQuery/buildWhereClause take metrics/filters/groupBy straight from req.body, so
// anything not on this list must be rejected rather than interpolated into SQL text.
const ANALYTICS_QUERYABLE_COLUMNS = new Set(['id', 'metric_name', 'dimensions', 'value', 'created_at']);

/**
 * Validates a user-supplied time range string (e.g. '30d', '24h') and returns a safe
 * Postgres INTERVAL literal. Rejects anything that doesn't match `<number><unit>` to close
 * the SQL injection vector where timeRange was previously interpolated directly into
 * `NOW() - INTERVAL '${timeRange}'`.
 */
function toSafeInterval(timeRange, fallback = '30 days') {
  const match = /^(\d{1,4})\s*(day|days|d|hour|hours|h|week|weeks|w|month|months|mo|year|years|y)$/i.exec(
    String(timeRange || '').trim()
  );
  if (!match) return fallback;

  const amount = match[1];
  const unitMap = {
    d: 'days', day: 'days', days: 'days',
    h: 'hours', hour: 'hours', hours: 'hours',
    w: 'weeks', week: 'weeks', weeks: 'weeks',
    mo: 'months', month: 'months', months: 'months',
    y: 'years', year: 'years', years: 'years'
  };
  const unit = unitMap[match[2].toLowerCase()];
  return `${amount} ${unit}`;
}

class AdvancedAnalyticsService {
  constructor() {
    this.serviceName = 'AdvancedAnalyticsService';
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Get farmer performance analytics
   */
  async getFarmerPerformanceAnalytics(farmerId, timeRange = '30d') {
    try {
      const cacheKey = `farmer:${farmerId}:performance:${timeRange}`;
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const query = `
        SELECT 
          f.id,
          f.name,
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue,
          COALESCE(AVG(o.total_amount), 0) as avg_order_value,
          COUNT(DISTINCT c.id) as total_crops,
          COALESCE(SUM(c.expected_yield_kg), 0) as total_production
        FROM farmers f
        LEFT JOIN orders o ON f.id = o.farmer_id
          AND o.created_at >= NOW() - INTERVAL '${toSafeInterval(timeRange)}'
        LEFT JOIN crops c ON f.id = c.farmer_id
          AND c.created_at >= NOW() - INTERVAL '${toSafeInterval(timeRange)}'
        WHERE f.id = $1
        GROUP BY f.id
      `;

      const result = await db.query(query, [farmerId]);
      
      const analytics = {
        farmerId,
        timeRange,
        totalOrders: result.rows[0].total_orders,
        totalRevenue: parseFloat(result.rows[0].total_revenue),
        averageOrderValue: parseFloat(result.rows[0].avg_order_value),
        totalCrops: result.rows[0].total_crops,
        totalProduction: parseFloat(result.rows[0].total_production),
        generatedAt: new Date().toISOString()
      };

      this.cache.set(cacheKey, analytics);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

      return { success: true, data: analytics };
    } catch (error) {
      logger.error(`${this.serviceName} - getFarmerPerformanceAnalytics error:`, error);
      return { 
        success: false, 
        error: 'Failed to retrieve farmer performance analytics',
        details: error.message 
      };
    }
  }

  /**
   * Get market trend analytics
   */
  async getMarketTrendAnalytics(cropType, region, timeRange = '90d') {
    try {
      let cacheKey = `market:${cropType}:${region}:trends:${timeRange}`;
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      let query = `
        SELECT 
          DATE_TRUNC('day', o.created_at) as date,
          COUNT(o.id) as daily_orders,
          COALESCE(SUM(o.total_amount), 0) as daily_revenue,
          COALESCE(AVG(o.total_amount), 0) as avg_daily_order
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN crops c ON oi.crop_id = c.id
        WHERE c.crop_type = $1
          AND o.created_at >= NOW() - INTERVAL '${toSafeInterval(timeRange)}'
          AND ($2::text IS NULL OR o.region = $2)
        GROUP BY DATE_TRUNC('day', o.created_at)
        ORDER BY date ASC
      `;

      let result = await db.query(query, [cropType, region]);
      
      let analytics = {
        cropType,
        region,
        timeRange,
        dailyData: result.rows.map(row => ({
          date: row.date,
          orders: row.daily_orders,
          revenue: parseFloat(row.daily_revenue),
          averageOrder: parseFloat(row.avg_daily_order)
        })),
        trends: this.calculateTrends(result.rows),
        generatedAt: new Date().toISOString()
      };

      this.cache.set(cacheKey, analytics);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

      return { success: true, data: analytics };
    } catch (error) {
      logger.error(`${this.serviceName} - getMarketTrendAnalytics error:`, error);
      return { 
        success: false, 
        error: 'Failed to retrieve market trend analytics',
        details: error.message 
      };
    }
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(timeRange = '30d') {
    try {
      let cacheKey = `platform:analytics:${timeRange}`;
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Independent scalar subqueries, not a join — farmers/buyers/orders/crops have no
      // natural join key for a platform-wide summary, and joining them directly produces a
      // Cartesian product (every farmer x every buyer x every order x every crop).
      let query = `
        SELECT
          (SELECT COUNT(DISTINCT id) FROM farmers) as active_farmers,
          (SELECT COUNT(DISTINCT id) FROM buyers) as active_buyers,
          (SELECT COUNT(DISTINCT id) FROM orders WHERE created_at >= NOW() - INTERVAL '${toSafeInterval(timeRange)}') as total_orders,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at >= NOW() - INTERVAL '${toSafeInterval(timeRange)}') as total_revenue,
          (SELECT COUNT(DISTINCT id) FROM crops) as active_crops,
          (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE created_at >= NOW() - INTERVAL '${toSafeInterval(timeRange)}') as avg_order_value
      `;

      let result = await db.query(query);
      
      let analytics = {
        timeRange,
        activeFarmers: result.rows[0].active_farmers,
        activeBuyers: result.rows[0].active_buyers,
        totalOrders: result.rows[0].total_orders,
        totalRevenue: parseFloat(result.rows[0].total_revenue),
        activeCrops: result.rows[0].active_crops,
        averageOrderValue: parseFloat(result.rows[0].avg_order_value),
        generatedAt: new Date().toISOString()
      };

      this.cache.set(cacheKey, analytics);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);

      return { success: true, data: analytics };
    } catch (error) {
      logger.error(`${this.serviceName} - getPlatformAnalytics error:`, error);
      return { 
        success: false, 
        error: 'Failed to retrieve platform analytics',
        details: error.message 
      };
    }
  }

  /**
   * Calculate trends from time series data
   */
  calculateTrends(data) {
    if (data.length < 2) {
      return { trend: 'insufficient_data', growthRate: 0 };
    }

    const values = data.map(d => parseFloat(d.daily_revenue || 0));
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    const growthRate = firstValue > 0 
      ? ((lastValue - firstValue) / firstValue) * 100 
      : 0;

    let trend = 'stable';
    if (growthRate > 5) trend = 'increasing';
    if (growthRate < -5) trend = 'decreasing';

    return { trend, growthRate: parseFloat(growthRate.toFixed(2)) };
  }

  /**
   * Generate custom analytics report
   */
  async generateCustomReport(config) {
    try {
      const { metrics, filters, groupBy, timeRange } = config;
      
      // Build dynamic query based on configuration
      let query = this.buildCustomQuery(metrics, filters, groupBy, timeRange);
      let result = await db.query(query.text, query.values);
      
      return { 
        success: true, 
        data: result.rows,
        metadata: {
          generatedAt: new Date().toISOString(),
          config
        }
      };
    } catch (error) {
      logger.error(`${this.serviceName} - generateCustomReport error:`, error);
      return { 
        success: false, 
        error: 'Failed to generate custom report',
        details: error.message 
      };
    }
  }

  /**
   * Build custom query for analytics
   */
  buildCustomQuery(metrics, filters, groupBy, timeRange) {
    // metrics/filters/groupBy come straight from req.body (POST /reports/custom) - every
    // identifier must be checked against ANALYTICS_QUERYABLE_COLUMNS before it touches SQL
    // text, and every value must be bound as a parameter, not interpolated.
    const safeMetrics = metrics.filter((m) => ANALYTICS_QUERYABLE_COLUMNS.has(m));
    if (safeMetrics.length === 0) {
      throw new Error('No valid metrics requested');
    }
    const selectClause = safeMetrics.join(', ');

    const { clause: whereClause, values } = this.buildWhereClause(filters, timeRange);

    let groupClause = '';
    if (groupBy && ANALYTICS_QUERYABLE_COLUMNS.has(groupBy)) {
      groupClause = `GROUP BY ${groupBy}`;
    }

    return {
      text: `SELECT ${selectClause} FROM analytics_data ${whereClause} ${groupClause}`,
      values
    };
  }

  /**
   * Build a parameterized WHERE clause for filters. Returns { clause, values } - the caller
   * must pass `values` as the query's bound parameters, never interpolate them into `clause`.
   */
  buildWhereClause(filters, timeRange) {
    const conditions = [];
    let values = [];

    if (timeRange) {
      conditions.push(`created_at >= NOW() - INTERVAL '${toSafeInterval(timeRange)}'`);
    }

    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (!ANALYTICS_QUERYABLE_COLUMNS.has(key)) return;
        values.push(value);
        conditions.push(`${key} = $${values.length}`);
      });
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      values
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    return { success: true, message: 'Cache cleared' };
  }
}

module.exports = new AdvancedAnalyticsService();