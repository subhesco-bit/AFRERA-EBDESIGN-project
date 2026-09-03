# Frontend Boundary Violations

**Generated:** 2026-09-02 by `tools/frontend-boundaries.js`
**Status:** DESCRIPTIVE — measured from source.
**Do not edit by hand.**

---

**Total: 128** across 120 files (763 scanned).

| Rule | Severity | Files | Description |
|---|---|---|---|
| FE-01 | critical | 72 | Network calls go through services/api.js — never raw fetch(). |
| FE-02 | high | 31 | Components must not fetch. Pages fetch; components receive props. |
| FE-03 | high | 1 | Interactive elements need an accessible name. |
| FE-04 | high | 0 | Every route-level page needs an error boundary above it. |
| FE-05 | medium | 17 | No hardcoded colour literals — use design tokens. |
| FE-06 | medium | 7 | A page fetching data must render a loading and an error state. |

## FE-01 — Network calls go through services/api.js — never raw fetch().

**CRITICAL.** services/api.js attaches the Authorization header and handles 401 by refreshing the token. 30 files bypassed it with raw fetch() and NONE set an auth header. Against a guarded endpoint every one of those calls returns 401 and the screen renders empty.

- `components/Multilingual/LanguageSelector.jsx` — 1
- `modules/M006/M006Page.jsx` — 2
- `modules/M011/M011Page.jsx` — 2
- `modules/M012/M012Page.jsx` — 1
- `modules/M013/M013Page.jsx` — 1
- `modules/M015/M015Page.jsx` — 1
- `modules/M017/M017Page.jsx` — 1
- `modules/M022/M022Page.jsx` — 1
- `modules/M023/M023Page.jsx` — 1
- `modules/M024/M024Page.jsx` — 1
- `modules/M025/M025Page.jsx` — 1
- `modules/M026/M026Page.jsx` — 1
- `modules/M028/M028Page.jsx` — 1
- `modules/M029/M029Page.jsx` — 1
- `modules/M030/M030Page.jsx` — 1
- `modules/M031/M031Page.jsx` — 1
- `modules/M032/M032Page.jsx` — 1
- `modules/M033/M033Page.jsx` — 1
- `modules/M036/M036Page.jsx` — 1
- `modules/M040/M040Page.jsx` — 1
- `modules/M042/M042Page.jsx` — 1
- `modules/M043/M043Page.jsx` — 1
- `modules/M044/M044Page.jsx` — 1
- `modules/M045/M045Page.jsx` — 1
- `modules/M047/M047Page.jsx` — 1
- `modules/M048/M048Page.jsx` — 1
- `modules/M050/M050Page.jsx` — 1
- `modules/M052/M052Page.jsx` — 1
- `modules/M055/M055Page.jsx` — 1
- `modules/M057/M057Page.jsx` — 1
- `modules/M071/M071Page.jsx` — 1
- `modules/M073/M073Page.jsx` — 1
- `modules/M081/M081Page.jsx` — 1
- `modules/M082/M082Page.jsx` — 1
- `modules/M085/M085Page.jsx` — 1
- `modules/M086/M086Page.jsx` — 1
- `modules/M090/M090Page.jsx` — 1
- `modules/M091/M091Page.jsx` — 1
- `modules/M092/M092Page.jsx` — 1
- `modules/M093/M093Page.jsx` — 1
- _…and 32 more_

## FE-02 — Components must not fetch. Pages fetch; components receive props.

**HIGH.** A component that fetches cannot be reused on a screen that already has the data, and cannot be tested without mocking the network. It also produces N requests when rendered in a list.

