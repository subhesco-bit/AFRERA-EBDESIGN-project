# M029 - Farmer Health & Welfare

Farmer health and welfare module backed by the existing `farmer_health_records`, `welfare_programs`, and `welfare_enrollments` tables.

## Backend
- CRUD compatibility: `listItems`, `getItem`, `createItem`, `updateItem`, `deleteItem`
- Domain operations: `listHealthRecords`, `getFarmerHealthSummary`, `getWelfarePrograms`, `enrollWelfareProgram`
- Module backbone operations: `healthCheck`, `execute`

## API
- Generic module API: `/api/v1/modules/m029`
- Dedicated health/welfare API: `/api/v1/farmer-health`

## AI Integration
- Exposes health summaries and welfare-program lookup through `execute('analyze')`, `execute('welfarePrograms')`, and `execute('enrollWelfareProgram')`
