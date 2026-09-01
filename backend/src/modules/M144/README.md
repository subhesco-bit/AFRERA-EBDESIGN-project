# M144 - Greenhouse Management (Horticulture)

Real, substantial greenhouse service (568 lines): CRUD, IoT sensor
registration, automation rules, AI-flavored crop-suitability/energy/
growth-cycle insights. Mounted directly and live at
`greenhouseService.setupRoutes(app)` in index.js (not just the generic
module bridge). Fixed 3 real fabrication bugs 2026-08-29:
`fetchGreenhouseSensorData()` returned one hardcoded fake reading for
every device (no real IoT gateway is configured - now honestly reports
`configured:false` when no logged reading exists); `getGreenhouseAIInsights()`
had a hardcoded `confidence:0.89` on deterministic rule-based math (removed,
not a real confidence score); `evaluateTrigger()` unconditionally returned
`true`, so every automation rule fired on every check regardless of its
condition (now evaluates real field/operator/value thresholds against the
latest logged reading). README previously said "Auto-generated module
template. Domain: TBD," stale relative to this real code.
