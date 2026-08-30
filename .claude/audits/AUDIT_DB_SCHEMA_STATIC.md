# Static Migration Schema Audit

Generated 2026-08-29T20:13:53.770Z by direct static scan (regex/paren-depth parser, not a full SQL parser) of 299 files in backend/src/database/migrations/.

**Summary:** 6 type mismatches, 53 duplicate table definitions, 88 duplicate index names, 0 FKs targeting an undefined table. (56 FKs excluded because they live inside a later same-name CREATE TABLE IF NOT EXISTS that never executes in real Postgres — see Duplicate table definitions.)

## Type mismatches (FK column type != referenced column/PK type)

- `3100_ecommerce_tables.sql:122` — review_helpful_votes.review_id (VARCHAR) REFERENCES product_reviews.id (SERIAL)
- `3100_ecommerce_tables.sql:175` — quotations.bulk_order_id (VARCHAR) REFERENCES bulk_orders.id (SERIAL)
- `995_erp_process_layer.sql:165` — purchase_order_lines.po_id (INTEGER) REFERENCES purchase_orders.id (VARCHAR)
- `995_erp_process_layer.sql:181` — goods_receipts.po_id (INTEGER) REFERENCES purchase_orders.id (VARCHAR)
- `995_erp_process_layer.sql:209` — invoice_match_results.po_id (INTEGER) REFERENCES purchase_orders.id (VARCHAR)
- `9999_zz_copilot_sessions_uuid_fix.sql:18` — copilot_sessions.user_id (INTEGER) REFERENCES users.id (UUID) [via ALTER TABLE]
  **FALSE POSITIVE, already fixed correctly** — this file's own `ALTER TABLE copilot_sessions ALTER COLUMN user_id TYPE UUID` (line 17, right before this) already converts the column before adding the FK constraint. This static parser doesn't track `ALTER COLUMN TYPE` statements, so it's still comparing against the original `016_ai_copilot_schema.sql` INTEGER declaration. No action needed.

