# M027 - Farmer Certification

Farmer certification module for storing structured certification records in the generated `farmer_m027_items` JSONB table.

## Backend
- CRUD contract: `listItems`, `getItem`, `createItem`, `updateItem`, `deleteItem`
- Domain operations: `getCertificationPortfolio`, `recommendCertificationPath`
- Module backbone operations: `healthCheck`, `execute`

## API
- Mounted by the generated module loader at `/api/v1/modules/m027`
- Supports filtering by `farmerId`, `type`, and `status`

## AI Integration
- Emits deterministic compliance scores and renewal signals
- Exposes `portfolio`, `recommendPath`, and `analyze` operations for Claude-compatible orchestration
