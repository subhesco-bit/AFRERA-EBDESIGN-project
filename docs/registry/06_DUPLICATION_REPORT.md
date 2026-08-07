# Duplication Report

**Generated:** 2026-08-04 by `tools/engineering-registry.js`
**Status:** DESCRIPTIVE — derived from code, not authored.
**Do not edit by hand.** Regenerate instead: `node tools/engineering-registry.js`

**Objects indexed:** 20

---

## Tables defined more than once (19)

- **shipment_tracking** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **maintenance_records** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/023_engineering_schema.sql
- **audit_logs** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/014_audit_system.sql
- **compliance_records** — backend/src/database/migrations/000_base_schema.sql + backend/src/database/migrations/023_engineering_schema.sql
- **fleet_vehicles** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **vehicle_maintenance** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **shipment_geofences** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **temperature_readings** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **temperature_alerts** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **warehouse_inventory** — backend/src/database/migrations/013_logistics_enhancements.sql + backend/src/database/migrations/034_logistics_enhancement_schema.sql
- **smart_contracts** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/019_blockchain_traceability_schema.sql
- **iot_devices** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/031_iot_integration_schema.sql
- **demand_forecasts** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/030_institutional_procurement_schema.sql
- **ar_vr_experiences** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/017_ar_vr_schema.sql
- **voice_commands** — backend/src/database/migrations/015_advanced_features.sql + backend/src/database/migrations/045_voice_ai_schema.sql
- **dietary_profiles** — backend/src/database/migrations/020_consumer_health_schema.sql + backend/src/database/migrations/036_nutrition_intelligence_schema.sql
- **tender_bids** — backend/src/database/migrations/023_engineering_schema.sql + backend/src/database/migrations/030_institutional_procurement_schema.sql
- **gst_invoices** — backend/src/database/migrations/028_gst_schema.sql + backend/src/database/migrations/047_gst_tables.sql
- **gst_invoice_items** — backend/src/database/migrations/028_gst_schema.sql + backend/src/database/migrations/047_gst_tables.sql

> Only the FIRST definition takes effect (CREATE TABLE IF NOT EXISTS).
> Later columns are silently discarded — see docs/MIGRATION_CHAIN_VERIFIED.md.

## Index names reused on different tables (1)

- **idx_listings_farmer** — farmer_listings, sales_listings
