# M076 - Water Budgeting

Domain: Water
Status: REAL core CRUD (404-line service.js) + extensive static-placeholder analytics

(2026-08-29) README previously said "Status: ABSENT" / "scaffolding" despite
already having real, complete budget CRUD (`createWaterBudget`,
`trackWaterUsage`, `getBudgetLimits`, `getActualWaterUsage`,
`getHistoricalWaterUsage`, `getCropPatterns`, `getGroundwaterLevels`,
`calculateVariance`) backed by real tables. Reachable live from
`frontend/src/pages/WaterManagementPage.jsx`.

**Real vs placeholder** (see the disclosure comment at the top of
`service.js` for full detail): budget CRUD and variance calculation are
real. Weather forecast, efficiency metrics, demand forecast, supply
constraints, priority matrix, environmental requirements, usage analysis,
water forecast and risk assessment are static placeholders returning the
same fixed numbers regardless of location/budget — pending a real weather
API, metering telemetry and a groundwater survey feed. Not rewired in this
pass because the honest fix is a real data-source integration, not a
better-disguised static number; tracked in `.ai/tasks/ACTIVE.md`.
