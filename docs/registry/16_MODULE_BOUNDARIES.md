# Module Boundary Cards

**Generated:** 2026-08-04 by `tools/wireframe-boundaries.js`
**Status:** DESCRIPTIVE — measured from source, comments stripped.
**Do not edit by hand.**

---

One card per module: what it owns, what it imports, whether it stays inside
its layer.

### digitalProductPassportService  `services/digitalProductPassportService.js`

| | |
|---|---|
| Layer | services |
| Lines | 1059 |
| Endpoints | 25 (12 write) |
| Imports layers | utils, middleware, database |
| Tables touched | product_ids, batch_tracking, farm_information, farmer_information, certification_information, processing_history, logistics_history, sustainability_data, carbon_data, quality_reports, recall_status, qr_codes |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### foodSafetyService  `services/foodSafetyService.js`

| | |
|---|---|
| Layer | services |
| Lines | 936 |
| Endpoints | 21 (12 write) |
| Imports layers | utils, middleware, database |
| Tables touched | haccp_plans, haccp_monitoring_records, fssai_compliance, iso22000_compliance, food_safety_recalls, recall, capa_records, capa, food_safety_audits, food_safety_risk_assessments, corrective_actions, corrective |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### indigenousKnowledgeService  `services/indigenousKnowledgeService.js`

| | |
|---|---|
| Layer | services |
| Lines | 825 |
| Endpoints | 19 (10 write) |
| Imports layers | utils, middleware, database |
| Tables touched | traditional_recipes, traditional_medicine, indigenous_farming_practices, oral_history, tribal_knowledge, indigenous_documentation, indigenous_protection, protection, indigenous_ip_management |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### biodiversityService  `services/biodiversityService.js`

| | |
|---|---|
| Layer | services |
| Lines | 896 |
| Endpoints | 17 (8 write) |
| Imports layers | utils, middleware, database |
| Tables touched | species_database, native_crops_database, traditional_varieties_database, medicinal_plants_database, wild_foods_database, conservation_tracking, conservation, biodiversity_risk_predictions |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### recipeIntelligenceService  `services/recipeIntelligenceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 907 |
| Endpoints | 17 (7 write) |
| Imports layers | utils, middleware, database |
| Tables touched | recipe_database, ingredient, institutional_recipes |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### institutionalProcurementService  `services/institutionalProcurementService.js`

| | |
|---|---|
| Layer | services |
| Lines | 785 |
| Endpoints | 16 (8 write) |
| Imports layers | utils, middleware, database |
| Tables touched | procurement_tenders, tender_bids, demand_forecasts, menu_plans, nutrition_compliance, supply_contracts, quality_inspections, settlement_records |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### shelfLifeService  `services/shelfLifeService.js`

| | |
|---|---|
| Layer | services |
| Lines | 881 |
| Endpoints | 16 (7 write) |
| Imports layers | utils, middleware, core, database |
| Tables touched | temperature_monitoring, humidity_monitoring, packaging_analysis, transport_analysis, storage_analysis, shelf_life_predictions, spoilage_risk_predictions |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### omnichannelAIService  `services/omnichannelAIService.js`

| | |
|---|---|
| Layer | services |
| Lines | 789 |
| Endpoints | 15 (12 write) |
| Imports layers | utils, middleware, database |
| Tables touched | omnichannel_sessions, omnichannel_messages, omnichannel_config, android_push_notifications, ios_push_notifications, whatsapp_templates, sms_messages, telegram_messages, email_messages, ivr_call_flows, kiosk_screens, channel |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### consumerHealthService  `services/consumerHealthService.js`

| | |
|---|---|
| Layer | services |
| Lines | 658 |
| Endpoints | 14 (7 write) |
| Imports layers | utils, middleware, database |
| Tables touched | health_profiles, dietary_profiles, health_metrics, health_goals, dietary_recommendations, health_alerts, food_consumption_logs, health_analytics |
| Status | **Complete** |
| Boundary violations | BR-08 |

