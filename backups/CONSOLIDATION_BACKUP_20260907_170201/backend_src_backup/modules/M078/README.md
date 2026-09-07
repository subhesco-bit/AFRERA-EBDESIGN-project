# M078 - Rainwater Harvesting

Domain: Water
Status: REAL core CRUD (385-line service.js) + partial static-placeholder analytics

(2026-08-29) README previously said "Status: ABSENT" / "scaffolding" despite
already having real, complete design/collection CRUD
(`designHarvestingSystem`, `getRainfallPatterns`, `getRainfallReceived`,
`getWaterCollected`, `calculateCollectionEfficiency` — a genuine division of
collected/received, `getStorageLevel`). Reachable live from
`frontend/src/pages/WaterManagementPage.jsx`.

Fixed 1 real fabrication bug: `getExpectedRainfall()` carried a hardcoded
`confidence: 75` on fixed numbers — now returns an honest
`{configured:false, reason}`, with `getExpectedCollection` /
`calculateSurplus` / `calculateDeficit` updated to propagate that honestly
(return `null`/`configured:false`) instead of silently computing NaN.

**Still placeholder**: `getEnvironmentalFactors`, `getHarvestedWaterQuality`,
`getDemandForecast`, `generateAllocationPlan` and `getDistributionPoints`
are static regardless of system/location/intended use — needs a real
rain-gauge/weather feed and a demand study; tracked in
`.ai/tasks/ACTIVE.md`. `calculateCatchmentEfficiency`, `getStorageOptions`
and `getFiltrationRequirements` are legitimate deterministic math / static
catalogs, not fabrication.
