// Production-Hardened Platform Core
// Includes auto-discovery for 200K+ files support

module.exports = {
  // Error Handling
  errorHandler: require('./errorHandler'),

  // Caching
  cache: require('./cache'),

  // Validation
  validation: require('./validation'),

  // Monitoring
  monitoring: require('./monitoring'),

  // Service Template
  ProductionService: require('./productionService'),

  // Enhanced Framework (AI optimizations)
  EnhancedServiceFramework: require('./enhancedServiceFramework'),

  // API Documentation
  apiDocumentation: require('./apiDocumentation'),

  // ========================================================================
  // AUTO-DISCOVERY MODULES (NEW)
  // ========================================================================

  // Dynamic Service Loader - auto-discovers services from directory tree
  DynamicServiceLoader: require('./dynamicServiceLoader'),

  // Dynamic Route Loader - auto-mounts routes from directory tree
  DynamicRouteLoader: require('./dynamicRouteLoader'),

  // Service Locator - central access point for all services
  ServiceLocator: require('./serviceLocator'),

  // Configuration Registry - database-driven service configuration
  ConfigRegistry: require('./configRegistry'),

  // Service Audit Engine
  ServiceAuditEngine: require('./serviceAuditAndEnhancement'),

  // File Connectivity Audit
  FileConnectivityAudit: require('./fileConnectivityAudit'),

  // AI intelligence fabric (core/ai/*)
  ai: require('./ai'),

  // Civil disruption routing
  DisruptionRoutingAgent: require('./disruptionRoutingAgent')
};
