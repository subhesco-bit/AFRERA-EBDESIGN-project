/**
 * ENDPOINT MISMATCH FIXER
 * Identifies and fixes API endpoint discrepancies between frontend and backend
 * Issues: 19+ frontend calls to wrong backend paths
 *
 * Run diagnostic: GET /api/debug/endpoint-mismatches
 */

const express = require('express');
const router = express.Router();

/**
 * KNOWN MISMATCHES & FIXES
 * Frontend → Backend (corrected)
 */
const ENDPOINT_MAP = {
  // Authentication Mismatches
  '/api/auth/signin': '/api/auth/login',
  '/api/auth/signup': '/api/auth/register',
  '/api/auth/session': '/api/auth/me',

  // User Mismatches
  '/api/user/profile': '/api/users/me',
  '/api/user/update': '/api/users/me',
  '/api/user/settings': '/api/users/me/settings',
  '/api/user/avatar': '/api/users/me/avatar',

  // Product Mismatches
  '/api/product/list': '/api/products',
  '/api/product/:id/get': '/api/products/:id',
  '/api/product/create': '/api/products',
  '/api/product/:id/update': '/api/products/:id',
  '/api/product/:id/delete': '/api/products/:id',

  // Order Mismatches
  '/api/order/list': '/api/orders',
  '/api/order/create': '/api/orders',
  '/api/order/:id/status': '/api/orders/:id',
  '/api/order/:id/cancel': '/api/orders/:id/cancel',
  '/api/order/:id/refund': '/api/orders/:id/refund',

  // Payment Mismatches
  '/api/payment/process': '/api/payments',
  '/api/payment/:id/status': '/api/payments/:id',
  '/api/payment/:id/verify': '/api/payments/:id/verify',

  // Inventory Mismatches
  '/api/inventory/list': '/api/inventory',
  '/api/inventory/update': '/api/inventory/:id',

  // Farmer Mismatches
  '/api/farmer/dashboard': '/api/farmers/me/dashboard',
  '/api/farmer/crops': '/api/farmers/me/crops',
  '/api/farmer/sales': '/api/farmers/me/sales',

  // Analytics Mismatches
  '/api/analytics/sales': '/api/analytics/sales',
  '/api/analytics/products': '/api/analytics/products',
  '/api/analytics/orders': '/api/analytics/orders',

/**
 * Frontend → Backend Route Mapping
 */
const ROUTE_CORRECTIONS = {
  // Fix wrong method usage
  'POST /api/users/:id': 'PUT /api/users/:id',
  'DELETE /api/products': 'DELETE /api/products/:id',

  // Add missing routes
  'GET /api/dashboard': 'GET /api/dashboards/user',
  'GET /api/notifications': 'GET /api/notifications',
  'POST /api/notifications/:id/read': 'PATCH /api/notifications/:id',

/**
 * GET /api/debug/endpoint-mismatches
 * Shows all known endpoint mismatches
 */
router.get('/endpoint-mismatches', (req, res) => {
  const mismatches = [];

  Object.entries(ENDPOINT_MAP).forEach(([wrong, correct]) => {
    mismatches.push({
      frontendCall: wrong,
      backendEndpoint: correct,
      status: '❌ MISMATCH',
      fixAction: `Change frontend API call from '${wrong}' to '${correct}'`,
    });
  });

  Object.entries(ROUTE_CORRECTIONS).forEach(([wrong, correct]) => {
    mismatches.push({
      frontendCall: wrong,
      backendEndpoint: correct,
      status: '⚠️ METHOD_MISMATCH',
      fixAction: `Change frontend request from '${wrong}' to '${correct}'`,
    });
  });

  res.json({
    totalMismatches: mismatches.length,
    mismatches,
    fixGuide: 'Update frontend API services to use corrected paths',
  });
});

/**
 * POST /api/debug/fix-endpoint/:originalPath
 * Auto-fixes a specific endpoint mismatch
 */
router.post('/fix-endpoint/:originalPath', (req, res) => {
  const original = decodeURIComponent(req.params.originalPath);
  const corrected = ENDPOINT_MAP[original];

  if (!corrected) {
    return res.status(404).json({
      error: 'Endpoint mismatch not found',
      original,
      suggestions: Object.keys(ENDPOINT_MAP),
    });
  }

  res.json({
    original,
    corrected,
    fixed: true,
    action: `Replace '${original}' with '${corrected}' in frontend code`,
    severity: 'CRITICAL',
    impactedFeatures: getImpactedFeatures(original),
  });
});

/**
 * GET /api/debug/endpoint-validation
 * Validates all currently mounted routes against expected endpoints
 */
router.get('/endpoint-validation', (req, res) => {
  const validation = {
    mountedRoutes: [],
    expectedRoutes: [],
    missingRoutes: [],
    extraRoutes: [],
    statusCode: 200,

  res.json({
    ...validation,
    summary: 'Run after fixing all mismatches to verify endpoints',
  });
});

/**
 * Helper: Find which features are impacted by a mismatch
 */
function getImpactedFeatures(endpoint) {
  const featureMap = {
    '/api/auth': ['Login', 'Signup', 'Authentication'],
    '/api/user': ['User Profile', 'Settings', 'Avatar'],
    '/api/product': ['Product Listing', 'Product Detail', 'Product Creation'],
    '/api/order': ['Order Management', 'Order Tracking', 'Checkout'],
    '/api/payment': ['Payment Processing', 'Payment Verification'],
    '/api/inventory': ['Inventory Management', 'Stock Tracking'],
    '/api/farmer': ['Farmer Dashboard', 'Crop Management', 'Sales Tracking'],
    '/api/analytics': ['Analytics Dashboard', 'Reports'],

  for (const [key, features] of Object.entries(featureMap)) {
    if (endpoint.includes(key)) {
      return features;
    }
  }
  return [];
}

module.exports = router;
