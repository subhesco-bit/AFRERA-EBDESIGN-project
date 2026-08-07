const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5]
});

// HTTP request counter
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Active connections gauge
const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Database query duration
const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

// Cache hit rate
const cacheHitRate = new promClient.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage'
});

// API response time
const apiResponseTime = new promClient.Histogram({
  name: 'api_response_time_seconds',
  help: 'API response time in seconds',
  labelNames: ['endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Error rate
const errorRate = new promClient.Gauge({
  name: 'error_rate',
  help: 'Error rate percentage',
  labelNames: ['type']
});

// Business metrics
const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of active users'
});

const totalOrders = new promClient.Counter({
  name: 'total_orders',
  help: 'Total number of orders',
  labelNames: ['status']
});

const totalRevenue = new promClient.Gauge({
  name: 'total_revenue',
  help: 'Total revenue in INR'
});

const farmerCount = new promClient.Gauge({
  name: 'farmer_count',
  help: 'Total number of farmers'
});

const productCount = new promClient.Gauge({
  name: 'product_count',
  help: 'Total number of products'
});

// Register all metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(dbQueryDuration);
register.registerMetric(cacheHitRate);
register.registerMetric(apiResponseTime);
register.registerMetric(errorRate);
register.registerMetric(activeUsers);
register.registerMetric(totalOrders);
register.registerMetric(totalRevenue);
register.registerMetric(farmerCount);
register.registerMetric(productCount);

// Middleware to track HTTP requests
const trackHttpRequests = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    // Track error rate
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server' : 'client';
      errorRate.inc({ type: errorType });
    }
  });

  next();
};

// Middleware to track active connections
const trackConnections = (req, res, next) => {
  activeConnections.inc();
  
  res.on('finish', () => {
    activeConnections.dec();
  });

  next();
};

// Metrics endpoint
const metricsEndpoint = async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Update business metrics
const updateBusinessMetrics = async (data) => {
  if (data.activeUsers !== undefined) {
    activeUsers.set(data.activeUsers);
  }
  if (data.totalRevenue !== undefined) {
    totalRevenue.set(data.totalRevenue);
  }
  if (data.farmerCount !== undefined) {
    farmerCount.set(data.farmerCount);
  }
  if (data.productCount !== undefined) {
    productCount.set(data.productCount);
  }
  if (data.orderStatus && data.orderCount) {
    totalOrders.inc({ status: data.orderStatus }, data.orderCount);
  }
};

// Track database query
const trackDbQuery = (operation, table, duration) => {
  dbQueryDuration.observe({ operation, table }, duration);
};

// Track cache performance
const updateCacheHitRate = (hitRate) => {
  cacheHitRate.set(hitRate);
};

// Track API response time
const trackApiResponse = (endpoint, duration) => {
  apiResponseTime.observe({ endpoint }, duration);
};

module.exports = {
  register,
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  activeConnections,
  dbQueryDuration,
  cacheHitRate,
  apiResponseTime,
  errorRate,
  activeUsers,
  totalOrders,
  totalRevenue,
  farmerCount,
  productCount,
  trackHttpRequests,
  trackConnections,
  metricsEndpoint,
  updateBusinessMetrics,
  trackDbQuery,
  updateCacheHitRate,
  trackApiResponse
};
