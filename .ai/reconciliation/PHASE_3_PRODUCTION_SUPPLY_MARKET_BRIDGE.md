# Phase 3 — Production → Supply → Marketplace Bridge

## Implemented

The reconciliation branch now has an executable bridge connecting existing farmer/land/crop/harvest concepts to the commercial pipeline without replacing the existing module architecture.

### Canonical flow

`Farmer → Land Record → Crop Plan → Harvest Plan → Production Supply Lot → Aggregation/Allocation → Marketplace Listing`

## Components

- `backend/src/database/migrations/406_production_supply_market_bridge.sql`
  - `production_supply_lots`
  - `production_supply_links`
  - status and quantity constraints
  - indexes for farmer/FPO/product/date/link lookups
  - update timestamp trigger
- `backend/src/services/productionSupplyBridgeService.js`
  - lot creation/read/list
  - production-to-entity linking
  - transactional marketplace-listing creation
  - parameterized SQL
  - rollback on failed multi-step writes
- `backend/src/routes/productionSupplyBridgeRoutes.js`
  - authenticated lot APIs
  - link API
  - marketplace-listing transition API
- `backend/src/services/__tests__/productionSupplyBridgeService.test.js`
  - validation
  - parameterization
  - transaction rollback

## Existing capability preserved

- Farmer portal and land records remain authoritative for farmer/land identity.
- Existing crop planning remains authoritative for cultivation planning.
- Existing M069 Harvest Planning remains authoritative for harvest-plan records.
- Existing FPO modules remain authoritative for FPO governance/membership.
- Existing marketplace and logistics modules are not duplicated; the bridge uses the canonical operational entity contract for cross-domain linkage.

## Verification rule

This phase is implementation-complete for the bridge, but not production-certified until repository CI executes migration, unit/integration, lint, and full system audit successfully against the target deployment database.
