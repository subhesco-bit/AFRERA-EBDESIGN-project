---
agent: ui-auditor
status: fail
findings: 8
---

# UI/UX Audit

## Summary

The application has a wide route and API surface, but several enterprise workflows are presented as if they are operational while their primary controls are inert, their navigation access model is inconsistent with route guards, or their UI is a generic JSON-operation console. The highest-impact risk is user trust: a user can reach a polished page, click an action such as register, sync, configure, or deactivate, and receive no request, feedback, or state change.

## Findings

### P0. Enterprise integration actions are visible but non-functional

- **Location:** [frontend/src/pages/EnterpriseIntegrationPage.jsx](frontend/src/pages/EnterpriseIntegrationPage.jsx#L186), [frontend/src/services/api.js](frontend/src/services/api.js#L170), [backend/src/routes/enterpriseIntegrationRoutes.js](backend/src/routes/enterpriseIntegrationRoutes.js#L1)
- **Description:** The integration detail view renders `Test Connection`, `Configure`, `Deactivate`, `Sync Now`, `View Logs`, `Test Payment`, `Test Logistics`, and `Execute Sync` buttons without handlers. The registration form also has no controlled values, submit handler, or mutation. The corresponding frontend API export only reads organization integrations, system status, and health; it does not provide mutations for these visible controls. This creates a false-success interaction: controls look production-ready but are no-ops.
- **Impact:** Administrators cannot complete the advertised integration lifecycle from the UI and receive no error or success feedback.
- **Remediation:** Either wire each control to a verified backend contract with loading, confirmation, success, and failure states, or remove/label the controls as unavailable until the contract exists. Add an integration-page test that asserts each primary action invokes the expected API mutation and updates the visible state.
- **Validation:** In a browser, select an integration, click each action, and assert a network request plus an observable state/toast change. In Jest/RTL, mock `enterpriseIntegrationAPI` and verify the handlers are called.

### P0. Navigation exposes protected workflows before the route guard can reject them

- **Location:** [frontend/src/components/Sidebar.jsx](frontend/src/components/Sidebar.jsx#L212), [frontend/src/components/RouteGuard.jsx](frontend/src/components/RouteGuard.jsx#L104), [frontend/src/App.jsx](frontend/src/App.jsx#L121)
- **Description:** `Sidebar` explicitly documents that it has no role gating and `canAccess` returns `true` for every non-special path. The same sidebar therefore offers links such as enterprise, ERP, AI, and operational pages to authenticated users regardless of role. `App` then applies `RoleRoute` to role-specific route groups, which redirects unauthorized users to `/unauthorized`. The result is a navigation model that advertises destinations the user cannot use.
- **Impact:** Users encounter avoidable unauthorized dead ends, especially on a large sidebar where role ownership is not obvious. It also exposes admin and institutional capability names to users who cannot access them.
- **Remediation:** Derive navigation visibility from the same route metadata used by `RoleRoute`, including farmer/admin/institutional roles. Keep a direct URL guard as defense in depth, but do not render a known-inaccessible link. Add tests for each role against the sidebar link set.
- **Validation:** Log in as farmer, banker, government, researcher, and admin; compare rendered links with the route role metadata and assert no visible link navigates immediately to `/unauthorized`.

### P1. The enterprise page is not keyboard-operable for integration selection

- **Location:** [frontend/src/pages/EnterpriseIntegrationPage.jsx](frontend/src/pages/EnterpriseIntegrationPage.jsx#L166)
- **Description:** Each integration is a clickable `div` with an `onClick`, but it is not a button, has no `tabIndex`, keyboard handler, focus styling, or selected-state semantics. A keyboard-only user cannot reliably select an integration to load its health details.
- **Impact:** The main detail workflow is inaccessible and the page fails the expected interaction pattern for a selectable list.
- **Remediation:** Use a button/listbox pattern or an actual link-like control with `aria-current`/`aria-selected`, visible focus, and arrow-key behavior where appropriate. Preserve the selected integration in the URL when deep-linking is useful.
- **Validation:** Navigate the page using Tab and Enter/Space only; verify every integration can be selected and that a screen reader announces its name, type, and status.

### P1. The generic module operation panel creates duplicate form IDs

- **Location:** [frontend/src/components/common/ModuleOperationPanel.jsx](frontend/src/components/common/ModuleOperationPanel.jsx#L87)
- **Description:** Every `OperationCard` renders the same `label htmlFor="arguments-json-passed-as-this-operation-"` and the same textarea `id`. A module with multiple operations therefore produces duplicate IDs and labels that can target the wrong textarea.
- **Impact:** Screen readers receive ambiguous field associations; browser label clicks and automated tests may operate on the first operation instead of the intended one.
- **Remediation:** Generate a stable ID from `moduleId` and `operation`, sanitize it for HTML, and associate each label with its unique textarea. Add `aria-describedby` for JSON validation errors and `aria-invalid` when parsing fails.
- **Validation:** Render a module with at least two operations and assert all IDs are unique; click each label and verify focus moves to its own textarea.

### P1. Enterprise and information-sharing workflows fall back to operator-only JSON consoles

- **Location:** [frontend/src/pages/InformationSharingPage.jsx](frontend/src/pages/InformationSharingPage.jsx#L49), [frontend/src/pages/CompleteERPIntegrationPage.jsx](frontend/src/pages/CompleteERPIntegrationPage.jsx#L31), [frontend/src/pages/WaterManagementPage.jsx](frontend/src/pages/WaterManagementPage.jsx#L158), [frontend/src/components/common/ModuleOperationPanel.jsx](frontend/src/components/common/ModuleOperationPanel.jsx#L1)
- **Description:** Major domain pages expose actions through repeated ID fields plus raw JSON payloads rather than domain forms, record pickers, validation, or guided workflows. Information sharing asks users to enter document IDs and JSON; ERP sync asks for IDs and JSON; water management similarly exposes backend operations. This is technically callable but not a professional workflow for farmers, finance staff, or enterprise operators.
- **Impact:** High input error rate, poor discoverability of required fields, no protection against syncing the wrong entity, and a high training burden. It also makes the UI look like an internal API console rather than a product surface.
- **Remediation:** Build resource-aware forms around existing API contracts: searchable entity selectors, schema-specific fields, inline validation, confirmation summaries, and result history. Keep a restricted developer/admin diagnostics view for raw JSON rather than making it the primary user journey.
- **Validation:** Conduct task tests for “sync one farmer harvest,” “create a document,” and “record a water budget” with a non-technical user; measure completion without reading source/API docs and verify invalid payloads are blocked before network submission.

### P1. The route preloader silently attempts the wrong dynamic imports

- **Location:** [frontend/src/App.jsx](frontend/src/App.jsx#L84), [frontend/src/utils/routePreloader.js](frontend/src/utils/routePreloader.js#L76)
- **Description:** `App` passes route objects from `getAllRoutes()` to `RoutePreloader`. The preloader filters routes and calls `preloadRoute(route.component.name)`, then constructs `import('../pages/${routePath}.jsx')`. The route component is a lazy wrapper, not the page module name, so this path is not a reliable mapping to a file; failures are caught and discarded. The component also has no user-visible telemetry for preload failures.
- **Impact:** Intended navigation performance improvements do not reliably occur, while idle work can generate failed chunk requests and mask regressions in route loading.
- **Remediation:** Store an explicit loader function or module key in route metadata and invoke that loader directly. Remove the duplicate path-based preloader implementation or make one canonical preloading utility. Add a test that verifies a flagged route resolves its actual chunk.
- **Validation:** Run a production build with network logging, visit the marketplace route after idle time, and assert the expected chunk is prefetched rather than `undefined`/component-name-derived requests.

### P2. Loading and error UX is globally generic and sometimes loses recovery context

- **Location:** [frontend/src/App.jsx](frontend/src/App.jsx#L91), [frontend/src/components/RouteLoading.jsx](frontend/src/components/RouteLoading.jsx#L14), [frontend/src/components/RouteErrorBoundary.jsx](frontend/src/components/RouteErrorBoundary.jsx#L223)
- **Description:** The outer application Suspense uses a full-screen spinner even though route-level `RouteSuspense` has contextual skeletons, making the actual page structure disappear during chunk loading. The dedicated `ErrorPage` renders the raw error message from navigation state and only offers back/home, without a request ID, retry path, or route-specific recovery. The result is inconsistent and low-information failure handling across a very large route surface.
- **Impact:** Slow or failing routes look stalled; support staff cannot correlate failures, and users may lose their intended workflow.
- **Remediation:** Use one route-aware loading boundary with `aria-busy`/status text and preserve the last stable layout. Add retry/reload and a support-safe error reference while avoiding raw internal error details in user-facing copy.
- **Validation:** Throttle the network and force a lazy chunk failure; verify a contextual skeleton appears, focus moves to the error heading, and retry returns to the requested route when the chunk becomes available.

### P2. Placeholder/generated UI remains present in the shipped frontend tree

- **Location:** [frontend/src/pages/Generated/Page10.jsx](frontend/src/pages/Generated/Page10.jsx#L4), [frontend/src/components/Atomic/Button.jsx](frontend/src/components/Atomic/Button.jsx#L4), [frontend/src/components/forms/ClaimForm.jsx](frontend/src/components/forms/ClaimForm.jsx#L5)
- **Description:** The repository contains many generated pages and atomic/form components whose rendered output is only an empty wrapper with `TODO: Implement`. Even if not currently linked by the primary route table, these files are part of the available component/page inventory and are likely candidates for future imports or generated module composition.
- **Impact:** A future route or component import can produce a blank page with no runtime error, and the codebase gives no reliable distinction between production-ready and scaffolded UI.
- **Remediation:** Remove unused scaffolds from the production import graph or mark them explicitly as non-production and exclude them from route/module generation. Add a CI check that fails when a routed page renders a TODO-only implementation.
- **Validation:** Build a route manifest from `routes.js` and module imports, scan each referenced page for TODO-only output, and smoke-test every generated module route at least once.

## Metrics

- Frontend route configuration contains a very large multi-category surface, including 150 generated module routes in [frontend/src/App.jsx](frontend/src/App.jsx#L201), but navigation and role metadata are maintained separately in [frontend/src/components/Sidebar.jsx](frontend/src/components/Sidebar.jsx#L4).
- Backend mounting is extensive and includes the enterprise, domain, livestock, ERP, climate, water, and information-sharing families in [backend/src/index.js](backend/src/index.js#L882), [backend/src/index.js](backend/src/index.js#L931), and [backend/src/index.js](backend/src/index.js#L1103). The dominant audit risk is therefore UI contract quality and discoverability, not only missing Express mounts.
- A repository search found 85 generated/page files with TODO-only output under `frontend/src/pages/Generated`; this metric should be split into “reachable” and “unreachable” before release decisions.

## Recommended Validation Order

1. Run browser smoke tests for the enterprise integration page and assert every visible primary action produces a request or is removed.
2. Run role-based navigation tests for all sidebar groups and institutional dashboards.
3. Add an accessibility test for duplicate IDs and keyboard selection in enterprise lists/module operation cards.
4. Run a route-manifest smoke test covering all configured routes and M001-M150 lazy imports.
5. Run throttled-network tests for route loading, chunk failure, and retry/error recovery.

### What's left
- [ ] Confirm which generated TODO-only pages are reachable through module imports before treating them as release blockers.
- [ ] Execute browser and role-based validation in a running frontend/backend environment.

*verified by vibecheck*---
agent: ui-auditor
status: warn
findings: 8
---

# UI Audit — Linkage/Wiring Focus

## Routing Follow-up (2026-09-03)

The requested routing/navigation slice was rechecked against the actual page
tree. Four defects were found and fixed:

- Removed 10 duplicate route declarations in `frontend/src/config/routes.js`
  for reports, bulk purchase, group buying, credit score, and EMI routes.
- Normalized `marketplace/contract-listing` to `/marketplace/contract-listing`.
- Changed the Sidebar `Admin` link from unregistered `/admin-dashboard` to the
  registered `/admin/settings` route.
- Added `role: 'admin'` to management routes already classified as admin-only
  by Sidebar policy, and changed `App.jsx` to enforce `route.role` with
  `RoleRoute`.

All 211 centralized lazy imports resolve to existing `.js` or `.jsx` page
modules. `BottomNav.jsx` had no evidenced route defect and was left unchanged.

Focused validation: `npm run build` passed with Vite transforming 3,675
modules and completing in 1m 28s. The existing BottomNav test remains the
next narrow executable check.

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
