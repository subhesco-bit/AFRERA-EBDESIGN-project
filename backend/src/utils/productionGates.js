/**
 * Production Gates - Comprehensive validation before deployment
 * Ensures backend, database, E2E, and production readiness
 */

import axios from 'axios';

class ProductionGates {
  constructor(config = {}) {
    this.backendUrl = config.backendUrl || 'http://localhost:3001';
    this.databaseUrl = config.databaseUrl || process.env.DATABASE_URL;
    this.timeout = config.timeout || 30000;
    this.results = {};
  }

  /**
   * Run all production gates
   */
  async runAllGates() {
    console.log('🚀 Starting Production Gate Validation...\n');

    const allResults = {
      timestamp: new Date().toISOString(),
      gates: {},
      summary: {},
    };

    // 1. Backend Health Gates
    console.log('1️⃣  Checking Backend Health...');
    allResults.gates.backend = await this.checkBackendHealth();

    // 2. Database Connection Gates
    console.log('2️⃣  Checking Database Connection...');
    allResults.gates.database = await this.checkDatabaseHealth();

    // 3. API Endpoints Gates
    console.log('3️⃣  Checking API Endpoints...');
    allResults.gates.apiEndpoints = await this.checkApiEndpoints();

    // 4. E2E Readiness Gates
    console.log('4️⃣  Checking E2E Readiness...');
    allResults.gates.e2eReadiness = await this.checkE2EReadiness();

    // 5. Security Gates
    console.log('5️⃣  Checking Security...');
    allResults.gates.security = await this.checkSecurity();

    // 6. Performance Gates
    console.log('6️⃣  Checking Performance...');
    allResults.gates.performance = await this.checkPerformance();

    // 7. Environment Gates
    console.log('7️⃣  Checking Environment...');
    allResults.gates.environment = await this.checkEnvironment();

    // Calculate summary
    allResults.summary = this.calculateSummary(allResults.gates);

    console.log('\n📊 Production Gate Summary:');
    console.log(JSON.stringify(allResults.summary, null, 2));

    return allResults;
  }

  /**
   * Check backend health
   */
  async checkBackendHealth() {
    const checks = {
      backendRunning: false,
      healthEndpoint: false,
      readinessEndpoint: false,
      livenessEndpoint: false,
      responseTime: 0,
      errors: [],
    };

    try {
      const startTime = Date.now();

      // Check /health endpoint
      try {
        const healthRes = await this.makeRequest(`${this.backendUrl}/health`, 5000);
        checks.healthEndpoint = healthRes.status === 200;
      } catch (error) {
        checks.errors.push(`Health endpoint failed: ${error.message}`);
      }

      // Check /health/ready endpoint
      try {
        const readyRes = await this.makeRequest(`${this.backendUrl}/health/ready`, 5000);
        checks.readinessEndpoint = readyRes.status === 200;
      } catch (error) {
        checks.errors.push(`Readiness endpoint failed: ${error.message}`);
      }

      // Check /health/live endpoint
      try {
        const liveRes = await this.makeRequest(`${this.backendUrl}/health/live`, 5000);
        checks.livenessEndpoint = liveRes.status === 200;
      } catch (error) {
        checks.errors.push(`Liveness endpoint failed: ${error.message}`);
      }

      checks.responseTime = Date.now() - startTime;
      checks.backendRunning = checks.healthEndpoint && checks.readinessEndpoint;

      checks.passed = checks.backendRunning && checks.responseTime < 5000;
    } catch (error) {
      checks.passed = false;
      checks.errors.push(`Backend health check failed: ${error.message}`);
    }

    return checks;
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    let checks = {
      connectionEstablished: false,
      canRead: false,
      canWrite: false,
      canExecuteTransactions: false,
      connectionPoolHealth: false,
      errors: [],
    };

    try {
      // Attempt database connection
      // This would use your actual DB client
      // Example with PostgreSQL:

      const pg = require('pg');
      const client = new pg.Client({
        connectionString: this.databaseUrl,
        connectionTimeoutMillis: 5000,
      });

      try {
        await client.connect();
        checks.connectionEstablished = true;

        // Test read operation
        try {
          const result = await client.query('SELECT 1');
          checks.canRead = result.rows.length > 0;
        } catch (error) {
          checks.errors.push(`Read test failed: ${error.message}`);
        }

        // Test write operation
        try {
          await client.query('BEGIN');
          await client.query("INSERT INTO _healthcheck (id) VALUES (gen_random_uuid())");
          await client.query('ROLLBACK');
          checks.canWrite = true;
        } catch (error) {
          checks.errors.push(`Write test failed: ${error.message}`);
        }

        // Test transactions
        try {
          await client.query('BEGIN');
          await client.query('SELECT 1');
          await client.query('COMMIT');
          checks.canExecuteTransactions = true;
        } catch (error) {
          checks.errors.push(`Transaction test failed: ${error.message}`);
        }

        // Check connection pool
        checks.connectionPoolHealth = !client._connecting;
      } finally {
        await client.end();
      }

      checks.passed =
        checks.connectionEstablished && checks.canRead && checks.canWrite && checks.canExecuteTransactions;
    } catch (error) {
      checks.passed = false;
      checks.errors.push(`Database health check failed: ${error.message}`);
    }

    return checks;
  }

