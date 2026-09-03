# Hidden Module Report

Generated 2026-09-02 from 2067 source files.

Answers one question per catalogued module: **does this capability exist
anywhere in the folder, under any name?** The previous count was decided by
matching module names against file names, which cannot see a capability
implemented under a different label or folded into a larger module.

| Verdict | Meaning | Safe to build? |
|---|---|---|
| FOUND | a file is named for this module | No — already exists |
| HIDDEN | exists under a different name | No — extend it, do not duplicate |
| CLUBBED | features folded into larger modules | No — extract first, then decide |
| LEAD | one weak word match | Check by hand first |
| ABSENT | no trace anywhere | **Yes** |

## Tally

| Verdict | Modules |
|---|---:|
| HIDDEN | 68 |
| LEAD | 49 |
| FOUND | 32 |
| UNSCORABLE | 1 |

## LEAD — 49

| ID | Module | Domain | Evidence |
|---|---|---|---|
| M002 | Platform Configuration | Platform Foundation | `backend/src/core/ai/aiProviderAdapters.js`<br>`backend/src/core/aiOrchestrator.js`<br>`backend/src/core/claudeAICoordinator.js` |
| M003 | Tenant Management | Platform Foundation | `backend/src/core/signalBus.js`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/014_platform_foundation_modules.sql` |
| M004 | Organization Management | Platform Foundation | `backend/src/controllers/comprehensiveERPController.js`<br>`backend/src/core/moduleRegistry.js`<br>`backend/src/core/signalBus.js` |
| M005 | Environment Management | Platform Foundation | `backend/src/core/ai/aiProviderAdapters.js`<br>`backend/src/core/aiOrchestrator.js`<br>`backend/src/database/ar_vr_schema.sql` |
| M006 | System Administration | Platform Foundation | `backend/src/database/migrations/071_animal_health_schema.sql`<br>`backend/src/database/migrations/1002_system_administration.sql`<br>`backend/src/index.js` |
| M008 | Localization Management | Platform Foundation | `backend/src/database/migrations/014_platform_foundation_modules.sql`<br>`backend/src/database/migrations/gdpr_schema.sql`<br>`backend/src/modules/M008/index.js` |
| M010 | Master Configuration | Platform Foundation | `backend/src/core/ai/aiProviderAdapters.js`<br>`backend/src/core/aiOrchestrator.js`<br>`backend/src/core/claudeAICoordinator.js` |
| M011 | User Management | Identity | `backend/src/controllers/aiBackboneController.js`<br>`backend/src/controllers/bulkOrderController.js`<br>`backend/src/controllers/completeAIIntegrationController.js` |
| M012 | Authentication | Identity | `backend/src/controllers/ecommerceController.js`<br>`backend/src/core/businessCell.js`<br>`backend/src/database/gi_intelligence_schema.sql` |
| M013 | Authorization | Identity | `backend/src/core/ai/aiGuardrails.js`<br>`backend/src/core/ai/aiOrchestratorCore.js`<br>`backend/src/database/migrations/000_base_schema.sql` |
| M014 | Role Management | Identity | `backend/src/controllers/nervousSystemController.js`<br>`backend/src/core/ai/aiGuardrails.js`<br>`backend/src/core/effectors.js` |
| M015 | Permission Management | Identity | `backend/src/core/ai/aiGuardrails.js`<br>`backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql` |
| M018 | Digital Identity | Identity | `backend/src/core/decisionEngine.js`<br>`backend/src/core/nervousSystem.js`<br>`backend/src/core/reflexEngine.js` |
| M019 | Consent Management | Identity | `backend/src/database/indigenous_knowledge_schema.sql`<br>`backend/src/database/migrations/014_platform_foundation_modules.sql`<br>`backend/src/database/migrations/029_indigenous_knowledge_schema.sql` |
| M020 | Session Management | Identity | `backend/src/core/aiOrchestrator.js`<br>`backend/src/core/claudeAICoordinator.js`<br>`backend/src/database/ai_copilot_schema.sql` |
| M039 | Survey Management | Land | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/011_farmer_portal_enhancements.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql` |
| M042 | Panchayat Management | Community | `backend/src/database/migrations/012_governance_module.sql`<br>`backend/src/database/migrations/3106_fpo_member_shares_schema.sql`<br>`backend/src/index.js` |
| M043 | Block Management | Community | `backend/src/core/ai/aiGuardrails.js`<br>`backend/src/core/decisionEngine.js`<br>`backend/src/core/disruptionRoutingAgent.js` |
| M044 | District Management | Community | `backend/src/controllers/ecommerceController.js`<br>`backend/src/core/disruptionRoutingAgent.js`<br>`backend/src/database/engineering_schema.sql` |
| M045 | State Management | Community | `backend/src/controllers/ecommerceController.js`<br>`backend/src/core/ai/aiCostController.js`<br>`backend/src/core/ai/aiOrchestratorCore.js` |
| M046 | SHG Management | Community | `backend/src/database/food_intelligence_schema.sql`<br>`backend/src/database/migrations/024_food_intelligence_schema.sql`<br>`backend/src/database/migrations/041_rural_life_os_schema.sql` |
| M047 | Cooperative Management | Community | `backend/src/database/digital_product_passport_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/012_governance_module.sql` |
| M066 | Nursery Management | Crop | `backend/src/database/migrations/014_horticulture_module.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzz_seedling_batch_tracking.sql` |
| M067 | Sowing Management | Crop | `backend/src/core/businessCell.js`<br>`backend/src/database/migrations/991_aeos_folu_ne_policy.sql`<br>`backend/src/database/migrations/992_v42_recovered_intelligence.sql` |
| M073 | Nutrient Management | Soil | `backend/src/controllers/ecommerceIntegrationController.js`<br>`backend/src/controllers/nutrientValueSalesController.js`<br>`backend/src/controllers/productMediaAIController.js` |
| M074 | Fertility Management | Soil | `backend/src/database/migrations/9510_m032_land_records_extra.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzz_soil_management_schema.sql`<br>`backend/src/index.js` |
| M075 | Irrigation Management | Water | `backend/src/controllers/completeAIIntegrationController.js`<br>`backend/src/database/digital_product_passport_schema.sql`<br>`backend/src/database/engineering_schema.sql` |
| M079 | Watershed Management | Water | `backend/src/database/migrations/9525_m079_m079.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzz_water_management_schema.sql`<br>`backend/src/index.js` |
| M093 | Labour Management | Operations | `backend/src/database/migrations/993_enterprise_control_layer.sql`<br>`backend/src/database/migrations/9996_project_systems_schema.sql`<br>`backend/src/database/migrations/9997_geofencing.sql` |
| M094 | Contractor Management | Operations | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql` |
| M101 | Tractor Management | Machinery | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql`<br>`backend/src/database/migrations/042_rural_procurement_logistics_mobility_schema.sql` |
| M102 | Implement Management | Machinery | `backend/src/core/ai/aiEngineRegistry.js`<br>`backend/src/core/ai/aiGuardrails.js`<br>`backend/src/core/ai/aiOrchestratorCore.js` |
| M105 | Fleet Management | Machinery | `backend/src/database/ai_copilot_schema.sql`<br>`backend/src/database/logistics_enhancement_schema.sql`<br>`backend/src/database/migrations/013_logistics_enhancements.sql` |
| M108 | Fuel Management | Machinery | `backend/src/database/logistics_enhancement_schema.sql`<br>`backend/src/database/migrations/013_logistics_enhancements.sql`<br>`backend/src/database/migrations/034_logistics_enhancement_schema.sql` |
| M113 | Biofertilizer Management | Input Supply | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzz_input_supply_management_schema.sql` |
| M116 | Micronutrient Management | Input Supply | `backend/src/database/consumer_health_schema.sql`<br>`backend/src/database/migrations/020_consumer_health_schema.sql`<br>`backend/src/database/migrations/036_nutrition_intelligence_schema.sql` |
| M121 | Dairy Management | Livestock | `backend/src/controllers/completeAIIntegrationController.js`<br>`backend/src/controllers/completeERPIntegrationController.js`<br>`backend/src/database/engineering_schema.sql` |
| M123 | Poultry Management | Livestock | `backend/src/controllers/completeAIIntegrationController.js`<br>`backend/src/controllers/completeERPIntegrationController.js`<br>`backend/src/database/migrations/041_rural_life_os_schema.sql` |
| M128 | Feed Management | Livestock | `backend/src/controllers/completeAIIntegrationController.js`<br>`backend/src/core/businessCell.js`<br>`backend/src/core/claudeAICoordinator.js` |
| M129 | Breeding Management | Livestock | `backend/src/controllers/completeAIIntegrationController.js`<br>`backend/src/core/signalBus.js`<br>`backend/src/database/biodiversity_schema.sql` |
| M132 | Pond Management | Fisheries | `backend/src/core/ai/aiEngineRegistry.js`<br>`backend/src/core/ai/aiOrchestratorCore.js`<br>`backend/src/core/withTransaction.js` |
| M133 | Hatchery Management | Fisheries | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz_fisheries_management_schema.sql`<br>`backend/src/database/rural_life_os_schema.sql` |
| M137 | Harvest Management (Fisheries) | Fisheries | `backend/src/controllers/completeAIIntegrationController.js`<br>`backend/src/controllers/completeERPIntegrationController.js`<br>`backend/src/controllers/ecommerceController.js` |
| M141 | Orchard Management | Horticulture | `backend/src/database/migrations/014_horticulture_module.sql`<br>`backend/src/modules/M021/service.js`<br>`backend/src/modules/M030/service.js` |
| M143 | Floriculture Management | Horticulture | `backend/src/database/migrations/014_horticulture_module.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzz_horticulture_management_schema.sql`<br>`backend/src/index.js` |
| M144 | Greenhouse Management | Horticulture | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/iot_integration_schema.sql`<br>`backend/src/database/migrations/014_horticulture_module.sql` |
| M145 | Polyhouse Management | Horticulture | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/014_horticulture_module.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql` |
| M146 | Hydroponics Management | Horticulture | `backend/src/database/migrations/014_horticulture_module.sql`<br>`backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzz_horticulture_management_schema.sql` |
| M147 | Aeroponics Management | Horticulture | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzz_horticulture_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/horticultureManagementRoutes.js` |

## HIDDEN — 68

| ID | Module | Domain | Evidence |
|---|---|---|---|
| M007 | Feature Flag Management | Platform Foundation | `backend/src/database/migrations/1001_platform_configuration.sql`<br>`backend/src/database/migrations/9500_m001_platform_core.sql`<br>`backend/src/database/migrations/9501_m002_platform_configuration.sql` |
| M009 | Time Zone Management | Platform Foundation | `backend/src/database/form_management_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/014_platform_foundation_modules.sql` |
| M016 | Single Sign-On | Identity | `backend/src/core/decisionEngine.js`<br>`backend/src/database/migrations/014_platform_foundation_modules.sql`<br>`backend/src/modules/M014/controller.js` |
| M017 | Multi-Factor Authentication | Identity | `backend/src/database/migrations/3015_m015_mfa.sql`<br>`backend/src/database/migrations/mfa_schema.sql`<br>`backend/src/index.js` |
| M021 | Farmer Registry | Farmer | `frontend/src/modules/M021/M021Page.jsx` |
| M027 | Farmer Certification | Farmer | `backend/src/core/aiOrchestrator.js`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/998_foreign_key_indexes.sql` |
| M030 | Farmer Performance | Farmer | `backend/src/modules/M023/service.js`<br>`backend/src/modules/M030/service.js`<br>`backend/src/routes/advancedAnalyticsRoutes.js` |
| M032 | Land Ownership | Land | `backend/src/database/migrations/015_authorization_service.sql`<br>`backend/src/database/migrations/strategic_services_schema.sql`<br>`backend/src/modules/M031/controller.js` |
| M033 | Land Lease Management | Land | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzz_farmer_land_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/landManagementRoutes.js` |
| M034 | Parcel Mapping | Land | `frontend/src/modules/M034/M034Component.jsx`<br>`frontend/src/modules/M034/M034Page.jsx`<br>`frontend/src/pages/LandManagementPage.jsx` |
| M035 | GIS Land Mapping | Land | `backend/src/database/migrations/9997_geofencing.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzz_farmer_land_management_schema.sql`<br>`backend/src/index.js` |
| M036 | Soil Mapping | Land | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzz_farmer_land_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/landManagementRoutes.js` |
| M037 | Water Resource Mapping | Land | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzz_farmer_land_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/landManagementRoutes.js` |
| M038 | Geo Boundary Management | Land | `backend/src/index.js`<br>`backend/src/routes/landManagementRoutes.js`<br>`backend/src/services/legacy/landManagementService.js` |
| M048 | Producer Group Management | Community | `backend/src/database/migrations/9507_m024_farmer_groups.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzz_community_management_schema.sql`<br>`backend/src/index.js` |
| M049 | Community Asset Management | Community | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzz_community_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/communityManagementRoutes.js` |
| M050 | Rural Development Management | Community | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzz_community_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/communityManagementRoutes.js` |
| M052 | FPO Governance | FPO | `frontend/src/services/api.js` |
| M053 | FPO Membership | FPO | `backend/src/database/migrations/9513_m051_m051.sql`<br>`backend/src/modules/M051/model.sql`<br>`backend/src/modules/M051/service.js` |
| M054 | FPO Finance | FPO | `frontend/src/modules/M054/M054Page.jsx` |
| M055 | FPO Procurement | FPO | `backend/src/database/migrations/3000_M055_generated.sql`<br>`frontend/src/services/api.js` |
| M056 | FPO Inventory | FPO | `backend/src/database/migrations/3000_M056_generated.sql`<br>`frontend/src/modules/M056/M056Page.jsx`<br>`frontend/src/pages/FPODashboardPage.jsx` |
| M057 | FPO Marketing | FPO | `frontend/src/services/api.js` |
| M058 | FPO Sales | FPO | `frontend/src/modules/M058/M058Page.jsx` |
| M059 | FPO Compliance | FPO | `frontend/src/modules/M059/M059Component.jsx`<br>`frontend/src/modules/M059/M059Page.jsx`<br>`frontend/src/services/api.js` |
| M060 | FPO Analytics | FPO | `frontend/src/modules/M060/M060Page.jsx` |
| M069 | Harvest Planning | Crop | `backend/src/modules/M069/controller.js`<br>`backend/src/modules/M069/index.js`<br>`backend/src/modules/M069/model.sql` |
| M070 | Yield Recording | Crop | `frontend/src/modules/M070/M070Component.jsx`<br>`frontend/src/modules/M070/M070Page.jsx` |
| M071 | Soil Health Management | Soil | `backend/src/database/digital_product_passport_schema.sql`<br>`backend/src/database/migrations/022_digital_product_passport_schema.sql`<br>`backend/src/database/migrations/041_rural_life_os_schema.sql` |
| M076 | Water Budgeting | Water | `backend/src/database/migrations/9522_m076_m076.sql`<br>`backend/src/index.js`<br>`backend/src/modules/M076/controller.js` |
| M077 | Water Quality Monitoring | Water | `backend/src/database/migrations/9523_m077_m077.sql`<br>`backend/src/modules/M077/controller.js`<br>`backend/src/modules/M077/index.js` |
| M078 | Rainwater Harvesting | Water | `backend/src/database/migrations/9524_m078_m078.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzz_water_management_schema.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzz_hidden_modules_schema_recovery.sql` |
| M080 | Water Analytics | Water | `backend/src/database/migrations/9526_m080_m080.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzz_water_management_schema.sql`<br>`backend/src/index.js` |
| M081 | Weather Monitoring | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/services/legacy/agriculturalIntelligenceService.js`<br>`frontend/src/config/routes.js` |
| M082 | Weather Forecasting | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/services/claude/aiAgentService.js`<br>`backend/src/services/legacy/aiAgenticCompanionService.js` |
| M084 | Disaster Alerts | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql` |
| M085 | Drought Monitoring | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/index.js`<br>`backend/src/routes/climateMonitoringRoutes.js` |
| M086 | Flood Monitoring | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/index.js`<br>`backend/src/routes/climateMonitoringRoutes.js` |
| M087 | Pest Forecasting | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzz_alert_management_schema.sql`<br>`backend/src/modules/M087/index.js` |
| M088 | Disease Forecasting | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/index.js`<br>`backend/src/routes/climateMonitoringRoutes.js` |
| M089 | Climate Risk Assessment | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzz_climate_monitoring_schema.sql`<br>`backend/src/services/legacy/climateMonitoringService.js` |
| M090 | Agro-Meteorology | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzz_climate_monitoring_schema.sql`<br>`backend/src/index.js` |
| M091 | Farm Activity Management | Operations | `backend/src/index.js`<br>`backend/src/routes/operationsManagementRoutes.js`<br>`backend/src/services/legacy/operationsManagementService.js` |
| M092 | Farm Task Scheduling | Operations | `backend/src/services/legacy/operationsManagementService.js`<br>`frontend/src/pages/OperationsManagementPage.jsx`<br>`frontend/src/services/api.js` |
| M095 | Machinery Operations | Operations | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzz_operations_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/operationsManagementRoutes.js` |
| M096 | Equipment Scheduling | Operations | `backend/src/index.js`<br>`backend/src/routes/operationsManagementRoutes.js`<br>`backend/src/services/legacy/operationsManagementService.js` |
| M097 | Input Consumption | Operations | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzz_operations_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/operationsManagementRoutes.js` |
| M099 | Farm Productivity | Operations | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzz_operations_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/operationsManagementRoutes.js` |
| M100 | Farm Operations Dashboard | Operations | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzz_operations_management_schema.sql`<br>`backend/src/index.js` |
| M111 | Seed Inventory | Input Supply | `backend/src/database/migrations/9999_zzzzzz_seed_vault_schema.sql`<br>`backend/src/services/legacy/inputSupplyManagementService.js`<br>`backend/src/services/legacy/seedVaultService.js` |
| M114 | Pesticide Inventory | Input Supply | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzz_input_supply_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/inputSupplyManagementRoutes.js` |
| M115 | Bio-Pesticide Management | Input Supply | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql` |
| M117 | Organic Input Management | Input Supply | `backend/src/database/migrations/038_organic_traceability_schema.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/992_v42_recovered_intelligence.sql` |
| M118 | Input Procurement | Input Supply | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzz_input_supply_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/inputSupplyManagementRoutes.js` |
| M119 | Input Distribution | Input Supply | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzz_input_supply_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/inputSupplyManagementRoutes.js` |
| M120 | Input Traceability | Input Supply | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzz_input_supply_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/inputSupplyManagementRoutes.js` |
| M130 | Livestock Analytics | Livestock | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzz_livestock_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/livestockManagementRoutes.js` |
| M131 | Biofloc Farm Management | Fisheries | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz_fisheries_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/fisheriesManagementRoutes.js` |
| M134 | Fish Feed Management | Fisheries | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz_fisheries_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/fisheriesManagementRoutes.js` |
| M135 | Water Quality Control | Fisheries | `backend/src/services/legacy/fisheriesManagementService.js`<br>`frontend/src/modules/M135/M135Component.jsx`<br>`frontend/src/modules/M135/M135Page.jsx` |
| M136 | Fish Health Management | Fisheries | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz_fisheries_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/fisheriesManagementRoutes.js` |
| M138 | Fish Processing Management | Fisheries | `backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz_fisheries_management_schema.sql`<br>`backend/src/index.js` |
| M139 | Cold Fish Chain | Fisheries | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz_fisheries_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/fisheriesManagementRoutes.js` |
| M140 | Aquaculture Analytics | Fisheries | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz_fisheries_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/fisheriesManagementRoutes.js` |
| M142 | Vegetable Production | Horticulture | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzz_horticulture_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/horticultureManagementRoutes.js` |
| M148 | Precision Horticulture | Horticulture | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzz_horticulture_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/horticultureManagementRoutes.js` |
| M149 | Protected Cultivation | Horticulture | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzz_horticulture_management_schema.sql`<br>`backend/src/index.js`<br>`backend/src/routes/horticultureManagementRoutes.js` |
| M150 | Horticulture Analytics | Horticulture | `backend/src/database/migrations/014_horticulture_module.sql`<br>`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzz_horticulture_management_schema.sql`<br>`backend/src/index.js` |

