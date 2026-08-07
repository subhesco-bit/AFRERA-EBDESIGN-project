# Frontend Boundary Violations

**Generated:** 2026-08-04 by `tools/frontend-boundaries.js`
**Status:** DESCRIPTIVE — measured from source.
**Do not edit by hand.**

---

**Total: 66** across 37 files (75 scanned).

| Rule | Severity | Files | Description |
|---|---|---|---|
| FE-01 | critical | 30 | Network calls go through services/api.js — never raw fetch(). |
| FE-02 | high | 22 | Components must not fetch. Pages fetch; components receive props. |
| FE-03 | high | 4 | Interactive elements need an accessible name. |
| FE-04 | high | 1 | Every route-level page needs an error boundary above it. |
| FE-05 | medium | 2 | No hardcoded colour literals — use design tokens. |
| FE-06 | medium | 7 | A page fetching data must render a loading and an error state. |

## FE-01 — Network calls go through services/api.js — never raw fetch().

**CRITICAL.** services/api.js attaches the Authorization header and handles 401 by refreshing the token. 30 files bypassed it with raw fetch() and NONE set an auth header. Against a guarded endpoint every one of those calls returns 401 and the screen renders empty.

- `components/ArVr/ExperienceViewer.jsx` — 2
- `components/BlockchainTraceability/TraceabilityViewer.jsx` — 2
- `components/ConsumerHealth/HealthDashboard.jsx` — 5
- `components/ConversationalAI/ChatInterface.jsx` — 4
- `components/FarmerPortal/LandRecords.jsx` — 3
- `components/FoodIntelligence/FoodSafetyDashboard.jsx` — 1
- `components/GIIntelligence/GIProductCard.jsx` — 1
- `components/Insurance/InsurancePremiumCalculator.jsx` — 2
- `components/IoTIntegration/DeviceMonitor.jsx` — 3
- `components/KnowledgeGraph/KnowledgeExplorer.jsx` — 2
- `components/LaboratoryERP/SampleRegistration.jsx` — 4
- `components/Logistics/RealTimeTracking.jsx` — 3
- `components/Marketplace/GSTCalculator.jsx` — 3
- `components/Marketplace/ProductReview.jsx` — 5
- `components/Multilingual/AutoTranslate.jsx` — 2
- `components/Multilingual/LanguageSelector.jsx` — 1
- `components/Multilingual/MultilingualProvider.jsx` — 6
- `components/NutritionIntelligence/NutritionLabel.jsx` — 2
- `components/OrganicTraceability/OrganicFarmRegistration.jsx` — 2
- `components/OrganicTraceability/QRCodeScanner.jsx` — 1
- `components/PredictiveAnalytics/DemandForecast.jsx` — 3
- `components/VoiceAI/VoiceAssistant.jsx` — 4
- `pages/AdminDashboardPage.jsx` — 3
- `pages/BankerDashboardPage.jsx` — 2
- `pages/CADashboardPage.jsx` — 1
- `pages/FPODashboardPage.jsx` — 1
- `pages/GovernmentDashboardPage.jsx` — 2
- `pages/ModuleHubPage.jsx` — 3
- `pages/ResearchDashboardPage.jsx` — 1
- `pages/SubsidyManagementPage.jsx` — 2

## FE-02 — Components must not fetch. Pages fetch; components receive props.

**HIGH.** A component that fetches cannot be reused on a screen that already has the data, and cannot be tested without mocking the network. It also produces N requests when rendered in a list.

- `components/ArVr/ExperienceViewer.jsx` — 2
- `components/BlockchainTraceability/TraceabilityViewer.jsx` — 2
- `components/ConsumerHealth/HealthDashboard.jsx` — 5
- `components/ConversationalAI/ChatInterface.jsx` — 4
- `components/FarmerPortal/LandRecords.jsx` — 3
- `components/FoodIntelligence/FoodSafetyDashboard.jsx` — 1
- `components/GIIntelligence/GIProductCard.jsx` — 1
- `components/Insurance/InsurancePremiumCalculator.jsx` — 2
- `components/IoTIntegration/DeviceMonitor.jsx` — 3
- `components/KnowledgeGraph/KnowledgeExplorer.jsx` — 2
- `components/LaboratoryERP/SampleRegistration.jsx` — 4
- `components/Logistics/RealTimeTracking.jsx` — 3
- `components/Marketplace/GSTCalculator.jsx` — 3
- `components/Marketplace/ProductReview.jsx` — 5
- `components/Multilingual/AutoTranslate.jsx` — 2
- `components/Multilingual/LanguageSelector.jsx` — 1
- `components/Multilingual/MultilingualProvider.jsx` — 6
- `components/NutritionIntelligence/NutritionLabel.jsx` — 2
- `components/OrganicTraceability/OrganicFarmRegistration.jsx` — 2
- `components/OrganicTraceability/QRCodeScanner.jsx` — 1
- `components/PredictiveAnalytics/DemandForecast.jsx` — 3
- `components/VoiceAI/VoiceAssistant.jsx` — 4

## FE-03 — Interactive elements need an accessible name.

**HIGH.** A button whose only content is an icon is unlabelled to a screen reader. This platform ships a voice mode for low-literacy and low-vision farmers; unlabelled controls make that mode decorative.

- `components/MobileOptimizedLayout.jsx` — 1
- `pages/DiscoverPage.jsx` — 1
- `pages/FarmAdvisorPage.jsx` — 1
- `pages/MarketplacePage.jsx` — 1

## FE-04 — Every route-level page needs an error boundary above it.

**HIGH.** Without one, a single component throwing unmounts the whole React tree and the user sees a blank white page. On a rural connection with partial data this is not a rare path.

- `App.jsx` — 1

## FE-05 — No hardcoded colour literals — use design tokens.

**MEDIUM.** Two different greens both called "the brand green" already shipped once. Tokens are the single source of truth; a hex in a component silently forks it and does not follow dark mode.

- `main.jsx` — 1
- `pages/AnalyticsPage.jsx` — 2

## FE-06 — A page fetching data must render a loading and an error state.

**MEDIUM.** Otherwise a slow or failed request is indistinguishable from empty data. The user cannot tell "no orders" from "we could not load your orders", and will act on the wrong one.

- `pages/AdminDashboardPage.jsx` — 1
- `pages/BankerDashboardPage.jsx` — 1
- `pages/CADashboardPage.jsx` — 1
- `pages/FPODashboardPage.jsx` — 1
- `pages/GovernmentDashboardPage.jsx` — 1
- `pages/ResearchDashboardPage.jsx` — 1
- `pages/SubsidyManagementPage.jsx` — 1
