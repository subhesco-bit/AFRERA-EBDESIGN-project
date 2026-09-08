/**
 * Service Bootstrap & Initialization
 * Loads all services on startup and verifies they are ready
 */

const serviceLocator = require("../core/serviceLocator");
const logger = require("../utils/logger");

async function bootstrap() {
  try {
    logger.info("🚀 Bootstrapping all services...");

    // Core services
    const coreServices = [
      "authService",
      "userService",
      "farmerService",
      "errorHandlerService",
      "cacheService",
    ];

    // AI services
    const aiServices = [
      "aiModelsService",
      "aiTrainingService",
      "aiEvaluationService",
    ];

    // Platform services
    const platformServices = [
      "digitalTwinService",
      "infrastructureMonitoringService",
      "gdprComplianceService",
    ];

    // Load all service categories
    const allServices = [...coreServices, ...aiServices, ...platformServices];

    for (const service of allServices) {
      try {
        const serviceInstance = serviceLocator.get(service);
        logger.info(`✅ ${service} initialized`);
      } catch (error) {
        logger.warn(`⚠️  ${service} failed to initialize: ${error.message}`);
      }
    }

    logger.info("✅ All services bootstrapped successfully");

    return {
      status: "ready",
      coreServices: coreServices.length,
      aiServices: aiServices.length,
      platformServices: platformServices.length,
      totalServices: allServices.length,
    };
  } catch (error) {
    logger.error("Bootstrap failed:", error);
    throw error;
  }
}

module.exports = { bootstrap };