### enterpriseControlService  `services/enterpriseControlService.js`

| | |
|---|---|
| Layer | services |
| Lines | 565 |
| Endpoints | 13 (7 write) |
| Imports layers | database, middleware, utils, core |
| Tables touched | workflow_definitions, workflow_steps, workflow_instances, workflow_actions, v_pending_approvals, crm_leads, clients, crm_opportunities, v_sales_pipeline, crm_activities, v_legal_calendar, risk_register |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### laboratoryERPService  `services/laboratoryERPService.js`

| | |
|---|---|
| Layer | services |
| Lines | 602 |
| Endpoints | 13 (6 write) |
| Imports layers | utils, middleware, database |
| Tables touched | laboratories, addresses, test_categories, test_methods, sample_registrations, test_assignments, test, certification_reports, sample_tracking |
| Status | **Complete** |
| Boundary violations | BR-08 |

### organicTraceabilityService  `services/organicTraceabilityService.js`

| | |
|---|---|
| Layer | services |
| Lines | 675 |
| Endpoints | 13 (7 write) |
| Imports layers | utils, middleware, database |
| Tables touched | organic_farms, organic_standards, addresses, organic_plots, organic_crops, organic_harvests, organic_chain_of_custody, organic_consumer_transparency, organic_fraud_alerts |
| Status | **Complete** |
| Boundary violations | BR-08 |

### aiCopilotService  `services/aiCopilotService.js`

| | |
|---|---|
| Layer | services |
| Lines | 592 |
| Endpoints | 11 (3 write) |
| Imports layers | utils, middleware, database |
| Tables touched | copilot_sessions, copilot_messages, transaction_date, financial_transactions, logistics_routes, warehouse_inventory, insurance_policies, food_composition, marketplace_analytics |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### giIntelligenceService  `services/giIntelligenceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 587 |
| Endpoints | 11 (6 write) |
| Imports layers | utils, middleware, database |
| Tables touched | gi_products, gi_producers, users, addresses, gi_product_pricing, gi_authentication, gi_marketplace_listings, gi_analytics |
| Status | **Complete** |
| Boundary violations | BR-08 |

### insuranceService  `services/insuranceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 687 |
| Endpoints | 11 (5 write) |
| Imports layers | utils, database, middleware |
| Tables touched | policies, insurance_products, users, master_policies, claims, farmers |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### iotIntegrationService  `services/iotIntegrationService.js`

| | |
|---|---|
| Layer | services |
| Lines | 579 |
| Endpoints | 11 (6 write) |
| Imports layers | utils, middleware, core, database |
| Tables touched | iot_devices, device, sensor_data, device_commands, device_alerts, iot_analytics |
| Status | **Complete** |
| Boundary violations | BR-08 |

### logisticsService  `services/logisticsService.js`

| | |
|---|---|
| Layer | services |
| Lines | 598 |
| Endpoints | 11 (5 write) |
| Imports layers | utils, database, middleware |
| Tables touched | shipments, shipment_modes, orders, shipment_tracking, added, vehicles, drivers |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### multilingualService  `services/multilingualService.js`

| | |
|---|---|
| Layer | services |
| Lines | 722 |
| Endpoints | 11 (5 write) |
| Imports layers | utils, middleware, database |
| Tables touched | languages, language_detection_logs, translation_memory, translation_requests, content_translations, user_language_preferences, user, preferences, language, pronunciation_guides |
| Status | **Complete** |
| Boundary violations | BR-08 |

### v42IntelligenceService  `services/v42IntelligenceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 467 |
| Endpoints | 11 (3 write) |
| Imports layers | database, middleware, utils |
| Tables touched | crop_concept_terms, crop_concepts, freight_lanes, transport_modes, freight_slots, v_freight_slot_availability, promo_codes, handling_engines, handling_engine_rules, organic_input_rates, insurance_plan_catalog, accessibility_modes |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### arVrService  `services/arVrService.js`