- `components/AI/AIChat.jsx` — 1
- `components/AI/AICollaborationDashboard.jsx` — 1
- `components/AI/CopilotChat.jsx` — 2
- `components/ArVr/ExperienceViewer.jsx` — 1
- `components/BlockchainTraceability/TraceabilityViewer.jsx` — 1
- `components/common/ModuleOperationPanel.jsx` — 1
- `components/ConsumerHealth/HealthDashboard.jsx` — 1
- `components/ConversationalAI/ChatInterface.jsx` — 1
- `components/FarmerPortal/LandRecords.jsx` — 1
- `components/FoodIntelligence/FoodSafetyDashboard.jsx` — 1
- `components/GDPR/GDPRConsent.jsx` — 1
- `components/GIIntelligence/GIProductCard.jsx` — 1
- `components/Insurance/InsurancePremiumCalculator.jsx` — 1
- `components/IoTIntegration/DeviceMonitor.jsx` — 1
- `components/KnowledgeGraph/KnowledgeExplorer.jsx` — 1
- `components/LaboratoryERP/SampleRegistration.jsx` — 1
- `components/Library/LibraryBrowser.jsx` — 1
- `components/Logistics/CustodyChainViewer.jsx` — 1
- `components/Logistics/RealTimeTracking.jsx` — 1
- `components/Marketplace/GSTCalculator.jsx` — 2
- `components/Marketplace/ProductReview.jsx` — 1
- `components/MFA/MFASetup.jsx` — 1
- `components/Multilingual/AutoTranslate.jsx` — 1
- `components/Multilingual/LanguageSelector.jsx` — 2
- `components/Multilingual/MultilingualProvider.jsx` — 1
- `components/NotificationBell.jsx` — 2
- `components/NutritionIntelligence/NutritionLabel.jsx` — 1
- `components/OrganicTraceability/OrganicFarmRegistration.jsx` — 1
- `components/OrganicTraceability/QRCodeScanner.jsx` — 1
- `components/PredictiveAnalytics/DemandForecast.jsx` — 1
- `components/VoiceAI/VoiceAssistant.jsx` — 1

## FE-03 — Interactive elements need an accessible name.

**HIGH.** A button whose only content is an icon is unlabelled to a screen reader. This platform ships a voice mode for low-literacy and low-vision farmers; unlabelled controls make that mode decorative.

- `components/MobileOptimizedLayout.jsx` — 1

## FE-05 — No hardcoded colour literals — use design tokens.

**MEDIUM.** Two different greens both called "the brand green" already shipped once. Tokens are the single source of truth; a hex in a component silently forks it and does not follow dark mode.

- `components/common/DataPrimitives.jsx` — 17
- `main.jsx` — 1
- `pages/AnalyticsPage.jsx` — 2
- `pages/AssetAccountingPage.jsx` — 5
- `pages/ClimateWeatherPage.jsx` — 6
- `pages/CompetitivePositionPage.jsx` — 8
- `pages/CompliancePage.jsx` — 3
- `pages/CorridorEconomicsPage.jsx` — 1
- `pages/CostControlPage.jsx` — 7
- `pages/EnterpriseControlPage.jsx` — 29
- `pages/ExperienceLayerPage.jsx` — 8
- `pages/ForwardPricingPage.jsx` — 4
- `pages/LandUseCarbonPage.jsx` — 4
- `pages/LedgerPage.jsx` — 9
- `pages/ProjectSystemsPage.jsx` — 26
- `pages/RfqPage.jsx` — 5
- `pages/YieldManagementPage.jsx` — 5

## FE-06 — A page fetching data must render a loading and an error state.

**MEDIUM.** Otherwise a slow or failed request is indistinguishable from empty data. The user cannot tell "no orders" from "we could not load your orders", and will act on the wrong one.

- `pages/DigitalTwinPage.jsx` — 1
- `pages/EnterpriseIntegrationPage.jsx` — 1
- `pages/FinancialServicesDashboard.jsx` — 1
- `pages/IoTMonitoringDashboard.jsx` — 1
- `pages/LoanManagementPage.jsx` — 1
- `pages/OperationalDashboard.jsx` — 1
- `pages/PredictiveIntelligencePage.jsx` — 1
