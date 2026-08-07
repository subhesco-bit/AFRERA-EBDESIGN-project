# Hidden Module Report

Generated 2026-08-07 from 1652 source files.

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
| HIDDEN | 73 |
| LEAD | 49 |
| CLUBBED | 20 |
| ABSENT | 4 |
| FOUND | 3 |
| UNSCORABLE | 1 |

## ABSENT — 4

| ID | Module | Domain | Evidence |
|---|---|---|---|
| M029 | Farmer Health & Welfare | Farmer | _no occurrence of these terms anywhere in backend or frontend_ |
| M050 | Rural Development Management | Community | _no occurrence of these terms anywhere in backend or frontend_ |
| M125 | Sheep Farming Management | Livestock | _no occurrence of these terms anywhere in backend or frontend_ |
| M148 | Precision Horticulture | Horticulture | _no occurrence of these terms anywhere in backend or frontend_ |

## LEAD — 49

| ID | Module | Domain | Evidence |
|---|---|---|---|
| M002 | Platform Configuration | Platform Foundation | `backend/src/database/conversational_ai_schema.sql`<br>`backend/src/database/engineering_schema.sql`<br>`backend/src/database/gst_schema.sql` |
| M003 | Tenant Management | Platform Foundation | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/060_experience_layer_dxp.sql`<br>`backend/src/database/migrations/994_recovered_capabilities.sql` |
| M004 | Organization Management | Platform Foundation | `backend/src/database/gi_intelligence_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/012_governance_module.sql` |
| M005 | Environment Management | Platform Foundation | `backend/src/database/ar_vr_schema.sql`<br>`backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/017_ar_vr_schema.sql` |
| M006 | System Administration | Platform Foundation | `backend/src/database/migrations/1002_system_administration.sql`<br>`backend/src/index.js`<br>`backend/src/modules/M006/controller.js` |
| M008 | Localization Management | Platform Foundation | `backend/src/modules/M008/controller.js`<br>`backend/src/modules/M008/index.js`<br>`backend/src/modules/M008/model.sql` |
| M010 | Master Configuration | Platform Foundation | `backend/src/database/conversational_ai_schema.sql`<br>`backend/src/database/engineering_schema.sql`<br>`backend/src/database/gst_schema.sql` |
| M011 | User Management | Identity | `backend/src/core/effectors.js`<br>`backend/src/core/erpAgents.js`<br>`backend/src/core/mcda.js` |
| M012 | Authentication | Identity | `backend/src/database/gi_intelligence_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/027_gi_intelligence_schema.sql` |
| M013 | Authorization | Identity | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/schema.sql`<br>`backend/src/index.js` |
| M014 | Role Management | Identity | `backend/src/core/effectors.js`<br>`backend/src/core/erpAgents.js`<br>`backend/src/core/signalBus.js` |
| M015 | Permission Management | Identity | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/014_audit_system.sql` |
| M018 | Digital Identity | Identity | `backend/src/core/decisionEngine.js`<br>`backend/src/core/signalBus.js`<br>`backend/src/database/gst_schema.sql` |
| M019 | Consent Management | Identity | `backend/src/database/indigenous_knowledge_schema.sql`<br>`backend/src/database/migrations/029_indigenous_knowledge_schema.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql` |
| M020 | Session Management | Identity | `backend/src/database/ai_copilot_schema.sql`<br>`backend/src/database/ar_vr_schema.sql`<br>`backend/src/database/conversational_ai_schema.sql` |
| M039 | Survey Management | Land | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/011_farmer_portal_enhancements.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql` |
| M042 | Panchayat Management | Community | `backend/src/database/migrations/012_governance_module.sql`<br>`backend/src/routes/governanceModule.js`<br>`backend/src/services/governanceService.js` |
| M043 | Block Management | Community | `backend/src/core/decisionEngine.js`<br>`backend/src/core/effectors.js`<br>`backend/src/core/erpAgents.js` |
| M044 | District Management | Community | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/011_farmer_portal_enhancements.sql`<br>`backend/src/database/migrations/012_governance_module.sql` |
| M045 | State Management | Community | `backend/src/core/effectors.js`<br>`backend/src/core/erpAgents.js`<br>`backend/src/core/mcda.js` |
| M046 | SHG Management | Community | `backend/src/database/food_intelligence_schema.sql`<br>`backend/src/database/migrations/024_food_intelligence_schema.sql`<br>`backend/src/database/migrations/041_rural_life_os_schema.sql` |
| M047 | Cooperative Management | Community | `backend/src/database/digital_product_passport_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/012_governance_module.sql` |
| M066 | Nursery Management | Crop | `backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/modules/M066/controller.js`<br>`backend/src/modules/M066/index.js` |
| M067 | Sowing Management | Crop | `backend/src/database/migrations/991_aeos_folu_ne_policy.sql`<br>`backend/src/database/migrations/992_v42_recovered_intelligence.sql`<br>`backend/src/database/pool.js` |
| M073 | Nutrient Management | Soil | `backend/src/database/consumer_health_schema.sql`<br>`backend/src/database/knowledge_graph_schema.sql`<br>`backend/src/database/laboratory_erp_schema.sql` |
| M074 | Fertility Management | Soil | `backend/src/modules/M074/controller.js`<br>`backend/src/modules/M074/index.js`<br>`backend/src/modules/M074/model.sql` |
| M075 | Irrigation Management | Water | `backend/src/database/digital_product_passport_schema.sql`<br>`backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/011_farmer_portal_enhancements.sql` |
| M079 | Watershed Management | Water | `backend/src/modules/M079/controller.js`<br>`backend/src/modules/M079/index.js`<br>`backend/src/modules/M079/model.sql` |
| M093 | Labour Management | Operations | `backend/src/database/migrations/993_enterprise_control_layer.sql` |
| M094 | Contractor Management | Operations | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql` |
| M101 | Tractor Management | Machinery | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql`<br>`backend/src/database/migrations/042_rural_procurement_logistics_mobility_schema.sql` |
| M102 | Implement Management | Machinery | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/009_marketplace_enhancements.sql`<br>`backend/src/database/migrations/010_insurance_enhancements.sql` |
| M105 | Fleet Management | Machinery | `backend/src/database/ai_copilot_schema.sql`<br>`backend/src/database/logistics_enhancement_schema.sql`<br>`backend/src/database/migrations/013_logistics_enhancements.sql` |
| M108 | Fuel Management | Machinery | `backend/src/database/logistics_enhancement_schema.sql`<br>`backend/src/database/migrations/013_logistics_enhancements.sql`<br>`backend/src/database/migrations/034_logistics_enhancement_schema.sql` |
| M113 | Biofertilizer Management | Input Supply | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/rural_life_os_schema.sql` |
| M116 | Micronutrient Management | Input Supply | `backend/src/database/consumer_health_schema.sql`<br>`backend/src/database/migrations/020_consumer_health_schema.sql`<br>`backend/src/database/migrations/036_nutrition_intelligence_schema.sql` |
| M121 | Dairy Management | Livestock | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/food_intelligence_schema.sql`<br>`backend/src/database/migrations/009_marketplace_enhancements.sql` |
| M123 | Poultry Management | Livestock | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/rural_life_os_schema.sql`<br>`backend/src/modules/M123/controller.js` |
| M128 | Feed Management | Livestock | `backend/src/core/decisionEngine.js`<br>`backend/src/core/effectors.js`<br>`backend/src/core/outcomeSink.js` |
| M129 | Breeding Management | Livestock | `backend/src/database/biodiversity_schema.sql`<br>`backend/src/database/migrations/018_biodiversity_schema.sql`<br>`backend/src/modules/M129/controller.js` |
| M132 | Pond Management | Fisheries | `backend/src/core/withTransaction.js`<br>`backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql` |
| M133 | Hatchery Management | Fisheries | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/rural_life_os_schema.sql`<br>`backend/src/modules/M133/controller.js` |
| M137 | Harvest Management (Fisheries) | Fisheries | `backend/src/core/effectors.js`<br>`backend/src/core/erpAgents.js`<br>`backend/src/database/biodiversity_schema.sql` |
| M141 | Orchard Management | Horticulture | `backend/src/modules/M141/controller.js`<br>`backend/src/modules/M141/index.js`<br>`backend/src/modules/M141/model.sql` |
| M143 | Floriculture Management | Horticulture | `backend/src/modules/M143/controller.js`<br>`backend/src/modules/M143/index.js`<br>`backend/src/modules/M143/model.sql` |
| M144 | Greenhouse Management | Horticulture | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/iot_integration_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql` |
| M145 | Polyhouse Management | Horticulture | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql`<br>`backend/src/modules/M145/controller.js` |
| M146 | Hydroponics Management | Horticulture | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/rural_life_os_schema.sql`<br>`backend/src/modules/M146/controller.js` |
| M147 | Aeroponics Management | Horticulture | `backend/src/modules/M147/controller.js`<br>`backend/src/modules/M147/index.js`<br>`backend/src/modules/M147/model.sql` |

## CLUBBED — 20

| ID | Module | Domain | Evidence |
|---|---|---|---|
| M017 | Multi-Factor Authentication | Identity | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/pool.js`<br>`backend/src/database/schema.sql`<br>`backend/src/services/authService.js` |
| M021 | Farmer Registry | Farmer | `backend/src/database/gi_intelligence_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/027_gi_intelligence_schema.sql`<br>`backend/src/database/migrations/038_organic_traceability_schema.sql` |
| M023 | Farmer Family | Farmer | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/994_recovered_capabilities.sql`<br>`backend/src/database/pool.js`<br>`backend/src/database/rural_life_os_schema.sql` |
| M024 | Farmer KYC | Farmer | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/schema.sql`<br>`backend/src/services/authService.js`<br>`backend/src/tests/e2e/farmer-journey.test.js` |
| M025 | Farmer Verification | Farmer | `backend/src/database/blockchain_traceability_schema.sql`<br>`backend/src/database/digital_product_passport_schema.sql`<br>`backend/src/database/gi_intelligence_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql` |
| M031 | Land Registry | Land | `backend/src/core/erpAgents.js`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/038_organic_traceability_schema.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql` |
| M033 | Land Lease Management | Land | `backend/src/core/erpAgents.js`<br>`backend/src/core/withTransaction.js`<br>`backend/src/database/connection.js`<br>`backend/src/database/migrate.js` |
| M048 | Producer Group Management | Community | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/992_v42_recovered_intelligence.sql`<br>`backend/src/database/migrations/998_foreign_key_indexes.sql` |
| M052 | FPO Governance | FPO | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/042_rural_procurement_logistics_mobility_schema.sql`<br>`backend/src/database/migrations/060_experience_layer_dxp.sql`<br>`backend/src/database/rural_procurement_logistics_mobility_schema.sql` |
| M053 | FPO Membership | FPO | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/042_rural_procurement_logistics_mobility_schema.sql`<br>`backend/src/database/rural_life_os_schema.sql`<br>`backend/src/database/rural_procurement_logistics_mobility_schema.sql` |
| M054 | FPO Finance | FPO | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/053_v42_recovered_finance.sql`<br>`backend/src/database/migrations/998_foreign_key_indexes.sql`<br>`backend/src/database/rural_life_os_schema.sql` |
| M055 | FPO Procurement | FPO | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/042_rural_procurement_logistics_mobility_schema.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/database/rural_procurement_logistics_mobility_schema.sql` |
| M056 | FPO Inventory | FPO | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/database/migrations/059_yield_management_pricing.sql`<br>`backend/src/database/migrations/998_foreign_key_indexes.sql`<br>`backend/src/services/dynamicPricingService.js` |
| M058 | FPO Sales | FPO | `backend/src/database/gi_intelligence_schema.sql`<br>`backend/src/database/migrations/027_gi_intelligence_schema.sql`<br>`backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql` |
| M060 | FPO Analytics | FPO | `backend/src/database/blockchain_traceability_schema.sql`<br>`backend/src/database/gi_intelligence_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/019_blockchain_traceability_schema.sql` |
| M091 | Farm Activity Management | Operations | `backend/src/core/erpAgents.js`<br>`backend/src/database/conversational_ai_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/021_conversational_ai_schema.sql` |
| M099 | Farm Productivity | Operations | `backend/src/database/migrations/023_engineering_schema.sql`<br>`backend/src/database/migrations/991_aeos_folu_ne_policy.sql`<br>`backend/src/services/moduleCatalogService.js`<br>`frontend/src/pages/SubsidyManagementPage.jsx` |
| M118 | Input Procurement | Input Supply | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/042_rural_procurement_logistics_mobility_schema.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql` |
| M119 | Input Distribution | Input Supply | `backend/src/database/migrations/054_v8_v9_commerce_recovery.sql`<br>`backend/src/database/migrations/995_erp_process_layer.sql`<br>`backend/src/routes/vendorRoutes.js`<br>`frontend/src/components/Marketplace/ProductReview.jsx` |
| M126 | Pig Farming Management | Livestock | `backend/src/services/catalogIntelligenceService.js`<br>`backend/src/services/farmerTrainingService.js`<br>`backend/src/services/preSeasonOrderService.js`<br>`backend/src/services/soilTestingService.js` |

