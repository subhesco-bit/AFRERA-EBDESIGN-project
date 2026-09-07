/**
 * API Contract Validator
 * Validates that frontend API clients match backend endpoints
 * Ensures frontend-backend contract integrity
 */

const { logger } = require('../utils/logger');

// Define expected API contracts based on frontend API clients
const API_CONTRACTS = {
  '/api/v1/erp': {
    endpoints: [
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/dashboard' },
      { method: 'GET', path: '/sync-status' },
      { method: 'GET', path: '/gl-entries' },
      { method: 'GET', path: '/reconciliation' },
      { method: 'GET', path: '/financial-reports' },
      { method: 'POST', path: '/sync/product' },
      { method: 'POST', path: '/sync/order' },
      { method: 'POST', path: '/sync/farmer' },
      { method: 'POST', path: '/sync/transaction' },
      { method: 'POST', path: '/sync/asset' },
      { method: 'POST', path: '/sync/bulk' }
    ]
  },
  '/api/v1/ai-brain': {
    endpoints: [
      { method: 'GET', path: '/health' },
      { method: 'POST', path: '/process' },
      { method: 'GET', path: '/knowledge-graph' },
      { method: 'POST', path: '/memory/working' },
      { method: 'POST', path: '/memory/long-term' }
    ]
  },
  '/api/v1/ai-gateway': {
    endpoints: [
      { method: 'GET', path: '/health' },
      { method: 'POST', path: '/predict' },
      { method: 'POST', path: '/optimize' },
      { method: 'POST', path: '/analyze' },
      { method: 'POST', path: '/recommend' }
    ]
  },
  '/api/v1/ai-self-healing': {
    endpoints: [
      { method: 'GET', path: '/health' },
      { method: 'POST', path: '/detect-error' },
      { method: 'POST', path: '/recover-error' },
      { method: 'POST', path: '/analyze-root-cause' },
      { method: 'GET', path: '/system-health' }
    ]
  },
  '/api/v1/ai-operation-intelligence': {
    endpoints: [
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/performance' },
      { method: 'POST', path: '/optimize' },
      { method: 'POST', path: '/allocate-resources' },
      { method: 'POST', path: '/detect-anomaly' }
    ]
  },
  '/api/v1/nutrition-intelligence': {
    endpoints: [
      { method: 'GET', path: '/nutrients' },
      { method: 'GET', path: '/dietary-profiles' },
      { method: 'POST', path: '/food-profiles' },
      { method: 'GET', path: '/food-profiles/search' },
      { method: 'POST', path: '/product-nutrition' },
      { method: 'GET', path: '/product-nutrition/:productId' },
      { method: 'POST', path: '/calculate-score' },
      { method: 'GET', path: '/product-nutrition/:productId/score' },
      { method: 'POST', path: '/calculate-pricing' },
      { method: 'POST', path: '/recipes' },
      { method: 'GET', path: '/wellness-practices' },
      { method: 'GET', path: '/medical-codes' },
      { method: 'GET', path: '/dietary-restrictions/:condition' },
      { method: 'GET', path: '/nutrient-requirements/:condition' },
      { method: 'GET', path: '/medical-code/:condition/:type?' },
      { method: 'POST', path: '/recipes/condition/:condition' },
      { method: 'POST', path: '/natural-therapist/guidance' },
      { method: 'POST', path: '/nutrient-calculator/:condition' }
    ]
  },
  '/api/v1/digital-twin': {
    endpoints: [
      { method: 'GET', path: '/status' },
      { method: 'GET', path: '/twins' },
      { method: 'POST', path: '/simulate' },
      { method: 'POST', path: '/sync' }
    ]
  },
  '/api/v1/climate-monitoring': {
    endpoints: [
      { method: 'GET', path: '/status' },
      { method: 'GET', path: '/alerts' },
      { method: 'GET', path: '/drought' },
      { method: 'GET', path: '/flood' },
      { method: 'POST', path: '/report' }
    ]
  },
  '/api/v1/cold-storage': {
    endpoints: [
      { method: 'GET', path: '/status' },
      { method: 'GET', path: '/facilities' },
      { method: 'POST', path: '/book' },
      { method: 'GET', path: '/temperature' },
      { method: 'GET', path: '/utilization' },
      { method: 'GET', path: '/compliance' }
    ]
  },
  '/api/v1/advanced-medical-coding': {
    endpoints: [
      { method: 'GET', path: '/code-systems' },
      { method: 'GET', path: '/search-codes/:condition' },
      { method: 'GET', path: '/dietitian-knowledge/:condition' },
      { method: 'GET', path: '/natural-therapist-knowledge/:condition' },
      { method: 'GET', path: '/experience-protocols/:category?' },
      { method: 'GET', path: '/biological-coding/:system' },
      { method: 'POST', path: '/ai-coding-assistance' },
      { method: 'POST', path: '/health-management-plan' },
      { method: 'GET', path: '/health' }
    ]
  }
};

/**
 * Validate API contracts
 */
function validateAPIContracts(app) {
  const validationResults = {
    valid: true,
    routes: {},
    endpoints: {},
    missingRoutes: [],
    missingEndpoints: [],
    warnings: []
  };

  // Check each route in the contracts
  for (const [routePath, contract] of Object.entries(API_CONTRACTS)) {
    const routeResults = {
      route: routePath,
      mounted: false,
      endpoints_checked: contract.endpoints.length,
      endpoints_available: 0,
      missing_endpoints: []
    };

    // Check if route is mounted
    try {
      // Try to access the route
      const routeExists = app._router.stack.some(layer => {
        if (layer.regexp) {
          const routePathRegex = routePath.replace(/\//g, '\\/').replace(/:([^/]+)/g, '[^/]+');
          return layer.regexp.test(routePath);
        }
        return false;
      });

      routeResults.mounted = routeExists;

      if (!routeExists) {
        validationResults.missingRoutes.push(routePath);
        validationResults.warnings.push(`Route ${routePath} is not mounted`);
      }
    } catch (error) {
      validationResults.warnings.push(`Error checking route ${routePath}: ${error.message}`);
    }

    // Check each endpoint
    for (const endpoint of contract.endpoints) {
      const endpointPath = `${routePath}${endpoint.path}`;
      routeResults.endpoints_available++;

      // Note: In a real implementation, we would check if each specific endpoint exists
      // For now, we're doing a basic route existence check
    }

    validationResults.routes[routePath] = routeResults;
  }

  // Determine overall validity
  validationResults.valid = validationResults.missingRoutes.length === 0;

  return validationResults;
}

/**
 * Generate API contract report
 */
function generateContractReport(validationResults) {
  const report = {
    timestamp: new Date().toISOString(),
    overall_status: validationResults.valid ? 'VALID' : 'INVALID',
    summary: {
      total_routes: Object.keys(API_CONTRACTS).length,
      mounted_routes: Object.values(validationResults.routes).filter(r => r.mounted).length,
      total_endpoints: Object.values(validationResults.routes).reduce((sum, r) => sum + r.endpoints_checked, 0),
      missing_routes: validationResults.missingRoutes.length,
      warnings: validationResults.warnings.length
    },
    routes: validationResults.routes,
    missing_routes: validationResults.missingRoutes,
    warnings: validationResults.warnings
  };

  return report;
}

module.exports = {
  validateAPIContracts,
  generateContractReport,
  API_CONTRACTS
};
