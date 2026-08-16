/**
 * Enterprise-Grade Route Configuration
 * 
 * Centralized route configuration with:
 * - Route metadata for SEO
 * - Authentication requirements
 * - Role-based access control
 * - Route transitions
 * - Preloading strategies
 * - Analytics tracking
 * - Error boundaries
 * - Loading states
 */

import { lazy } from 'react'


/**
 * Lazy load page components
 */
const HomePage = lazy(() => import('../pages/HomePage'))
const MarketplacePage = lazy(() => import('../pages/MarketplacePage'))
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'))
const CartPage = lazy(() => import('../pages/CartPage'))
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))
const FarmerPortalPage = lazy(() => import('../pages/FarmerPortalPage'))
const FarmerHomePage = lazy(() => import('../pages/FarmerHomePage'))
const FarmerSellPage = lazy(() => import('../pages/FarmerSellPage'))
const FarmerFieldPage = lazy(() => import('../pages/FarmerFieldPage'))
const HarvestPlanPage = lazy(() => import('../pages/HarvestPlanPage'))
const HarvestScorePage = lazy(() => import('../pages/HarvestScorePage'))
const WhatGrowPage = lazy(() => import('../pages/WhatGrowPage'))
const SeedVaultPage = lazy(() => import('../pages/SeedVaultPage'))
const FarmAdvisorPage = lazy(() => import('../pages/FarmAdvisorPage'))
const PriceCheckPage = lazy(() => import('../pages/PriceCheckPage'))
const PriceBuildPage = lazy(() => import('../pages/PriceBuildPage'))
const DynamicPricingPage = lazy(() => import('../pages/DynamicPricingPage'))
const SellTimingPage = lazy(() => import('../pages/SellTimingPage'))
const ComparePage = lazy(() => import('../pages/ComparePage'))
const DiscoverPage = lazy(() => import('../pages/DiscoverPage'))
const PreOrderPage = lazy(() => import('../pages/PreOrderPage'))
const LogisticsPage = lazy(() => import('../pages/LogisticsPage'))
const InsurancePage = lazy(() => import('../pages/InsurancePage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const WalletPage = lazy(() => import('../pages/WalletPage'))
const BankPassportPage = lazy(() => import('../pages/BankPassportPage'))
const FarmerEntranceHubPage = lazy(() => import('../pages/FarmerEntranceHubPage'))
const FarmerSellDoorPage = lazy(() => import('../pages/FarmerSellDoorPage'))
const FarmerHouseholdDoorPage = lazy(() => import('../pages/FarmerHouseholdDoorPage'))
const FarmerFieldDoorPage = lazy(() => import('../pages/FarmerFieldDoorPage'))
const FarmerSharedDoorPage = lazy(() => import('../pages/FarmerSharedDoorPage'))
const ForwardPricingPage = lazy(() => import('../pages/ForwardPricingPage'))
const ClimateWeatherPage = lazy(() => import('../pages/ClimateWeatherPage'))
const LedgerPage = lazy(() => import('../pages/LedgerPage'))
const CompliancePage = lazy(() => import('../pages/CompliancePage'))
const RfqPage = lazy(() => import('../pages/RfqPage'))
const CorridorEconomicsPage = lazy(() => import('../pages/CorridorEconomicsPage'))
const LandUseCarbonPage = lazy(() => import('../pages/LandUseCarbonPage'))
const AssetAccountingPage = lazy(() => import('../pages/AssetAccountingPage'))
const CostControlPage = lazy(() => import('../pages/CostControlPage'))
const ProjectSystemsPage = lazy(() => import('../pages/ProjectSystemsPage'))
const YieldManagementPage = lazy(() => import('../pages/YieldManagementPage'))
const CompetitivePositionPage = lazy(() => import('../pages/CompetitivePositionPage'))
const ExperienceLayerPage = lazy(() => import('../pages/ExperienceLayerPage'))
const FormManagementPage = lazy(() => import('../pages/FormManagementPage'))
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'))
const ModuleHubPage = lazy(() => import('../pages/ModuleHubPage'))
const CorporateBuyerPage = lazy(() => import('../pages/CorporateBuyerPage'))
const LogisticsProviderPage = lazy(() => import('../pages/LogisticsProviderPage'))
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'))
const FPODashboardPage = lazy(() => import('../pages/FPODashboardPage'))
const AuthorizationPage = lazy(() => import('../pages/AuthorizationPage'))
const ClimateAdvisoryPage = lazy(() => import('../pages/ClimateAdvisoryPage'))
const DairyManagementPage = lazy(() => import('../pages/DairyManagementPage'))
const FarmCostingPage = lazy(() => import('../pages/FarmCostingPage'))
const FarmerKycPage = lazy(() => import('../pages/FarmerKycPage'))
const FertilizerInventoryPage = lazy(() => import('../pages/FertilizerInventoryPage'))
const IrrigationManagementPage = lazy(() => import('../pages/IrrigationManagementPage'))
const LabourManagementPage = lazy(() => import('../pages/LabourManagementPage'))
const LandRegistryPage = lazy(() => import('../pages/LandRegistryPage'))
const OrchardManagementPage = lazy(() => import('../pages/OrchardManagementPage'))
const PondManagementPage = lazy(() => import('../pages/PondManagementPage'))
const ShgManagementPage = lazy(() => import('../pages/ShgManagementPage'))
const TractorManagementPage = lazy(() => import('../pages/TractorManagementPage'))
const VillageRegistryPage = lazy(() => import('../pages/VillageRegistryPage'))
const SowingManagementPage = lazy(() => import('../pages/SowingManagementPage'))
const BankerDashboardPage = lazy(() => import('../pages/BankerDashboardPage'))
const CADashboardPage = lazy(() => import('../pages/CADashboardPage'))
const GovernmentDashboardPage = lazy(() => import('../pages/GovernmentDashboardPage'))
const ResearchDashboardPage = lazy(() => import('../pages/ResearchDashboardPage'))
const ClimateMonitoringPage = lazy(() => import('../pages/ClimateMonitoringPage'))
const OperationsManagementPage = lazy(() => import('../pages/OperationsManagementPage'))
const MachineryManagementPage = lazy(() => import('../pages/MachineryManagementPage'))
const HorticultureManagementPage = lazy(() => import('../pages/HorticultureManagementPage'))
const FisheriesManagementPage = lazy(() => import('../pages/FisheriesManagementPage'))
const IdentityManagementPage = lazy(() => import('../pages/IdentityManagementPage'))
const PlatformFoundationPage = lazy(() => import('../pages/PlatformFoundationPage'))
const EnterpriseControlPage = lazy(() => import('../pages/EnterpriseControlPage'))
const AIBackbonePage = lazy(() => import('../pages/AIBackbonePage'))
const DietRecipesPage = lazy(() => import('../pages/DietRecipesPage'))
const WearablesPage = lazy(() => import('../pages/WearablesPage'))
const FitbitCallbackPage = lazy(() => import('../pages/FitbitCallbackPage'))
const DefenseFitnessPrepPage = lazy(() => import('../pages/DefenseFitnessPrepPage'))
const SellerProductFormPage = lazy(() => import('../pages/SellerProductFormPage'))
const VarietyDirectoryPage = lazy(() => import('../pages/VarietyDirectoryPage'))
const CropValueReviewPage = lazy(() => import('../pages/CropValueReviewPage'))
const PoultryManagementPage = lazy(() => import('../pages/PoultryManagementPage'))
const GoatFarmingPage = lazy(() => import('../pages/GoatFarmingPage'))
const SheepFarmingPage = lazy(() => import('../pages/SheepFarmingPage'))
const PigFarmingPage = lazy(() => import('../pages/PigFarmingPage'))
const AnimalHealthPage = lazy(() => import('../pages/AnimalHealthPage'))
const UnifiedLedgerPage = lazy(() => import('../pages/UnifiedLedgerPage'))
const REOSDashboardPage = lazy(() => import('../pages/REOSDashboardPage'))
const AIDashboard = lazy(() => import('../pages/AIDashboard'))
const ERPDashboard = lazy(() => import('../pages/ERPDashboard'))
const B2BMarketplace = lazy(() => import('../pages/B2BMarketplace'))
const MarketingCenter = lazy(() => import('../pages/MarketingCenter'))
const NutrientValueMarketplace = lazy(() => import('../pages/NutrientValueMarketplace'))

// Additional management pages
const FarmerProfilePage = lazy(() => import('../pages/FarmerProfilePage'))
const FarmerFamilyPage = lazy(() => import('../pages/FarmerFamilyPage'))
const FarmerVerificationPage = lazy(() => import('../pages/FarmerVerificationPage'))
const FarmerSkillPage = lazy(() => import('../pages/FarmerSkillPage'))
const FarmerHealthWelfarePage = lazy(() => import('../pages/FarmerHealthWelfarePage'))
const CropCalendarPage = lazy(() => import('../pages/CropCalendarPage'))
const CropRegistrationPage = lazy(() => import('../pages/CropRegistrationPage'))
const CropVarietyPage = lazy(() => import('../pages/CropVarietyPage'))
const SeedPlanningPage = lazy(() => import('../pages/SeedPlanningPage'))
const NurseryManagementPage = lazy(() => import('../pages/NurseryManagementPage'))
const CropMonitoringPage = lazy(() => import('../pages/CropMonitoringPage'))
const LandManagementPage = lazy(() => import('../pages/LandManagementPage'))
const InputSupplyManagementPage = lazy(() => import('../pages/InputSupplyManagementPage'))
const LivestockManagementPage = lazy(() => import('../pages/LivestockManagementPage'))
const CommunityManagementPage = lazy(() => import('../pages/CommunityManagementPage'))
const SoilManagementPage = lazy(() => import('../pages/SoilManagementPage'))
const WaterManagementPage = lazy(() => import('../pages/WaterManagementPage'))
const SubsidyManagementPage = lazy(() => import('../pages/SubsidyManagementPage'))

/**
 * Public routes - no authentication required
 */
export const publicRoutes = undefined[
  {
    path: '/',
    component: HomePage,
    title: 'Home - AFRERA Agriculture Platform',
    description: 'Welcome to AFRERA - Your comprehensive agriculture and rural economy platform',
    keywords: 'agriculture, farming, rural economy, marketplace',
    transition: 'fade'
  },
  {
    path: '/marketplace',
    component: MarketplacePage,
    title: 'Marketplace - Buy & Sell Agricultural Products',
    description: 'Browse and purchase fresh produce, seeds, and agricultural products directly from farmers',
    keywords: 'marketplace, buy, sell, agricultural products, farming',
    transition: 'slide',
    preload: true
  },
  {
    path: '/products/:id',
    component: ProductDetailPage,
    title: 'Product Details',
    description: 'View detailed information about agricultural products',
    keywords: 'product, details, agriculture',
    transition: 'fade',
    preload: true
  },
  {
    path: '/login',
    component: LoginPage,
    title: 'Login - AFRERA',
    description: 'Sign in to your AFRERA account',
    keywords: 'login, sign in, authentication',
    transition: 'fade',
    noIndex: true
  },
  {
    path: '/register',
    component: RegisterPage,
    title: 'Register - AFRERA',
    description: 'Create your AFRERA account',
    keywords: 'register, sign up, create account',
    transition: 'fade',
    noIndex: true
  },
  {
    path: '/farmer-entrance',
    component: FarmerEntranceHubPage,
    title: 'Farmer Portal - AFRERA',
    description: 'Access farmer services and resources',
    keywords: 'farmer, portal, services',
    transition: 'slide'
  },
  {
    path: '/farmer-entrance/sell',
    component: FarmerSellDoorPage,
    title: 'Sell Your Produce - AFRERA',
    description: 'Sell your agricultural products on our marketplace',
    keywords: 'sell, produce, marketplace',
    transition: 'fade'
  },
  {
    path: '/farmer-entrance/household',
    component: FarmerHouseholdDoorPage,
    title: 'Household Services - AFRERA',
    description: 'Household services for farmers',
    keywords: 'household, services, farmer',
    transition: 'fade'
  },
  {
    path: '/farmer-entrance/field',
    component: FarmerFieldDoorPage,
    title: 'Field Management - AFRERA',
    description: 'Manage your fields and crops',
    keywords: 'field, management, crops',
    transition: 'fade'
  },
  {
    path: '/farmer-entrance/shared',
    component: FarmerSharedDoorPage,
    title: 'Shared Resources - AFRERA',
    description: 'Access shared farming resources',
    keywords: 'shared, resources, farming',
    transition: 'fade'
  },
  {
    path: '/pricing/forward',
    component: ForwardPricingPage,
    title: 'Forward Pricing - AFRERA',
    description: 'View forward pricing for agricultural commodities',
    keywords: 'forward, pricing, commodities',
    transition: 'fade'
  },
  {
    path: '/climate',
    component: ClimateWeatherPage,
    title: 'Climate & Weather - AFRERA',
    description: 'Weather forecasts and climate information for farmers',
    keywords: 'climate, weather, forecast, farming',
    transition: 'fade'
  },
  {
    path: '/corridor-economics',
    component: CorridorEconomicsPage,
    title: 'Corridor Economics - AFRERA',
    description: 'Economic analysis of agricultural corridors',
    keywords: 'corridor, economics, agriculture',
    transition: 'fade'
  },
  {
    path: '/land-use',
    component: LandUseCarbonPage,
    title: 'Land Use & Carbon - AFRERA',
    description: 'Land use and carbon credit information',
    keywords: 'land use, carbon, credits, agriculture',
    transition: 'fade'
  }
]

/**
 * Protected routes - authentication required
 */
export const protectedRoutes = [
  {
    path: '/cart',
    component: CartPage,
    title: 'Shopping Cart - AFRERA',
    description: 'View and manage your shopping cart',
    keywords: 'cart, shopping, checkout',
    transition: 'slide',
    preload: true
  },
  {
    path: '/checkout',
    component: CheckoutPage,
    title: 'Checkout - AFRERA',
    description: 'Complete your purchase',
    keywords: 'checkout, payment, order',
    transition: 'fade',
    noIndex: true
  },
  {
    path: '/dashboard',
    component: DashboardPage,
    title: 'Dashboard - AFRERA',
    description: 'Your personalized dashboard',
    keywords: 'dashboard, overview, account',
    transition: 'fade'
  },
  {
    path: '/wallet',
    component: WalletPage,
    title: 'Wallet - AFRERA',
    description: 'Manage your digital wallet and payments',
    keywords: 'wallet, payments, digital',
    transition: 'fade'
  },
  {
    path: '/bank-passport',
    component: BankPassportPage,
    title: 'Bank Passport - AFRERA',
    description: 'Your digital banking passport',
    keywords: 'bank, passport, digital identity',
    transition: 'fade'
  },
  {
    path: '/forms',
    component: FormManagementPage,
    title: 'Form Management - AFRERA',
    description: 'Manage your forms and applications',
    keywords: 'forms, management, applications',
    transition: 'fade'
  },
  {
    path: '/analytics',
    component: AnalyticsPage,
    title: 'Analytics - AFRERA',
    description: 'View your analytics and insights',
    keywords: 'analytics, insights, data',
    transition: 'fade'
  },
  {
    path: '/modules',
    component: ModuleHubPage,
    title: 'Module Hub - AFRERA',
    description: 'Access all available modules',
    keywords: 'modules, hub, features',
    transition: 'fade'
  }
]

/**
 * Farmer-only routes
 */
export const farmerRoutes = [
  {
    path: '/farmer-portal',
    component: FarmerPortalPage,
    title: 'Farmer Portal - AFRERA',
    description: 'Your dedicated farmer portal',
    keywords: 'farmer, portal, dashboard',
    transition: 'slide'
  },
  {
    path: '/farmerhome',
    component: FarmerHomePage,
    title: 'Farmer Home - AFRERA',
    description: 'Your farmer home dashboard',
    keywords: 'farmer, home, dashboard',
    transition: 'fade'
  },
  {
    path: '/farmer-sell',
    component: FarmerSellPage,
    title: 'Sell Produce - AFRERA',
    description: 'Sell your agricultural produce',
    keywords: 'sell, produce, farmer',
    transition: 'fade'
  },
  {
    path: '/farmer-field',
    component: FarmerFieldPage,
    title: 'Field Management - AFRERA',
    description: 'Manage your agricultural fields',
    keywords: 'field, management, farmer',
    transition: 'fade'
  },
  {
    path: '/harvest-plan',
    component: HarvestPlanPage,
    title: 'Harvest Planning - AFRERA',
    description: 'Plan your harvest schedule',
    keywords: 'harvest, planning, schedule',
    transition: 'fade'
  },
  {
    path: '/harvest-score',
    component: HarvestScorePage,
    title: 'Harvest Score - AFRERA',
    description: 'View your harvest performance score',
    keywords: 'harvest, score, performance',
    transition: 'fade'
  },
  {
    path: '/what-grow',
    component: WhatGrowPage,
    title: 'What to Grow - AFRERA',
    description: 'Get recommendations on what to grow',
    keywords: 'grow, recommendations, crops',
    transition: 'fade'
  },
  {
    path: '/seed-vault',
    component: SeedVaultPage,
    title: 'Seed Vault - AFRERA',
    description: 'Access seed varieties and information',
    keywords: 'seeds, vault, varieties',
    transition: 'fade'
  },
  {
    path: '/farm-advisor',
    component: FarmAdvisorPage,
    title: 'Farm Advisor - AFRERA',
    description: 'Get expert farming advice',
    keywords: 'advisor, farming, expert',
    transition: 'fade'
  },
  {
    path: '/price-check',
    component: PriceCheckPage,
    title: 'Price Check - AFRERA',
    description: 'Check current market prices',
    keywords: 'price, check, market',
    transition: 'fade'
  },
  {
    path: '/price-build',
    component: PriceBuildPage,
    title: 'Price Builder - AFRERA',
    description: 'Build your pricing strategy',
    keywords: 'price, builder, strategy',
    transition: 'fade'
  },
  {
    path: '/dynamic-pricing',
    component: DynamicPricingPage,
    title: 'Dynamic Pricing - AFRERA',
    description: 'Dynamic pricing tools',
    keywords: 'dynamic, pricing, tools',
    transition: 'fade'
  },
  {
    path: '/sell-timing',
    component: SellTimingPage,
    title: 'Sell Timing - AFRERA',
    description: 'Optimize your sell timing',
    keywords: 'sell, timing, optimize',
    transition: 'fade'
  },
  {
    path: '/compare',
    component: ComparePage,
    title: 'Compare - AFRERA',
    description: 'Compare products and prices',
    keywords: 'compare, products, prices',
    transition: 'fade'
  },
  {
    path: '/discover',
    component: DiscoverPage,
    title: 'Discover - AFRERA',
    description: 'Discover new opportunities',
    keywords: 'discover, opportunities, farming',
    transition: 'fade'
  },
  {
    path: '/pre-order',
    component: PreOrderPage,
    title: 'Pre-Order - AFRERA',
    description: 'Pre-order agricultural products',
    keywords: 'pre-order, products, farming',
    transition: 'fade'
  },
  {
    path: '/logistics',
    component: LogisticsPage,
    title: 'Logistics - AFRERA',
    description: 'Manage your logistics and shipping',
    keywords: 'logistics, shipping, transport',
    transition: 'fade'
  },
  {
    path: '/insurance',
    component: InsurancePage,
    title: 'Insurance - AFRERA',
    description: 'Agricultural insurance options',
    keywords: 'insurance, agricultural, protection',
    transition: 'fade'
  },
  {
    path: '/ledger',
    component: LedgerPage,
    title: 'Ledger - AFRERA',
    description: 'Your financial ledger',
    keywords: 'ledger, financial, accounting',
    transition: 'fade'
  },
  {
    path: '/compliance',
    component: CompliancePage,
    title: 'Compliance - AFRERA',
    description: 'Compliance and regulatory information',
    keywords: 'compliance, regulatory, farming',
    transition: 'fade'
  },
  {
    path: '/procurement',
    component: RfqPage,
    title: 'Procurement - AFRERA',
    description: 'Procurement and RFQ management',
    keywords: 'procurement, RFQ, purchasing',
    transition: 'fade'
  },
  {
    path: '/asset-accounting',
    component: AssetAccountingPage,
    title: 'Asset Accounting - AFRERA',
    description: 'Manage your agricultural assets',
    keywords: 'asset, accounting, management',
    transition: 'fade'
  },
  {
    path: '/cost-control',
    component: CostControlPage,
    title: 'Cost Control - AFRERA',
    description: 'Control your farming costs',
    keywords: 'cost, control, budget',
    transition: 'fade'
  },
  {
    path: '/project-systems',
    component: ProjectSystemsPage,
    title: 'Project Systems - AFRERA',
    description: 'Manage your farming projects',
    keywords: 'project, systems, management',
    transition: 'fade'
  },
  {
    path: '/yield-management',
    component: YieldManagementPage,
    title: 'Yield Management - AFRERA',
    description: 'Optimize your crop yields',
    keywords: 'yield, management, optimization',
    transition: 'fade'
  },
  {
    path: '/competitive-position',
    component: CompetitivePositionPage,
    title: 'Competitive Position - AFRERA',
    description: 'Analyze your competitive position',
    keywords: 'competitive, position, analysis',
    transition: 'fade'
  },
  {
    path: '/experience',
    component: ExperienceLayerPage,
    title: 'Experience Layer - AFRERA',
    description: 'Your farming experience layer',
    keywords: 'experience, layer, farming',
    transition: 'fade'
  }
]

/**
 * Admin-only routes
 */
export const adminRoutes = [
  {
    path: '/users',
    component: AuthorizationPage,
    title: 'User Management - AFRERA',
    description: 'Manage platform users',
    keywords: 'users, management, admin',
    transition: 'fade',
    role: 'admin'
  },
  {
    path: '/admin/settings',
    component: AdminDashboardPage,
    title: 'Admin Settings - AFRERA',
    description: 'Platform administration settings',
    keywords: 'admin, settings, configuration',
    transition: 'fade',
    role: 'admin'
  },
  {
    path: '/fpo-dashboard',
    component: FPODashboardPage,
    title: 'FPO Dashboard - AFRERA',
    description: 'Farmer Producer Organization dashboard',
    keywords: 'FPO, dashboard, organization',
    transition: 'fade',
    role: 'admin'
  },
  {
    path: '/admin/crop-value-review',
    component: CropValueReviewPage,
    title: 'Crop Value Review - AFRERA',
    description: 'Review AI-suggested crop value-compound reference data before publication',
    keywords: 'admin, crop, nutrient, review, ai',
    transition: 'fade',
    role: 'admin'
  }
]

/**
 * Dashboard routes for different roles
 */
export const dashboardRoutes = [
  {
    path: '/banker-dashboard',
    component: BankerDashboardPage,
    title: 'Banker Dashboard - AFRERA',
    description: 'Banking dashboard for financial partners',
    keywords: 'banker, dashboard, financial',
    transition: 'fade',
    role: 'banker'
  },
  {
    path: '/ca-dashboard',
    component: CADashboardPage,
    title: 'CA Dashboard - AFRERA',
    description: 'Chartered Accountant dashboard',
    keywords: 'CA, dashboard, accounting',
    transition: 'fade',
    role: 'ca'
  },
  {
    path: '/government-dashboard',
    component: GovernmentDashboardPage,
    title: 'Government Dashboard - AFRERA',
    description: 'Government oversight dashboard',
    keywords: 'government, dashboard, oversight',
    transition: 'fade',
    role: 'government'
  },
  {
    path: '/research-dashboard',
    component: ResearchDashboardPage,
    title: 'Research Dashboard - AFRERA',
    description: 'Agricultural research dashboard',
    keywords: 'research, dashboard, agriculture',
    transition: 'fade',
    role: 'researcher'
  },
  {
    path: '/corporate-buyer',
    component: CorporateBuyerPage,
    title: 'Corporate Buyer - AFRERA',
    description: 'Corporate buyer portal',
    keywords: 'corporate, buyer, procurement',
    transition: 'fade',
    role: 'corporate'
  },
  {
    path: '/logistics-provider',
    component: LogisticsProviderPage,
    title: 'Logistics Provider - AFRERA',
    description: 'Logistics provider portal',
    keywords: 'logistics, provider, transport',
    transition: 'fade',
    role: 'logistics'
  }
]

/**
 * Management routes
 */
export const managementRoutes = [
  {
    path: '/farmer-profile',
    component: FarmerProfilePage,
    title: 'Farmer Profile - AFRERA',
    description: 'Manage your farmer profile',
    keywords: 'farmer, profile, management',
    transition: 'fade'
  },
  {
    path: '/farmer-family',
    component: FarmerFamilyPage,
    title: 'Family Information - AFRERA',
    description: 'Family information and details',
    keywords: 'family, information, farmer',
    transition: 'fade'
  },
  {
    path: '/farmer-verification',
    component: FarmerVerificationPage,
    title: 'Farmer Verification - AFRERA',
    description: 'Farmer verification status',
    keywords: 'verification, farmer, status',
    transition: 'fade'
  },
  {
    path: '/farmer-skills',
    component: FarmerSkillPage,
    title: 'Farmer Skills - AFRERA',
    description: 'Skills and certifications',
    keywords: 'skills, certifications, farmer',
    transition: 'fade'
  },
  {
    path: '/farmer-welfare',
    component: FarmerHealthWelfarePage,
    title: 'Health & Welfare - AFRERA',
    description: 'Health and welfare programs',
    keywords: 'health, welfare, farmer',
    transition: 'fade'
  },
  {
    path: '/crop-calendar',
    component: CropCalendarPage,
    title: 'Crop Calendar - AFRERA',
    description: 'Your crop planting calendar',
    keywords: 'crop, calendar, planting',
    transition: 'fade'
  },
  {
    path: '/crop-registration',
    component: CropRegistrationPage,
    title: 'Crop Registration - AFRERA',
    description: 'Register your crops',
    keywords: 'crop, registration, farming',
    transition: 'fade'
  },
  {
    path: '/crop-variety',
    component: CropVarietyPage,
    title: 'Crop Varieties - AFRERA',
    description: 'Crop variety information',
    keywords: 'crop, variety, information',
    transition: 'fade'
  },
  {
    path: '/seed-planning',
    component: SeedPlanningPage,
    title: 'Seed Planning - AFRERA',
    description: 'Plan your seed requirements',
    keywords: 'seed, planning, requirements',
    transition: 'fade'
  },
  {
    path: '/nursery-management',
    component: NurseryManagementPage,
    title: 'Nursery Management - AFRERA',
    description: 'Manage your nursery',
    keywords: 'nursery, management, farming',
    transition: 'fade'
  },
  {
    path: '/crop-monitoring',
    component: CropMonitoringPage,
    title: 'Crop Monitoring - AFRERA',
    description: 'Monitor your crops',
    keywords: 'crop, monitoring, farming',
    transition: 'fade'
  },
  {
    path: '/land-management',
    component: LandManagementPage,
    title: 'Land Management - AFRERA',
    description: 'Manage your land holdings',
    keywords: 'land, management, farming',
    transition: 'fade'
  },
  {
    path: '/input-supply',
    component: InputSupplyManagementPage,
    title: 'Input Supply - AFRERA',
    description: 'Manage agricultural inputs',
    keywords: 'input, supply, farming',
    transition: 'fade'
  },
  {
    path: '/livestock-management',
    component: LivestockManagementPage,
    title: 'Livestock Management - AFRERA',
    description: 'Manage your livestock',
    keywords: 'livestock, management, farming',
    transition: 'fade'
  },
  {
    path: '/community-management',
    component: CommunityManagementPage,
    title: 'Community Management - AFRERA',
    description: 'Community management tools',
    keywords: 'community, management, farming',
    transition: 'fade'
  },
  {
    path: '/soil-management',
    component: SoilManagementPage,
    title: 'Soil Management - AFRERA',
    description: 'Soil health and management',
    keywords: 'soil, management, health',
    transition: 'fade'
  },
  {
    path: '/water-management',
    component: WaterManagementPage,
    title: 'Water Management - AFRERA',
    description: 'Water resource management',
    keywords: 'water, management, irrigation',
    transition: 'fade'
  },
  {
    path: '/subsidy-management',
    component: SubsidyManagementPage,
    title: 'Subsidy Management - AFRERA',
    description: 'Government subsidy management',
    keywords: 'subsidy, government, management',
    transition: 'fade'
  },
  {
    path: '/farm-costing',
    component: FarmCostingPage,
    title: 'Farm Costing - AFRERA',
    description: 'Farm costing and budgeting',
    keywords: 'farm, costing, budget',
    transition: 'fade'
  },
  {
    path: '/farmer-kyc',
    component: FarmerKycPage,
    title: 'Farmer KYC - AFRERA',
    description: 'Know Your Customer verification',
    keywords: 'KYC, verification, farmer',
    transition: 'fade'
  },
  {
    path: '/fertilizer-inventory',
    component: FertilizerInventoryPage,
    title: 'Fertilizer Inventory - AFRERA',
    description: 'Fertilizer inventory management',
    keywords: 'fertilizer, inventory, management',
    transition: 'fade'
  },
  {
    path: '/irrigation-management',
    component: IrrigationManagementPage,
    title: 'Irrigation Management - AFRERA',
    description: 'Irrigation system management',
    keywords: 'irrigation, management, water',
    transition: 'fade'
  },
  {
    path: '/labour-management',
    component: LabourManagementPage,
    title: 'Labour Management - AFRERA',
    description: 'Farm labour management',
    keywords: 'labour, management, workforce',
    transition: 'fade'
  },
  {
    path: '/land-registry',
    component: LandRegistryPage,
    title: 'Land Registry - AFRERA',
    description: 'Land registration and records',
    keywords: 'land, registry, records',
    transition: 'fade'
  },
  {
    path: '/orchard-management',
    component: OrchardManagementPage,
    title: 'Orchard Management - AFRERA',
    description: 'Orchard and fruit management',
    keywords: 'orchard, management, fruit',
    transition: 'fade'
  },
  {
    path: '/pond-management',
    component: PondManagementPage,
    title: 'Pond Management - AFRERA',
    description: 'Pond and water body management',
    keywords: 'pond, management, water',
    transition: 'fade'
  },
  {
    path: '/shg-management',
    component: ShgManagementPage,
    title: 'SHG Management - AFRERA',
    description: 'Self Help Group management',
    keywords: 'SHG, management, group',
    transition: 'fade'
  },
  {
    path: '/tractor-management',
    component: TractorManagementPage,
    title: 'Tractor Management - AFRERA',
    description: 'Tractor and equipment management',
    keywords: 'tractor, management, equipment',
    transition: 'fade'
  },
  {
    path: '/village-registry',
    component: VillageRegistryPage,
    title: 'Village Registry - AFRERA',
    description: 'Village registration and records',
    keywords: 'village, registry, records',
    transition: 'fade'
  },
  {
    path: '/sowing-management',
    component: SowingManagementPage,
    title: 'Sowing Management - AFRERA',
    description: 'Sowing and planting management',
    keywords: 'sowing, planting, management',
    transition: 'fade'
  },
  {
    path: '/climate-advisory',
    component: ClimateAdvisoryPage,
    title: 'Climate Advisory - AFRERA',
    description: 'Climate advisory and recommendations',
    keywords: 'climate, advisory, recommendations',
    transition: 'fade'
  },
  {
    path: '/dairy-management',
    component: DairyManagementPage,
    title: 'Dairy Management - AFRERA',
    description: 'Dairy farming management',
    keywords: 'dairy, management, farming',
    transition: 'fade'
  },
  {
    path: '/climate-monitoring',
    component: ClimateMonitoringPage,
    title: 'Climate Monitoring - AFRERA',
    description: 'Monitor climate conditions',
    keywords: 'climate, monitoring, weather',
    transition: 'fade'
  },
  {
    path: '/operations-management',
    component: OperationsManagementPage,
    title: 'Operations Management - AFRERA',
    description: 'Farm operations management',
    keywords: 'operations, management, farming',
    transition: 'fade'
  },
  {
    path: '/machinery-management',
    component: MachineryManagementPage,
    title: 'Machinery Management - AFRERA',
    description: 'Farm machinery management',
    keywords: 'machinery, management, equipment',
    transition: 'fade'
  },
  {
    path: '/horticulture-management',
    component: HorticultureManagementPage,
    title: 'Horticulture - AFRERA',
    description: 'Horticulture management',
    keywords: 'horticulture, management, farming',
    transition: 'fade'
  },
  {
    path: '/fisheries-management',
    component: FisheriesManagementPage,
    title: 'Fisheries - AFRERA',
    description: 'Fisheries management',
    keywords: 'fisheries, management, aquaculture',
    transition: 'fade'
  },
  {
    path: '/identity-management',
    component: IdentityManagementPage,
    title: 'Identity Management - AFRERA',
    description: 'Digital identity management',
    keywords: 'identity, management, digital',
    transition: 'fade'
  },
  {
    path: '/platform-foundation',
    component: PlatformFoundationPage,
    title: 'Platform Foundation - AFRERA',
    description: 'Platform foundation services',
    keywords: 'platform, foundation, services',
    transition: 'fade'
  },
  {
    path: '/enterprise-control',
    component: EnterpriseControlPage,
    title: 'Enterprise Control - AFRERA',
    description: 'Enterprise control systems',
    keywords: 'enterprise, control, systems',
    transition: 'fade'
  },
  {
    path: '/ai-backbone',
    component: AIBackbonePage,
    title: 'AI Backbone - AFRERA',
    description: 'Unified multi-provider AI integration: Claude, ChatGPT, Gemini, Azure OpenAI, Hugging Face',
    keywords: 'ai, backbone, claude, chatgpt, gemini, azure, huggingface',
    transition: 'fade'
  },
  {
    path: '/diet-recipes',
    component: DietRecipesPage,
    title: 'Diet & Recipes - AFRERA',
    description: 'AI-generated recipes grounded in real dietary profiles and real AFRERA products',
    keywords: 'diet, recipes, nutrition, ai',
    transition: 'fade'
  },
  {
    path: '/wearables',
    component: WearablesPage,
    title: 'Wearables - AFRERA',
    description: 'Fitbit, Apple Health, Samsung Health connection status and activity',
    keywords: 'wearable, fitbit, apple health, samsung health, fitness',
    transition: 'fade'
  },
  {
    path: '/wearables/fitbit-callback',
    component: FitbitCallbackPage,
    title: 'Connecting Fitbit - AFRERA',
    description: 'Fitbit OAuth callback',
    keywords: 'fitbit, oauth, callback',
    transition: 'fade'
  },
  {
    path: '/defense-fitness-prep',
    component: DefenseFitnessPrepPage,
    title: 'Defense & Police Fitness Prep - AFRERA',
    description: 'Self-prep comparison against real, cited published physical standards',
    keywords: 'defense, police, bsf, fitness, recruitment, prep',
    transition: 'fade'
  },
  {
    path: '/sell/new-product',
    component: SellerProductFormPage,
    title: 'Add Product - AFRERA',
    description: 'Create a new marketplace product listing',
    keywords: 'sell, product, add, create, listing',
    transition: 'fade'
  },
  {
    path: '/variety-directory',
    component: VarietyDirectoryPage,
    title: 'Variety Directory - AFRERA',
    description: '142 real, citation-backed NE India crop, livestock, and fisheries varieties',
    keywords: 'variety, directory, north east, GI, biodiversity',
    transition: 'fade'
  },
  {
    path: '/poultry-management',
    component: PoultryManagementPage,
    title: 'Poultry - AFRERA',
    description: 'Poultry farming management',
    keywords: 'poultry, management, farming',
    transition: 'fade'
  },
  {
    path: '/goat-farming',
    component: GoatFarmingPage,
    title: 'Goat Farming - AFRERA',
    description: 'Goat farming management',
    keywords: 'goat, farming, livestock',
    transition: 'fade'
  },
  {
    path: '/sheep-farming',
    component: SheepFarmingPage,
    title: 'Sheep Farming - AFRERA',
    description: 'Sheep farming management',
    keywords: 'sheep, farming, livestock',
    transition: 'fade'
  },
  {
    path: '/pig-farming',
    component: PigFarmingPage,
    title: 'Pig Farming - AFRERA',
    description: 'Pig farming management',
    keywords: 'pig, farming, livestock',
    transition: 'fade'
  },
  {
    path: '/animal-health',
    component: AnimalHealthPage,
    title: 'Animal Health - AFRERA',
    description: 'Animal health management',
    keywords: 'animal, health, veterinary',
    transition: 'fade'
  },
  {
    path: '/unified-ledger',
    component: UnifiedLedgerPage,
    title: 'Unified Ledger - AFRERA',
    description: 'Unified financial ledger',
    keywords: 'ledger, unified, financial',
    transition: 'fade'
  },
  {
    path: '/reos-dashboard',
    component: REOSDashboardPage,
    title: 'REOS Dashboard - AFRERA',
    description: 'Rural Economic Operating System',
    keywords: 'REOS, dashboard, rural economy',
    transition: 'fade'
  },
  {
    path: '/ai-dashboard',
    component: AIDashboard,
    title: 'AI Dashboard - AFRERA',
    description: 'AI-powered insights and tools',
    keywords: 'AI, dashboard, insights',
    transition: 'fade'
  },
  {
    path: '/erp-dashboard',
    component: ERPDashboard,
    title: 'ERP Dashboard - AFRERA',
    description: 'Enterprise Resource Planning',
    keywords: 'ERP, dashboard, enterprise',
    transition: 'fade'
  },
  {
    path: '/b2b-marketplace',
    component: B2BMarketplace,
    title: 'B2B Marketplace - AFRERA',
    description: 'Business-to-business marketplace',
    keywords: 'B2B, marketplace, business',
    transition: 'fade'
  },
  {
    path: '/marketing-center',
    component: MarketingCenter,
    title: 'Marketing Center - AFRERA',
    description: 'Marketing tools and resources',
    keywords: 'marketing, center, tools',
    transition: 'fade'
  },
  {
    path: '/nutrient-marketplace',
    component: NutrientValueMarketplace,
    title: 'Nutrient Value Marketplace - AFRERA',
    description: 'Nutrient value trading',
    keywords: 'nutrient, value, marketplace',
    transition: 'fade'
  }
]

/**
 * Get route by path
 */
export function getRouteByPath(path) {
  const allRoutes = [
    ...publicRoutes,
    ...protectedRoutes,
    ...farmerRoutes,
    ...adminRoutes,
    ...dashboardRoutes,
    ...managementRoutes
  ]
  
  return allRoutes.find(route => route.path === path)
}

/**
 * Get all routes
 */
export function getAllRoutes() {
  return [
    ...publicRoutes,
    ...protectedRoutes,
    ...farmerRoutes,
    ...adminRoutes,
    ...dashboardRoutes,
    ...managementRoutes
  ]
}

/**
 * Get routes by role
 */
export function getRoutesByRole(role) {
  const routes = [...publicRoutes, ...protectedRoutes]
  
  if (role === 'farmer') {
    routes.push(...farmerRoutes)
  }
  
  if (role === 'admin') {
    routes.push(...adminRoutes)
  }
  
  if (role === 'banker') {
    routes.push(...dashboardRoutes.filter(r => r.role === 'banker'))
  }
  
  if (role === 'ca') {
    routes.push(...dashboardRoutes.filter(r => r.role === 'ca'))
  }
  
  if (role === 'government') {
    routes.push(...dashboardRoutes.filter(r => r.role === 'government'))
  }
  
  if (role === 'researcher') {
    routes.push(...dashboardRoutes.filter(r => r.role === 'researcher'))
  }
  
  if (role === 'corporate') {
    routes.push(...dashboardRoutes.filter(r => r.role === 'corporate'))
  }
  
  if (role === 'logistics') {
    routes.push(...dashboardRoutes.filter(r => r.role === 'logistics'))
  }
  
  return routes
}
