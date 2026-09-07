# M069 - Harvest Planning

Domain: Crop
Status: ENHANCED

Real CRUD over the `crop_m069_items` table (migrations/3000_M069_generated.sql).
Row payloads are stored in the table's generic `data` JSONB column and flattened
back onto the row in the service layer, so the API surface is a normal
`{ id, crop, field_name, planned_harvest_date, ... }` shape.

## Features
- List (paginated), get, create, update, delete harvest plans
- Auto-mounted at `/api/v1/modules/m069` via the generated-module loader in `backend/src/index.js`
- Consumed by `frontend/src/modules/M069/M069Page.jsx` via `ResourceManager`
