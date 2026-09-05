/**
 * ORPHANED SERVICES - Router Module
 * Mounts all orphaned services that have setupRoutes() but were never called
 */

const express = require('express');
const { logger } = require('../utils/logger');

// Import all orphaned services
const dynamicPricingService = require('../services/legacy/dynamicPricingService');
const farmerTrainingService = require('../services/legacy/farmerTrainingService');
const governmentSchemeService = require('../services/legacy/governmentSchemeService');
const greenhouseService = require('../services/legacy/greenhouseService');
const insuranceClaimsService = require('../services/legacy/insuranceClaimsService');
const preSeasonOrderService = require('../services/legacy/preSeasonOrderService');
const sharedInfraService = require('../services/legacy/sharedInfrastructureService');
const soilTestingService = require('../services/legacy/soilTestingService');
const subsidyService = require('../services/legacy/subsidyService');

const router = express.Router();

logger.info('🔌 Initializing orphaned services router...');

// 1. Dynamic Pricing Service
try {
  if (dynamicPricingService && typeof dynamicPricingService.setupRoutes === 'function') {
    dynamicPricingService.setupRoutes(router);
    logger.info('✅ Dynamic Pricing Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Dynamic Pricing Service:', error.message);
}

// 2. Farmer Training Service
try {
  if (farmerTrainingService && typeof farmerTrainingService.setupRoutes === 'function') {
    farmerTrainingService.setupRoutes(router);
    logger.info('✅ Farmer Training Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Farmer Training Service:', error.message);
}

// 3. Government Scheme Service
try {
  if (governmentSchemeService && typeof governmentSchemeService.setupRoutes === 'function') {
    governmentSchemeService.setupRoutes(router);
    logger.info('✅ Government Scheme Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Government Scheme Service:', error.message);
}

// 4. Greenhouse Service
try {
  if (greenhouseService && typeof greenhouseService.setupRoutes === 'function') {
    greenhouseService.setupRoutes(router);
    logger.info('✅ Greenhouse Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Greenhouse Service:', error.message);
}

// 5. Insurance Claims Service
try {
  if (insuranceClaimsService && typeof insuranceClaimsService.setupRoutes === 'function') {
    insuranceClaimsService.setupRoutes(router);
    logger.info('✅ Insurance Claims Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Insurance Claims Service:', error.message);
}

// 6. Pre-Season Order Service
try {
  if (preSeasonOrderService && typeof preSeasonOrderService.setupRoutes === 'function') {
    preSeasonOrderService.setupRoutes(router);
    logger.info('✅ Pre-Season Order Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Pre-Season Order Service:', error.message);
}

// 7. Shared Infrastructure Service
try {
  if (sharedInfraService && typeof sharedInfraService.setupRoutes === 'function') {
    sharedInfraService.setupRoutes(router);
    logger.info('✅ Shared Infrastructure Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Shared Infrastructure Service:', error.message);
}

// 8. Soil Testing Service
try {
  if (soilTestingService && typeof soilTestingService.setupRoutes === 'function') {
    soilTestingService.setupRoutes(router);
    logger.info('✅ Soil Testing Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Soil Testing Service:', error.message);
}

// 9. Subsidy Service
try {
  if (subsidyService && typeof subsidyService.setupRoutes === 'function') {
    subsidyService.setupRoutes(router);
    logger.info('✅ Subsidy Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Subsidy Service:', error.message);
}

logger.info('✅ Orphaned services router initialized');

module.exports = router;
