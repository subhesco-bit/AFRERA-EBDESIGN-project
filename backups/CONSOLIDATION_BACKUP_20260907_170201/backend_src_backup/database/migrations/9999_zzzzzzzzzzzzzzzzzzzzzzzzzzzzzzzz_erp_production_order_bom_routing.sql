-- comprehensiveERPService.js's createProductionOrder() destructures bom and
-- routing from the payload but never persists them - silently dropped data,
-- found during the 2026-08-24 ERP module test pass. No BOM/Routing
-- master-data tables exist anywhere in the schema (a full Bill of Materials
-- + Manufacturing Routing system - header/items/operations - is a separate,
-- larger feature, not built here). These two columns are the honest
-- minimum fix: a free-text reference so the caller's input is not silently
-- discarded, not a claim that BOM/Routing management exists.

ALTER TABLE erp_production_orders ADD COLUMN IF NOT EXISTS bom_reference VARCHAR(50);
ALTER TABLE erp_production_orders ADD COLUMN IF NOT EXISTS routing_reference VARCHAR(50);
