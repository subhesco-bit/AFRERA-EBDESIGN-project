/**
 * ORPHANED SERVICES - IMMEDIATE MOUNT FIX
 * This adds all orphaned services to the Express app
 * Add this code to backend/src/index.js around line 800 (after all other routes)
 */

// ============================================================================
// MOUNT ORPHANED SERVICES (Services with setupRoutes() that were never called)
// ============================================================================

logger.info('🔌 Mounting previously-orphaned services...');

// 1. Dynamic Pricing Service
try {
  if (dynamicPricingService && typeof dynamicPricingService.setupRoutes === 'function') {
    dynamicPricingService.setupRoutes(app);
    logger.info('✅ Dynamic Pricing Service mounted at /api/v1/pricing');
  }
} catch (error) {
  logger.error('❌ Failed to mount Dynamic Pricing Service:', error.message);
}

// 2. Farmer Training Service
try {
  if (farmerTrainingService && typeof farmerTrainingService.setupRoutes === 'function') {
    farmerTrainingService.setupRoutes(app);
    logger.info('✅ Farmer Training Service mounted at /api/v1/farmer-training');
  }
} catch (error) {
  logger.error('❌ Failed to mount Farmer Training Service:', error.message);
}

// 3. Government Scheme Service
try {
  if (governmentSchemeService && typeof governmentSchemeService.setupRoutes === 'function') {
    governmentSchemeService.setupRoutes(app);
    logger.info('✅ Government Scheme Service mounted at /api/v1/schemes');
  }
} catch (error) {
  logger.error('❌ Failed to mount Government Scheme Service:', error.message);
}

// 4. Greenhouse Service
try {
  if (greenhouseService && typeof greenhouseService.setupRoutes === 'function') {
    greenhouseService.setupRoutes(app);
    logger.info('✅ Greenhouse Service mounted at /api/v1/greenhouse');
  }
} catch (error) {
  logger.error('❌ Failed to mount Greenhouse Service:', error.message);
}

// 5. Insurance Claims Service
try {
  if (insuranceClaimsService && typeof insuranceClaimsService.setupRoutes === 'function') {
    insuranceClaimsService.setupRoutes(app);
    logger.info('✅ Insurance Claims Service mounted at /api/v1/claims');
  }
} catch (error) {
  logger.error('❌ Failed to mount Insurance Claims Service:', error.message);
}

// 6. Pre-Season Order Service
try {
  if (preSeasonOrderService && typeof preSeasonOrderService.setupRoutes === 'function') {
    preSeasonOrderService.setupRoutes(app);
    logger.info('✅ Pre-Season Order Service mounted at /api/v1/preseason');
  }
} catch (error) {
  logger.error('❌ Failed to mount Pre-Season Order Service:', error.message);
}

// 7. Shared Infrastructure Service
try {
  if (sharedInfraService && typeof sharedInfraService.setupRoutes === 'function') {
    sharedInfraService.setupRoutes(app);
    logger.info('✅ Shared Infrastructure Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Shared Infrastructure Service:', error.message);
}

// 8. Soil Testing Service
try {
  if (soilTestingService && typeof soilTestingService.setupRoutes === 'function') {
    soilTestingService.setupRoutes(app);
    logger.info('✅ Soil Testing Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Soil Testing Service:', error.message);
}

// 9. Subsidy Service
try {
  if (subsidyService && typeof subsidyService.setupRoutes === 'function') {
    subsidyService.setupRoutes(app);
    logger.info('✅ Subsidy Service mounted at /api/v1/subsidy');
  }
} catch (error) {
  logger.error('❌ Failed to mount Subsidy Service:', error.message);
}

logger.info('✅ Orphaned services mount attempt completed');
