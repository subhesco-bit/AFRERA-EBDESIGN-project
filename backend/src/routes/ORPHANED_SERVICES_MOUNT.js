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

// Batch 2: 15 additional orphaned services discovered with real setupRoutes()
// functions that were never require()'d or mounted anywhere.
const aiAdvisoryService = require('../services/legacy/aiAdvisoryService');
const buyingClubService = require('../services/legacy/buyingClubService');
const custodyEventRoutes = require('../services/legacy/custodyEventRoutes');
const escrowService = require('../services/legacy/escrowService');
const householdEconomyService = require('../services/legacy/householdEconomyService');
const machineryAccessService = require('../services/legacy/machineryAccessService');
const marketAccessService = require('../services/legacy/marketAccessService');
const marketIntelligenceService = require('../services/legacy/marketIntelligenceService');
const mobilityRidesService = require('../services/legacy/mobilityRidesService');
const procurementSubscriptionService = require('../services/legacy/procurementSubscriptionService');
const renewableEnergyService = require('../services/legacy/renewableEnergyService');
const ruralEnterpriseService = require('../services/legacy/ruralEnterpriseService');
const ruralFinanceService = require('../services/legacy/ruralFinanceService');
// NOTE: distinct from `sharedInfraService` above, which is actually
// services/legacy/sharedInfrastructureService.js (already mounted, #7).
// This is the real, separate services/legacy/sharedInfraService.js (shared
// infrastructure + equipment rental / second-life marketplace).
const sharedInfraEquipmentService = require('../services/legacy/sharedInfraService');
const villageProfileService = require('../services/legacy/villageProfileService');

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

// 10. AI Advisory Service
try {
  if (aiAdvisoryService && typeof aiAdvisoryService.setupRoutes === 'function') {
    aiAdvisoryService.setupRoutes(router);
    logger.info('✅ AI Advisory Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount AI Advisory Service:', error.message);
}

// 11. Buying Club Service
try {
  if (buyingClubService && typeof buyingClubService.setupRoutes === 'function') {
    buyingClubService.setupRoutes(router);
    logger.info('✅ Buying Club Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Buying Club Service:', error.message);
}

// 12. Custody Event Routes
try {
  if (custodyEventRoutes && typeof custodyEventRoutes.setupRoutes === 'function') {
    custodyEventRoutes.setupRoutes(router);
    logger.info('✅ Custody Event Routes mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Custody Event Routes:', error.message);
}

// 13. Escrow Service
try {
  if (escrowService && typeof escrowService.setupRoutes === 'function') {
    escrowService.setupRoutes(router);
    logger.info('✅ Escrow Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Escrow Service:', error.message);
}

// 14. Household Economy Service
try {
  if (householdEconomyService && typeof householdEconomyService.setupRoutes === 'function') {
    householdEconomyService.setupRoutes(router);
    logger.info('✅ Household Economy Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Household Economy Service:', error.message);
}

// 15. Machinery Access Service
try {
  if (machineryAccessService && typeof machineryAccessService.setupRoutes === 'function') {
    machineryAccessService.setupRoutes(router);
    logger.info('✅ Machinery Access Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Machinery Access Service:', error.message);
}

// 16. Market Access Service
try {
  if (marketAccessService && typeof marketAccessService.setupRoutes === 'function') {
    marketAccessService.setupRoutes(router);
    logger.info('✅ Market Access Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Market Access Service:', error.message);
}

// 17. Market Intelligence Service
try {
  if (marketIntelligenceService && typeof marketIntelligenceService.setupRoutes === 'function') {
    marketIntelligenceService.setupRoutes(router);
    logger.info('✅ Market Intelligence Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Market Intelligence Service:', error.message);
}

// 18. Mobility Rides Service
try {
  if (mobilityRidesService && typeof mobilityRidesService.setupRoutes === 'function') {
    mobilityRidesService.setupRoutes(router);
    logger.info('✅ Mobility Rides Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Mobility Rides Service:', error.message);
}

// 19. Procurement Subscription Service
try {
  if (procurementSubscriptionService && typeof procurementSubscriptionService.setupRoutes === 'function') {
    procurementSubscriptionService.setupRoutes(router);
    logger.info('✅ Procurement Subscription Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Procurement Subscription Service:', error.message);
}

// 20. Renewable Energy Service
try {
  if (renewableEnergyService && typeof renewableEnergyService.setupRoutes === 'function') {
    renewableEnergyService.setupRoutes(router);
    logger.info('✅ Renewable Energy Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Renewable Energy Service:', error.message);
}

// 21. Rural Enterprise Service
try {
  if (ruralEnterpriseService && typeof ruralEnterpriseService.setupRoutes === 'function') {
    ruralEnterpriseService.setupRoutes(router);
    logger.info('✅ Rural Enterprise Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Rural Enterprise Service:', error.message);
}

// 22. Rural Finance Service
try {
  if (ruralFinanceService && typeof ruralFinanceService.setupRoutes === 'function') {
    ruralFinanceService.setupRoutes(router);
    logger.info('✅ Rural Finance Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Rural Finance Service:', error.message);
}

// 23. Shared Infrastructure & Equipment Rental Service (legacy/sharedInfraService.js
// - distinct from #7's sharedInfrastructureService.js)
try {
  if (sharedInfraEquipmentService && typeof sharedInfraEquipmentService.setupRoutes === 'function') {
    sharedInfraEquipmentService.setupRoutes(router);
    logger.info('✅ Shared Infrastructure & Equipment Rental Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Shared Infrastructure & Equipment Rental Service:', error.message);
}

// 24. Village Profile Service (canonical M041-backed compatibility layer)
try {
  if (villageProfileService && typeof villageProfileService.setupRoutes === 'function') {
    villageProfileService.setupRoutes(router);
    logger.info('✅ Village Profile Service mounted');
  }
} catch (error) {
  logger.error('❌ Failed to mount Village Profile Service:', error.message);
}

logger.info('✅ Orphaned services router initialized');

module.exports = router;
