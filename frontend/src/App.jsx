import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MarketplacePage from './pages/MarketplacePage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FarmerPortalPage from './pages/FarmerPortalPage'
import FarmerHomePage from './pages/FarmerHomePage'
import FarmerSellPage from './pages/FarmerSellPage'
import FarmerFieldPage from './pages/FarmerFieldPage'
import HarvestPlanPage from './pages/HarvestPlanPage'
import HarvestScorePage from './pages/HarvestScorePage'
import WhatGrowPage from './pages/WhatGrowPage'
import SeedVaultPage from './pages/SeedVaultPage'
import FarmAdvisorPage from './pages/FarmAdvisorPage'
import PriceCheckPage from './pages/PriceCheckPage'
import PriceBuildPage from './pages/PriceBuildPage'
import DynamicPricingPage from './pages/DynamicPricingPage'
import SellTimingPage from './pages/SellTimingPage'
import ComparePage from './pages/ComparePage'
import DiscoverPage from './pages/DiscoverPage'
import PreOrderPage from './pages/PreOrderPage'
import LogisticsPage from './pages/LogisticsPage'
import InsurancePage from './pages/InsurancePage'
import DashboardPage from './pages/DashboardPage'
// Modules recovered 2026-08-05 (migrations 051-058). Each had a working
// backend service and nothing rendering it — the state the master index
// reports as NO_UI.
import ForwardPricingPage from './pages/ForwardPricingPage'
import ClimateWeatherPage from './pages/ClimateWeatherPage'
import LedgerPage from './pages/LedgerPage'
import CompliancePage from './pages/CompliancePage'
import RfqPage from './pages/RfqPage'
import CorridorEconomicsPage from './pages/CorridorEconomicsPage'
import LandUseCarbonPage from './pages/LandUseCarbonPage'
import YieldManagementPage from './pages/YieldManagementPage'
import CompetitivePositionPage from './pages/CompetitivePositionPage'
import ExperienceLayerPage from './pages/ExperienceLayerPage'
import FormManagementPage from './pages/FormManagementPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ModuleHubPage from './pages/ModuleHubPage'
import CorporateBuyerPage from './pages/CorporateBuyerPage'
import LogisticsProviderPage from './pages/LogisticsProviderPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import M011Page from './modules/M011/M011Page'
import M006Page from './modules/M006/M006Page'
// Auto-generated module imports
import M001Page from './modules/M001/M001Page'
import M002Page from './modules/M002/M002Page'
import M003Page from './modules/M003/M003Page'
import M004Page from './modules/M004/M004Page'
import M005Page from './modules/M005/M005Page'
import M007Page from './modules/M007/M007Page'
import M008Page from './modules/M008/M008Page'
import M009Page from './modules/M009/M009Page'
import M010Page from './modules/M010/M010Page'
import M012Page from './modules/M012/M012Page'
import M013Page from './modules/M013/M013Page'
import M014Page from './modules/M014/M014Page'
import M015Page from './modules/M015/M015Page'
import M016Page from './modules/M016/M016Page'
import M017Page from './modules/M017/M017Page'
import M018Page from './modules/M018/M018Page'
import M019Page from './modules/M019/M019Page'
import M020Page from './modules/M020/M020Page'
import M021Page from './modules/M021/M021Page'
import M022Page from './modules/M022/M022Page'
import M023Page from './modules/M023/M023Page'
import M024Page from './modules/M024/M024Page'
import M025Page from './modules/M025/M025Page'
import M026Page from './modules/M026/M026Page'
import M027Page from './modules/M027/M027Page'
import M028Page from './modules/M028/M028Page'
import M029Page from './modules/M029/M029Page'
import M030Page from './modules/M030/M030Page'
import M031Page from './modules/M031/M031Page'
import M032Page from './modules/M032/M032Page'
import M033Page from './modules/M033/M033Page'
import M034Page from './modules/M034/M034Page'
import M035Page from './modules/M035/M035Page'
import M036Page from './modules/M036/M036Page'
import M037Page from './modules/M037/M037Page'
import M038Page from './modules/M038/M038Page'
import M039Page from './modules/M039/M039Page'
import M040Page from './modules/M040/M040Page'
import M041Page from './modules/M041/M041Page'
import M042Page from './modules/M042/M042Page'
import M043Page from './modules/M043/M043Page'
import M044Page from './modules/M044/M044Page'
import M045Page from './modules/M045/M045Page'
import M046Page from './modules/M046/M046Page'
import M047Page from './modules/M047/M047Page'
import M048Page from './modules/M048/M048Page'
import M049Page from './modules/M049/M049Page'
import M050Page from './modules/M050/M050Page'
import M051Page from './modules/M051/M051Page'
import M052Page from './modules/M052/M052Page'
import M053Page from './modules/M053/M053Page'
import M054Page from './modules/M054/M054Page'
import M055Page from './modules/M055/M055Page'
import M056Page from './modules/M056/M056Page'
import M057Page from './modules/M057/M057Page'
import M058Page from './modules/M058/M058Page'
import M059Page from './modules/M059/M059Page'
import M060Page from './modules/M060/M060Page'
import M061Page from './modules/M061/M061Page'
import M062Page from './modules/M062/M062Page'
import M063Page from './modules/M063/M063Page'
import M064Page from './modules/M064/M064Page'
import M065Page from './modules/M065/M065Page'
import M066Page from './modules/M066/M066Page'
import M067Page from './modules/M067/M067Page'
import M068Page from './modules/M068/M068Page'
import M069Page from './modules/M069/M069Page'
import M070Page from './modules/M070/M070Page'
import M071Page from './modules/M071/M071Page'
import M072Page from './modules/M072/M072Page'
import M073Page from './modules/M073/M073Page'
import M074Page from './modules/M074/M074Page'
import M075Page from './modules/M075/M075Page'
import M076Page from './modules/M076/M076Page'
import M077Page from './modules/M077/M077Page'
import M078Page from './modules/M078/M078Page'
import M079Page from './modules/M079/M079Page'
import M080Page from './modules/M080/M080Page'
import M081Page from './modules/M081/M081Page'
import M082Page from './modules/M082/M082Page'
import M083Page from './modules/M083/M083Page'
import M084Page from './modules/M084/M084Page'
import M085Page from './modules/M085/M085Page'
import M086Page from './modules/M086/M086Page'
import M087Page from './modules/M087/M087Page'
import M088Page from './modules/M088/M088Page'
import M089Page from './modules/M089/M089Page'
import M090Page from './modules/M090/M090Page'
import M091Page from './modules/M091/M091Page'
import M092Page from './modules/M092/M092Page'
import M093Page from './modules/M093/M093Page'
import M094Page from './modules/M094/M094Page'
import M095Page from './modules/M095/M095Page'
import M096Page from './modules/M096/M096Page'
import M097Page from './modules/M097/M097Page'
import M098Page from './modules/M098/M098Page'
import M099Page from './modules/M099/M099Page'
import M100Page from './modules/M100/M100Page'
import M101Page from './modules/M101/M101Page'
import M102Page from './modules/M102/M102Page'
import M103Page from './modules/M103/M103Page'
import M104Page from './modules/M104/M104Page'
import M105Page from './modules/M105/M105Page'
import M106Page from './modules/M106/M106Page'
import M107Page from './modules/M107/M107Page'
import M108Page from './modules/M108/M108Page'
import M109Page from './modules/M109/M109Page'
import M110Page from './modules/M110/M110Page'
import M111Page from './modules/M111/M111Page'
import M112Page from './modules/M112/M112Page'
import M113Page from './modules/M113/M113Page'
import M114Page from './modules/M114/M114Page'
import M115Page from './modules/M115/M115Page'
import M116Page from './modules/M116/M116Page'
import M117Page from './modules/M117/M117Page'
import M118Page from './modules/M118/M118Page'
import M119Page from './modules/M119/M119Page'
import M120Page from './modules/M120/M120Page'
import M121Page from './modules/M121/M121Page'
import M122Page from './modules/M122/M122Page'
import M123Page from './modules/M123/M123Page'
import M124Page from './modules/M124/M124Page'
import M125Page from './modules/M125/M125Page'
import M126Page from './modules/M126/M126Page'
import M127Page from './modules/M127/M127Page'
import M128Page from './modules/M128/M128Page'
import M129Page from './modules/M129/M129Page'
import M130Page from './modules/M130/M130Page'
import M131Page from './modules/M131/M131Page'
import M132Page from './modules/M132/M132Page'
import M133Page from './modules/M133/M133Page'
import M134Page from './modules/M134/M134Page'
import M135Page from './modules/M135/M135Page'
import M136Page from './modules/M136/M136Page'
import M137Page from './modules/M137/M137Page'
import M138Page from './modules/M138/M138Page'
import M139Page from './modules/M139/M139Page'
import M140Page from './modules/M140/M140Page'
import M141Page from './modules/M141/M141Page'
import M142Page from './modules/M142/M142Page'
import M143Page from './modules/M143/M143Page'
import M144Page from './modules/M144/M144Page'
import M145Page from './modules/M145/M145Page'
import M146Page from './modules/M146/M146Page'
import M147Page from './modules/M147/M147Page'
import M148Page from './modules/M148/M148Page'
import M149Page from './modules/M149/M149Page'
import M150Page from './modules/M150/M150Page'
// End auto-generated module imports
import { EconomicDashboard } from './pages/economic'
import ProtectedRoute from './components/ProtectedRoute'
import { MultilingualProvider } from './components/Multilingual/MultilingualProvider'
// Accessibility modes {simple, kiosk, voice, sms} recovered from v42.
// Outermost provider: a shared kiosk must not persist session state, so
// this has to be established before anything below it stores anything.
import { AccessibilityProvider } from './components/Accessibility/AccessibilityProvider'

