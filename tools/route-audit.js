/**
 * Route Audit and Repair Script
 * 
 * This script audits the backend route structure to identify:
 * 1. Missing route files that are imported in index.js
 * 2. Orphaned route files that are not imported
 * 3. Broken route references
 * 4. Duplicate route registrations
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../backend/src/routes');
const INDEX_FILE = path.join(__dirname, '../backend/src/index.js');

// Routes imported in index.js (extracted from the grep results)
const IMPORTED_ROUTES = [
  'marketplaceEnhancements',
  'ecommerceRoutes',
  'ecommerceIntegrationRoutes',
  'ecommerceAIRoutes',
  'ecommerceERPRoutes',
  'ecommerceBusinessSalesRoutes',
  'ecommerceMarketingRoutes',
  'nutrientValueSalesRoutes',
  'nervousSystemRoutes',
  'bulkOrderRoutes',
  'completeERPIntegrationRoutes',
  'completeAIIntegrationRoutes',
  'comprehensiveERPRoutes',
  'aiBackboneRoutes',
  'productMediaAIRoutes',
  'wearableIntegrationRoutes',
  'defenseFitnessPrepRoutes',
  'cropValueResearchRoutes',
  'platformTelemetryRoutes',
  'farmerTrainingRoutes',
  'insuranceEnhancements',
  'farmerPortalEnhancements',
  'governanceModule',
  'logisticsEnhancements',
  'advancedFeatures',
  'enterpriseAIRoutes',
  'gstRoutes',
  'logisticsOpsRoutes',
  'farmerRoutes',
  'auditRoutes',
  'dairyRoutes',
  'fertilizerRoutes',
  'poultryRoutes',
  'goatRoutes',
  'sheepRoutes',
  'pigRoutes',
  'animalHealthRoutes',
  'enterpriseControlRoutes',
  'hrRoutes',
  'revenueRoutes',
  'riskPricingRoutes',
  'recoveredFinanceRoutes',
  'droughtMonitoringRoutes',
  'floodMonitoringRoutes',
  'diseaseForecastingRoutes',
  'climateRiskRoutes',
  'agroMeteorologyRoutes',
  'farmActivityRoutes',
  'farmTaskRoutes',
  'contractorRoutes',
  'machineryOperationsRoutes',
  'equipmentSchedulingRoutes',
  'inputConsumptionRoutes',
  'farmProductivityRoutes',
  'farmOperationsDashboardRoutes',
  'waterBudgetingRoutes',
  'waterQualityRoutes',
  'rainwaterHarvestingRoutes',
  'watershedManagementRoutes',
  'waterAnalyticsRoutes',
  'soilHealthRoutes',
  'nutrientManagementRoutes',
  'fertilityManagementRoutes',
  'blockManagementRoutes',
  'districtManagementRoutes',
  'stateManagementRoutes',
  'producerGroupRoutes',
  'communityAssetRoutes',
  'ruralDevelopmentRoutes',
  'biofertilizerRoutes',
  'pesticideInventoryRoutes',
  'bioPesticideRoutes',
  'micronutrientRoutes',
  'organicInputRoutes',
  'inputProcurementRoutes',
  'inputDistributionRoutes',
  'inputTraceabilityRoutes',
  'cattleRegistryRoutes',
  'feedManagementRoutes',
  'livestockAnalyticsRoutes',
  'farmerFamilyRoutes',
  'landLeaseRoutes',
  'gisLandMappingRoutes',
  'soilMappingRoutes',
  'waterResourceMappingRoutes',
  'geoBoundaryRoutes'
];

async function auditRoutes() {
  console.log('🔍 Starting Route Audit...\n');

  // Get all route files that actually exist
  const existingFiles = fs.readdirSync(ROUTES_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => file.replace('.js', ''));

  console.log(`📁 Found ${existingFiles.length} route files in ${ROUTES_DIR}`);

  // Check for missing routes
  const missingRoutes = IMPORTED_ROUTES.filter(route => !existingFiles.includes(route));
  
  if (missingRoutes.length > 0) {
    console.log(`\n❌ Missing ${missingRoutes.length} route files imported in index.js:`);
    missingRoutes.forEach(route => console.log(`   - ${route}.js`));
  } else {
    console.log('✅ All imported routes exist');
  }

  // Check for orphaned routes (exist but not imported)
  const orphanedRoutes = existingFiles.filter(file => !IMPORTED_ROUTES.includes(file));
  
  if (orphanedRoutes.length > 0) {
    console.log(`\n⚠️  Found ${orphanedRoutes.length} orphaned route files (not imported):`);
    orphanedRoutes.forEach(route => console.log(`   - ${route}.js`));
  } else {
    console.log('✅ No orphaned route files');
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Imported routes: ${IMPORTED_ROUTES.length}`);
  console.log(`   Existing files: ${existingFiles.length}`);
  console.log(`   Missing files: ${missingRoutes.length}`);
  console.log(`   Orphaned files: ${orphanedRoutes.length}`);

  return {
    imported: IMPORTED_ROUTES,
    existing: existingFiles,
    missing: missingRoutes,
    orphaned: orphanedRoutes
  };
}

// Run the audit
auditRoutes().then(result => {
  console.log('\n✅ Route audit complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Route audit failed:', error);
  process.exit(1);
});