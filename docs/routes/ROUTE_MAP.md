# Route Map — Frontend

Generated from `frontend/src/App.jsx`.

| Path | Component | Protected | Required Role |
|---|---|---:|---|
| / | HomePage | No | - |
| /marketplace | MarketplacePage | No | - |
| /products/:id | ProductDetailPage | No | - |
| /forms | FormManagementPage | No | - |
| /analytics | AnalyticsPage | No | - |
| /modules | ModuleHubPage | No | - |
| /login | LoginPage | No | - |
| /register | RegisterPage | No | - |
| /cart | CartPage | Yes | any authenticated user |
| /checkout | CheckoutPage | Yes | any authenticated user |
| /dashboard | DashboardPage | Yes | any authenticated user |
| /farmer-portal | FarmerPortalPage | Yes | farmer |
| /farmerhome | FarmerHomePage | Yes | farmer |
| /farmersell | FarmerSellPage | Yes | farmer |
| /farmerfield | FarmerFieldPage | Yes | farmer |
| /harvestplan | HarvestPlanPage | Yes | farmer |
| /harvestscore | HarvestScorePage | Yes | farmer |
| /whatgrow | WhatGrowPage | Yes | farmer |
| /seedvault | SeedVaultPage | Yes | farmer |
| /farmadvisor | FarmAdvisorPage | Yes | farmer |
| /pricecheck | PriceCheckPage | No | - |
| /pricebuild | PriceBuildPage | No | - |
| /dynamicpricing | DynamicPricingPage | No | - |
| /selltiming | SellTimingPage | No | - |
| /compare | ComparePage | No | - |
| /discover | DiscoverPage | No | - |
| /preorder | PreOrderPage | Yes | any authenticated user |
| /logistics | LogisticsPage | Yes | logistics |
| /insurance | InsurancePage | Yes | any authenticated user |
| /corporate-buyer | CorporateBuyerPage | Yes | corporate |
| /logistics-provider | LogisticsProviderPage | Yes | logistics |
| /admin-dashboard | AdminDashboardPage | Yes | admin |
| /economic | EconomicDashboard | Yes | admin |
| * (404) | Inline 404 | No | - |

Notes:
- Protected routes use `ProtectedRoute` component which enforces authentication and optional `requiredRole`.
- Use this table to drive navigation, permissions and wireframe linking.