function App() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // MultilingualProvider was fully implemented but never mounted, so the entire
  // multilingual capability (720 lines of backend service, 8 tables, and seeded
  // support for Hindi, Bengali, Assamese, Manipuri and Khasi) was unreachable
  // from the UI — every user saw English only. Mounting it above the router so
  // language context is available to every page.
  return (
    <AccessibilityProvider>
    <MultilingualProvider>
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/forms" element={<FormManagementPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/modules" element={<ModuleHubPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />


        {/* Recovered modules (051-058).
            Public: forward pricing, climate and corridor economics. A farmer
            must be able to see an indicative price band and a flood warning
            without an account — putting a dispatch-blocking alert behind a
            login is not a security posture.
            Protected: ledger, tax compliance and procurement, which are
            internal records. */}
        <Route path="/pricing/forward" element={<ForwardPricingPage />} />
        <Route path="/climate" element={<ClimateWeatherPage />} />
        <Route path="/corridor-economics" element={<CorridorEconomicsPage />} />
        <Route path="/land-use" element={<LandUseCarbonPage />} />
        <Route path="/experience" element={<ExperienceLayerPage />} />
        <Route
          path="/yield-management"
          element={(
            <ProtectedRoute>
              <YieldManagementPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/competitive-position"
          element={(
            <ProtectedRoute>
              <CompetitivePositionPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/ledger"
          element={(
            <ProtectedRoute>
              <LedgerPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/compliance"
          element={(
            <ProtectedRoute>
              <CompliancePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/procurement"
          element={(
            <ProtectedRoute>
              <RfqPage />
            </ProtectedRoute>
          )}
        />

        {/* Protected Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <M011Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requiredRole="admin">
              <M006Page />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmer-portal"
          element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerPortalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmerhome"
          element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerHomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmersell"
          element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerSellPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmerfield"
          element={
            <ProtectedRoute requiredRole="farmer">
              <FarmerFieldPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/harvestplan"
          element={
            <ProtectedRoute requiredRole="farmer">
              <HarvestPlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/harvestscore"
          element={
            <ProtectedRoute requiredRole="farmer">
              <HarvestScorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/whatgrow"
          element={
            <ProtectedRoute requiredRole="farmer">
              <WhatGrowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seedvault"
          element={
            <ProtectedRoute requiredRole="farmer">
              <SeedVaultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/farmadvisor"
          element={
            <ProtectedRoute requiredRole="farmer">
              <FarmAdvisorPage />
            </ProtectedRoute>
          }
        />
        <Route path="/pricecheck" element={<PriceCheckPage />} />
        <Route path="/pricebuild" element={<PriceBuildPage />} />
        <Route path="/dynamicpricing" element={<DynamicPricingPage />} />
        <Route path="/selltiming" element={<SellTimingPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route
          path="/preorder"
          element={
            <ProtectedRoute>
              <PreOrderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logistics"
          element={
            <ProtectedRoute requiredRole="logistics">
              <LogisticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insurance"
          element={
            <ProtectedRoute>
              <InsurancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/corporate-buyer"
          element={
            <ProtectedRoute requiredRole="corporate">
              <CorporateBuyerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logistics-provider"
          element={
            <ProtectedRoute requiredRole="logistics">
              <LogisticsProviderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/economic"
          element={
            <ProtectedRoute requiredRole="admin">
              <EconomicDashboard />
            </ProtectedRoute>
          }
        />

        {/* Auto-generated module routes (admin-protected) */}
        <Route path="/modules/m001" element={ ( <ProtectedRoute requiredRole="admin"> <M001Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m002" element={ ( <ProtectedRoute requiredRole="admin"> <M002Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m003" element={ ( <ProtectedRoute requiredRole="admin"> <M003Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m004" element={ ( <ProtectedRoute requiredRole="admin"> <M004Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m005" element={ ( <ProtectedRoute requiredRole="admin"> <M005Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m006" element={ ( <ProtectedRoute requiredRole="admin"> <M006Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m007" element={ ( <ProtectedRoute requiredRole="admin"> <M007Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m008" element={ ( <ProtectedRoute requiredRole="admin"> <M008Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m009" element={ ( <ProtectedRoute requiredRole="admin"> <M009Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m010" element={ ( <ProtectedRoute requiredRole="admin"> <M010Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m011" element={ ( <ProtectedRoute requiredRole="admin"> <M011Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m012" element={ ( <ProtectedRoute requiredRole="admin"> <M012Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m013" element={ ( <ProtectedRoute requiredRole="admin"> <M013Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m014" element={ ( <ProtectedRoute requiredRole="admin"> <M014Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m015" element={ ( <ProtectedRoute requiredRole="admin"> <M015Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m016" element={ ( <ProtectedRoute requiredRole="admin"> <M016Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m017" element={ ( <ProtectedRoute requiredRole="admin"> <M017Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m018" element={ ( <ProtectedRoute requiredRole="admin"> <M018Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m019" element={ ( <ProtectedRoute requiredRole="admin"> <M019Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m020" element={ ( <ProtectedRoute requiredRole="admin"> <M020Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m021" element={ ( <ProtectedRoute requiredRole="admin"> <M021Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m022" element={ ( <ProtectedRoute requiredRole="admin"> <M022Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m023" element={ ( <ProtectedRoute requiredRole="admin"> <M023Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m024" element={ ( <ProtectedRoute requiredRole="admin"> <M024Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m025" element={ ( <ProtectedRoute requiredRole="admin"> <M025Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m026" element={ ( <ProtectedRoute requiredRole="admin"> <M026Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m027" element={ ( <ProtectedRoute requiredRole="admin"> <M027Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m028" element={ ( <ProtectedRoute requiredRole="admin"> <M028Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m029" element={ ( <ProtectedRoute requiredRole="admin"> <M029Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m030" element={ ( <ProtectedRoute requiredRole="admin"> <M030Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m031" element={ ( <ProtectedRoute requiredRole="admin"> <M031Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m032" element={ ( <ProtectedRoute requiredRole="admin"> <M032Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m033" element={ ( <ProtectedRoute requiredRole="admin"> <M033Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m034" element={ ( <ProtectedRoute requiredRole="admin"> <M034Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m035" element={ ( <ProtectedRoute requiredRole="admin"> <M035Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m036" element={ ( <ProtectedRoute requiredRole="admin"> <M036Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m037" element={ ( <ProtectedRoute requiredRole="admin"> <M037Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m038" element={ ( <ProtectedRoute requiredRole="admin"> <M038Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m039" element={ ( <ProtectedRoute requiredRole="admin"> <M039Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m040" element={ ( <ProtectedRoute requiredRole="admin"> <M040Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m041" element={ ( <ProtectedRoute requiredRole="admin"> <M041Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m042" element={ ( <ProtectedRoute requiredRole="admin"> <M042Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m043" element={ ( <ProtectedRoute requiredRole="admin"> <M043Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m044" element={ ( <ProtectedRoute requiredRole="admin"> <M044Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m045" element={ ( <ProtectedRoute requiredRole="admin"> <M045Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m046" element={ ( <ProtectedRoute requiredRole="admin"> <M046Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m047" element={ ( <ProtectedRoute requiredRole="admin"> <M047Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m048" element={ ( <ProtectedRoute requiredRole="admin"> <M048Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m049" element={ ( <ProtectedRoute requiredRole="admin"> <M049Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m050" element={ ( <ProtectedRoute requiredRole="admin"> <M050Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m051" element={ ( <ProtectedRoute requiredRole="admin"> <M051Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m052" element={ ( <ProtectedRoute requiredRole="admin"> <M052Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m053" element={ ( <ProtectedRoute requiredRole="admin"> <M053Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m054" element={ ( <ProtectedRoute requiredRole="admin"> <M054Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m055" element={ ( <ProtectedRoute requiredRole="admin"> <M055Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m056" element={ ( <ProtectedRoute requiredRole="admin"> <M056Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m057" element={ ( <ProtectedRoute requiredRole="admin"> <M057Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m058" element={ ( <ProtectedRoute requiredRole="admin"> <M058Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m059" element={ ( <ProtectedRoute requiredRole="admin"> <M059Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m060" element={ ( <ProtectedRoute requiredRole="admin"> <M060Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m061" element={ ( <ProtectedRoute requiredRole="admin"> <M061Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m062" element={ ( <ProtectedRoute requiredRole="admin"> <M062Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m063" element={ ( <ProtectedRoute requiredRole="admin"> <M063Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m064" element={ ( <ProtectedRoute requiredRole="admin"> <M064Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m065" element={ ( <ProtectedRoute requiredRole="admin"> <M065Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m066" element={ ( <ProtectedRoute requiredRole="admin"> <M066Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m067" element={ ( <ProtectedRoute requiredRole="admin"> <M067Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m068" element={ ( <ProtectedRoute requiredRole="admin"> <M068Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m069" element={ ( <ProtectedRoute requiredRole="admin"> <M069Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m070" element={ ( <ProtectedRoute requiredRole="admin"> <M070Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m071" element={ ( <ProtectedRoute requiredRole="admin"> <M071Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m072" element={ ( <ProtectedRoute requiredRole="admin"> <M072Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m073" element={ ( <ProtectedRoute requiredRole="admin"> <M073Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m074" element={ ( <ProtectedRoute requiredRole="admin"> <M074Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m075" element={ ( <ProtectedRoute requiredRole="admin"> <M075Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m076" element={ ( <ProtectedRoute requiredRole="admin"> <M076Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m077" element={ ( <ProtectedRoute requiredRole="admin"> <M077Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m078" element={ ( <ProtectedRoute requiredRole="admin"> <M078Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m079" element={ ( <ProtectedRoute requiredRole="admin"> <M079Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m080" element={ ( <ProtectedRoute requiredRole="admin"> <M080Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m081" element={ ( <ProtectedRoute requiredRole="admin"> <M081Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m082" element={ ( <ProtectedRoute requiredRole="admin"> <M082Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m083" element={ ( <ProtectedRoute requiredRole="admin"> <M083Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m084" element={ ( <ProtectedRoute requiredRole="admin"> <M084Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m085" element={ ( <ProtectedRoute requiredRole="admin"> <M085Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m086" element={ ( <ProtectedRoute requiredRole="admin"> <M086Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m087" element={ ( <ProtectedRoute requiredRole="admin"> <M087Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m088" element={ ( <ProtectedRoute requiredRole="admin"> <M088Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m089" element={ ( <ProtectedRoute requiredRole="admin"> <M089Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m090" element={ ( <ProtectedRoute requiredRole="admin"> <M090Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m091" element={ ( <ProtectedRoute requiredRole="admin"> <M091Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m092" element={ ( <ProtectedRoute requiredRole="admin"> <M092Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m093" element={ ( <ProtectedRoute requiredRole="admin"> <M093Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m094" element={ ( <ProtectedRoute requiredRole="admin"> <M094Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m095" element={ ( <ProtectedRoute requiredRole="admin"> <M095Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m096" element={ ( <ProtectedRoute requiredRole="admin"> <M096Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m097" element={ ( <ProtectedRoute requiredRole="admin"> <M097Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m098" element={ ( <ProtectedRoute requiredRole="admin"> <M098Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m099" element={ ( <ProtectedRoute requiredRole="admin"> <M099Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m100" element={ ( <ProtectedRoute requiredRole="admin"> <M100Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m101" element={ ( <ProtectedRoute requiredRole="admin"> <M101Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m102" element={ ( <ProtectedRoute requiredRole="admin"> <M102Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m103" element={ ( <ProtectedRoute requiredRole="admin"> <M103Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m104" element={ ( <ProtectedRoute requiredRole="admin"> <M104Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m105" element={ ( <ProtectedRoute requiredRole="admin"> <M105Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m106" element={ ( <ProtectedRoute requiredRole="admin"> <M106Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m107" element={ ( <ProtectedRoute requiredRole="admin"> <M107Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m108" element={ ( <ProtectedRoute requiredRole="admin"> <M108Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m109" element={ ( <ProtectedRoute requiredRole="admin"> <M109Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m110" element={ ( <ProtectedRoute requiredRole="admin"> <M110Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m111" element={ ( <ProtectedRoute requiredRole="admin"> <M111Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m112" element={ ( <ProtectedRoute requiredRole="admin"> <M112Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m113" element={ ( <ProtectedRoute requiredRole="admin"> <M113Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m114" element={ ( <ProtectedRoute requiredRole="admin"> <M114Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m115" element={ ( <ProtectedRoute requiredRole="admin"> <M115Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m116" element={ ( <ProtectedRoute requiredRole="admin"> <M116Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m117" element={ ( <ProtectedRoute requiredRole="admin"> <M117Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m118" element={ ( <ProtectedRoute requiredRole="admin"> <M118Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m119" element={ ( <ProtectedRoute requiredRole="admin"> <M119Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m120" element={ ( <ProtectedRoute requiredRole="admin"> <M120Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m121" element={ ( <ProtectedRoute requiredRole="admin"> <M121Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m122" element={ ( <ProtectedRoute requiredRole="admin"> <M122Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m123" element={ ( <ProtectedRoute requiredRole="admin"> <M123Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m124" element={ ( <ProtectedRoute requiredRole="admin"> <M124Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m125" element={ ( <ProtectedRoute requiredRole="admin"> <M125Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m126" element={ ( <ProtectedRoute requiredRole="admin"> <M126Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m127" element={ ( <ProtectedRoute requiredRole="admin"> <M127Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m128" element={ ( <ProtectedRoute requiredRole="admin"> <M128Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m129" element={ ( <ProtectedRoute requiredRole="admin"> <M129Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m130" element={ ( <ProtectedRoute requiredRole="admin"> <M130Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m131" element={ ( <ProtectedRoute requiredRole="admin"> <M131Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m132" element={ ( <ProtectedRoute requiredRole="admin"> <M132Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m133" element={ ( <ProtectedRoute requiredRole="admin"> <M133Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m134" element={ ( <ProtectedRoute requiredRole="admin"> <M134Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m135" element={ ( <ProtectedRoute requiredRole="admin"> <M135Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m136" element={ ( <ProtectedRoute requiredRole="admin"> <M136Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m137" element={ ( <ProtectedRoute requiredRole="admin"> <M137Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m138" element={ ( <ProtectedRoute requiredRole="admin"> <M138Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m139" element={ ( <ProtectedRoute requiredRole="admin"> <M139Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m140" element={ ( <ProtectedRoute requiredRole="admin"> <M140Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m141" element={ ( <ProtectedRoute requiredRole="admin"> <M141Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m142" element={ ( <ProtectedRoute requiredRole="admin"> <M142Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m143" element={ ( <ProtectedRoute requiredRole="admin"> <M143Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m144" element={ ( <ProtectedRoute requiredRole="admin"> <M144Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m145" element={ ( <ProtectedRoute requiredRole="admin"> <M145Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m146" element={ ( <ProtectedRoute requiredRole="admin"> <M146Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m147" element={ ( <ProtectedRoute requiredRole="admin"> <M147Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m148" element={ ( <ProtectedRoute requiredRole="admin"> <M148Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m149" element={ ( <ProtectedRoute requiredRole="admin"> <M149Page /> </ProtectedRoute> ) } />
        <Route path="/modules/m150" element={ ( <ProtectedRoute requiredRole="admin"> <M150Page /> </ProtectedRoute> ) } />
        {/* End auto-generated module routes */}
        {/* 404 */}
        <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
      </Routes>
    </Layout>
    </MultilingualProvider>
    </AccessibilityProvider>
  )
}

export default App