  /**
   * Check critical API endpoints
   */
  async checkApiEndpoints() {
    const criticalEndpoints = [
      { method: 'GET', path: '/api/health', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/pricing/current/1', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/training/programs', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/schemes', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/greenhouse', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/claims', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/subsidy', expectedStatus: 200 },
      { method: 'GET', path: '/api/v1/soil-testing', expectedStatus: 200 },
    ];

    const results = {
      total: criticalEndpoints.length,
      passed: 0,
      failed: 0,
      endpoints: [],
      errors: [],
    };

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await this.makeRequest(
          `${this.backendUrl}${endpoint.path}`,
          5000,
          endpoint.method
        );

        const success = response.status === endpoint.expectedStatus;

        results.endpoints.push({
          path: endpoint.path,
          method: endpoint.method,
          status: response.status,
          success,
          responseTime: response.duration,
        });

        if (success) {
          results.passed++;
        } else {
          results.failed++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${endpoint.method} ${endpoint.path}: ${error.message}`);
        results.endpoints.push({
          path: endpoint.path,
          method: endpoint.method,
          success: false,
          error: error.message,
        });
      }
    }

    results.passed = results.passed === results.total;
    return results;
  }

  /**
   * Check E2E readiness
   */
  async checkE2EReadiness() {
    let checks = {
      testFrameworkReady: true,
      testDataSeeded: false,
      testEnvironmentConfigured: false,
      apiMocksReady: false,
      errors: [],
    };

    try {
      // Check if test framework is available
      try {
        require('jest');
        checks.testFrameworkReady = true;
      } catch {
        checks.errors.push('Jest test framework not available');
        checks.testFrameworkReady = false;
      }

      // Check test data
      try {
        const testDataRes = await this.makeRequest(
          `${this.backendUrl}/api/test/seed-status`,
          5000
        );
        checks.testDataSeeded = testDataRes.status === 200 && testDataRes.data?.seeded;
      } catch {
        checks.errors.push('Cannot verify test data seeding');
      }

      // Check environment
      const requiredEnvVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'REDIS_URL',
        'JWT_SECRET',
      ];

      checks.testEnvironmentConfigured = requiredEnvVars.every(
        env => process.env[env]
      );

      if (!checks.testEnvironmentConfigured) {
        checks.errors.push(
          `Missing environment variables: ${requiredEnvVars.filter(e => !process.env[e]).join(', ')}`
        );
      }

      checks.apiMocksReady = true; // Assuming mocks are always ready

      checks.passed =
        checks.testFrameworkReady &&
        checks.testDataSeeded &&
        checks.testEnvironmentConfigured;
    } catch (error) {
      checks.passed = false;
      checks.errors.push(`E2E readiness check failed: ${error.message}`);
    }

    return checks;
  }

  /**
   * Check security requirements
   */
  async checkSecurity() {
    let checks = {
      httpsRedirect: false,
      corsConfigured: false,
      helmHeadersPresent: false,
      jwtValidation: false,
      rateLimitingEnabled: false,
      errors: [],
    };

    try {
      let response = await this.makeRequest(`${this.backendUrl}/health`, 5000);

      // Check for security headers
      const headers = response.headers || {};
      checks.helmHeadersPresent = !!(
        headers['x-content-type-options'] ||
        headers['x-frame-options'] ||
        headers['content-security-policy']
      );

      if (!checks.helmHeadersPresent) {
        checks.errors.push('Missing security headers (Helmet configuration)');
      }

      // Check CORS
      checks.corsConfigured = !!headers['access-control-allow-origin'];
      if (!checks.corsConfigured) {
        checks.errors.push('CORS not properly configured');
      }

      checks.passed = checks.helmHeadersPresent && checks.corsConfigured;
    } catch (error) {
      checks.passed = false;
      checks.errors.push(`Security check failed: ${error.message}`);
    }

    return checks;
  }

  /**
   * Check performance requirements
   */
  async checkPerformance() {
    let checks = {
      avgResponseTime: 0,
      maxResponseTime: 0,
      responsesUnder500ms: 0,
      responsesUnder1000ms: 0,
      errors: [],
    };

    const sampleEndpoints = [
      '/health',
      '/api/v1/pricing/current/1',
      '/api/v1/training/programs',
    ];

    const responseTimes = [];

    for (const endpoint of sampleEndpoints) {
      try {
        let startTime = Date.now();
        await this.makeRequest(`${this.backendUrl}${endpoint}`, 5000);
        const duration = Date.now() - startTime;

        responseTimes.push(duration);

        if (duration < 500) checks.responsesUnder500ms++;
        if (duration < 1000) checks.responsesUnder1000ms++;
      } catch (error) {
        checks.errors.push(`Performance check failed for ${endpoint}: ${error.message}`);
      }
    }

    if (responseTimes.length > 0) {
      checks.avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      checks.maxResponseTime = Math.max(...responseTimes);
    }

    checks.passed = checks.avgResponseTime < 1000 && checks.responsesUnder1000ms === sampleEndpoints.length;
    return checks;
  }

  /**
   * Check environment configuration
   */
  async checkEnvironment() {
    let checks = {
      nodeVersionValid: true,
      envFilePresent: false,
      requiredEnvVars: {},
      errors: [],
    };

    const requiredVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'API_PORT',
    ];

    for (const envVar of requiredVars) {
      checks.requiredEnvVars[envVar] = !!process.env[envVar];
      if (!process.env[envVar]) {
        checks.errors.push(`Missing required environment variable: ${envVar}`);
      }
    }

    checks.passed = Object.values(checks.requiredEnvVars).every(v => v);

    return checks;
  }

  /**
   * Make HTTP request with timeout
   */
  async makeRequest(url, timeout = 5000, method = 'GET') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let startTime = Date.now();

    try {
      let response = await axios({
        method,
        url,
        signal: controller.signal,
        validateStatus: () => true,
      });

      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
        duration: Date.now() - startTime,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Calculate overall summary
   */
  calculateSummary(gates) {
    const summary = {
      totalGates: Object.keys(gates).length,
      passedGates: 0,
      failedGates: 0,
      status: 'FAILED',
      readyForProduction: false,
      details: {},
    };

    for (const [gateName, gateResult] of Object.entries(gates)) {
      const passed = gateResult.passed || false;
      summary.details[gateName] = passed ? '✅ PASSED' : '❌ FAILED';

      if (passed) {
        summary.passedGates++;
      } else {
        summary.failedGates++;
      }
    }

    summary.status =
      summary.failedGates === 0 ? 'ALL_GATES_PASSED' : `${summary.failedGates} GATES FAILED`;
    summary.readyForProduction = summary.failedGates === 0;

    return summary;
  }
}

export default ProductionGates;
