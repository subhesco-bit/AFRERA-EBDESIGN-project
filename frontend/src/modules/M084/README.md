# M084 - Disaster Alerts (frontend)

Domain: Climate
Status: BUILT — implemented at `frontend/src/pages/ClimateWeatherPage.jsx`

This module's UI is not built here. Active dispatch-blocking weather alerts
(headline, severity, affected districts, recommended action) are
implemented in the alerts banner of `ClimateWeatherPage.jsx`, mounted at
`/climate`, backed by `weatherAPI.activeAlerts()`. This stub
(`M084Page.jsx`) redirects to it rather than duplicating the implementation.
