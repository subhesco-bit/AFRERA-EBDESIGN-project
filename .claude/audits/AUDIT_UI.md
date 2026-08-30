---
agent: ui-auditor
status: warn
findings: 8
---

# UI Audit — Linkage/Wiring Focus

**Scope note:** per explicit brief, this pass prioritizes UI-to-API wiring gaps over
general accessibility/responsive issues, and deliberately does NOT re-report items
already closed per `.ai/tasks/ACTIVE.md` (page routing sweep, FarmerEntranceHubPage,
nutritionIntelligenceService, productMediaAIService, the 30 route-wiring fixes, etc.).
Checked against latest commit `967ff53c`.

## Summary

Page routing itself is now genuinely complete — all 165 page components under
`frontend/src/pages/` are imported and rendered via `config/routes.js` /
`App.jsx` (confirmed by diffing every `.jsx` file against every `component:`
reference and every route array actually `.map()`'d in `App.jsx`; zero orphans).
The real remaining gaps are (1) a large primary-navigation reachability gap —
most routed pages have no link in `Header.jsx`/`Sidebar.jsx`/`BottomNav.jsx` —
and (2) a confirmed set of fully real, backend-mounted API surfaces in
`frontend/src/services/api.js` that no page or component calls at all,
several of them significant features (a whole notification system, an
audit/compliance log, a security/access-control console, a government
schemes/CSR/localization service).

## Findings

### 1. [HIGH] Notification system fully built and mounted, zero UI consumer
- **Location:** `frontend/src/services/api.js:2712-2726` (`notificationAPI`),
  backend `backend/src/modules/M010/` (routes.js confirms identical paths),
  mounted live at `/api/v1/modules/m010/*` via the generic module-mount loop
  in `backend/src/index.js:641-652`.
- **Description:** 13 real methods (create/list/get/mark-read/mark-all-read,
  per-user preferences, templates + render, batch delivery, analytics) with a
  correctly-matching, live-mounted backend. Confirmed via
  `grep -rl notificationAPI frontend/src` — zero hits outside its own
  definition. There is no bell icon, no notification center, no unread-count
  badge anywhere in `Header.jsx`, `Sidebar.jsx`, `BottomNav.jsx`, or
  `Layout.jsx`. A real, working feature is completely invisible to users.
- **Remediation:** add a notification bell/dropdown to `Header.jsx` (or
  `Layout.jsx`, since it already mounts global widgets like `ChatInterface`)
  calling `notificationAPI.getNotifications` + `markAsRead`.

### 2. [HIGH] Audit-compliance and security-access-control consoles, zero UI consumer
- **Location:** `frontend/src/services/api.js:2678-2710`
  (`auditComplianceAPI` → M008, `securityAccessControlAPI` → M009), both
  mounted the same way as M010 above (`/api/v1/modules/m008`,
  `/api/v1/modules/m009`).
- **Description:** `auditComplianceAPI` covers audit-log CRUD + integrity
  verification, compliance-rule evaluation, compliance reports, anomaly
  detection (9 methods). `securityAccessControlAPI` covers security events,
  IP allow/deny lists, rate-limit checks, threat detection, security scoring,
  access-policy evaluation (11 methods). Neither is referenced anywhere
  outside `api.js`. Given the platform has an `AdminDashboardPage.jsx` and a
  `SystemAdministrationPage.jsx` already routed, these are the natural,
  currently-missing homes for this data.
- **Remediation:** surface at minimum a read-only audit-log/security-events
  panel in `SystemAdministrationPage.jsx` or `AdminDashboardPage.jsx`.

### 3. [MEDIUM] Government schemes / CSR / localization service, zero UI consumer
- **Location:** `frontend/src/services/api.js:734-745` (`governmentSchemeAPI`)
  and `:1966-1971` (`schemeRegistryAPI`, a distinct sub-surface of the same
  service). Backend confirmed real and mounted:
  `backend/src/services/legacy/governmentSchemeService.js:776-919`
  (`setupRoutes(app)` pattern, registers all 15 matching
  `/api/v1/government/...` paths directly on `app`, not through a router
  file — verified this is actually called via `governmentSchemeService.setupRoutes(app)`
  in `index.js:971`).
- **Description:** `GovernmentDashboardPage.jsx` exists and is routed, but
  only calls a *different* object, `governmentAPI` (scheme analytics,
  compliance status) — it never calls `governmentSchemeAPI`/`schemeRegistryAPI`.
  So scheme listing, weather alerts, announcements (create+list), CSR
  opportunities/proposal submission, localized-page content, scheme tracking,
  and scheme expiry-status are all live on the backend with no page anywhere
  presenting them.
- **Remediation:** extend `GovernmentDashboardPage.jsx` with these sections,
  or confirm with the user whether a farmer-facing schemes page (separate
  from the admin/government dashboard) was intended instead.

### 4. [MEDIUM] Real institutional-procurement features unused: contract offers, mill-circuit booking
- **Location:** `frontend/src/services/api.js:1976-1994` (`contractOfferAPI`,
  `millCircuitAPI`). Backend confirmed real and mounted:
  `index.js:605-606` — `mountRoute('/api/v1/institutional-procurement', institutionalProcurementService)`
  and `mountRoute('/api/v1/mill-fpo', millCircuitService)`.
- **Description:** Both are genuinely live (not the same as the confirmed-dead
  `fpo-governance`/`fpo-marketing`/`fpo-compliance` group noted below — these
  two have real, mounted backends). No page or component references either
  object. `contractOfferAPI`'s own code comment notes farmer floor-price is
  deliberately never returned by these endpoints — worth keeping in mind if
  building a UI here, since the price-protection logic lives server-side.
- **Remediation:** needs a dedicated page (contract-offer inbox for
  farmers/FPOs, mill-circuit slot booking calendar) — currently zero
  frontend surface exists for either.

### 5. [LOW] Confirmed-still-dead client code with no backend at all (re-verified, not new)
- **Location:** `frontend/src/services/api.js` — `fpoGovernanceAPI`
  (`/fpo-governance/meetings`), `fpoMarketingAPI` (`/fpo-marketing/campaigns`),
  `fpoComplianceAPI` (`/fpo-compliance/filings`), `featureFlagAPI`,
  `masterConfigAPI`, `timeZoneManagementAPI`.
- **Description:** Re-verified via `grep -rn` across `backend/src` — no route
  file or `app.use()`/`setupRoutes()` call registers any of these paths.
  This matches the prior session's finding in `.ai/tasks/ACTIVE.md`
  ("Confirmed the remaining 5 ... are dead code — no page routes to them,
  zero live impact"). Recorded here only to confirm it's still true as of
  `967ff53c`, not as a new finding.

### 6. [MEDIUM] Duplicate-named API objects mask real dead code
- **Location:** `dynamicPricingAPI` (`api.js:701-714`) vs. `DynamicPricingPage.jsx`
  (calls `farmersAPI.getPriceDynamics/getDemandForecast/getPriceSignals`
  instead); `yieldManagementAPI` (`api.js:2142`) vs. `YieldManagementPage.jsx`
  (calls `yieldAPI.lotsNeedingAttention/lotPrice/...` instead);
  `environmentManagementAPI` (`api.js:2875`) vs. `EnvironmentManagementPage.jsx`
  (uses the generic `ModuleOperationPanel moduleId="M005"` bridge instead).
- **Description:** In each case a page with a near-identical name to a dead
  API object already exists and works — but through a *different* client
  object/mechanism. This isn't broken (the pages work), but it means whatever
  backend route the dead-named object targets is genuinely orphaned, and the
  naming collision makes it easy to assume (incorrectly) that "the page for
  this API already exists and works" during any future audit. Worth a
  deliberate decision: delete the dead objects, or confirm they target a
  genuinely different backend surface worth wiring up separately.

### 7. [MEDIUM] Primary navigation reaches roughly a third of routed pages
- **Location:** `frontend/src/components/Header.jsx`, `Sidebar.jsx`,
  `BottomNav.jsx` vs. `frontend/src/config/routes.js`.
- **Description:** Of 162 static (non-`:param`) routed paths, only 51 appear
  as a `to=`/`to:` target in `Header.jsx`, `Sidebar.jsx`, or `BottomNav.jsx`
  combined — 111 routed, working pages have no link in any of the three
  primary nav surfaces. Examples with real, wired backends and no nav path
  in: `AnimalHealthPage` (`/animal-health`), `IrrigationManagementPage`
  (`/irrigation-management`), `DairyManagementPage` (`/dairy-management`),
  `WaterManagementPage`/`WaterRecordsPage`, `PoultryManagementPage`,
  `MachineryManagementPage`, `SubsidyManagementPage`,
  `SystemAdministrationPage`, `RolePermissionPage`, `LibraryBrowserPage`
  (`/library`), `GovernmentDashboardPage`, `BankerDashboardPage`,
  `CADashboardPage`, `DecisionSupportPage`, `MarketSignalsPage`.
  **Mitigating factor, not a full fix:** `ModuleHubPage.jsx` (linked from
  both `Sidebar.jsx` and `BottomNav.jsx` as `/modules`) fetches
  `modulesAPI.getModules()` at runtime and renders a `Link` per module using
  a `module.route` field when present — this is a real secondary discovery
  path, but only for whichever of the 165 pages the module registry actually
  has a correct `route` populated for, and it requires the user to already
  know to visit `/modules` and search/scroll rather than finding a page from
  a role-relevant menu (e.g. a dairy farmer would not think to look in a
  generic "Modules" directory for `DairyManagementPage`). Not verified in
  this pass how many of the 111 the registry actually covers — a reasonable
  follow-up would be cross-referencing `modulesAPI.getModules()`'s live
  output against this 111-item list specifically.
- **Remediation:** role-scoped submenus (the platform already has
  farmer/banker/CA/government/admin dashboard pages, suggesting the intended
  IA) rather than relying on the generic module hub for primary discovery.

### 8. [LOW] `HarvestPlanPage.jsx` and `FPORegistrationPage.jsx` are honest placeholders, not silent gaps
- **Location:** `frontend/src/pages/HarvestPlanPage.jsx:14` (comment:
  "farmersAPI.getHarvestPlans/getWeatherForecast/getCropRecommendations never
  ... crop-recommendation data source in the API. The layout below is a
  ready-to-wire placeholder; no figures [are fabricated]");
  `FPORegistrationPage.jsx` (16 lines, generic `ModuleOperationPanel`
  bridging to real M051 backend operations, explicit comment "no bespoke
  form has been built for this module yet").
- **Description:** Not a bug — flagging only because both correspond to
  entries in the dead-API list (`harvestPlanningAPI`, `fpoRegistrationAPI`)
  and a naive dead-code sweep would misreport them as silently broken. Both
  pages are honest about their own incompleteness and don't fabricate data,
  consistent with this codebase's stated discipline elsewhere.

## Metrics

- Page components under `frontend/src/pages/`: 165 (165/165 routed — 0 orphaned)
- Route paths declared in `config/routes.js`: 164 (+1 direct import in `App.jsx`)
- Static (non-param) routed paths with zero Header/Sidebar/BottomNav link: 111 / 162
- Exported `*API` objects in `services/api.js`: 279
- `*API` objects with zero reference anywhere in `pages/`/`components/` (or
  anywhere else in `frontend/src`): 37, of which:
  - 6 confirmed pre-existing/documented dead ends (no backend at all,
    re-verified only — see Finding 5)
  - ~5 are real dead client code shadowed by a differently-named object the
    matching page actually uses (Finding 6) — feature itself is fine
  - ~26 are the genuine, previously-unreported gap: real, backend-mounted,
    zero UI consumer (Findings 1-4 cover the highest-value ones by name;
    remaining smaller ones — `energyAPI`, `costAPI`, `visionAPI`,
    `driverTrackingAPI`, `geofencingAPI`, `preSeasonAPI`,
    `organizationManagementAPI`, `tenantManagementAPI`,
    `farmerTrainingAPI` — not individually detailed here for space but
    follow the identical pattern: real backend route, `grep`-confirmed zero
    caller, worth the same treatment)

*Verified By VibeCheck ✅*
