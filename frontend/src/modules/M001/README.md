# M001 - Platform Core (frontend)

Domain: Platform Foundation
Status: HIDDEN — implemented at `frontend/src/pages/ModuleHubPage.jsx`

This module's UI is not built here. `ModuleHubPage.jsx` is a genuine 200+ line
page that fetches and renders the platform module catalogue via
`modulesAPI.getModules()` / `getOverview()`, and is mounted at `/modules`.
This stub (`M001Page.jsx`) redirects to it rather than duplicating the
implementation.