**Status of the 81 other type mismatches originally found here (2026-08-29):** auto-fixed. Every case where the FK column was declared INTEGER/VARCHAR but referenced a confirmed-UUID primary key (`users.id`, `farmers.id`, `addresses.id`, `orders.id`, `gi_products.id`) had its column type changed to UUID in place, across 22 files — this was the dominant, systemic root cause (auto-generated M0xx module scaffolds defaulting FK columns to INTEGER without checking the real referenced table's type). Each edit only replaced the type token; NOT NULL/DEFAULT/ON DELETE/REFERENCES clauses and comments were left untouched, and every diff was reviewed before applying. The 5 remaining entries above need manual judgment because their target column (`product_reviews.id`, `bulk_orders.id`, `purchase_orders.id`) is itself SERIAL/VARCHAR rather than UUID, and all three target tables are also duplicate-defined (see below) — fixing them means deciding which of the two colliding definitions of `product_reviews`/`bulk_orders`/`purchase_orders` should actually win, which needs a look at how each table's data is actually used elsewhere in the codebase, not just a type-token swap.

## Duplicate table definitions (same table name, multiple CREATE TABLE statements)

- `shipment_tracking`: first defined `000_base_schema.sql:646`, redefined `013_logistics_enhancements.sql:56`
- `audit_logs`: first defined `000_base_schema.sql:849`, redefined `014_audit_system.sql:11`
- `roles`: first defined `000_base_schema.sql:100`, redefined `014_platform_foundation_modules.sql:148`
- `user_roles`: first defined `000_base_schema.sql:108`, redefined `014_platform_foundation_modules.sql:181`
- `audit_logs`: first defined `000_base_schema.sql:849`, redefined `014_platform_foundation_modules.sql:264`
- `roles`: first defined `000_base_schema.sql:100`, redefined `015_authorization_service.sql:6`
- `ar_vr_experiences`: first defined `015_advanced_features.sql:102`, redefined `017_ar_vr_schema.sql:24`
- `smart_contracts`: first defined `015_advanced_features.sql:11`, redefined `019_blockchain_traceability_schema.sql:111`
- `demand_forecasts`: first defined `015_advanced_features.sql:86`, redefined `030_institutional_procurement_schema.sql:90`
- `iot_devices`: first defined `015_advanced_features.sql:33`, redefined `031_iot_integration_schema.sql:24`
- `fleet_vehicles`: first defined `013_logistics_enhancements.sql:11`, redefined `034_logistics_enhancement_schema.sql:14`
- `vehicle_maintenance`: first defined `013_logistics_enhancements.sql:34`, redefined `034_logistics_enhancement_schema.sql:50`
- `shipment_tracking`: first defined `000_base_schema.sql:646`, redefined `034_logistics_enhancement_schema.sql:81`
- `shipment_geofences`: first defined `013_logistics_enhancements.sql:81`, redefined `034_logistics_enhancement_schema.sql:113`
- `temperature_readings`: first defined `013_logistics_enhancements.sql:95`, redefined `034_logistics_enhancement_schema.sql:131`
- `temperature_alerts`: first defined `013_logistics_enhancements.sql:113`, redefined `034_logistics_enhancement_schema.sql:158`
- `warehouse_inventory`: first defined `013_logistics_enhancements.sql:170`, redefined `034_logistics_enhancement_schema.sql:228`
- `dietary_profiles`: first defined `020_consumer_health_schema.sql:42`, redefined `036_nutrition_intelligence_schema.sql:198`
- `voice_commands`: first defined `015_advanced_features.sql:118`, redefined `045_voice_ai_schema.sql:43`
- `gst_invoices`: first defined `028_gst_schema.sql:55`, redefined `047_gst_tables.sql:31`
- `gst_invoice_items`: first defined `028_gst_schema.sql:97`, redefined `047_gst_tables.sql:94`
- `demand_forecasts`: first defined `015_advanced_features.sql:86`, redefined `052_economic_layer.sql:45`
- `users`: first defined `000_base_schema.sql:34`, redefined `1000_user_management.sql:4`
- `roles`: first defined `000_base_schema.sql:100`, redefined `1000_user_management.sql:15`
- `user_roles`: first defined `000_base_schema.sql:108`, redefined `1000_user_management.sql:21`
- `platform_configurations`: first defined `014_platform_foundation_modules.sql:6`, redefined `1001_platform_configuration.sql:4`
- `audit_logs`: first defined `000_base_schema.sql:849`, redefined `1002_system_administration.sql:13`
- `users`: first defined `000_base_schema.sql:34`, redefined `3000_M011_generated.sql:6`
- `consents`: first defined `014_platform_foundation_modules.sql:224`, redefined `3017_m017_consent_management.sql:7`
- `user_profiles`: first defined `000_base_schema.sql:58`, redefined `3019_m019_profile_management.sql:7`
- `profile_views`: first defined `3018_m018_privacy_controls.sql:59`, redefined `3019_m019_profile_management.sql:24`
- `profile_activity`: first defined `3018_m018_privacy_controls.sql:68`, redefined `3019_m019_profile_management.sql:33`
- `farmers`: first defined `000_base_schema.sql:361`, redefined `3021_m021_farmer_registration.sql:7`
- `iot_devices`: first defined `015_advanced_features.sql:33`, redefined `3030_m030_farmer_advisory.sql:17`
- `gi_marketplace_listings`: first defined `027_gi_intelligence_schema.sql:182`, redefined `3100_ecommerce_tables.sql:60`
- `product_reviews`: first defined `009_marketplace_enhancements.sql:20`, redefined `3100_ecommerce_tables.sql:93`
- `review_reports`: first defined `009_marketplace_enhancements.sql:53`, redefined `3100_ecommerce_tables.sql:130`
- `bulk_orders`: first defined `009_marketplace_enhancements.sql:68`, redefined `3100_ecommerce_tables.sql:145`
- `demand_forecasts`: first defined `015_advanced_features.sql:86`, redefined `3102_ecommerce_ai_erp_business_marketing.sql:38`
- `gst_invoices`: first defined `028_gst_schema.sql:55`, redefined `3102_ecommerce_ai_erp_business_marketing.sql:126`
- `warehouse_inventory`: first defined `013_logistics_enhancements.sql:170`, redefined `3102_ecommerce_ai_erp_business_marketing.sql:141`
- `contract_milestones`: first defined `000_base_schema.sql:718`, redefined `3102_ecommerce_ai_erp_business_marketing.sql:243`
- `dpr_documents`: first defined `023_engineering_schema.sql:638`, redefined `3105_dpr_documents_schema.sql:19`
- `training_records`: first defined `000_base_schema.sql:411`, redefined `3200_hr_module_schema.sql:104`
- `promotions`: first defined `3102_ecommerce_ai_erp_business_marketing.sql:349`, redefined `3200_hr_module_schema.sql:120`
- `cold_storage_bookings`: first defined `3104_cold_storage_schema.sql:51`, redefined `994_recovered_capabilities.sql:163`
- `purchase_orders`: first defined `3102_ecommerce_ai_erp_business_marketing.sql:168`, redefined `995_erp_process_layer.sql:143`
- `production_orders`: first defined `3102_ecommerce_ai_erp_business_marketing.sql:197`, redefined `995_erp_process_layer.sql:392`
- `departments`: first defined `3200_hr_module_schema.sql:33`, redefined `996_enterprise_foundation.sql:102`
- `journal_entries`: first defined `3102_ecommerce_ai_erp_business_marketing.sql:106`, redefined `996_enterprise_foundation.sql:207`
- `climate_risk_assessments`: first defined `057_climate_weather_d14.sql:281`, redefined `9999_zzzzzzzzzzzzzzzzz_climate_monitoring_schema.sql:51`
- `tender_bids`: first defined `030_institutional_procurement_schema.sql:52`, redefined `999_zz_tender_bids_collision_repair.sql:57`
- `mfa_secrets`: first defined `3015_m015_mfa.sql:7`, redefined `mfa_schema.sql:5`

## Duplicate index names

- `idx_product_variants_product_id`: 000_base_schema.sql:198, 998_foreign_key_indexes.sql:469
- `idx_certifications_product_id`: 000_base_schema.sql:214, 998_foreign_key_indexes.sql:114
- `idx_orders_shipping_address_id`: 000_base_schema.sql:249, 998_foreign_key_indexes.sql:399
- `idx_orders_billing_address_id`: 000_base_schema.sql:250, 998_foreign_key_indexes.sql:397
- `idx_cart_user_id`: 000_base_schema.sql:282, 998_foreign_key_indexes.sql:108
- `idx_cart_product_id`: 000_base_schema.sql:283, 998_foreign_key_indexes.sql:106
- `idx_payments_order_id`: 000_base_schema.sql:303, 998_foreign_key_indexes.sql:443
- `idx_payments_user_id`: 000_base_schema.sql:304, 998_foreign_key_indexes.sql:445
- `idx_fpos_address_id`: 000_base_schema.sql:358, 998_foreign_key_indexes.sql:268
- `idx_farmers_farm_location_id`: 000_base_schema.sql:390, 998_foreign_key_indexes.sql:232
- `idx_farmers_status`: 000_base_schema.sql:391, 3021_m021_farmer_registration.sql:54
- `idx_farmer_certifications_farmer_id`: 000_base_schema.sql:408, 998_foreign_key_indexes.sql:230
- `idx_training_records_farmer_id`: 000_base_schema.sql:422, 998_foreign_key_indexes.sql:569
- `idx_credit_scores_farmer_id`: 000_base_schema.sql:440, 998_foreign_key_indexes.sql:170
- `idx_loans_farmer_id`: 000_base_schema.sql:465, 998_foreign_key_indexes.sql:346
- `idx_emi_schedule_loan_id`: 000_base_schema.sql:483, 998_foreign_key_indexes.sql:214
- `idx_advances_farmer_id`: 000_base_schema.sql:505, 998_foreign_key_indexes.sql:32
- `idx_financial_transactions_user_id`: 000_base_schema.sql:526, 998_foreign_key_indexes.sql:236
- `idx_shipment_tracking_shipment_id`: 000_base_schema.sql:658, 013_logistics_enhancements.sql:77
- `idx_audit_logs_user_id`: 000_base_schema.sql:862, 014_audit_system.sql:34
- `idx_audit_logs_entity`: 000_base_schema.sql:863, 014_audit_system.sql:35
- `idx_product_reviews_status`: 009_marketplace_enhancements.sql:37, 3100_ecommerce_tables.sql:116
- `idx_product_reviews_rating`: 009_marketplace_enhancements.sql:38, 3100_ecommerce_tables.sql:115
- `idx_bulk_orders_status`: 009_marketplace_enhancements.sql:91, 3100_ecommerce_tables.sql:169
- `idx_fleet_vehicles_type`: 013_logistics_enhancements.sql:29, 034_logistics_enhancement_schema.sql:41
- `idx_fleet_vehicles_status`: 013_logistics_enhancements.sql:31, 034_logistics_enhancement_schema.sql:43
- `idx_vehicle_maintenance_status`: 013_logistics_enhancements.sql:52, 034_logistics_enhancement_schema.sql:74
- `idx_shipment_tracking_timestamp`: 013_logistics_enhancements.sql:78, 034_logistics_enhancement_schema.sql:106
- `idx_temperature_readings_timestamp`: 013_logistics_enhancements.sql:109, 034_logistics_enhancement_schema.sql:151
- `idx_roles_system`: 014_platform_foundation_modules.sql:160, 9999_zzzzzzzzzzzzzzzzzzz_roles_collision_repair.sql:31
- `idx_roles_level`: 014_platform_foundation_modules.sql:161, 9999_zzzzzzzzzzzzzzzzzzz_roles_collision_repair.sql:32
- `idx_sessions_user`: 014_platform_foundation_modules.sql:258, 9999_zzzzzzzzzzzzzzz_m012_session_security_schema.sql:24
- `idx_sessions_token`: 014_platform_foundation_modules.sql:259, 9999_zzzzzzzzzzzzzzz_m012_session_security_schema.sql:25
- `idx_smart_contracts_type`: 015_advanced_features.sql:28, 019_blockchain_traceability_schema.sql:139
- `idx_iot_devices_device_id`: 015_advanced_features.sql:49, 031_iot_integration_schema.sql:58, 3030_m030_farmer_advisory.sql:48
- `idx_iot_devices_type`: 015_advanced_features.sql:50, 031_iot_integration_schema.sql:59
- `idx_iot_devices_status`: 015_advanced_features.sql:52, 031_iot_integration_schema.sql:60
- `idx_ar_vr_experiences_type`: 015_advanced_features.sql:114, 017_ar_vr_schema.sql:56
- `idx_dpr_documents_created_at`: 023_engineering_schema.sql:673, 3105_dpr_documents_schema.sql:41
- `idx_gst_invoices_number`: 028_gst_schema.sql:87, 3102_ecommerce_ai_erp_business_marketing.sql:136
- `idx_gst_invoices_order`: 028_gst_schema.sql:88, 3102_ecommerce_ai_erp_business_marketing.sql:137
- `idx_gst_invoices_status`: 028_gst_schema.sql:90, 3102_ecommerce_ai_erp_business_marketing.sql:138
- `idx_tender_bids_tender`: 030_institutional_procurement_schema.sql:82, 999_zz_tender_bids_collision_repair.sql:74
- `idx_tender_bids_supplier`: 030_institutional_procurement_schema.sql:83, 999_zz_tender_bids_collision_repair.sql:75
- `idx_tender_bids_status`: 030_institutional_procurement_schema.sql:84, 999_zz_tender_bids_collision_repair.sql:76
- `idx_warehouse_inventory_warehouse`: 034_logistics_enhancement_schema.sql:256, 3102_ecommerce_ai_erp_business_marketing.sql:152
- `idx_warehouse_inventory_product`: 034_logistics_enhancement_schema.sql:258, 3102_ecommerce_ai_erp_business_marketing.sql:151
- `idx_mfa_secrets_user_id`: 3015_m015_mfa.sql:79, mfa_schema.sql:41
- `idx_profile_views_profile_user`: 3018_m018_privacy_controls.sql:81, 3019_m019_profile_management.sql:44
- `idx_profile_activity_user_id`: 3018_m018_privacy_controls.sql:82, 3019_m019_profile_management.sql:45
- `idx_user_profiles_user_id`: 3019_m019_profile_management.sql:42, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:13
- `idx_journal_entries_reference`: 3102_ecommerce_ai_erp_business_marketing.sql:122, 996_enterprise_foundation.sql:604
- `idx_production_orders_status`: 3102_ecommerce_ai_erp_business_marketing.sql:211, 4000_comprehensive_erp_schema.sql:554
- `idx_employees_status`: 3200_hr_module_schema.sql:220, 4000_comprehensive_erp_schema.sql:565
- `idx_journal_lines_account`: 4000_comprehensive_erp_schema.sql:537, 996_enterprise_foundation.sql:608
- `idx_journal_lines_cost_center`: 4000_comprehensive_erp_schema.sql:538, 996_enterprise_foundation.sql:610
- `idx_journal_lines_profit_center`: 4000_comprehensive_erp_schema.sql:539, 996_enterprise_foundation.sql:612
- `idx_projects_status`: 4000_comprehensive_erp_schema.sql:569, 9996_project_systems_schema.sql:173
- `idx_listings_farmer`: 991_aeos_folu_ne_policy.sql:463, 995_erp_process_layer.sql:553
- `idx_asset_bookings_asset_id`: 998_foreign_key_indexes.sql:54, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:36
- `idx_asset_bookings_user_id`: 998_foreign_key_indexes.sql:56, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:37
- `idx_assets_location_id`: 998_foreign_key_indexes.sql:58, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:34
- `idx_assets_responsible_user_id`: 998_foreign_key_indexes.sql:60, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:35
- `idx_assets_type_id`: 998_foreign_key_indexes.sql:62, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:33
- `idx_categories_parent_id`: 998_foreign_key_indexes.sql:110, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:17
- `idx_claims_policy_id`: 998_foreign_key_indexes.sql:124, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:23
- `idx_claims_user_id`: 998_foreign_key_indexes.sql:126, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:24
- `idx_compliance_records_verified_by`: 998_foreign_key_indexes.sql:130, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:41
- `idx_contract_milestones_contract_id`: 998_foreign_key_indexes.sql:140, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:31
- `idx_contracts_buyer_id`: 998_foreign_key_indexes.sql:142, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:29
- `idx_contracts_crop_id`: 998_foreign_key_indexes.sql:144, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:30
- `idx_contracts_farmer_id`: 998_foreign_key_indexes.sql:146, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:28
- `idx_drivers_assigned_vehicle_id`: 998_foreign_key_indexes.sql:210, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:27
- `idx_escrow_accounts_contract_id`: 998_foreign_key_indexes.sql:220, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:32
- `idx_maintenance_records_asset_id`: 998_foreign_key_indexes.sql:354, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:38
- `idx_policies_farmer_id`: 998_foreign_key_indexes.sql:447, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:21
- `idx_policies_product_id`: 998_foreign_key_indexes.sql:449, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:22
- `idx_policies_user_id`: 998_foreign_key_indexes.sql:451, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:20
- `idx_products_created_by`: 998_foreign_key_indexes.sql:471, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:19
- `idx_products_unit_id`: 998_foreign_key_indexes.sql:473, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:18
- `idx_recommendations_user_id`: 998_foreign_key_indexes.sql:493, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:42
- `idx_shipments_mode_id`: 998_foreign_key_indexes.sql:525, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:26
- `idx_shipments_order_id`: 998_foreign_key_indexes.sql:527, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:25
- `idx_subsidy_claims_farmer_id`: 998_foreign_key_indexes.sql:535, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:39
- `idx_subsidy_claims_scheme_id`: 998_foreign_key_indexes.sql:537, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:40
- `idx_user_roles_assigned_by`: 998_foreign_key_indexes.sql:589, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:16
- `idx_user_roles_role_id`: 998_foreign_key_indexes.sql:591, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:15
- `idx_user_roles_user_id`: 998_foreign_key_indexes.sql:593, 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql:14

## FKs referencing a table never defined in any migration

None found.


## Stats

- Tables defined: 1087
- Foreign keys found: 873
- Indexes found: 2010

## Caveats

- This is a regex/paren-depth parser, not a real SQL parser. It can miss FKs written in unusual formatting, and "type" comparison is by broad family (UUID / INTEGER / TEXT / other-exact-match), not full type equality (e.g. VARCHAR(50) vs VARCHAR(100) is not flagged).
- Migration execution order is assumed to be lexicographic filename sort (matches the numeric-prefix convention used throughout this migrations directory) — this affects only presentation, not the mismatch/duplicate findings themselves, which are order-independent.
- Columns added later via `ALTER TABLE ... ADD COLUMN` are not tracked, so an FK added later against an ALTER-added column may show target type as unresolved and be silently skipped rather than falsely flagged.