| | |
|---|---|
| Layer | services |
| Lines | 503 |
| Endpoints | 10 (7 write) |
| Imports layers | utils, middleware, database |
| Tables touched | ar_vr_experiences, ar_vr_assets, interaction_points, ar_vr_sessions, ar_vr_analytics |
| Status | **Complete** |
| Boundary violations | BR-08 |

### authService  `services/authService.js`

| | |
|---|---|
| Layer | services |
| Lines | 1183 |
| Endpoints | 10 (8 write) |
| Imports layers | utils, database, middleware |
| Tables touched | users, user_profiles, refresh_tokens |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### blockchainTraceabilityService  `services/blockchainTraceabilityService.js`

| | |
|---|---|
| Layer | services |
| Lines | 533 |
| Endpoints | 10 (6 write) |
| Imports layers | utils, middleware, database |
| Tables touched | blockchain_transactions, traceability_events, users, addresses, chain_of_custody, blockchain_certificates, verification_requests, blockchain_analytics |
| Status | **Complete** |
| Boundary violations | BR-08 |

### conversationalAIService  `services/conversationalAIService.js`

| | |
|---|---|
| Layer | services |
| Lines | 557 |
| Endpoints | 10 (6 write) |
| Imports layers | utils, middleware, database |
| Tables touched | conversation_sessions, conversation_domains, conversation_messages, conversation_context, conversation_analytics |
| Status | **Complete** |
| Boundary violations | BR-08 |

### foodIntelligenceService  `services/foodIntelligenceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 587 |
| Endpoints | 10 (6 write) |
| Imports layers | utils, middleware, database |
| Tables touched | food_items, food_categories, food_quality_assessments, contaminant_types, food_contaminant_tests, food_freshness_assessments, food_recalls, food_intelligence_analytics |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### merchandisingService  `services/merchandisingService.js`

| | |
|---|---|
| Layer | services |
| Lines | 461 |
| Endpoints | 10 (0 write) |
| Imports layers | utils |
| Tables touched | harvest, light, this |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### nutritionIntelligenceService  `services/nutritionIntelligenceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 579 |
| Endpoints | 10 (5 write) |
| Imports layers | utils, middleware, database |
| Tables touched | nutrients, nutrient_categories, food_nutrition_profiles, product_nutrition, product_nutrition_scores, nutrition_pricing_rules, product_nutrition_pricing, nutrition_comparisons, dietary_profiles |
| Status | **Complete** |
| Boundary violations | BR-08 |

### offlinePaymentService  `services/offlinePaymentService.js`

| | |
|---|---|
| Layer | services |
| Lines | 699 |
| Endpoints | 10 (6 write) |
| Imports layers | utils, middleware, database |
| Tables touched | offline_payment_requests, offline_transactions, user_payment_settings, offline_sync_queue, transactions, user_wallets, wallet, ussd_payment_requests |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### orderService  `services/orderService.js`

| | |
|---|---|
| Layer | services |
| Lines | 777 |
| Endpoints | 10 (7 write) |
| Imports layers | utils, database, middleware, core |
| Tables touched | cart, products, units, orders, order_items, product, users, addresses, payments, coupons, auth |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### voiceAIService  `services/voiceAIService.js`

| | |
|---|---|
| Layer | services |
| Lines | 495 |
| Endpoints | 10 (7 write) |
| Imports layers | utils, middleware, database |
| Tables touched | voice_sessions, voice_commands, speech_recognition_logs, voice_responses, voice_preferences, voice_analytics |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### predictiveAnalyticsService  `services/predictiveAnalyticsService.js`

| | |
|---|---|
| Layer | services |
| Lines | 480 |
| Endpoints | 9 (5 write) |
| Imports layers | utils, middleware, database |
| Tables touched | predictive_models, predictions, forecasts, prediction_alerts, predictive_analytics |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### advancedAIService  `services/advancedAIService.js`

