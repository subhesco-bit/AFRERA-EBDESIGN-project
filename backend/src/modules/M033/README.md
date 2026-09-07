# M033 - Farm Equipment Maintenance Log

Part of the crop-planning & farm-operations module cluster. Tracks
equipment usage hours and computes real due/overdue maintenance status
from a service-interval threshold.

## Strategy Card
```
Purpose:      Flag which farm equipment is due or overdue for service
              before it breaks down mid-season.
Actors:       Farmer/admin (logs usage hours, checks due list).
Decision:     status (ok / due_soon / overdue) per equipment item.
Algorithm:    hours_since_service = usage_hours - last_service_hours;
              overdue when hours_since_service >= service_interval_hours;
              due_soon when within the last 10% of the interval.
              service_interval_hours defaults per equipment type
              (tractor 250h, irrigation_pump 500h, thresher 150h,
              power_tiller 200h, sprayer 100h) when not specified.
              estimated_due_date projected from daily_usage_hours_avg
              when supplied. See computeMaintenanceStatus() in service.js.
Data:         agronomist_m033_items.data JSONB shape:
              { equipment_id, equipment_type, purchase_date, usage_hours,
                last_service_hours, service_interval_hours,
                daily_usage_hours_avg, record_type: "equipment" }
AI role:      none — deterministic threshold check against usage hours.
Status:       real
```

## Endpoints
- `POST /api/v1/modules/m033/status` — compute maintenance status for a given equipment payload (not persisted).
- `GET /api/v1/modules/m033/analytics/due` — all stored equipment items currently due_soon or overdue.
- Standard CRUD: `GET/POST /`, `GET/PUT/DELETE /:id`.

Files: controller.js, service.js, routes.js, migrations/3000_M033_generated.sql