## HIDDEN — 73

| ID | Module | Domain | Evidence |
|---|---|---|---|
| M007 | Feature Flag Management | Platform Foundation | `backend/src/database/migrations/1001_platform_configuration.sql`<br>`backend/src/modules/M007/controller.js`<br>`backend/src/modules/M007/index.js` |
| M009 | Time Zone Management | Platform Foundation | `backend/src/database/form_management_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/026_form_management_schema.sql` |
| M016 | Single Sign-On | Identity | `backend/src/core/decisionEngine.js`<br>`backend/src/modules/M016/controller.js`<br>`backend/src/modules/M016/index.js` |
| M022 | Farmer Profile | Farmer | `backend/src/database/conversational_ai_schema.sql`<br>`backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/021_conversational_ai_schema.sql` |
| M026 | Farmer Skill Management | Farmer | `backend/src/services/farmerTrainingService.js` |
| M027 | Farmer Certification | Farmer | `backend/src/database/migrations/000_base_schema.sql`<br>`backend/src/database/migrations/998_foreign_key_indexes.sql`<br>`backend/src/database/schema.sql` |
| M028 | Farmer Advisory | Farmer | `backend/src/database/migrations/058_sam_ai_orchestration.sql` |
| M030 | Farmer Performance | Farmer | `backend/src/services/dynamicPricingService.js`<br>`backend/src/services/preSeasonOrderService.js` |
| M032 | Land Ownership | Land | `backend/src/services/landRecordsService.js`<br>`backend/src/services/subsidyService.js` |
| M034 | Parcel Mapping | Land | `backend/src/modules/M034/controller.js`<br>`backend/src/modules/M034/index.js`<br>`backend/src/modules/M034/model.sql` |
| M035 | GIS Land Mapping | Land | `backend/src/modules/M035/controller.js`<br>`backend/src/modules/M035/index.js`<br>`backend/src/modules/M035/model.sql` |
| M036 | Soil Mapping | Land | `backend/src/tests/e2e/farmer-journey.test.js` |
| M037 | Water Resource Mapping | Land | `backend/src/modules/M037/controller.js`<br>`backend/src/modules/M037/index.js`<br>`backend/src/modules/M037/model.sql` |
| M038 | Geo Boundary Management | Land | `backend/src/modules/M038/controller.js`<br>`backend/src/modules/M038/index.js`<br>`backend/src/modules/M038/model.sql` |
| M041 | Village Registry | Community | `backend/src/modules/M041/controller.js`<br>`backend/src/modules/M041/index.js`<br>`backend/src/modules/M041/model.sql` |
| M049 | Community Asset Management | Community | `backend/src/modules/M049/controller.js`<br>`backend/src/modules/M049/index.js`<br>`backend/src/modules/M049/model.sql` |
| M051 | FPO Registration | FPO | `backend/src/modules/M051/controller.js`<br>`backend/src/modules/M051/index.js`<br>`backend/src/modules/M051/model.sql` |
| M057 | FPO Marketing | FPO | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/middleware/compliance.js`<br>`backend/src/services/neProductIntelligenceService.js` |
| M059 | FPO Compliance | FPO | `backend/src/modules/M059/controller.js`<br>`backend/src/modules/M059/index.js`<br>`backend/src/modules/M059/model.sql` |
| M062 | Crop Calendar | Crop | `backend/src/modules/M062/controller.js`<br>`backend/src/modules/M062/index.js`<br>`backend/src/modules/M062/model.sql` |
| M063 | Crop Registration | Crop | `backend/src/modules/M063/controller.js`<br>`backend/src/modules/M063/index.js`<br>`backend/src/modules/M063/model.sql` |
| M064 | Crop Variety Management | Crop | `backend/src/modules/M064/controller.js`<br>`backend/src/modules/M064/index.js`<br>`backend/src/modules/M064/model.sql` |
| M065 | Seed Planning | Crop | `backend/src/modules/M065/controller.js`<br>`backend/src/modules/M065/index.js`<br>`backend/src/modules/M065/model.sql` |
| M068 | Crop Monitoring | Crop | `backend/src/modules/M068/controller.js`<br>`backend/src/modules/M068/index.js`<br>`backend/src/modules/M068/model.sql` |
| M069 | Harvest Planning | Crop | `backend/src/modules/M069/controller.js`<br>`backend/src/modules/M069/index.js`<br>`backend/src/modules/M069/model.sql` |
| M070 | Yield Recording | Crop | `backend/src/modules/M070/controller.js`<br>`backend/src/modules/M070/index.js`<br>`backend/src/modules/M070/model.sql` |
| M071 | Soil Health Management | Soil | `backend/src/database/digital_product_passport_schema.sql`<br>`backend/src/database/migrations/022_digital_product_passport_schema.sql`<br>`backend/src/database/migrations/041_rural_life_os_schema.sql` |
| M076 | Water Budgeting | Water | `backend/src/modules/M076/controller.js`<br>`backend/src/modules/M076/index.js`<br>`backend/src/modules/M076/model.sql` |
| M077 | Water Quality Monitoring | Water | `backend/src/modules/M077/controller.js`<br>`backend/src/modules/M077/index.js`<br>`backend/src/modules/M077/model.sql` |
| M078 | Rainwater Harvesting | Water | `backend/src/modules/M078/controller.js`<br>`backend/src/modules/M078/index.js`<br>`backend/src/modules/M078/model.sql` |
| M080 | Water Analytics | Water | `backend/src/modules/M080/controller.js`<br>`backend/src/modules/M080/index.js`<br>`backend/src/modules/M080/model.sql` |
| M081 | Weather Monitoring | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql` |
| M082 | Weather Forecasting | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql` |
| M083 | Climate Advisory | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/modules/M083/controller.js`<br>`backend/src/modules/M083/index.js` |
| M084 | Disaster Alerts | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql` |
| M085 | Drought Monitoring | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql` |
| M086 | Flood Monitoring | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql` |
| M087 | Pest Forecasting | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/modules/M087/controller.js`<br>`backend/src/modules/M087/index.js` |
| M088 | Disease Forecasting | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/modules/M088/controller.js`<br>`backend/src/modules/M088/index.js` |
| M089 | Climate Risk Assessment | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/modules/M089/controller.js`<br>`backend/src/modules/M089/index.js` |
| M090 | Agro-Meteorology | Climate | `backend/src/database/migrations/057_climate_weather_d14.sql` |
| M092 | Farm Task Scheduling | Operations | `backend/src/database/migrations/023_engineering_schema.sql` |
| M095 | Machinery Operations | Operations | `backend/src/modules/M095/controller.js`<br>`backend/src/modules/M095/index.js`<br>`backend/src/modules/M095/model.sql` |
| M096 | Equipment Scheduling | Operations | `backend/src/modules/M096/controller.js`<br>`backend/src/modules/M096/index.js`<br>`backend/src/modules/M096/model.sql` |
| M097 | Input Consumption | Operations | `backend/src/modules/M097/controller.js`<br>`backend/src/modules/M097/index.js`<br>`backend/src/modules/M097/model.sql` |
| M098 | Farm Costing | Operations | `backend/src/database/migrations/054_v8_v9_commerce_recovery.sql`<br>`backend/src/services/recipeIntelligenceService.js` |
| M100 | Farm Operations Dashboard | Operations | `backend/src/database/migrations/057_climate_weather_d14.sql`<br>`backend/src/services/advancedAIService.js` |
| M103 | Equipment Inventory | Machinery | `backend/src/modules/M103/controller.js`<br>`backend/src/modules/M103/index.js`<br>`backend/src/modules/M103/model.sql` |
| M104 | Equipment Rental | Machinery | `backend/src/database/migrations/991_aeos_folu_ne_policy.sql`<br>`backend/src/modules/M104/controller.js`<br>`backend/src/modules/M104/index.js` |
| M106 | Preventive Maintenance | Machinery | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql`<br>`backend/src/database/migrations/995_erp_process_layer.sql` |
| M107 | Breakdown Maintenance | Machinery | `backend/src/modules/M107/controller.js`<br>`backend/src/modules/M107/index.js`<br>`backend/src/modules/M107/model.sql` |
| M109 | Spare Parts Management | Machinery | `backend/src/modules/M109/controller.js`<br>`backend/src/modules/M109/index.js`<br>`backend/src/modules/M109/model.sql` |
| M110 | Asset Lifecycle Management | Machinery | `backend/src/modules/M110/controller.js`<br>`backend/src/modules/M110/index.js`<br>`backend/src/modules/M110/model.sql` |
| M111 | Seed Inventory | Input Supply | `frontend/src/pages/SeedVaultPage.jsx` |
| M112 | Fertilizer Inventory | Input Supply | `backend/src/modules/M112/controller.js`<br>`backend/src/modules/M112/index.js`<br>`backend/src/modules/M112/model.sql` |
| M114 | Pesticide Inventory | Input Supply | `backend/src/database/migrations/056_named_missing_modules.sql` |
| M115 | Bio-Pesticide Management | Input Supply | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/056_named_missing_modules.sql` |
| M117 | Organic Input Management | Input Supply | `backend/src/database/migrations/038_organic_traceability_schema.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/992_v42_recovered_intelligence.sql` |
| M120 | Input Traceability | Input Supply | `backend/src/services/rfqService.js` |
| M122 | Cattle Registry | Livestock | `backend/src/modules/M122/controller.js`<br>`backend/src/modules/M122/index.js`<br>`backend/src/modules/M122/model.sql` |
| M124 | Goat Farming Management | Livestock | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/rural_life_os_schema.sql` |
| M127 | Animal Health Management | Livestock | `backend/src/modules/M127/controller.js`<br>`backend/src/modules/M127/index.js`<br>`backend/src/modules/M127/model.sql` |
| M130 | Livestock Analytics | Livestock | `backend/src/modules/M130/controller.js`<br>`backend/src/modules/M130/index.js`<br>`backend/src/modules/M130/model.sql` |
| M131 | Biofloc Farm Management | Fisheries | `backend/src/modules/M131/controller.js`<br>`backend/src/modules/M131/index.js`<br>`backend/src/modules/M131/model.sql` |
| M134 | Fish Feed Management | Fisheries | `backend/src/modules/M134/controller.js`<br>`backend/src/modules/M134/index.js`<br>`backend/src/modules/M134/model.sql` |
| M135 | Water Quality Control | Fisheries | `backend/src/modules/M135/controller.js`<br>`backend/src/modules/M135/index.js`<br>`backend/src/modules/M135/model.sql` |
| M136 | Fish Health Management | Fisheries | `backend/src/modules/M136/controller.js`<br>`backend/src/modules/M136/index.js`<br>`backend/src/modules/M136/model.sql` |
| M138 | Fish Processing Management | Fisheries | `backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/modules/M138/controller.js`<br>`backend/src/modules/M138/index.js` |
| M139 | Cold Fish Chain | Fisheries | `backend/src/database/migrations/041_rural_life_os_schema.sql`<br>`backend/src/database/migrations/055_business_report_recovery.sql`<br>`backend/src/database/migrations/991_aeos_folu_ne_policy.sql` |
| M140 | Aquaculture Analytics | Fisheries | `backend/src/modules/M140/controller.js`<br>`backend/src/modules/M140/index.js`<br>`backend/src/modules/M140/model.sql` |
| M142 | Vegetable Production | Horticulture | `backend/src/modules/M142/controller.js`<br>`backend/src/modules/M142/index.js`<br>`backend/src/modules/M142/model.sql` |
| M149 | Protected Cultivation | Horticulture | `backend/src/database/biodiversity_schema.sql`<br>`backend/src/database/migrations/018_biodiversity_schema.sql`<br>`backend/src/services/biodiversityService.js` |
| M150 | Horticulture Analytics | Horticulture | `backend/src/modules/M150/controller.js`<br>`backend/src/modules/M150/index.js`<br>`backend/src/modules/M150/model.sql` |

## FOUND — 3

| ID | Module | Domain | Evidence |
|---|---|---|---|
| M040 | Digital Land Records | Land | `backend/src/services/landRecordsService.js`<br>`frontend/src/components/FarmerPortal/LandRecords.jsx` |
| M061 | Crop Planning | Crop | `backend/src/services/cropPlanningService.js` |
| M072 | Soil Test Management | Soil | `backend/src/services/soilTestingService.js` |

## Named-missing modules from the source documents

| Module | Verdict | Evidence |
|---|---|---|
| RFQ (Request for Quote) & Dynamic Negotiation Engine | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql` |
| Subscription / "SIP" (Systematic Investment Plan) for Staples | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/services/commerceRulesService.js` |
| "Quote-to-Order" Conversion Dashboard | CLUBBED | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/services/enterpriseControlService.js`<br>`backend/src/services/rfqService.js`<br>`frontend/src/pages/RfqPage.jsx` |
| Sponsored GI Listings (Auction-based) | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql` |
| Affiliate & Influencer Tracking | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql` |
| Pixel & Retargeting Integration | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |
| TDS (Tax Deducted at Source) Engine | LEAD | `backend/src/database/engineering_schema.sql`<br>`backend/src/database/logistics_enhancement_schema.sql`<br>`backend/src/database/migrations/023_engineering_schema.sql` |
| Automated Bank Reconciliation (via UPI/Razorpay) | HIDDEN | `backend/src/database/migrations/023_engineering_schema.sql` |
| Asset Capitalization & Depreciation Schedule | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |
| E-Invoice IRN (Invoice Reference Number) Generation | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql`<br>`backend/src/services/complianceService.js` |
| GSTR-1 & GSTR-3B Auto-Population | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |
| Reverse Charge Mechanism (RCM) Handler | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |
| Farm Plot & Land Bank Management | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql` |
| Agri-Input Inventory (Seed/Fertilizer/PPE) Tracking | HIDDEN | `backend/src/database/migrations/056_named_missing_modules.sql` |
| Mandi / APMC Price Integration (Live) | HIDDEN | `backend/src/services/marketDataService.js` |
| Quality Control (QC) Hold & Release Workflow | HIDDEN | `backend/src/core/erpAgents.js`<br>`backend/src/services/enterpriseControlService.js` |
| Multi-Location FPO Cost Centers | ABSENT | _no occurrence of these terms anywhere in backend or frontend_ |