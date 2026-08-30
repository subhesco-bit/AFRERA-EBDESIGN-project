# Duplication Report

**Generated:** 2026-08-30 by `tools/engineering-registry.js`
**Status:** DESCRIPTIVE — derived from code, not authored.
**Do not edit by hand.** Regenerate instead: `node tools/engineering-registry.js`

**Objects indexed:** 47

---

## Tables defined more than once (38)

- **users** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/1000_user_management.sql + backend/src/database/migrations/3000_M011_generated.sql
- **user_profiles** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/3019_m019_profile_management.sql
- **roles** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/014_platform_foundation_modules.sql + backend/src/database/migrations/015_authorization_service.sql + backend/src/database/migrations/1000_user_management.sql
- **user_roles** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/014_platform_foundation_modules.sql + backend/src/database/migrations/1000_user_management.sql
- **farmers** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/3021_m021_farmer_registration.sql
- **training_records** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/3200_hr_module_schema.sql
- **shipment_tracking** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **contract_milestones** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/3102_ecommerce_ai_erp_business_marketing.sql
- **audit_logs** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/014_audit_system.sql + backend/src/database/migrations/014_platform_foundation_modules.sql + backend/src/database/migrations/1002_system_administration.sql
- **product_reviews** — backend/src/database/migrations/009_marketplace_enhancements.sql + backend/src/database/migrations/3100_ecommerce_tables.sql
- **review_reports** — backend/src/database/migrations/009_marketplace_enhancements.sql + backend/src/database/migrations/3100_ecommerce_tables.sql
- **bulk_orders** — backend/src/database/migrations/009_marketplace_enhancements.sql + backend/src/database/migrations/3100_ecommerce_tables.sql
- **fleet_vehicles** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **vehicle_maintenance** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **shipment_geofences** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **temperature_readings** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **temperature_alerts** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **warehouse_inventory** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql + backend/src/database/migrations/3102_ecommerce_ai_erp_business_marketing.sql
- **consents** — backend/src/database/migrations/014_platform_foundation_modules.sql + backend/src/database/migrations/3017_m017_consent_management.sql
- **smart_contracts** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/019_blockchain_traceability_schema.sql
- **iot_devices** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/031_iot_integration_schema.sql + backend/src/database/migrations/3030_m030_farmer_advisory.sql
- **demand_forecasts** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/030_institutional_procurement_schema.sql + backend/src/database/migrations/052_economic_layer.sql + backend/src/database/migrations/3102_ecommerce_ai_erp_business_marketing.sql
- **ar_vr_experiences** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/017_ar_vr_schema.sql
- **voice_commands** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/045_voice_ai_schema.sql
- **dietary_profiles** — backend/src/database/migrations/020_consumer_health_schema.sql + backend/src/database/migrations/036_nutrition_intelligence_schema.sql
- **dpr_documents** — backend/src/database/migrations/023_engineering_schema.sql + backend/src/database/migrations/3105_dpr_documents_schema.sql
- **gi_marketplace_listings** — backend/src/database/migrations/027_gi_intelligence_schema.sql + backend/src/database/migrations/3100_ecommerce_tables.sql
- **gst_invoices** — backend/src/database/migrations/028_gst_schema.sql + backend/src/database/migrations/047_gst_tables.sql + backend/src/database/migrations/3102_ecommerce_ai_erp_business_marketing.sql
- **gst_invoice_items** — backend/src/database/migrations/028_gst_schema.sql + backend/src/database/migrations/047_gst_tables.sql
- **tender_bids** — backend/src/database/migrations/030_institutional_procurement_schema.sql + backend/src/database/migrations/999_zz_tender_bids_collision_repair.sql
- **climate_risk_assessments** — backend/src/database/migrations/057_climate_weather_d14.sql + backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzz_climate_monitoring_schema.sql
- **mfa_secrets** — backend/src/database/migrations/3015_m015_mfa.sql + backend/src/database/migrations/mfa_schema.sql
- **profile_views** — backend/src/database/migrations/3018_m018_privacy_controls.sql + backend/src/database/migrations/3019_m019_profile_management.sql
- **profile_activity** — backend/src/database/migrations/3018_m018_privacy_controls.sql + backend/src/database/migrations/3019_m019_profile_management.sql
- **journal_entries** — backend/src/database/migrations/3102_ecommerce_ai_erp_business_marketing.sql + backend/src/database/migrations/996_enterprise_foundation.sql
- **purchase_orders** — backend/src/database/migrations/3102_ecommerce_ai_erp_business_marketing.sql + backend/src/database/migrations/995_erp_process_layer.sql
- **production_orders** — backend/src/database/migrations/3102_ecommerce_ai_erp_business_marketing.sql + backend/src/database/migrations/995_erp_process_layer.sql
- **cold_storage_bookings** — backend/src/database/migrations/3104_cold_storage_schema.sql + backend/src/database/migrations/994_recovered_capabilities.sql

> Only the FIRST definition takes effect (CREATE TABLE IF NOT EXISTS).
> Later columns are silently discarded — see docs/MIGRATION_CHAIN_VERIFIED.md.

## Index names reused on different tables (9)

- **idx_sessions_user** — user_sessions, sessions
- **idx_sessions_token** — user_sessions, sessions
- **idx_production_orders_status** — production_orders, erp_production_orders
- **idx_employees_status** — employees, erp_employees
- **idx_journal_lines_account** — erp_journal_lines, journal_lines
- **idx_journal_lines_cost_center** — erp_journal_lines, journal_lines
- **idx_journal_lines_profit_center** — erp_journal_lines, journal_lines
- **idx_projects_status** — erp_projects, projects
- **idx_listings_farmer** — farmer_listings, sales_listings
