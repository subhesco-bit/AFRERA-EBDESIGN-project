# M092 - Warehouse Capacity Tracking

Part of the supply-chain-operations M0xx cluster (M092, M093, M094, M098, M099,
M100, M106, M111, M114, M115, M117) — see `.claude/audits/MODULE_STRATEGY.md`
for the shared framework these modules follow.

Domain: periodic capacity snapshots for a warehouse/storage point — how much
of its declared capacity is occupied right now, and whether that is trending
toward a problem. Complements (does not duplicate) the existing
`warehouses` / `warehouse_inventory` tables in `logisticsEnhancementService.js`,
which track product-level inventory; this module tracks the facility-level
capacity signal derived from operational snapshots, including sub-zone
breakdowns those tables don't record.

## Strategy Card
```
Purpose:      Answer "how full is this warehouse right now, and is that
              getting worse" from real logged snapshots, not a live
              recomputation that requires perfect inventory bookkeeping.
Actors:       system/warehouse-staff (log a snapshot), logistics admin
              (reviews utilization and trend).
Decision:     Classify current utilization into a status band and detect a
              worsening trend across the last N snapshots for one warehouse.
Algorithm:    utilizationPct = occupiedUnits / totalCapacityUnits * 100
              status: >=100 'over_capacity', >=90 'critical',
                      >=75 'high', else 'normal'
              trend (getTrend): compares utilizationPct of the oldest vs
              newest snapshot in the requested window; 'worsening' if the
              increase exceeds 5 percentage points, 'improving' if it drops
              by more than 5 points, else 'stable'.
Data:         data JSONB per row:
              { warehouseId, warehouseName, recordedAt, totalCapacityUnits,
                occupiedUnits, unit, zoneBreakdown: [{zone, occupiedUnits}],
                utilizationPct, status, overCapacity }
              utilizationPct/status/overCapacity are computed and stored at
              write time (createItem), not recomputed on every read.
AI role:      none — utilization banding and trend detection are fixed
              numeric thresholds, not a judgment call needing a model.
Status:       real
```

Files: controller.js, service.js, routes.js, migrations/3000_M092_generated.sql
(table `logistics_m092_items`, unchanged scaffold table — this module's real
schema lives in the JSONB `data` shape documented above).

## Endpoints
- `GET /` `GET /:id` `POST /` `PUT /:id` `DELETE /:id` — generic snapshot
  access (`logistics`/`admin`-gated writes).
- `GET /warehouses/:warehouseId/latest` — most recent snapshot for one
  warehouse, with current utilization status.
- `GET /warehouses/:warehouseId/trend?limit=` — trend across the most recent
  snapshots for one warehouse.
