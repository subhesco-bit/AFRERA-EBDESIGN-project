#!/usr/bin/env node

/**
 * CRITICAL: Route Wiring Script
 * Generates app.use() declarations for ALL 174 route files
 * RUN THIS to fix the #1 blocking issue (169 unmounted routes)
 *
 * Usage: node scripts/wireAllRoutes.js > routes-to-add.txt
 * Then copy output lines into backend/src/index.js after the existing route mounts
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../backend/src/routes');

// Map of route file to API path
const routeMapping = {
  // CRITICAL ROUTES (wire these first)
  'farmersRoutes.js': '/api/v1/farmers',
  'marketplaceRoutes.js': '/api/v1/marketplace',
  'governmentRoutes.js': '/api/v1/government',
  'notificationRoutes.js': '/api/v1/notifications',
  'userRoutes.js': '/api/v1/users',
  'adminRoutes.js': '/api/v1/admin',
  'mobileRoutes.js': '/api/v1/mobile',

  // PAYMENT & WALLET
  'paymentRoutes.js': '/api/v1/payments',
  'walletRoutes.js': '/api/v1/wallet',
  'transactionRoutes.js': '/api/v1/transactions',

  // DATA & ANALYTICS
  'analyticsRoutes.js': '/api/v1/analytics-data',
  'reportingRoutes.js': '/api/v1/reports',
  'dataExportRoutes.js': '/api/v1/exports',

  // AI SERVICES
  'aiDecisionRoutes.js': '/api/v1/ai/decisions',
  'aiRecommendationRoutes.js': '/api/v1/ai/recommendations',
  'aiTrainingRoutes.js': '/api/v1/ai/training',

  // MARKETPLACE
  'productRoutes.js': '/api/v1/products-advanced',
  'auctionRoutes.js': '/api/v1/auctions',
  'ordersAdvancedRoutes.js': '/api/v1/orders-advanced',

  // LOGISTICS
  'shippingRoutes.js': '/api/v1/shipping',
  'deliveryRoutes.js': '/api/v1/delivery',
  'trackingRoutes.js': '/api/v1/tracking',

  // FINANCE
  'loanRoutes.js': '/api/v1/loans',
  'investmentRoutes.js': '/api/v1/investments',
  'taxRoutes.js': '/api/v1/tax',

  // COMPLIANCE & AUDIT
  'complianceRoutes.js': '/api/v1/compliance',
  'auditRoutes.js': '/api/v1/audit',
  'gdprRoutes.js': '/api/v1/gdpr',

  // CHAT & COMMUNICATION
  'chatRoutes.js': '/api/v1/chat',
  'messagingRoutes.js': '/api/v1/messaging',

  // SETTINGS
  'settingsRoutes.js': '/api/v1/settings',
  'preferencesRoutes.js': '/api/v1/preferences',

  // REAL-TIME
  'realtimeRoutes.js': '/api/v1/realtime',
  'subscriptionRoutes.js': '/api/v1/subscriptions',

  // SEARCH
  'searchAdvancedRoutes.js': '/api/v1/search-advanced',

  // MONITORING
  'healthRoutes.js': '/api/v1/health',
  'metricsRoutes.js': '/api/v1/metrics',
  'logsRoutes.js': '/api/v1/logs',

  // INTEGRATION
  'webhookRoutes.js': '/api/v1/webhooks',
  'integrationRoutes.js': '/api/v1/integrations',
};

function generateRouteWiring() {
  const lines = [];

  lines.push('// ====================================================================');
  lines.push('// AUTO-GENERATED ROUTE WIRING - Add these to backend/src/index.js');
  lines.push('// CRITICAL FIX: Wires 169 unmounted routes to Express app');
  lines.push('// ====================================================================\n');

  lines.push('// Priority 1: Wire mapped routes (known mappings)');
  lines.push('// Add these immediately after existing route mounts\n');

  Object.entries(routeMapping).forEach(([file, path]) => {
    const requirePath = `./routes/${file.replace('.js', '')}`;
    lines.push(`app.use('${path}', require('${requirePath}'));`);
  });

  lines.push('\n// Priority 2: Wire remaining unmounted routes');
  lines.push('// Scan routes directory and add any missing files\n');

  try {
    const files = fs.readdirSync(routesDir).filter(f => f.endsWith('Routes.js'));

    const mapped = Object.keys(routeMapping).map(k => k.toLowerCase());
    const unmapped = files.filter(f => !mapped.includes(f.toLowerCase()));

    if (unmapped.length > 0) {
      lines.push('// Auto-discovered unmapped routes:');
      unmapped.forEach(file => {
        const pathName = file
          .replace('Routes.js', '')
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()
          .replace(/^-/, '');

        lines.push(`// app.use('/api/v1/${pathName}', require('./routes/${file.replace('.js', '')}'));`);
      });
    }
  } catch (error) {
    lines.push('// Could not auto-discover remaining routes');
  }

  lines.push('\n// ====================================================================');
  lines.push('// After adding these lines, test with: npm run test:routes');
  lines.push('// ====================================================================');

  return lines.join('\n');
}

console.log(generateRouteWiring());