## FOUND — 32

| ID | Module | Domain | Evidence |
|---|---|---|---|
| M022 | Farmer Profile | Farmer | `backend/src/database/migrations/9505_m022_farmer_profiles.sql`<br>`frontend/src/pages/FarmerProfilePage.jsx` |
| M023 | Farmer Family | Farmer | `backend/src/routes/farmerFamilyRoutes.js`<br>`backend/src/services/legacy/farmerFamilyService.js`<br>`frontend/src/pages/FarmerFamilyPage.jsx` |
| M024 | Farmer KYC | Farmer | `frontend/src/pages/FarmerKycPage.jsx` |
| M025 | Farmer Verification | Farmer | `frontend/src/pages/FarmerVerificationPage.jsx` |
| M026 | Farmer Skill Management | Farmer | `frontend/src/pages/FarmerSkillPage.jsx` |
| M028 | Farmer Advisory | Farmer | `backend/src/database/migrations/3030_m030_farmer_advisory.sql` |
| M029 | Farmer Health & Welfare | Farmer | `backend/src/database/migrations/013_farmer_health_welfare_module.sql`<br>`frontend/src/pages/FarmerHealthWelfarePage.jsx` |
| M031 | Land Registry | Land | `frontend/src/pages/LandRegistryPage.jsx` |
| M040 | Digital Land Records | Land | `backend/src/database/migrations/9510_m032_land_records_extra.sql`<br>`backend/src/routes/landRecordsRoutes.js`<br>`backend/src/services/legacy/landRecordsService.js` |
| M041 | Village Registry | Community | `frontend/src/pages/VillageRegistryPage.jsx` |
| M051 | FPO Registration | FPO | `frontend/src/pages/FPORegistrationPage.jsx` |
| M061 | Crop Planning | Crop | `backend/src/routes/cropPlanningRoutes.js`<br>`backend/src/services/legacy/cropPlanningService.js` |
| M062 | Crop Calendar | Crop | `frontend/src/pages/CropCalendarPage.jsx` |
| M063 | Crop Registration | Crop | `frontend/src/pages/CropRegistrationPage.jsx` |
| M064 | Crop Variety Management | Crop | `frontend/src/pages/CropVarietyPage.jsx` |
| M065 | Seed Planning | Crop | `frontend/src/pages/SeedPlanningPage.jsx` |
| M068 | Crop Monitoring | Crop | `frontend/src/pages/CropMonitoringPage.jsx` |
| M072 | Soil Test Management | Soil | `backend/src/services/legacy/soilTestingService.js` |
| M083 | Climate Advisory | Climate | `backend/src/routes/climateAdvisoryRoutes.js`<br>`frontend/src/pages/ClimateAdvisoryPage.jsx` |
| M098 | Farm Costing | Operations | `frontend/src/pages/FarmCostingPage.jsx` |
| M103 | Equipment Inventory | Machinery | `frontend/src/pages/EquipmentInventoryPage.jsx` |
| M104 | Equipment Rental | Machinery | `frontend/src/pages/EquipmentRentalPage.jsx` |
| M106 | Preventive Maintenance | Machinery | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzz_preventive_maintenance_schema.sql`<br>`backend/src/routes/preventiveMaintenanceRoutes.js`<br>`backend/src/services/legacy/preventiveMaintenanceService.js` |
| M107 | Breakdown Maintenance | Machinery | `frontend/src/pages/BreakdownMaintenancePage.jsx` |
| M109 | Spare Parts Management | Machinery | `frontend/src/pages/SparePartsManagementPage.jsx` |
| M110 | Asset Lifecycle Management | Machinery | `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzz_asset_lifecycle_schema.sql`<br>`frontend/src/pages/AssetLifecycleManagementPage.jsx` |
| M112 | Fertilizer Inventory | Input Supply | `backend/src/database/migrations/066_fertilizer_inventory_schema.sql`<br>`backend/src/services/legacy/fertilizerInventoryService.js`<br>`frontend/src/pages/FertilizerInventoryPage.jsx` |
| M122 | Cattle Registry | Livestock | `frontend/src/pages/CattleRegistryPage.jsx` |
| M124 | Goat Farming Management | Livestock | `backend/src/database/migrations/068_goat_farming_schema.sql`<br>`frontend/src/pages/GoatFarmingPage.jsx` |
| M125 | Sheep Farming Management | Livestock | `backend/src/database/migrations/069_sheep_farming_schema.sql`<br>`frontend/src/pages/SheepFarmingPage.jsx` |
| M126 | Pig Farming Management | Livestock | `backend/src/database/migrations/070_pig_farming_schema.sql`<br>`frontend/src/pages/PigFarmingPage.jsx` |
| M127 | Animal Health Management | Livestock | `backend/src/database/migrations/071_animal_health_schema.sql`<br>`backend/src/routes/animalHealthRoutes.js`<br>`backend/src/services/legacy/animalHealthService.js` |

## Named-missing modules from the source documents

| Module | Verdict | Evidence |
|---|---|---|
| RFQ (Request for Quote) & Dynamic Negotiation Engine | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql` |
| Subscription / "SIP" (Systematic Investment Plan) for Staples | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/services/legacy/commerceRulesService.js` |
| "Quote-to-Order" Conversion Dashboard | CLUBBED | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/index.js`<br>`backend/src/services/legacy/commerceRulesService.js`<br>`backend/src/services/legacy/ecommerceBusinessSalesService.js` |
| Sponsored GI Listings (Auction-based) | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql` |
| Affiliate & Influencer Tracking | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/services/legacy/ecommerceMarketingService.js` |
| Pixel & Retargeting Integration | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |
| TDS (Tax Deducted at Source) Engine | LEAD | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/logistics_enhancement_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql` |
| Automated Bank Reconciliation (via UPI/Razorpay) | HIDDEN | `frontend/src/services/api.js` |
| Asset Capitalization & Depreciation Schedule | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |
| E-Invoice IRN (Invoice Reference Number) Generation | CLUBBED | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/index.js`<br>`backend/src/services/legacy/complianceService.js`<br>`frontend/src/services/api.js` |
| GSTR-1 & GSTR-3B Auto-Population | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |
| Reverse Charge Mechanism (RCM) Handler | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |
| Farm Plot & Land Bank Management | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`frontend/src/services/api.js` |
| Agri-Input Inventory (Seed/Fertilizer/PPE) Tracking | CLUBBED | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/index.js`<br>`backend/src/services/legacy/aiBackboneService.js`<br>`frontend/src/components/Sidebar.jsx` |
| Mandi / APMC Price Integration (Live) | HIDDEN | `backend/src/services/legacy/marketDataService.js` |
| Quality Control (QC) Hold & Release Workflow | CLUBBED | `backend/src/core/erpAgents.js`<br>`backend/src/services/legacy/enterpriseControlService.js`<br>`frontend/src/pages/ComprehensiveERPPage.jsx`<br>`frontend/src/services/api.js` |
| Multi-Location FPO Cost Centers | CLUBBED | `backend/src/database/migrations/998_foreign_key_indexes.sql`<br>`backend/src/index.js`<br>`backend/src/services/legacy/comprehensiveERPService.js`<br>`frontend/src/services/api.js` |