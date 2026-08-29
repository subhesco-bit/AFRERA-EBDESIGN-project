# M028 - Farmer Advisory

Structured advisory work-plan module for converting farmer, farm, weather, market, compliance, and sensor signals into auditable actions.

## Backend
- CRUD contract: `listItems`, `getItem`, `createItem`, `updateItem`, `deleteItem`
- Domain operations: `generateAdvisoryPlan`, `getOpenActionSummary`
- Module backbone operations: `healthCheck`, `execute`

## API
- Mounted by the generated module loader at `/api/v1/modules/m028`
- Supports filtering by `farmerId`, `advisoryType`, `status`, and `priority`

## AI Integration
- Returns Claude-ready prompt context with actions, signals, and escalation state
- Uses deterministic rules until an external model/provider is explicitly connected