| | |
|---|---|
| Layer | services |
| Lines | 1543 |
| Endpoints | 8 (6 write) |
| Imports layers | utils, database, middleware, core |
| Tables touched | order_items, orders, time_series, competitor_prices, market_analysis, competitor_analysis, farmers, users, user_profiles, loans, farm_operations, sales |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### catalogIntelligenceService  `services/catalogIntelligenceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 904 |
| Endpoints | 8 (0 write) |
| Imports layers | utils |
| Tables touched | being |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### financialService  `services/financialService.js`

| | |
|---|---|
| Layer | services |
| Lines | 527 |
| Endpoints | 8 (4 write) |
| Imports layers | utils, database, middleware |
| Tables touched | loans, emi_schedule, farmers, advances, contracts, credit_scores |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### formService  `services/formService.js`

| | |
|---|---|
| Layer | services |
| Lines | 435 |
| Endpoints | 8 (4 write) |
| Imports layers | utils, database, middleware |
| Tables touched | form_definitions, form_submissions, logical, failed |
| Status | **Complete** |
| Boundary violations | BR-08 |

### offlineSyncService  `services/offlineSyncService.js`

| | |
|---|---|
| Layer | services |
| Lines | 834 |
| Endpoints | 8 (4 write) |
| Imports layers | utils, middleware, database |
| Tables touched | sync_queue, orders, products, user_profiles, inventory, transactions, generic_entities, sync_conflicts, user_sync_preferences, users, sync |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### productService  `services/productService.js`

| | |
|---|---|
| Layer | services |
| Lines | 549 |
| Endpoints | 8 (3 write) |
| Imports layers | utils, database, middleware |
| Tables touched | products, categories, states, units, certifications |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### valueCommerceService  `services/valueCommerceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 457 |
| Endpoints | 8 (3 write) |
| Imports layers | utils, middleware, database |
| Tables touched | value_factors, product_value_scores, product_value_pricing, consumer_value_preferences, products, value_recommendations, value_tiers |
| Status | **Complete** |
| Boundary violations | BR-08 |

### erpService  `services/erpService.js`

| | |
|---|---|
| Layer | services |
| Lines | 943 |
| Endpoints | 7 (6 write) |
| Imports layers | utils, database, middleware |
| Tables touched | products, categories, states, units, orders, users, addresses, order_items, farmers, fpos, financial_transactions, assets |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### knowledgeGraphService  `services/knowledgeGraphService.js`

| | |
|---|---|
| Layer | services |
| Lines | 391 |
| Endpoints | 7 (5 write) |
| Imports layers | utils, middleware, database |
| Tables touched | knowledge_nodes, knowledge_relationships, graph_queries, query_results, knowledge_analytics |
| Status | **Complete** |
| Boundary violations | BR-08 |

### advancedVoiceAI  `services/advancedVoiceAI.js`

