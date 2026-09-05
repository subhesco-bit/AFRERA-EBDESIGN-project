const NodeCache = require('node-cache');
const { performance } = require('perf_hooks');

// Performance cache
const performanceCache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

// Performance metrics storage
const performanceMetrics = {
  responseTimes: [],
  dbQueryTimes: [],
  cacheHitRates: [],
  errorRates: []
};

// Performance tracking middleware
const trackPerformance = (req, res, next) => {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    
    // Store response time
    performanceMetrics.responseTimes.push({
      endpoint: req.path,
      method: req.method,
      duration,
      timestamp: new Date()
    });

    // Keep only last 1000 entries
    if (performanceMetrics.responseTimes.length > 1000) {
      performanceMetrics.responseTimes.shift();
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
  });

  next();
};

// Database query tracking
const trackDbQuery = (operation, table, duration) => {
  performanceMetrics.dbQueryTimes.push({
    operation,
    table,
    duration,
    timestamp: new Date()
  });

  if (performanceMetrics.dbQueryTimes.length > 1000) {
    performanceMetrics.dbQueryTimes.shift();
  }
};

// Cache performance tracking
const trackCachePerformance = (hits, misses) => {
  const total = hits + misses;
  const hitRate = total > 0 ? (hits / total) * 100 : 0;
  
  performanceMetrics.cacheHitRates.push({
    hitRate,
    hits,
    misses,
    timestamp: new Date()
  });

  if (performanceMetrics.cacheHitRates.length > 1000) {
    performanceMetrics.cacheHitRates.shift();
  }
};

// Error rate tracking
const trackErrorRate = (errors, total) => {
  const errorRate = total > 0 ? (errors / total) * 100 : 0;
  
  performanceMetrics.errorRates.push({
    errorRate,
    errors,
    total,
    timestamp: new Date()
  });

  if (performanceMetrics.errorRates.length > 1000) {
    performanceMetrics.errorRates.shift();
  }
};

// Calculate average response time
const getAverageResponseTime = (endpoint = null) => {
  const relevantTimes = endpoint 
    ? performanceMetrics.responseTimes.filter(m => m.endpoint === endpoint)
    : performanceMetrics.responseTimes;

  if (relevantTimes.length === 0) return 0;

  let total = relevantTimes.reduce((sum, m) => sum + m.duration, 0);
  return total / relevantTimes.length;
};

// Get percentile response time
const getPercentileResponseTime = (percentile = 95, endpoint = null) => {
  let relevantTimes = endpoint
    ? performanceMetrics.responseTimes.filter(m => m.endpoint === endpoint)
    : performanceMetrics.responseTimes;

  if (relevantTimes.length === 0) return 0;

  const sorted = relevantTimes.map(m => m.duration).sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
};