| | |
|---|---|
| Layer | services |
| Lines | 758 |
| Endpoints | 6 (3 write) |
| Imports layers | utils, middleware, database |
| Tables touched | farmers, orders, voice_conversation_turns, voice_conversations |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### neProductIntelligenceService  `services/neProductIntelligenceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 347 |
| Endpoints | 6 (4 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### aiService  `services/aiService.js`

| | |
|---|---|
| Layer | services |
| Lines | 663 |
| Endpoints | 5 (5 write) |
| Imports layers | utils, database, middleware |
| Tables touched | order_items, orders, products, categories, states, farmers, users, loans |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### commerceRulesService  `services/commerceRulesService.js`

| | |
|---|---|
| Layer | services |
| Lines | 275 |
| Endpoints | 5 (3 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### farmerValueService  `services/farmerValueService.js`

| | |
|---|---|
| Layer | services |
| Lines | 462 |
| Endpoints | 5 (1 write) |
| Imports layers | database, middleware, utils, core |
| Tables touched | farm_consumables, rural_economic_units, farmers, farmer_revenue, yield_actuals, v_ne_organic_status, subsidy_claims, schemes, farmer_value_index, farmer_cash_flow |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### smsAuthService  `services/smsAuthService.js`

| | |
|---|---|
| Layer | services |
| Lines | 583 |
| Endpoints | 5 (4 write) |
| Imports layers | utils, database, middleware |
| Tables touched | users, user_profiles, sms_otps, pending_registrations |
| Status | **Complete with gaps** |
| Boundary violations | BR-08 |

### moduleCatalogService  `services/moduleCatalogService.js`

| | |
|---|---|
| Layer | services |
| Lines | 237 |
| Endpoints | 4 (1 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete with gaps** |
| Boundary violations | _none_ |

### analyticsService  `services/analyticsService.js`

| | |
|---|---|
| Layer | services |
| Lines | 126 |
| Endpoints | 2 (0 write) |
| Imports layers | utils |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### advancedFeaturesService  `services/advancedFeaturesService.js`

| | |
|---|---|
| Layer | services |
| Lines | 515 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | farmers, orders, smart_contracts, iot_devices, iot_readings, iot_automation_rules, demand_forecasts, farmer_wallets, ar_vr_experiences |
| Status | **Complete** |
| Boundary violations | BR-08 |

### auditService  `services/auditService.js`

| | |
|---|---|
| Layer | services |
| Lines | 350 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | audit_logs, users, compliance_reports |
| Status | **Complete** |
| Boundary violations | _none_ |

### bulkOrderService  `services/bulkOrderService.js`

| | |
|---|---|
| Layer | services |
| Lines | 511 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | products, bulk_orders, users, bulk_order_quotations, orders, order_items |
| Status | **Complete** |
| Boundary violations | BR-08 |

### cropPlanningService  `services/cropPlanningService.js`

| | |
|---|---|
| Layer | services |
| Lines | 520 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | land_records, crop_plans |
| Status | **Complete** |
| Boundary violations | _none_ |

### decisionSupportService  `services/decisionSupportService.js`

| | |
|---|---|
| Layer | services |
| Lines | 323 |
| Endpoints | 0 (0 write) |
| Imports layers | routes |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### dynamicPricingService  `services/dynamicPricingService.js`

| | |
|---|---|
| Layer | services |
| Lines | 476 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### enterpriseAIService  `services/enterpriseAIService.js`

| | |
|---|---|
| Layer | services |
| Lines | 458 |
| Endpoints | 0 (0 write) |
| Imports layers | _none_ |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### farmerService  `services/farmerService.js`

| | |
|---|---|
| Layer | services |
| Lines | 581 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database, middleware |
| Tables touched | farmers, users, fpos, farmer_certifications, training_records, orders, wallet_transactions, farmer_wallets, wallet, farmer_bank_accounts |
| Status | **Complete** |
| Boundary violations | BR-08 |

### farmerTrainingService  `services/farmerTrainingService.js`

| | |
|---|---|
| Layer | services |
| Lines | 735 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### governanceService  `services/governanceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 571 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | villages, panchayats, panchayat_schemes, csr_projects, csr_contributions, compliance_reports, cooperatives, cooperative_members |
| Status | **Complete** |
| Boundary violations | BR-08 |

### governmentSchemeService  `services/governmentSchemeService.js`

| | |
|---|---|
| Layer | services |
| Lines | 706 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### greenhouseService  `services/greenhouseService.js`

| | |
|---|---|
| Layer | services |
| Lines | 536 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### gstService  `services/gstService.js`

| | |
|---|---|
| Layer | services |
| Lines | 226 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | order_items, products, orders, users |
| Status | **Complete** |
| Boundary violations | _none_ |

### insuranceClaimsService  `services/insuranceClaimsService.js`

| | |
|---|---|
| Layer | services |
| Lines | 587 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### insuranceFraudDetectionService  `services/insuranceFraudDetectionService.js`

| | |
|---|---|
| Layer | services |
| Lines | 594 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | claims, insurance_policies, users, claim_documents, fraud_analysis |
| Status | **Complete** |
| Boundary violations | _none_ |

### insurancePolicyIssuanceService  `services/insurancePolicyIssuanceService.js`

| | |
|---|---|
| Layer | services |
| Lines | 523 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | insurance_policies, insurance_quotes, users, policy_documents |
| Status | **Complete** |
| Boundary violations | BR-08 |

### insurancePremiumService  `services/insurancePremiumService.js`

| | |
|---|---|
| Layer | services |
| Lines | 417 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | insurance_quotes, users |
| Status | **Complete** |
| Boundary violations | _none_ |

### landRecordsService  `services/landRecordsService.js`

| | |
|---|---|
| Layer | services |
| Lines | 462 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | land_records, farmers, government |
| Status | **Complete** |
| Boundary violations | BR-08 |

### logisticsEnhancementService  `services/logisticsEnhancementService.js`

| | |
|---|---|
| Layer | services |
| Lines | 590 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | fleet_vehicles, vehicle_maintenance, shipment_tracking, shipments, shipment_geofences, temperature_readings, temperature_alerts, temperature_alert_log, warehouses, warehouse_inventory, products, warehouse_shipments |
| Status | **Complete** |
| Boundary violations | BR-08 |

### preSeasonOrderService  `services/preSeasonOrderService.js`

| | |
|---|---|
| Layer | services |
| Lines | 751 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | contract |
| Status | **Complete** |
| Boundary violations | _none_ |

### productReviewService  `services/productReviewService.js`

| | |
|---|---|
| Layer | services |
| Lines | 426 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, database |
| Tables touched | order_items, orders, product_reviews, users, products, review_helpful, review_reports |
| Status | **Complete** |
| Boundary violations | BR-08 |

### sharedInfraService  `services/sharedInfraService.js`

| | |
|---|---|
| Layer | services |
| Lines | 606 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### soilTestingService  `services/soilTestingService.js`

| | |
|---|---|
| Layer | services |
| Lines | 613 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### subsidyService  `services/subsidyService.js`

| | |
|---|---|
| Layer | services |
| Lines | 592 |
| Endpoints | 0 (0 write) |
| Imports layers | utils, middleware |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### decisionEngine  `core/decisionEngine.js`

| | |
|---|---|
| Layer | core |
| Lines | 360 |
| Endpoints | 0 (0 write) |
| Imports layers | utils |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### effectors  `core/effectors.js`

| | |
|---|---|
| Layer | core |
| Lines | 292 |
| Endpoints | 0 (0 write) |
| Imports layers | utils |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### erpAgents  `core/erpAgents.js`

| | |
|---|---|
| Layer | core |
| Lines | 826 |
| Endpoints | 0 (0 write) |
| Imports layers | utils |
| Tables touched | demand |
| Status | **Complete** |
| Boundary violations | _none_ |

### mcda  `core/mcda.js`

| | |
|---|---|
| Layer | core |
| Lines | 138 |
| Endpoints | 0 (0 write) |
| Imports layers | _none_ |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

### outcomeSink  `core/outcomeSink.js`

| | |
|---|---|
| Layer | core |
| Lines | 198 |
| Endpoints | 0 (0 write) |
| Imports layers | database, utils |
| Tables touched | ai_outcomes, ai_prediction_log, v_ai_outcomes_pending, v_ai_actor_accuracy, v_ai_calibration |
| Status | **Complete** |
| Boundary violations | BR-08 |

### signalBus  `core/signalBus.js`

| | |
|---|---|
| Layer | core |
| Lines | 210 |
| Endpoints | 0 (0 write) |
| Imports layers | utils |
| Tables touched | _none detected_ |
| Status | **Complete** |
| Boundary violations | _none_ |