// Get slowest endpoints
const getSlowestEndpoints = (limit = 10) => {
  const endpointAverages = {};
  
  performanceMetrics.responseTimes.forEach(m => {
    if (!endpointAverages[m.endpoint]) {
      endpointAverages[m.endpoint] = {
        total: 0,
        count: 0
      };
    }
    endpointAverages[m.endpoint].total += m.duration;
    endpointAverages[m.endpoint].count += 1;
  });

  return Object.entries(endpointAverages)
    .map(([endpoint, data]) => ({
      endpoint,
      average: data.total / data.count,
      count: data.count
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, limit);
};

// Get database query performance
const getDbQueryPerformance = () => {
  const queryAverages = {};
  
  performanceMetrics.dbQueryTimes.forEach(m => {
    const key = `${m.operation}_${m.table}`;
    if (!queryAverages[key]) {
      queryAverages[key] = {
        total: 0,
        count: 0,
        operation: m.operation,
        table: m.table
      };
    }
    queryAverages[key].total += m.duration;
    queryAverages[key].count += 1;
  });

  return Object.values(queryAverages).map(data => ({
    operation: data.operation,
    table: data.table,
    average: data.total / data.count,
    count: data.count
  }));
};

// Get cache performance
const getCachePerformance = () => {
  if (performanceMetrics.cacheHitRates.length === 0) {
    return {
      averageHitRate: 0,
      totalHits: 0,
      totalMisses: 0
    };
  }

  const recent = performanceMetrics.cacheHitRates.slice(-100);
  const totalHits = recent.reduce((sum, m) => sum + m.hits, 0);
  const totalMisses = recent.reduce((sum, m) => sum + m.misses, 0);
  const averageHitRate = recent.reduce((sum, m) => sum + m.hitRate, 0) / recent.length;

  return {
    averageHitRate,
    totalHits,
    totalMisses
  };
};

// Get error rate
const getErrorRate = () => {
  if (performanceMetrics.errorRates.length === 0) {
    return 0;
  }

  let recent = performanceMetrics.errorRates.slice(-10);
  return recent.reduce((sum, m) => sum + m.errorRate, 0) / recent.length;
};

// Performance optimization recommendations
const getOptimizationRecommendations = () => {
  const recommendations = [];

  // Check response times
  const avgResponseTime = getAverageResponseTime();
  if (avgResponseTime > 500) {
    recommendations.push({
      type: 'response_time',
      severity: 'high',
      message: 'Average response time is high',
      value: avgResponseTime,
      recommendation: 'Consider implementing caching, database optimization, or CDN'
    });
  }

  // Check cache hit rate
  const cachePerf = getCachePerformance();
  if (cachePerf.averageHitRate < 70) {
    recommendations.push({
      type: 'cache',
      severity: 'medium',
      message: 'Cache hit rate is low',
      value: cachePerf.averageHitRate,
      recommendation: 'Consider increasing cache size or adjusting cache TTL'
    });
  }

  // Check error rate
  let errorRate = getErrorRate();
  if (errorRate > 1) {
    recommendations.push({
      type: 'error_rate',
      severity: 'high',
      message: 'Error rate is elevated',
      value: errorRate,
      recommendation: 'Review error logs and implement better error handling'
    });
  }

  // Check slow endpoints
  const slowEndpoints = getSlowestEndpoints(5);
  slowEndpoints.forEach(endpoint => {
    if (endpoint.average > 1000) {
      recommendations.push({
        type: 'endpoint',
        severity: 'medium',
        message: `Endpoint ${endpoint.endpoint} is slow`,
        value: endpoint.average,
        recommendation: 'Consider optimizing database queries or implementing caching'
      });
    }
  });

  return recommendations;
};

// Performance summary
const getPerformanceSummary = () => {
  return {
    responseTime: {
      average: getAverageResponseTime(),
      p50: getPercentileResponseTime(50),
      p95: getPercentileResponseTime(95),
      p99: getPercentileResponseTime(99)
    },
    cache: getCachePerformance(),
    errorRate: getErrorRate(),
    slowEndpoints: getSlowestEndpoints(5),
    dbQueries: getDbQueryPerformance().slice(0, 10),
    recommendations: getOptimizationRecommendations()
  };
};

// Clear old metrics
const clearOldMetrics = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  performanceMetrics.responseTimes = performanceMetrics.responseTimes.filter(
    m => new Date(m.timestamp) > oneHourAgo
  );
  performanceMetrics.dbQueryTimes = performanceMetrics.dbQueryTimes.filter(
    m => new Date(m.timestamp) > oneHourAgo
  );
  performanceMetrics.cacheHitRates = performanceMetrics.cacheHitRates.filter(
    m => new Date(m.timestamp) > oneHourAgo
  );
  performanceMetrics.errorRates = performanceMetrics.errorRates.filter(
    m => new Date(m.timestamp) > oneHourAgo
  );
};

// Clear old metrics every hour
setInterval(clearOldMetrics, 60 * 60 * 1000);

module.exports = {
  trackPerformance,
  trackDbQuery,
  trackCachePerformance,
  trackErrorRate,
  getAverageResponseTime,
  getPercentileResponseTime,
  getSlowestEndpoints,
  getDbQueryPerformance,
  getCachePerformance,
  getErrorRate,
  getOptimizationRecommendations,
  getPerformanceSummary,
  clearOldMetrics
};
