import axios from 'axios'

// API_BASE_URL defaults to localhost for development
// Production should set VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token: newRefreshToken } = response.data

        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: (data) => api.post('/auth/refresh', data),
  getMe: () => api.get('/auth/me'),
  setup2FA: (userId) => api.post(`/auth/2fa/setup`, { user_id: userId }),
  verify2FA: (userId, code) => api.post(`/auth/2fa/verify`, { user_id: userId, code }),
  disable2FA: (userId, password) => api.post(`/auth/2fa/disable`, { user_id: userId, password }),
}

// Products API
export const productsAPI = {
  getProducts: (filters, pagination) => api.get('/products', { params: { ...filters, ...pagination } }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories/list'),
  getStates: () => api.get('/products/states/list'),
  searchProducts: (query) => api.get('/products/search', { params: { q: query } }),
}

// Orders API
export const ordersAPI = {
  getCart: () => api.get('/orders/cart'),
  addToCart: (data) => api.post('/orders/cart', data),
  updateCartItem: (id, data) => api.put(`/orders/cart/${id}`, data),
  removeFromCart: (id) => api.delete(`/orders/cart/${id}`),
  clearCart: () => api.delete('/orders/cart'),
  createOrder: (data) => api.post('/orders', data),
  getOrder: (id) => api.get(`/orders/${id}`),
  getOrders: (filters, pagination) => api.get('/orders', { params: { ...filters, ...pagination } }),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  processPayment: (id, data) => api.post(`/orders/${id}/payment`, data),
}

// Farmers API
export const farmersAPI = {
  getFarmer: (id) => api.get(`/farmers/${id}`),
  getFarmers: (filters, pagination) => api.get('/farmers', { params: { ...filters, ...pagination } }),
  calculateFDI: (id) => api.post(`/farmers/${id}/fdi`),
  addCertification: (id, data) => api.post(`/farmers/${id}/certifications`, data),
  getCertifications: (id) => api.get(`/farmers/${id}/certifications`),
  getFPOs: (filters) => api.get('/farmers/fpos/list', { params: filters }),
}

/**
 * Seed Vault — real backend added 2026-08-15. SeedVaultPage.jsx previously
 * called farmersAPI.getSeedVault/getSeedCategories/deleteSeed, none of
 * which existed anywhere (a live, fully broken page).
 */
export const seedVaultAPI = {
  getSeeds: () => api.get('/seed-vault'),
  getCategories: () => api.get('/seed-vault/categories'),
  addSeed: (data) => api.post('/seed-vault', data),
  updateSeed: (id, data) => api.put(`/seed-vault/${id}`, data),
  recordUsage: (id, amountUsed) => api.post(`/seed-vault/${id}/record-usage`, { amountUsed }),
  deleteSeed: (id) => api.delete(`/seed-vault/${id}`),
}

// Financial API
export const financialAPI = {
  applyForLoan: (data) => api.post('/financial/loans', data),
  getFarmerLoans: (farmerId, filters) => api.get(`/financial/loans/farmer/${farmerId}`, { params: filters }),
  approveLoan: (id, data) => api.post(`/financial/loans/${id}/approve`, data),
  getEMISchedule: (id) => api.get(`/financial/loans/${id}/emi`),
  payEMI: (id, data) => api.post(`/financial/emi/${id}/pay`, data),
  requestAdvance: (data) => api.post('/financial/advances', data),
  getFarmerAdvances: (farmerId) => api.get(`/financial/advances/farmer/${farmerId}`),
  getCreditScore: (farmerId) => api.get(`/financial/credit-score/${farmerId}`),
}

// Logistics API
export const logisticsAPI = {
  createShipment: (data) => api.post('/logistics/shipments', data),
  getShipment: (id) => api.get(`/logistics/shipments/${id}`),
  getShipments: (filters, pagination) => api.get('/logistics/shipments', { params: { ...filters, ...pagination } }),
  updateShipmentStatus: (id, data) => api.put(`/logistics/shipments/${id}/status`, data),
  addTrackingUpdate: (id, data) => api.post(`/logistics/shipments/${id}/tracking`, data),
  getShipmentTracking: (id) => api.get(`/logistics/shipments/${id}/tracking`),
  registerVehicle: (data) => api.post('/logistics/vehicles', data),
  getVehicles: (filters) => api.get('/logistics/vehicles', { params: filters }),
  registerDriver: (data) => api.post('/logistics/drivers', data),
  getDrivers: (filters) => api.get('/logistics/drivers', { params: filters }),
  getShipmentModes: () => api.get('/logistics/modes'),
  getLiveTracking: (shipmentId) => api.get(`/logistics/shipments/${shipmentId}/live-tracking`),
  getTemperatureData: (shipmentId) => api.get(`/logistics/shipments/${shipmentId}/temperature`),
  getTemperatureAlerts: (shipmentId) => api.get(`/logistics/shipments/${shipmentId}/temperature-alerts`),
}

// Insurance API
export const insuranceAPI = {
  createPolicy: (data) => api.post('/insurance/policies', data),
  getPolicy: (id) => api.get(`/insurance/policies/${id}`),
  getPolicies: (filters, pagination) => api.get('/insurance/policies', { params: { ...filters, ...pagination } }),
  submitClaim: (data) => api.post('/insurance/claims', data),
  getClaim: (id) => api.get(`/insurance/claims/${id}`),
  getClaims: (filters, pagination) => api.get('/insurance/claims', { params: { ...filters, ...pagination } }),
  processClaim: (id, data) => api.put(`/insurance/claims/${id}/process`, data),
  createMasterPolicy: (data) => api.post('/insurance/master-policies', data),
  getMasterPolicies: (filters) => api.get('/insurance/master-policies', { params: filters }),
  getInsuranceProducts: (filters) => api.get('/insurance/products', { params: filters }),
  calculatePremium: (data) => api.post('/insurance/calculate-premium', data),
  calculatePremiumByType: (type, data) => api.post(`/insurance/calculate/${type}`, data),
  generateQuote: (data) => api.post('/insurance/quotes', data),
}

// AI API
export const aiAPI = {
  predictDemand: (data) => api.post('/ai/predict/demand', data),
  optimizePrice: (data) => api.post('/ai/optimize/price', data),
  assessCreditRisk: (data) => api.post('/ai/assess/credit-risk', data),
  detectFraud: (data) => api.post('/ai/detect/fraud', data),
  generateRecommendations: (data) => api.post('/ai/recommend', data),
}

// Product Media AI API — AI product-image generation, nutrient-comparison
// video generation. See backend/src/services/productMediaAIService.js —
// provider status is honestly not_configured until an image/video provider
// key is set; buildVideoScript works today with no external AI dependency.
export const productMediaAIAPI = {
  getProviderStatus: () => api.get('/product-media-ai/status'),
  generateImage: (productId, prompt) => api.post(`/product-media-ai/products/${productId}/image`, { prompt }),
  buildVideoScript: (productId) => api.post(`/product-media-ai/products/${productId}/video-script`),
  generateVideo: (productId) => api.post(`/product-media-ai/products/${productId}/video`),
}

// Wearable Integration API — Fitbit (real OAuth2), Apple Health / Samsung
// Health (device-push only, see wearableIntegrationService.js header for why).
export const wearableAPI = {
  getStatus: () => api.get('/wearable-integration/status'),
  getFitbitAuthUrl: () => api.get('/wearable-integration/fitbit/auth-url'),
  handleFitbitCallback: (code) => api.post('/wearable-integration/fitbit/callback', { code }),
  syncFitbit: () => api.post('/wearable-integration/fitbit/sync'),
  // Called by the mobile (Capacitor) client after reading local HealthKit /
  // Samsung Health SDK data — the web app cannot call this meaningfully.
  ingestDeviceActivity: (provider, activityDate, activity) =>
    api.post('/wearable-integration/sync', { provider, activity_date: activityDate, activity }),
  getRecentActivity: (days) => api.get('/wearable-integration/activity/recent', { params: { days } }),
  disconnect: (provider) => api.delete(`/wearable-integration/${provider}`),
}

// Defense/Police/BSF Fitness Prep API — self-prep comparison against real,
// cited published physical standards. No connection to any actual
// recruitment system; see defenseFitnessPrepService.js header.
// Regional Variety Directory — 142 real, citation-backed NE India crop/
// livestock/fisheries varieties (see backend/src/database/migrations/
// 9999_zzz_regional_variety_directory_schema.sql). Reference/education data,
// deliberately separate from buyable `products` (no real farmer prices exist
// for these) until a seller explicitly creates a real listing from one.
export const varietyDirectoryAPI = {
  list: (params) => api.get('/variety-directory', { params }),
  getCategories: () => api.get('/variety-directory/categories'),
  getById: (id) => api.get(`/variety-directory/${id}`),
  requestImage: (id) => api.post(`/variety-directory/${id}/generate-image`),
  createListing: (id, data) => api.post(`/variety-directory/${id}/create-listing`, data),
}

// Crop Value-Compound Research — AI-assisted, human-reviewed published
// reference data. See backend/src/services/cropValueResearchService.js.
// Platform Telemetry API — real system/business metrics (admin-only).
// See backend/src/services/platformTelemetryService.js for what is and is
// not honestly computable (no request-logging store exists in this codebase).
export const platformTelemetryAPI = {
  getStatus: () => api.get('/platform-telemetry/status'),
  getAnalytics: () => api.get('/platform-telemetry/analytics'),
}

export const cropValueResearchAPI = {
  getProviderStatus: () => api.get('/crop-value-research/status'),
  research: (varietyName, compoundKey) => api.post('/crop-value-research/research', { variety_name: varietyName, compound_key: compoundKey }),
  getPending: () => api.get('/crop-value-research/pending'),
  review: (id, approve) => api.post(`/crop-value-research/pending/${id}/review`, { approve }),
}

export const defenseFitnessPrepAPI = {
  getCategories: () => api.get('/defense-fitness-prep/categories'),
  getStandards: (category, gender) => api.get(`/defense-fitness-prep/standards/${category}`, { params: { gender } }),
  recordAttempt: (category, testComponent, recordedValue, source) =>
    api.post('/defense-fitness-prep/attempts', { category, test_component: testComponent, recorded_value: recordedValue, source }),
  getReadiness: (category, gender) => api.get(`/defense-fitness-prep/readiness/${category}`, { params: { gender } }),
}

// Forms API
export const formsAPI = {
  getForms: (params = {}) => api.get('/forms', { params }),
  getForm: (id) => api.get(`/forms/${id}`),
  createForm: (data) => api.post('/forms', data),
  updateForm: (id, data) => api.put(`/forms/${id}`, data),
  deleteForm: (id) => api.delete(`/forms/${id}`),
  submitForm: (id, payload) => api.post(`/forms/${id}/submit`, payload),
  getSubmissions: (id) => api.get(`/forms/${id}/submissions`),
  getTemplates: () => api.get('/forms/templates'),
}

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getInsights: () => api.get('/analytics/insights'),
  getPlatformStats: () => api.get('/analytics/platform-stats'),
}

// ERP API
export const erpAPI = {
  getSyncStatus: () => api.get('/erp/status'),
  syncProduct: (data) => api.post('/erp/sync/product', data),
  syncOrder: (data) => api.post('/erp/sync/order', data),
  syncFarmer: (data) => api.post('/erp/sync/farmer', data),
  syncTransaction: (data) => api.post('/erp/sync/transaction', data),
  syncAsset: (data) => api.post('/erp/sync/asset', data),
  triggerBulkSync: (data) => api.post('/erp/sync/bulk', data),
}

// ---------------------------------------------------------------------------
// Modules recovered 2026-08-05 (migrations 051-058).
//
// Every endpoint below existed in the backend with no frontend caller, which is
// the state the master index reports as NO_UI: a working service nothing
// renders. These are the callers.
// ---------------------------------------------------------------------------

/** Advance Rate Pricing — forward curves, basis, commitment advice (051). */
export const pricingAPI = {
  crop: (cropKey) => api.get(`/pricing/crops/${cropKey}`),
  forward: (params) => api.get('/pricing/forward', { params }),
  calibration: (state, district, cropKey) =>
    api.get(`/pricing/calibration/${encodeURIComponent(state)}/${encodeURIComponent(district)}/${cropKey}`),
  advise: (body) => api.post('/pricing/advise', body),
  publish: (body) => api.post('/pricing/publish', body),
  recordBasis: (body) => api.post('/pricing/basis', body),
}

/**
 * Hash-chained ledger (read-only), schemes, eNWR, freight, risk (053).
 * classifyGst/buildInvoice/ledgerEntry were removed 2026-08-17: the backend
 * routes they called were deleted as dangerous duplicates (see
 * backend/src/routes/recoveredFinanceRoutes.js) and neither wrapper had a
 * caller anywhere in this codebase. Use marketplaceAPI.calculateProductGST/
 * calculateOrderGST for GST (the canonical gstService.resolveGSTRate() path)
 * and financeAPI.trialBalance/verifyLedger for the ledger instead.
 */
export const financeAPI = {
  trialBalance: () => api.get('/finance/ledger/trial-balance'),
  verifyLedger: () => api.get('/finance/ledger/verify'),
  matchSchemes: (params) => api.get('/finance/schemes/match', { params }),
  issueEnwr: (body) => api.post('/finance/enwr/issue', body),
  getMyEnwrReceipts: () => api.get('/finance/enwr/my-receipts'),
  freightRate: (params) => api.get('/finance/freight/rate', { params }),
  equipmentSubsidy: (params) => api.get('/finance/subsidy/equipment', { params }),
  recordRiskEvent: (body) => api.post('/finance/risk/event', body),
  partyRisk: (partyId) => api.get(`/finance/risk/${partyId}`),
  expiringCertificates: (params) => api.get('/finance/certificates/expiring', { params }),
}

/**
 * Asset Accounting — AF-AA (996_enterprise_foundation). Fixed-asset register,
 * straight-line depreciation schedules, disposal. Mounted at /erp/assets.
 */
export const assetAccountingAPI = {
  createAsset: (data) => api.post('/erp/assets/assets', data),
  getAssets: (companyId, filters = {}) => api.get('/erp/assets/assets', { params: { companyId, ...filters } }),
  getAssetRegisterSummary: (companyId) => api.get('/erp/assets/assets/summary', { params: { companyId } }),
  getAsset: (assetId) => api.get(`/erp/assets/assets/${assetId}`),
  generateDepreciationSchedule: (assetId) => api.post(`/erp/assets/assets/${assetId}/depreciation-schedule`),
  getDepreciationSchedule: (assetId) => api.get(`/erp/assets/assets/${assetId}/depreciation-schedule`),
  postDepreciationPeriod: (assetId, periodDate) =>
    api.post(`/erp/assets/assets/${assetId}/depreciation-schedule/${periodDate}/post`),
  runDepreciationForPeriod: (companyId, asOfDate) => api.post('/erp/assets/depreciation-run', { companyId, asOfDate }),
  disposeAsset: (assetId, data) => api.post(`/erp/assets/assets/${assetId}/dispose`, data),
}

/**
 * Cost Control — AF-CO / "Controlling" (996_enterprise_foundation). Cost and
 * profit centres, budgets and budget lines, budget-vs-actual against the
 * posted general ledger. Mounted at /erp/controlling. Distinct from
 * financeAPI (GL/GST), rfqAPI.centrePnl (FPO cost centres) and the /costs
 * landed-cost pricing model.
 */
export const costControlAPI = {
  createCostCenter: (data) => api.post('/erp/controlling/cost-centers', data),
  getCostCenters: (companyId, filters = {}) => api.get('/erp/controlling/cost-centers', { params: { companyId, ...filters } }),
  getCostCenter: (costCenterId) => api.get(`/erp/controlling/cost-centers/${costCenterId}`),
  getCostCenterActuals: (costCenterId, params = {}) => api.get(`/erp/controlling/cost-centers/${costCenterId}/actuals`, { params }),
  createProfitCenter: (data) => api.post('/erp/controlling/profit-centers', data),
  getProfitCenters: (companyId, filters = {}) => api.get('/erp/controlling/profit-centers', { params: { companyId, ...filters } }),
  createBudget: (data) => api.post('/erp/controlling/budgets', data),
  getBudgets: (companyId, filters = {}) => api.get('/erp/controlling/budgets', { params: { companyId, ...filters } }),
  getBudget: (budgetId) => api.get(`/erp/controlling/budgets/${budgetId}`),
  submitBudget: (budgetId) => api.post(`/erp/controlling/budgets/${budgetId}/submit`),
  approveBudget: (budgetId, approved = true) => api.post(`/erp/controlling/budgets/${budgetId}/approve`, { approved }),
  addBudgetLine: (budgetId, data) => api.post(`/erp/controlling/budgets/${budgetId}/lines`, data),
  getBudgetLines: (budgetId) => api.get(`/erp/controlling/budgets/${budgetId}/lines`),
  getBudgetVsActual: (budgetId) => api.get(`/erp/controlling/budgets/${budgetId}/vs-actual`),
}

/**
 * Project Systems — AF-PS (9996_project_systems_schema). Projects, work
 * breakdown structure, milestones, and live actuals computed from the posted
 * general ledger. Mounted at /erp/projects.
 */
export const projectSystemsAPI = {
  createProject: (data) => api.post('/erp/projects', data),
  getProjects: (companyId, filters = {}) => api.get('/erp/projects', { params: { companyId, ...filters } }),
  getProject: (projectId) => api.get(`/erp/projects/${projectId}`),
  updateProjectStatus: (projectId, status, dates = {}) => api.post(`/erp/projects/${projectId}/status`, { status, ...dates }),
  createWbsElement: (projectId, data) => api.post(`/erp/projects/${projectId}/wbs`, data),
  getProjectWbs: (projectId) => api.get(`/erp/projects/${projectId}/wbs`),
  getWbsCostRollup: (projectId) => api.get(`/erp/projects/${projectId}/wbs/rollup`),
  getWbsElement: (wbsId) => api.get(`/erp/projects/wbs/${wbsId}`),
  updateWbsStatus: (wbsId, status, dates = {}) => api.post(`/erp/projects/wbs/${wbsId}/status`, { status, ...dates }),
  createMilestone: (projectId, data) => api.post(`/erp/projects/${projectId}/milestones`, data),
  getProjectMilestones: (projectId, params = {}) => api.get(`/erp/projects/${projectId}/milestones`, { params }),
  getMilestoneStatusSummary: (projectId, asOfDate) =>
    api.get(`/erp/projects/${projectId}/milestones/summary`, { params: asOfDate ? { asOfDate } : {} }),
  completeMilestone: (milestoneId, actualCompletionDate) =>
    api.post(`/erp/projects/milestones/${milestoneId}/complete`, { actualCompletionDate }),
  getProjectBudgetVsActual: (projectId) => api.get(`/erp/projects/${projectId}/budget-vs-actual`),
}

/**
 * Company lookup — resolves accounting UI gap for companyId/fiscalYear/chart-of-accounts.
 * Provides dropdown data for AF-AA, AF-CO, and AF-PS pages.
 */
export const companyAPI = {
  getCompanies: () => api.get('/companies'),
  listCompanies: () => api.get('/companies'),
  getCompany: (id) => api.get(`/companies/${id}`),
  getFiscalYears: (companyId) => api.get(`/companies/${companyId}/fiscal-years`),
  getChartOfAccounts: (companyId) => api.get(`/companies/${companyId}/chart-of-accounts`),
}

/**
 * Platform Core API — AI-enhanced platform foundation (Platform Foundation D01).
 * Platform health, auto-scaling, capacity planning, disaster recovery, performance monitoring.
 */
export const platformCoreAPI = {
  initialize: () => api.post('/platform-core/initialize'),
  getHealth: () => api.get('/platform-core/health'),
  getScalingRecommendations: () => api.get('/platform-core/scaling/recommendations'),
  predictCapacity: (timeframe = '24h') => api.get('/platform-core/capacity/predict', { params: { timeframe } }),
  triggerDisasterRecovery: (incident) => api.post('/platform-core/disaster-recovery', incident),
  monitorPerformance: () => api.get('/platform-core/performance/monitor'),
  triggerSelfHealing: (issue) => api.post('/platform-core/self-healing', issue),
  getOptimizedConfiguration: () => api.get('/platform-core/configuration/optimized'),
  applyConfiguration: (config) => api.post('/platform-core/configuration/apply', config),
  getMetrics: () => api.get('/platform-core/metrics'),
  getSystemState: () => api.get('/platform-core/state'),
}

/**
 * Platform Configuration API — AI-enhanced configuration management.
 * Configuration optimization, parameter tuning, security scanning, compliance checking.
 */
export const platformConfigurationAPI = {
  getConfiguration: () => api.get('/platform-configuration/configuration'),
  getRecommendations: () => api.get('/platform-configuration/configuration/recommendations'),
  applyConfiguration: (config) => api.post('/platform-configuration/configuration/apply', config),
  autoTuneParameters: () => api.post('/platform-configuration/configuration/tune'),
  adjustPerformanceBased: () => api.get('/platform-configuration/configuration/adjust-performance'),
  performSecurityScan: () => api.post('/platform-configuration/configuration/security-scan'),
  checkCompliance: () => api.get('/platform-configuration/configuration/compliance'),
  getConfigurationHistory: (limit = 50) => api.get('/platform-configuration/configuration/history', { params: { limit } }),
  rollbackConfiguration: (targetConfigId) => api.post('/platform-configuration/configuration/rollback', { targetConfigId }),
  validateConfiguration: (config) => api.post('/platform-configuration/configuration/validate', config),
}

/**
 * Tenant Management API — AI-enhanced tenant operations.
 * Tenant CRUD, resource optimization, usage prediction, tier recommendations, cost optimization.
 */
export const tenantManagementAPI = {
  createTenant: (data) => api.post('/tenant-management/tenants', data),
  getTenant: (id) => api.get(`/tenant-management/tenants/${id}`),
  getAllTenants: (filters = {}) => api.get('/tenant-management/tenants', { params: filters }),
  updateTenant: (id, updates) => api.put(`/tenant-management/tenants/${id}`, updates),
  deleteTenant: (id) => api.delete(`/tenant-management/tenants/${id}`),
  optimizeResources: (id) => api.post(`/tenant-management/tenants/${id}/optimize-resources`),
  predictUsage: (id, timeframe = '30d') => api.get(`/tenant-management/tenants/${id}/predict-usage`, { params: { timeframe } }),
  recommendTier: (id) => api.get(`/tenant-management/tenants/${id}/recommend-tier`),
  optimizeCost: (id) => api.post(`/tenant-management/tenants/${id}/optimize-cost`),
}

/**
 * Organization Management API — AI-enhanced organization operations.
 * Organization CRUD, structure optimization, hierarchy recommendations, performance prediction.
 */
export const organizationManagementAPI = {
  createOrganization: (data) => api.post('/organization-management/organizations', data),
  getOrganization: (id) => api.get(`/organization-management/organizations/${id}`),
  updateOrganization: (id, updates) => api.put(`/organization-management/organizations/${id}`, updates),
  optimizeStructure: (id) => api.post(`/organization-management/organizations/${id}/optimize-structure`),
  recommendHierarchy: (id) => api.get(`/organization-management/organizations/${id}/recommend-hierarchy`),
  predictUnitPerformance: (id, unitId, timeframe = '90d') => 
    api.get(`/organization-management/organizations/${id}/units/${unitId}/predict-performance`, { params: { timeframe } }),
  optimizeResources: (id) => api.post(`/organization-management/organizations/${id}/optimize-resources`),
  analyzeChangeImpact: (id, proposedChange) => api.post(`/organization-management/organizations/${id}/analyze-change-impact`, proposedChange),
  getUnits: (id) => api.get(`/organization-management/organizations/${id}/units`),
  addUnit: (id, unitData) => api.post(`/organization-management/organizations/${id}/units`, unitData),
}

/**
 * System Administration API — AI-enhanced system operations.
 * Incident prediction, root cause analysis, self-healing, capacity forecasting, threat detection.
 */
export const systemAdministrationAPI = {
  initialize: () => api.post('/system-administration/initialize'),
  predictIncidents: (timeframe = '24h') => api.get('/system-administration/incidents/predict', { params: { timeframe } }),
  analyzeRootCause: (incident) => api.post('/system-administration/incidents/root-cause', incident),
  triggerSelfHealing: (issue) => api.post('/system-administration/self-healing', issue),
  forecastCapacity: (timeframe = '90d') => api.get('/system-administration/capacity/forecast', { params: { timeframe } }),
  detectSecurityThreats: () => api.post('/system-administration/security/threats/detect'),
  getSystemHealthDashboard: () => api.get('/system-administration/dashboard/health'),
  performAutomatedMaintenance: () => api.post('/system-administration/maintenance/automated'),
}

/** Domain D14 — Climate & Weather (057). */
export const weatherAPI = {
  coverage: () => api.get('/weather/coverage'),
  forArp: (params) => api.get('/weather/for-arp', { params }),
  activeAlerts: () => api.get('/weather/alerts/active'),
  dispatchCheck: (districts) =>
    api.get('/weather/alerts/dispatch-check', { params: { districts: districts.join(',') } }),
  pestForecast: (params) => api.get('/weather/pest-forecast', { params }),
  forecastAccuracy: () => api.get('/weather/forecast-accuracy'),
  recordObservation: (body) => api.post('/weather/observations', body),
  recordForecast: (body) => api.post('/weather/forecasts', body),
  scoreForecasts: () => api.post('/weather/forecasts/score'),
  raiseAlert: (body) => api.post('/weather/alerts', body),
  // Real threshold-breach advisory candidates (SPI/SPEI drought-wet severity
  // + trailing heat-stress days) computed from climate_indices and
  // weather_observations — see weatherService.getAdvisoryTriggers().
  advisoryTriggers: (params) => api.get('/weather/advisory-triggers', { params }),
}

/** TDS, e-invoice IRN, GSTR, RCM (056). */
export const complianceAPI = {
  deductTds: (body) => api.post('/compliance/tds/deduct', body),
  tdsSummary: (params) => api.get('/compliance/tds/summary', { params }),
  tdsRates: () => api.get('/compliance/tds/rates'),
  registerIrn: (body) => api.post('/compliance/irn/register', body),
  recordIrnResult: (body) => api.post('/compliance/irn/result', body),
  gstrDraft: (body) => api.post('/compliance/gstr/draft', body),
  recordRcm: (body) => api.post('/compliance/rcm', body),
  rcmOutstanding: (period) => api.get('/compliance/rcm/outstanding', { params: { period } }),
}

/** M123 Poultry Management — Livestock domain. */
export const poultryAPI = {
  listFlocks: (params) => api.get('/poultry/flocks', { params }),
  createFlock: (body) => api.post('/poultry/flocks', body),
  updateFlock: (id, body) => api.put(`/poultry/flocks/${id}`, body),
  deleteFlock: (id) => api.delete(`/poultry/flocks/${id}`),
  listEggProduction: (flockId, params) => api.get(`/poultry/flocks/${flockId}/egg-production`, { params }),
  recordEggProduction: (flockId, body) => api.post(`/poultry/flocks/${flockId}/egg-production`, body),
  listFeedConsumption: (flockId, params) => api.get(`/poultry/flocks/${flockId}/feed-consumption`, { params }),
  recordFeedConsumption: (flockId, body) => api.post(`/poultry/flocks/${flockId}/feed-consumption`, body),
  listMortality: (flockId, params) => api.get(`/poultry/flocks/${flockId}/mortality`, { params }),
  recordMortality: (flockId, body) => api.post(`/poultry/flocks/${flockId}/mortality`, body),
  listVaccinations: (flockId, params) => api.get(`/poultry/flocks/${flockId}/vaccinations`, { params }),
  recordVaccination: (flockId, body) => api.post(`/poultry/flocks/${flockId}/vaccinations`, body),
  getFlockPerformance: (flockId) => api.get(`/poultry/flocks/${flockId}/performance`),
  // Real backend route returns alerts across all active flocks, not per-flock
  // (no callers ever pass a real flockId - it was always undefined on the wire).
  getVaccinationAlerts: () => api.get('/poultry/vaccination-alerts'),
}

/** M124 Goat Farming — Livestock domain. */
export const goatAPI = {
  listHerd: (params) => api.get('/goat/herd', { params }),
  createAnimal: (body) => api.post('/goat/herd', body),
  updateAnimal: (id, body) => api.put(`/goat/herd/${id}`, body),
  deleteAnimal: (id) => api.delete(`/goat/herd/${id}`),
  listMilkProduction: (animalId, params) => api.get(`/goat/herd/${animalId}/milk-production`, { params }),
  recordMilkProduction: (animalId, body) => api.post(`/goat/herd/${animalId}/milk-production`, body),
  listFeedConsumption: (animalId, params) => api.get(`/goat/herd/${animalId}/feed-consumption`, { params }),
  recordFeedConsumption: (animalId, body) => api.post(`/goat/herd/${animalId}/feed-consumption`, body),
  listBreedingRecords: (femaleId, params) => api.get(`/goat/herd/${femaleId}/breeding`, { params }),
  recordBreeding: (femaleId, body) => api.post(`/goat/herd/${femaleId}/breeding`, body),
  updateKiddingOutcome: (id, body) => api.put(`/goat/breeding/${id}/kidding-outcome`, body),
  listVaccinations: (animalId, params) => api.get(`/goat/herd/${animalId}/vaccinations`, { params }),
  recordVaccination: (animalId, body) => api.post(`/goat/herd/${animalId}/vaccinations`, body),
  getHerdPerformance: (animalId) => api.get(`/goat/herd/${animalId}/performance`),
  // Real backend routes return alerts across the whole herd, not per-animal.
  getBreedingAlerts: () => api.get('/goat/breeding-alerts'),
  getVaccinationAlerts: () => api.get('/goat/vaccination-alerts'),
}

/** M125 Sheep Farming — Livestock domain. */
export const sheepAPI = {
  listFlock: (params) => api.get('/sheep/flock', { params }),
  createAnimal: (body) => api.post('/sheep/flock', body),
  updateAnimal: (id, body) => api.put(`/sheep/flock/${id}`, body),
  deleteAnimal: (id) => api.delete(`/sheep/flock/${id}`),
  listWoolProduction: (animalId, params) => api.get(`/sheep/flock/${animalId}/wool-production`, { params }),
  recordWoolProduction: (animalId, body) => api.post(`/sheep/flock/${animalId}/wool-production`, body),
  listFeedConsumption: (animalId, params) => api.get(`/sheep/flock/${animalId}/feed-consumption`, { params }),
  recordFeedConsumption: (animalId, body) => api.post(`/sheep/flock/${animalId}/feed-consumption`, body),
  listBreedingRecords: (femaleId, params) => api.get(`/sheep/flock/${femaleId}/breeding`, { params }),
  recordBreeding: (femaleId, body) => api.post(`/sheep/flock/${femaleId}/breeding`, body),
  updateLambingOutcome: (id, body) => api.put(`/sheep/breeding/${id}/lambing-outcome`, body),
  listVaccinations: (animalId, params) => api.get(`/sheep/flock/${animalId}/vaccinations`, { params }),
  recordVaccination: (animalId, body) => api.post(`/sheep/flock/${animalId}/vaccinations`, body),
  getFlockPerformance: (animalId) => api.get(`/sheep/flock/${animalId}/performance`),
  // Real backend routes return alerts across the whole flock, not per-animal.
  getBreedingAlerts: () => api.get('/sheep/breeding-alerts'),
  getVaccinationAlerts: () => api.get('/sheep/vaccination-alerts'),
  getShearingAlerts: () => api.get('/sheep/shearing-alerts'),
}

/** M126 Pig Farming — Livestock domain. */
export const pigAPI = {
  listHerd: (params) => api.get('/pig/herd', { params }),
  createAnimal: (body) => api.post('/pig/herd', body),
  updateAnimal: (id, body) => api.put(`/pig/herd/${id}`, body),
  deleteAnimal: (id) => api.delete(`/pig/herd/${id}`),
  listWeightRecords: (animalId, params) => api.get(`/pig/herd/${animalId}/weight-records`, { params }),
  recordWeight: (animalId, body) => api.post(`/pig/herd/${animalId}/weight-records`, body),
  listFeedConsumption: (animalId, params) => api.get(`/pig/herd/${animalId}/feed-consumption`, { params }),
  recordFeedConsumption: (animalId, body) => api.post(`/pig/herd/${animalId}/feed-consumption`, body),
  listBreedingRecords: (sowId, params) => api.get(`/pig/herd/${sowId}/breeding`, { params }),
  recordBreeding: (sowId, body) => api.post(`/pig/herd/${sowId}/breeding`, body),
  updateFarrowingOutcome: (id, body) => api.put(`/pig/breeding/${id}/farrowing-outcome`, body),
  listVaccinations: (animalId, params) => api.get(`/pig/herd/${animalId}/vaccinations`, { params }),
  recordVaccination: (animalId, body) => api.post(`/pig/herd/${animalId}/vaccinations`, body),
  getHerdPerformance: (animalId) => api.get(`/pig/herd/${animalId}/performance`),
  // Real backend routes return alerts across the whole herd, not per-animal.
  getBreedingAlerts: () => api.get('/pig/breeding-alerts'),
  getVaccinationAlerts: () => api.get('/pig/vaccination-alerts'),
  getFeedConversionRatio: (animalId) => api.get(`/pig/herd/${animalId}/fcr`),
}

/** M127 Animal Health Management — Livestock domain (cross-cutting). */
export const animalHealthAPI = {
  listExaminations: (params) => api.get('/animal-health/examinations', { params }),
  createExamination: (body) => api.post('/animal-health/examinations', body),
  updateExamination: (id, body) => api.put(`/animal-health/examinations/${id}`, body),
  deleteExamination: (id) => api.delete(`/animal-health/examinations/${id}`),
  listTreatments: (params) => api.get('/animal-health/treatments', { params }),
  createTreatment: (body) => api.post('/animal-health/treatments', body),
  updateTreatment: (id, body) => api.put(`/animal-health/treatments/${id}`, body),
  deleteTreatment: (id) => api.delete(`/animal-health/treatments/${id}`),
  listDiseaseOutbreaks: (params) => api.get('/animal-health/outbreaks', { params }),
  createOutbreak: (body) => api.post('/animal-health/outbreaks', body),
  updateOutbreak: (id, body) => api.put(`/animal-health/outbreaks/${id}`, body),
  deleteOutbreak: (id) => api.delete(`/animal-health/outbreaks/${id}`),
  listQuarantineRecords: (params) => api.get('/animal-health/quarantines', { params }),
  createQuarantine: (body) => api.post('/animal-health/quarantines', body),
  updateQuarantine: (id, body) => api.put(`/animal-health/quarantines/${id}`, body),
  deleteQuarantine: (id) => api.delete(`/animal-health/quarantines/${id}`),
  getHealthOverview: (params) => api.get('/animal-health/overview', { params }),
  getActiveOutbreaks: () => api.get('/animal-health/active-outbreaks'),
  getActiveQuarantines: () => api.get('/animal-health/active-quarantines'),
}

/** RFQ, quote outcomes, QC holds, FPO cost centres (056). */
export const rfqAPI = {
  create: (body) => api.post('/rfq/rfq', body),
  bid: (rfqId, body) => api.post(`/rfq/rfq/${rfqId}/bid`, body),
  bids: (rfqId, asBuyer = false) => api.get(`/rfq/rfq/${rfqId}/bids`, { params: { asBuyer } }),
  centrePnl: (centreId, period) => api.get(`/rfq/cost-centres/${centreId}/pnl`, { params: { period } }),
  qcHolds: (rfqId) => api.get(`/rfq/rfq/${rfqId}/qc-holds`),
}

/** Regional demand, cost model, revenue (052). */
export const economicAPI = {
  forecast: (params) => api.get('/demand/forecast', { params }),
  heatmap: (params) => api.get('/demand/heatmap', { params }),
  mandiSignal: (params) => api.get('/demand/mandi-signal', { params }),
  costBreakup: (params) => api.get('/cost/breakup', { params }),
  corridorModel: (corridor) => api.get('/cost/corridor-model', { params: { corridor } }),
  revenueOverview: (params) => api.get('/revenue/overview', { params }),
  allocateChannels: (body) => api.post('/revenue/allocate', body),
}

/** Energy Management — power consumption, solar integration. */
export const energyAPI = {
  getConsumption: (params) => api.get('/energy/consumption', { params }),
  recordConsumption: (body) => api.post('/energy/consumption', body),
  getSolarGeneration: (params) => api.get('/energy/solar', { params }),
  getEnergyOverview: () => api.get('/energy/overview'),
}

/** Demand Management — demand forecasting, inventory planning.
 *  getDemandForecast fixed 2026-08-11: backend/src/routes/demandRoutes.js only
 *  exposes GET /demand/forecast (query params: productId, regionId, from, to,
 *  limit) — there is no /demand/forecast/:productId path param route, so the
 *  previous shape 404'd on every call (DynamicPricingPage.jsx was the only
 *  caller and crashed reaching for farmersAPI.getDemandForecast, which never
 *  existed on farmersAPI at all — see that page for the full fix).
 *  getDemandHistory / updateDemandPlan remain unmatched to any real route
 *  (demandRoutes.js has no /history or /plan endpoints) and are unused by any
 *  page — left as-is, out of scope for this pass. */
export const demandAPI = {
  getDemandForecast: (params) => api.get('/demand/forecast', { params }),
  getDemandHistory: (productId, params) => api.get(`/demand/history/${productId}`, { params }),
  updateDemandPlan: (productId, body) => api.put(`/demand/plan/${productId}`, body),
}

// ---------------------------------------------------------------------------
// Previously-orphaned services wired 2026-08-11. These all call
// `service.setupRoutes(app)` directly from backend/src/index.js (see the
// "Services that self-register their routes directly on `app`" block there)
// and had exported a working router for a long time with zero callers
// anywhere in this file. Verified against each service file's setupRoutes()
// body, not guessed from naming.
// ---------------------------------------------------------------------------

/** Dynamic Pricing Service — local-market/nutrient-based pricing calculators,
 *  farmer price optimization, per-user price alerts, floor-price peer
 *  benchmark, and the yield-management lot alloc-score/festival-price add-ons.
 *  Distinct from pricingAPI (forward curves, riskPricingRoutes.js) and
 *  yieldAPI (lot price/booking-curve — different paths on the same service). */
export const dynamicPricingAPI = {
  localMarketPrice: (data) => api.post('/pricing/local-market', data),
  nutrientBasedPrice: (data) => api.post('/pricing/nutrient-based', data),
  farmerOptimization: (data) => api.post('/pricing/farmer-optimization', data),
  getAlerts: (userId, productIds) => api.get(`/pricing/alerts/${userId}`, { params: productIds ? { productIds: productIds.join(',') } : {} }),
  setRule: (productId, data) => api.post(`/pricing/rules/${productId}`, data),
  getFloorBenchmark: (category) => api.get('/pricing/floor-benchmark', { params: { category } }),
  getLotAllocScore: (lotCode, dest) => api.get(`/pricing/lots/${lotCode}/alloc-score`, { params: { dest } }),
  getLotFestivalPrice: (lotCode, asOf) => api.get(`/pricing/lots/${lotCode}/festival-price`, { params: asOf ? { asOf } : {} }),
}

/** Farmer Training Service — training programs, registration/progress, FOLU
 *  self-assessment, carbon footprint, NE-organic guidance, certificates,
 *  AI-driven recommendations, compliance reporting. */
export const farmerTrainingAPI = {
  getPrograms: () => api.get('/training/programs'),
  createProgram: (data) => api.post('/training/programs', data),
  register: (data) => api.post('/training/register', data),
  getProgress: (registrationId) => api.get(`/training/progress/${registrationId}`),
  foluAssessment: (data) => api.post('/training/folu-assessment', data),
  getCarbonFootprint: (farmerId) => api.get(`/training/carbon-footprint/${farmerId}`),
  getNortheastOrganic: () => api.get('/training/northeast-organic'),
  issueCertificate: (registrationId, data) => api.post(`/training/certificates/${registrationId}`, data),
  getRecommendations: (farmerId) => api.get(`/training/recommendations/${farmerId}`),
  complianceReport: (data) => api.post('/training/compliance-report', data),
}

/** Government Scheme Service action endpoints — scheme discovery, weather
 *  alerts, announcements, official login, CSR opportunities/proposals,
 *  localized content, per-scheme tracking, expiry status. Distinct from
 *  schemeRegistryAPI above (the verified registry CRUD, same service file,
 *  different route group) and governmentAPI (scheme-analytics/
 *  compliance-status, which target a different, still-unbacked path). */
export const governmentSchemeAPI = {
  getSchemes: (params) => api.get('/government/schemes', { params }),
  getWeatherAlerts: (params) => api.get('/government/weather/alerts', { params }),
  getAnnouncements: (params) => api.get('/government/announcements', { params }),
  createAnnouncement: (data) => api.post('/government/announcements', data),
  officialLogin: (data) => api.post('/government/official/login', data),
  getCsrOpportunities: (params) => api.get('/government/csr/opportunities', { params }),
  submitCsrProposal: (data) => api.post('/government/csr/proposals', data),
  getLocalizedPage: (params) => api.get('/government/localized-page', { params }),
  trackScheme: (id) => api.get(`/government/schemes/track/${id}`),
  getExpiryStatus: () => api.get('/government/schemes/expiry-status'),
}

/** Insurance Claims Service — the deeper claims pipeline (fraud detection,
 *  adjuster follow-ups, payout computation). Distinct from insuranceAPI's
 *  submitClaim/getClaim/getClaims/processClaim above, which correctly target
 *  insuranceService.js's simpler claims CRUD (verified: both routers mount at
 *  /api/v1/insurance, but insuranceService.js registers /claims, /claims/:id,
 *  PUT /claims/:id/process, while insuranceClaimsService.js registers the
 *  /claims/submit, /claims/:id/process (POST), /claims/:id/followup,
 *  /claims/:id/status, /claims/fraud-detect, /claims/:id/payout paths below —
 *  no collision, but easy to confuse). */
export const insuranceClaimsAPI = {
  submitClaim: (data) => api.post('/insurance/claims/submit', data),
  processClaim: (id, data) => api.post(`/insurance/claims/${id}/process`, data),
  followUp: (id, data) => api.post(`/insurance/claims/${id}/followup`, data),
  getStatus: (id) => api.get(`/insurance/claims/${id}/status`),
  detectFraud: (data) => api.post('/insurance/claims/fraud-detect', data),
  getPayout: (id) => api.get(`/insurance/claims/${id}/payout`),
}

/** Pre-Season Order Service — advance/contract-farming order booking, sealed
 *  bidding, bid selection, milestone-based contracts, analytics, dashboard.
 *  Distinct from the generic farmersAPI/orders flow. */
export const preSeasonAPI = {
  createOrder: (data) => api.post('/pre-season/orders', data),
  createBid: (data) => api.post('/pre-season/bids', data),
  selectBid: (orderId, data) => api.post(`/pre-season/orders/${orderId}/select-bid`, data),
  createContract: (data) => api.post('/pre-season/contracts', data),
  updateMilestones: (contractId, data) => api.put(`/pre-season/contracts/${contractId}/milestones`, data),
  getAnalytics: (params) => api.get('/pre-season/analytics', { params }),
  getDashboard: (params) => api.get('/pre-season/dashboard', { params }),
}

/** AFRERA E-Commerce Service - International Launch Standard
 *  Comprehensive marketplace with AI-powered features:
 *  - Product listing management with AI optimization
 *  - Dynamic pricing with market intelligence
 *  - Seller analytics and insights
 *  - GI marketplace integration
 *  - Market price trends and demand analysis
 *  Real backend at backend/src/services/ecommerceService.js */
export const ecommerceAPI = {
  // Product Listings
  createListing: (data) => api.post('/ecommerce/listings', data),
  getListings: (filters, pagination) => api.get('/ecommerce/listings', { params: { ...filters, ...pagination } }),
  getListing: (id) => api.get(`/ecommerce/listings/${id}`),
  updateListing: (id, data) => api.put(`/ecommerce/listings/${id}`, data),
  deleteListing: (id) => api.delete(`/ecommerce/listings/${id}`),
  
  // Seller Analytics
  getSellerAnalytics: (period) => api.get('/ecommerce/seller/analytics', { params: { period } }),
  getSellerListings: () => api.get('/ecommerce/seller/listings'),
  
  // GI Marketplace
  getGIListings: (filters) => api.get('/ecommerce/gi-listings', { params: filters }),
  
  // Market Intelligence
  getPriceTrends: (categoryId, period) => api.get(`/ecommerce/market/price-trends/${categoryId}`, { params: { period } }),
  getDemandAnalysis: (categoryId) => api.get(`/ecommerce/market/demand/${categoryId}`),
  getPriceRecommendation: (data) => api.post('/ecommerce/price-recommendation', data),
}

/** AFRERA E-Commerce Integration Service
 *  Deep integration between E-commerce and:
 *  - Nutrition Intelligence (nutrition scoring, health-based pricing)
 *  - Recipe Intelligence (recipe suggestions, ingredient matching)
 *  - Consumer Health (health profiles, dietary recommendations)
 *  - Nutrient Calculator (nutrition calculation for purchased products)
 *  - Dietitian Services (professional dietary advice integration)
 *  Real backend at backend/src/services/ecommerceIntegrationService.js */
export const ecommerceIntegrationAPI = {
  // Nutrition Scoring
  calculateNutritionScore: (productId) => api.post(`/ecommerce-integration/nutrition-score/${productId}`),
  getNutritionPricePremium: (productId, basePrice) => api.get(`/ecommerce-integration/nutrition-price/${productId}`, { params: { basePrice } }),
  
  // Recipe Integration
  getRecipeSuggestions: (productId, limit) => api.get(`/ecommerce-integration/recipes/${productId}`, { params: { limit } }),
  getRecipeProducts: (recipeId) => api.get(`/ecommerce-integration/recipe-products/${recipeId}`),
  
  // Health-Based Recommendations
  getHealthRecommendations: (limit) => api.get('/ecommerce-integration/health-recommendations', { params: { limit } }),
  checkCompatibility: (productId) => api.get(`/ecommerce-integration/compatibility/${productId}`),
  
  // Shopping Cart Nutrition
  calculateCartNutrition: (cartItems) => api.post('/ecommerce-integration/cart-nutrition', { cartItems }),
  calculateCartRDA: (cartNutrition) => api.post('/ecommerce-integration/cart-rda', { cartNutrition }),
  
  // Dietitian Integration
  getDietitianCollections: (dietitianId) => api.get('/ecommerce-integration/dietitian-collections', { params: { dietitianId } }),
  getDietitianRecommendation: () => api.get('/ecommerce-integration/dietitian-recommendation'),
}

/** AFRERA E-Commerce AI Service
 *  AI-powered marketplace capabilities:
 *  - Customer Segmentation (RFM, behavioral)
 *  - Demand Forecasting
 *  - Inventory Optimization
 *  - Product Recommendations
 *  - Sales Prediction
 *  - Customer Lifetime Value
 *  - Market Basket Analysis
 *  Real backend at backend/src/services/ecommerceAIService.js */
export const ecommerceAIAPI = {
  // Customer Segmentation
  segmentCustomersRFM: () => api.post('/ecommerce-ai/segment-customers-rfm'),
  segmentCustomersBehavioral: () => api.post('/ecommerce-ai/segment-customers-behavioral'),
  
  // Demand Forecasting
  forecastProductDemand: (productId, horizonDays) => api.post(`/ecommerce-ai/forecast-demand/${productId}`, { horizonDays }),
  
  // Inventory Optimization
  optimizeInventory: (productId) => api.post(`/ecommerce-ai/optimize-inventory/${productId}`),
  
  // Product Recommendations
  getPersonalizedRecommendations: (userId, limit) => api.get(`/ecommerce-ai/recommendations/${userId}`, { params: { limit } }),
  
  // Sales Prediction
  predictSales: (categoryId, periodDays) => api.post('/ecommerce-ai/predict-sales', { categoryId, periodDays }),
  
  // Customer Lifetime Value
  calculateCustomerLifetimeValue: (userId) => api.get(`/ecommerce-ai/clv/${userId}`),
  
  // Market Basket Analysis
  analyzeMarketBasket: (categoryId) => api.get('/ecommerce-ai/market-basket', { params: { categoryId } }),
}

/** AFRERA E-Commerce ERP Service
 *  ERP integration capabilities:
 *  - Financial ERP (GL posting, GST invoicing)
 *  - Supply Chain ERP (inventory sync, purchase orders)
 *  - Production ERP (production orders)
 *  - Customer ERP (CRM synchronization)
 *  Real backend at backend/src/services/ecommerceERPService.js */
export const ecommerceERPAPI = {
  // Financial ERP
  postToGeneralLedger: (transactionData) => api.post('/ecommerce-erp/post-gl', transactionData),
  generateGSTInvoice: (orderId) => api.post(`/ecommerce-erp/generate-gst-invoice/${orderId}`),
  
  // Supply Chain ERP
  syncInventoryWithERP: (productId) => api.post(`/ecommerce-erp/sync-inventory/${productId}`),
  createPurchaseOrder: (listingId, quantity) => api.post('/ecommerce-erp/create-purchase-order', { listingId, quantity }),
  
  // Customer ERP (CRM)
  syncCustomerWithCRM: (userId) => api.post(`/ecommerce-erp/sync-customer/${userId}`),
  
  // Production ERP
  createProductionOrder: (productId, demandQuantity) => api.post('/ecommerce-erp/create-production-order', { productId, demandQuantity }),
}

/** AFRERA E-Commerce Business Sales Service
 *  B2B and business sales capabilities:
 *  - Bulk Order Management
 *  - Contract Farming
 *  - Quotation Management
 *  - Sales Analytics
 *  - Commission Management
 *  Real backend at backend/src/services/ecommerceBusinessSalesService.js */
export const ecommerceBusinessSalesAPI = {
  // B2B Bulk Orders
  createBulkOrder: (orderData) => api.post('/ecommerce-business/create-bulk-order', orderData),
  submitQuotation: (bulkOrderId, sellerId, quotationData) => api.post('/ecommerce-business/submit-quotation', { bulkOrderId, sellerId, quotationData }),
  acceptQuotation: (quotationId) => api.post(`/ecommerce-business/accept-quotation/${quotationId}`),
  
  // Contract Farming
  createContractFarming: (contractData) => api.post('/ecommerce-business/create-contract-farming', contractData),
  recordContractMilestone: (contractId, milestoneData) => api.post('/ecommerce-business/record-milestone', { contractId, milestoneData }),
  
  // Sales Analytics
  getSalesAnalytics: (filters) => api.get('/ecommerce-business/sales-analytics', { params: filters }),
  getB2BConversionMetrics: (periodDays) => api.get('/ecommerce-business/b2b-conversion-metrics', { params: { periodDays } }),
  
  // Commission Management
  calculateCommission: (orderId) => api.post(`/ecommerce-business/calculate-commission/${orderId}`),
}

/** AFRERA E-Commerce Marketing Service
 *  Marketing and advertising capabilities:
 *  - Campaign Management
 *  - Sponsored Products
 *  - Promotion Management
 *  - Retargeting Campaigns
 *  - Performance Analytics
 *  Real backend at backend/src/services/ecommerceMarketingService.js */
export const ecommerceMarketingAPI = {
  // Campaign Management
  createCampaign: (campaignData) => api.post('/ecommerce-marketing/create-campaign', campaignData),
  launchCampaign: (campaignId) => api.post(`/ecommerce-marketing/launch-campaign/${campaignId}`),
  updateCampaignMetrics: (campaignId) => api.post(`/ecommerce-marketing/update-campaign-metrics/${campaignId}`),
  
  // Sponsored Products
  createSponsoredProduct: (productData) => api.post('/ecommerce-marketing/create-sponsored-product', productData),
  getSponsoredProducts: (filters) => api.get('/ecommerce-marketing/sponsored-products', { params: filters }),
  
  // Promotion Management
  createPromotion: (promotionData) => api.post('/ecommerce-marketing/create-promotion', promotionData),
  applyPromotion: (promoCode, orderId) => api.post(`/ecommerce-marketing/apply-promotion/${promoCode}`, { orderId }),
  
  // Retargeting
  createCartRetargeting: (cartItems) => api.post('/ecommerce-marketing/retargeting-cart', { cartItems }),
  createProductViewRetargeting: (productId) => api.post('/ecommerce-marketing/retargeting-product-view', { productId }),
  
  // Analytics
  getMarketingAnalytics: (filters) => api.get('/ecommerce-marketing/analytics', { params: filters }),
}

/** AFRERA Nutrient Value Sales Service
 *  Nutrient-value-based sales capabilities:
 *  - Nutrient-Value Pricing
 *  - Nutrient Content Verification
 *  - Nutrient-Value Listings
 *  - Nutrient Quality Tiers
 *  - Nutrient-Based Comparison
 *  - Nutrient Certification
 *  - Nutrient-Based Commission
 *  - Nutrient-Value Search
 *  Real backend at backend/src/services/nutrientValueSalesService.js */
export const nutrientValueSalesAPI = {
  // Nutrient-Value Pricing
  calculateNutrientValuePrice: (productId, nutrientContent) => api.post(`/nutrient-value/calculate-price/${productId}`, nutrientContent),
  
  // Nutrient Content Verification
  submitNutrientContent: (productId, contentData, verificationData) => api.post('/nutrient-value/submit-verification', { productId, contentData, verificationData }),
  approveNutrientVerification: (verificationId, approvedBy, notes) => api.post(`/nutrient-value/approve-verification/${verificationId}`, { approvedBy, notes }),
  
  // Nutrient-Value Listings
  createNutrientValueListing: (listingData) => api.post('/nutrient-value/create-listing', listingData),
  
  // Nutrient Quality Tiers
  assignNutrientTier: (productId, manualOverride) => api.post(`/nutrient-value/assign-tier/${productId}`, { manualOverride }),
  
  // Nutrient-Based Comparison
  compareProductsByNutrient: (productIds) => api.post('/nutrient-value/compare-products', { productIds }),
  
  // Nutrient Certification
  issueNutrientCertificate: (productId, certificationData) => api.post('/nutrient-value/issue-certificate', { productId, certificationData }),
  
  // Nutrient-Based Commission
  calculateNutrientBasedCommission: (orderId) => api.post(`/nutrient-value/calculate-commission/${orderId}`),
  
  // Nutrient-Value Search
  searchByNutrientCriteria: (criteria) => api.get('/nutrient-value/search', { params: criteria }),
}

/** Shared Infrastructure asset marketplace (register/search/book shared
 *  equipment, second-life equipment listings, community battery listings,
 *  renewable-support lookup, per-asset utilization analytics). Real backend
 *  at backend/src/services/sharedInfraService.js. Previously labelled "coming
 *  soon" in FarmerSharedDoorPage.jsx — wired 2026-08-11, see SharedInfraPage.jsx.
 *  Distinct from sharedInfrastructureAPI-style per-village access records
 *  (a different service, sharedInfrastructureService.js, REOS Rural Life OS). */
export const sharedInfraAPI = {
  registerAsset: (data) => api.post('/shared-infra/assets/register', data),
  searchAssets: (params) => api.get('/shared-infra/assets/search', { params }),
  bookAsset: (data) => api.post('/shared-infra/assets/book', data),
  listSecondLife: (data) => api.post('/shared-infra/second-life/list', data),
  searchSecondLife: (params) => api.get('/shared-infra/second-life/search', { params }),
  listBatteries: (data) => api.post('/shared-infra/batteries/list', data),
  getRenewableSupport: (params) => api.get('/shared-infra/renewable/support', { params }),
  getAssetAnalytics: (id) => api.get(`/shared-infra/assets/${id}/analytics`),
}

/** Soil Testing Service (M072 — individual lab sample results: submit sample,
 *  submit lab results, fertilizer recommendation, track a sample, health
 *  card, INM plan, organic input plan). Explicitly out of scope for
 *  SoilManagementPage.jsx's M071/M073/M074 batch (see that file's header) —
 *  wired as its own tab there 2026-08-11. Distinct from soilHealthAPI's
 *  plot/zone-level health cards (different, still-unbacked /soil-health/cards
 *  path). */
export const soilTestingOpsAPI = {
  submitSample: (data) => api.post('/soil-testing/samples', data),
  submitResults: (id, data) => api.post(`/soil-testing/samples/${id}/results`, data),
  getFertilizerRecommendation: (id, data) => api.post(`/soil-testing/samples/${id}/fertilizer-recommendation`, data),
  trackSample: (id) => api.get(`/soil-testing/samples/${id}/track`),
  getHealthCard: (params) => api.get('/soil-testing/health-card', { params }),
  getInmPlan: (sampleId, params) => api.get(`/soil-testing/inm-plan/${sampleId}`, { params }),
  getOrganicInputPlan: (params) => api.get('/soil-testing/organic-input-plan', { params }),
}

/** Subsidy Service action endpoints — project/equipment/logistics eligibility
 *  checks, applicable-scheme lookup, application submission, tracking, GST
 *  applicability. Distinct from subsidyAPI above (getStats/getPending, which
 *  target /subsidy/stats and /subsidy/pending — still no matching route, see
 *  the FE-01 comment on subsidyAPI; that gap remains out of scope here). */
export const subsidyOpsAPI = {
  checkProjectSubsidy: (data) => api.post('/subsidy/project/check', data),
  checkEquipmentSubsidy: (data) => api.post('/subsidy/equipment/check', data),
  checkLogisticsSubsidy: (data) => api.post('/subsidy/logistics/check', data),
  getSchemes: (params) => api.get('/subsidy/schemes', { params }),
  apply: (data) => api.post('/subsidy/apply', data),
  track: (id) => api.get(`/subsidy/track/${id}`),
  calculateGst: (data) => api.post('/subsidy/gst/calculate', data),
}

/** Cost Management — landed cost pricing, cost breakdowns. */
export const costAPI = {
  getLandedCost: (productId) => api.get(`/costs/landed/${productId}`),
  calculateCost: (body) => api.post('/costs/calculate', body),
  getCostBreakdown: (productId) => api.get(`/costs/breakdown/${productId}`),
}

/** Vision + OCR — image processing, document extraction. */
export const visionAPI = {
  processImage: (body) => api.post('/vision/process', body),
  extractText: (body) => api.post('/vision/ocr', body),
  detectObjects: (body) => api.post('/vision/detect', body),
}

// unifiedLedgerAPI ("One Ledger + 9 Economies") was removed 2026-08-17: the
// backend it called was deleted as a rejected architecture (see
// backend/src/index.js). UnifiedLedgerPage.jsx now points to /ledger
// (financeAPI.trialBalance/verifyLedger) instead.

/** FOLU land use, carbon and NE organic schemes (991). */
export const foluAPI = {
  landUseSummary: (params) => api.get('/folu/land-use/summary', { params }),
  registerParcel: (body) => api.post('/folu/parcels', body),
  recordChange: (body) => api.post('/folu/land-use/change', body),
  estimateCarbon: (body) => api.post('/folu/carbon/estimate', body),
  schemeStatus: (farmerId) => api.get(`/folu/schemes/${farmerId}`),
}

/** Agmarknet / e-NAM prices and DBT reconciliation. */
export const marketDataAPI = {
  priceTrend: (params) => api.get('/market-data/prices/trend', { params }),
  ingestPrices: (records, source) => api.post('/market-data/prices/ingest', { records, source }),
  reconcileDbt: (body) => api.post('/market-data/dbt/reconcile', body),
  unclaimedEntitlements: (params) => api.get('/market-data/dbt/unclaimed', { params }),
}

/** Driver tracking — served by the existing logistics routes, not a new module. */
export const driverTrackingAPI = {
  recordLocation: (body) => api.post('/logistics-ops/drivers/location', body),
  activeDrivers: (params) => api.get('/logistics-ops/drivers/active', { params }),
  shipmentTrail: (id) => api.get(`/logistics-ops/shipments/${id}/trail`),
}

/**
 * Geofencing — circular zone check-ins built on real mobile GPS
 * (see hooks/useGeolocation.js) and the existing driver_location pipeline
 * above. Manual check-in only, no continuous background tracking.
 */
export const geofencingAPI = {
  listZones: (params) => api.get('/geofencing/zones', { params }),
  createZone: (body) => api.post('/geofencing/zones', body),
  getZone: (id) => api.get(`/geofencing/zones/${id}`),
  checkIn: (body) => api.post('/geofencing/checkins', body),
  checkInHistory: (params) => api.get('/geofencing/checkins', { params }),
  driverZoneCheck: (body) => api.post('/geofencing/driver-zone-check', body),
}

/** Village Profile Service (REOS Layer 5 - District/Village/Block Economic Database) */
export const villageProfileAPI = {
  getVillage: (villageId) => api.get(`/village-profiles/villages/${villageId}`),
  getVillagesByDistrict: (district) => api.get(`/village-profiles/villages/district/${district}`),
  getVillagesByBlock: (block) => api.get(`/village-profiles/villages/block/${block}`),
  getDistrictSummary: (district) => api.get(`/village-profiles/districts/${district}/economic-summary`),
  upsertVillage: (body) => api.post('/village-profiles/villages', body),
  searchVillages: (params) => api.get('/village-profiles/villages/search', { params }),
}

/** Procurement Subscription Service (REOS Layer 1.9 - Subscription Commerce) */
export const procurementSubscriptionAPI = {
  getSubscription: (subscriptionId) => api.get(`/procurement-subscriptions/subscriptions/${subscriptionId}`),
  getSubscriptionsBySubscriber: (subscriberId) => api.get(`/procurement-subscriptions/subscriptions/subscriber/${subscriberId}`),
  getSubscriptionsByProduct: (productId) => api.get(`/procurement-subscriptions/subscriptions/product/${productId}`),
  createSubscription: (body) => api.post('/procurement-subscriptions/subscriptions', body),
  updateSubscription: (subscriptionId, body) => api.put(`/procurement-subscriptions/subscriptions/${subscriptionId}`, body),
  cancelSubscription: (subscriptionId, body) => api.post(`/procurement-subscriptions/subscriptions/${subscriptionId}/cancel`, body),
  getSubscriptionsDue: (date) => api.get(`/procurement-subscriptions/subscriptions/due/${date}`),
  getStatistics: (params) => api.get('/procurement-subscriptions/subscriptions/statistics', { params }),
}

/** Buying Club Service (REOS Layer 1.10-1.11 - Group Buying / Community Buying) */
export const buyingClubAPI = {
  getClub: (clubId) => api.get(`/buying-clubs/clubs/${clubId}`),
  getClubsByVillage: (villageId) => api.get(`/buying-clubs/clubs/village/${villageId}`),
  getClubsByDistrict: (district) => api.get(`/buying-clubs/clubs/district/${district}`),
  createClub: (body) => api.post('/buying-clubs/clubs', body),
  updateClub: (clubId, body) => api.put(`/buying-clubs/clubs/${clubId}`, body),
  addMember: (clubId, body) => api.post(`/buying-clubs/clubs/${clubId}/members`, body),
  createOrder: (body) => api.post('/buying-clubs/orders', body),
  getClubOrders: (clubId) => api.get(`/buying-clubs/orders/club/${clubId}`),
  getStatistics: (params) => api.get('/buying-clubs/clubs/statistics', { params }),
}

/** Rural Enterprise Service (REOS Rural Life OS - rural_enterprises table) */
export const ruralEnterpriseAPI = {
  getEnterprise: (enterpriseId) => api.get(`/rural-enterprises/enterprises/${enterpriseId}`),
  getEnterprisesByVillage: (villageId) => api.get(`/rural-enterprises/enterprises/village/${villageId}`),
  getEnterprisesByType: (enterpriseType) => api.get(`/rural-enterprises/enterprises/type/${enterpriseType}`),
  createEnterprise: (body) => api.post('/rural-enterprises/enterprises', body),
  updateEnterprise: (enterpriseId, body) => api.put(`/rural-enterprises/enterprises/${enterpriseId}`, body),
  getStatistics: (params) => api.get('/rural-enterprises/enterprises/statistics', { params }),
  searchEnterprises: (params) => api.get('/rural-enterprises/enterprises/search', { params }),
}

/** Renewable Energy Service (REOS Rural Life OS - renewable_energy_systems table) */
export const renewableEnergyAPI = {
  getSystem: (systemId) => api.get(`/renewable-energy/systems/${systemId}`),
  getSystemsByVillage: (villageId) => api.get(`/renewable-energy/systems/village/${villageId}`),
  getSystemsByType: (energyType) => api.get(`/renewable-energy/systems/type/${energyType}`),
  createSystem: (body) => api.post('/renewable-energy/systems', body),
  updateSystem: (systemId, body) => api.put(`/renewable-energy/systems/${systemId}`, body),
  getStatistics: (params) => api.get('/renewable-energy/systems/statistics', { params }),
}

/** Household Economy Service (REOS Rural Life OS - household_economy table) */
export const householdEconomyAPI = {
  getHousehold: (householdId) => api.get(`/household-economy/households/${householdId}`),
  getHouseholdsByVillage: (villageId) => api.get(`/household-economy/households/village/${villageId}`),
  getVillageSummary: (villageId) => api.get(`/household-economy/households/village/${villageId}/summary`),
  upsertHousehold: (body) => api.post('/household-economy/households', body),
}

/** Shared Infrastructure Service (REOS Rural Life OS - shared_infrastructure_access table) */
export const sharedInfrastructureAPI = {
  getAccess: (accessId) => api.get(`/shared-infrastructure/access/${accessId}`),
  getAccessByVillage: (villageId) => api.get(`/shared-infrastructure/access/village/${villageId}`),
  getAccessByType: (infrastructureType) => api.get(`/shared-infrastructure/access/type/${infrastructureType}`),
  getVillageSummary: (villageId) => api.get(`/shared-infrastructure/access/village/${villageId}/summary`),
  upsertAccess: (body) => api.post('/shared-infrastructure/access', body),
}

/** Machinery Access Service (REOS Rural Life OS - machinery_access table) */
export const machineryAccessAPI = {
  getAccess: (accessId) => api.get(`/machinery-access/access/${accessId}`),
  getAccessByVillage: (villageId) => api.get(`/machinery-access/access/village/${villageId}`),
  getAccessByType: (machineryType) => api.get(`/machinery-access/access/type/${machineryType}`),
  getVillageSummary: (villageId) => api.get(`/machinery-access/access/village/${villageId}/summary`),
  upsertAccess: (body) => api.post('/machinery-access/access', body),
}

/** Rural Finance Service (REOS Rural Life OS - rural_finance table) */
export const ruralFinanceAPI = {
  getFinance: (financeId) => api.get(`/rural-finance/finance/${financeId}`),
  getFinanceByVillage: (villageId) => api.get(`/rural-finance/finance/village/${villageId}`),
  getFinanceByServiceType: (serviceType) => api.get(`/rural-finance/finance/service/${serviceType}`),
  getVillageSummary: (villageId) => api.get(`/rural-finance/finance/village/${villageId}/summary`),
  upsertFinance: (body) => api.post('/rural-finance/finance', body),
}

/** AI Advisory Service (REOS Rural Life OS - ai_advisories table) */
export const aiAdvisoryAPI = {
  getAdvisory: (advisoryId) => api.get(`/ai-advisories/advisories/${advisoryId}`),
  getAdvisoriesByVillage: (villageId) => api.get(`/ai-advisories/advisories/village/${villageId}`),
  getAdvisoriesByFarmer: (farmerId) => api.get(`/ai-advisories/advisories/farmer/${farmerId}`),
  getAdvisoriesByType: (advisoryType) => api.get(`/ai-advisories/advisories/type/${advisoryType}`),
  createAdvisory: (body) => api.post('/ai-advisories/advisories', body),
  updateStatus: (advisoryId, body) => api.put(`/ai-advisories/advisories/${advisoryId}/status`, body),
  getStatistics: (params) => api.get('/ai-advisories/advisories/statistics', { params }),
}

/** Market Access Service (REOS Rural Life OS - market_access table) */
export const marketAccessAPI = {
  getAccess: (accessId) => api.get(`/market-access/access/${accessId}`),
  getAccessByVillage: (villageId) => api.get(`/market-access/access/village/${villageId}`),
  getAccessByType: (marketType) => api.get(`/market-access/access/type/${marketType}`),
  getVillageSummary: (villageId) => api.get(`/market-access/access/village/${villageId}/summary`),
  upsertAccess: (body) => api.post('/market-access/access', body),
}

/** Market Intelligence Service (REOS Rural Life OS - market_intelligence table) */
export const marketIntelligenceAPI = {
  getIntelligence: (intelligenceId) => api.get(`/market-intelligence/intelligence/${intelligenceId}`),
  getIntelligenceByVillage: (villageId) => api.get(`/market-intelligence/intelligence/village/${villageId}`),
  getIntelligenceByCrop: (cropId) => api.get(`/market-intelligence/intelligence/crop/${cropId}`),
  getLatestIntelligence: (villageId) => api.get(`/market-intelligence/intelligence/village/${villageId}/latest`),
  createIntelligence: (body) => api.post('/market-intelligence/intelligence', body),
}

/** Mobility Rides Service (REOS Rural Life OS - mobility_rides table) */
export const mobilityRidesAPI = {
  getRide: (rideId) => api.get(`/mobility-rides/rides/${rideId}`),
  getRidesByVillage: (villageId) => api.get(`/mobility-rides/rides/village/${villageId}`),
  getRidesByDriver: (driverId) => api.get(`/mobility-rides/rides/driver/${driverId}`),
  createRide: (body) => api.post('/mobility-rides/rides', body),
  updateStatus: (rideId, body) => api.put(`/mobility-rides/rides/${rideId}/status`, body),
  getStatistics: (params) => api.get('/mobility-rides/rides/statistics', { params }),
}

/** Yield management — lots, fare buckets, markdown, booking curve (059).
 *  Served by the existing /pricing routes; dynamicPricingService owns the logic. */
export const yieldAPI = {
  lotPrice: (lotCode) => api.get(`/pricing/lots/${lotCode}/price`),
  openNextBucket: (lotCode) => api.post(`/pricing/lots/${lotCode}/open-bucket`),
  bookingCurve: (cropKey) => api.get(`/pricing/booking-curve/${cropKey}`),
  recordBookingPoint: (body) => api.post('/pricing/booking-curve', body),
  lotsNeedingAttention: (params) => api.get('/pricing/lots/attention', { params }),
}

/** Competitor price intelligence — writes to price_intelligence (042 + 059). */
export const competitorAPI = {
  observe: (body) => api.post('/market-data/competitor/observe', body),
  position: (params) => api.get('/market-data/competitor/position', { params }),
}

/** Vendor / buyer orchestration API used by the logistics and corporate buyer pages. */
export const vendorsAPI = {
  // Real backend routes are under /vendors/corporate/..., not /vendors/buyers/...
  getBuyerProfile: (buyerId) => api.get(`/vendors/corporate/${buyerId}/profile`),
  getCreditStatus: (buyerId) => api.get(`/vendors/corporate/${buyerId}/credit-status`),
  getActiveOrders: (buyerId) => api.get(`/vendors/corporate/${buyerId}/orders`),
  createCorporateOrder: (body) => api.post('/vendors/corporate/orders', body),
  getLogisticsProfile: (providerId) => api.get(`/vendors/logistics/${providerId}/profile`),
  getActiveShipments: (providerId) => api.get(`/vendors/logistics/${providerId}/shipments`),
  getColdChainNodes: () => api.get('/vendors/logistics/cold-chain/nodes'),
  getReturnTruckOpportunities: () => api.get('/vendors/logistics/return-trucks'),
  createLogisticsBooking: (body) => api.post('/vendors/logistics/bookings', body),
}

/** Experience Layer / DXP — the 15 engines (migration 060). */
export const experienceAPI = {
  resolve: (params) => api.get('/experience/resolve', { params }),
  tokens: (theme) => api.get('/experience/tokens', { params: { theme } }),
  saveToken: (body) => api.post('/experience/tokens', body),
  themes: () => api.get('/experience/themes'),
  contrast: (fg, bg, large) => api.get('/experience/contrast', { params: { fg, bg, large } }),
  motion: (reduced) => api.get('/experience/motion', { params: { reduced } }),
  breakpoint: (width) => api.get('/experience/breakpoint', { params: { width } }),
  components: (params) => api.get('/experience/components', { params }),
  registerComponent: (body) => api.post('/experience/components', body),
  accessibility: () => api.get('/experience/accessibility'),
  recordConformance: (body) => api.post('/experience/accessibility', body),
  preferences: () => api.get('/experience/preferences'),
  savePreferences: (body) => api.put('/experience/preferences', body),
}

// ---------------------------------------------------------------------------
// Dashboard/system callers recovered 2026-08-07 (FE-01 fix, docs/registry/20_FRONTEND_BOUNDARIES.md).
//
// These pages previously called raw fetch() directly, which never attached the
// Authorization header and never benefited from the 401-refresh interceptor
// above. Paths are unchanged from the original fetch() calls. Some of the
// paths below (admin/audit/recent, banker/*, ca/audit-stats, fpo/stats,
// government/*, research/stats, subsidy/stats, subsidy/pending) have no
// matching backend route as of this fix — that gap pre-dates this change and
// is out of scope here; the caller now at least behaves identically to a
// fetch-based caller once a route exists, and gets the same auth handling as
// every other module in this file.
// ---------------------------------------------------------------------------

/** Unversioned endpoints that live outside the /api/v1 prefix (e.g. health checks). */
const SYSTEM_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '')
export const systemAPI = {
  getHealth: () => axios.get(`${SYSTEM_BASE_URL}/health`),
}

/** Admin dashboard. */
export const adminAPI = {
  getRecentAudit: () => api.get('/admin/audit/recent'),
  exportAuditCSV: () => api.get('/admin/audit/export', { responseType: 'blob' }),
}

/** Banker dashboard. */
export const bankerAPI = {
  getPortfolio: () => api.get('/banker/portfolio'),
  getRiskDashboard: () => api.get('/banker/risk-dashboard'),
}

/** CA (chartered accountant) dashboard. */
export const caAPI = {
  getAuditStats: () => api.get('/ca/audit-stats'),
}

/** FPO dashboard summary stats — distinct from farmersAPI.getFPOs, which lists FPOs. */
export const fpoAPI = {
  getStats: () => api.get('/fpo/stats'),
}

/** Government dashboard. */
export const governmentAPI = {
  getSchemeAnalytics: () => api.get('/government/scheme-analytics'),
  getComplianceStatus: () => api.get('/government/compliance-status'),
}

/** Module hub catalogue and AI recommendation assistant. */
export const modulesAPI = {
  getModules: () => api.get('/modules'),
  getOverview: () => api.get('/modules/overview'),
  askAssistant: (prompt) => api.post('/modules/assistant', { prompt }),
}

/** Research dashboard. */
export const researchAPI = {
  getStats: () => api.get('/research/stats'),
}

/** Subsidy management dashboard — distinct from financeAPI.equipmentSubsidy. */
export const subsidyAPI = {
  getStats: () => api.get('/subsidy/stats'),
  getPending: () => api.get('/subsidy/pending'),
}

// ---------------------------------------------------------------------------
// Component callers recovered 2026-08-07 (FE-01 fix, docs/registry/20_FRONTEND_BOUNDARIES.md).
// Same rationale as the dashboard section above: these callers bypassed
// services/api.js with raw fetch() and never attached the Authorization
// header. Paths are unchanged from the original fetch() calls.
// ---------------------------------------------------------------------------

/** AR/VR experience viewer (components/ArVr/ExperienceViewer.jsx). */
export const arVrAPI = {
  getExperiences: (targetEntityId, targetEntityType = 'product') =>
    api.get('/ar-vr/experiences', { params: { target_entity_id: targetEntityId, target_entity_type: targetEntityType } }),
  getInteractionPoints: (experienceId) => api.get(`/ar-vr/experiences/${experienceId}/interaction-points`),
}

/** Blockchain traceability viewer (components/BlockchainTraceability/TraceabilityViewer.jsx). */
export const blockchainTraceabilityAPI = {
  getTraceabilityEvents: (productId, batchNumber) =>
    api.get(`/blockchain-traceability/traceability-events/${productId}`, { params: batchNumber ? { batch_number: batchNumber } : {} }),
  verifyChainOfCustody: (productId, batchNumber) =>
    api.get(`/blockchain-traceability/chain-of-custody/verify/${productId}`, { params: batchNumber ? { batch_number: batchNumber } : {} }),
}

/** Consumer health dashboard (components/ConsumerHealth/HealthDashboard.jsx). */
export const consumerHealthAPI = {
  getHealthProfiles: () => api.get('/consumer-health/health-profiles'),
  getHealthMetrics: () => api.get('/consumer-health/health-metrics'),
  getHealthGoals: () => api.get('/consumer-health/health-goals'),
  getDietaryRecommendations: () => api.get('/consumer-health/dietary-recommendations'),
  getBMI: () => api.get('/consumer-health/bmi'),
}

/** Conversational AI chat (components/ConversationalAI/ChatInterface.jsx). */
export const conversationalAIAPI = {
  getDomains: () => api.get('/conversational-ai/domains'),
  createSession: (body) => api.post('/conversational-ai/sessions', body),
  respond: (sessionId, message) => api.post(`/conversational-ai/sessions/${sessionId}/respond`, { message }),
  endSession: (sessionId, body) => api.post(`/conversational-ai/sessions/${sessionId}/end`, body),
}

/** Farmer portal land records (components/FarmerPortal/LandRecords.jsx). */
export const farmerPortalAPI = {
  getLandRecords: () => api.get('/farmer-portal/land-records'),
  addLandRecord: (data) => api.post('/farmer-portal/land-records', data),
  syncGovernmentLandRecords: () => api.post('/farmer-portal/land-records/sync-government'),
}

/** Farmer wallet — real, DB-backed, transactional (see services/farmerService.js). */
export const walletAPI = {
  getWallet: () => api.get('/farmer-portal/wallet'),
  getBalance: () => api.get('/farmer-portal/wallet/balance'),
  getTransactions: (params) => api.get('/farmer-portal/wallet/transactions', { params }),
  deposit: (data) => api.post('/farmer-portal/wallet/deposit', data),
  withdraw: (data) => api.post('/farmer-portal/wallet/withdraw', data),
  transfer: (data) => api.post('/farmer-portal/wallet/transfer', data),
  linkBank: (data) => api.post('/farmer-portal/wallet/link-bank', data),
}

/** Food intelligence recalls (components/FoodIntelligence/FoodSafetyDashboard.jsx). */
export const foodIntelligenceAPI = {
  getActiveRecalls: () => api.get('/food-intelligence/food-recalls/active'),
}

/** GI (Geographical Indication) product listing + authenticity verification (components/GIIntelligence/GIProductCard.jsx). */
export const giIntelligenceAPI = {
  getGIProducts: (state) => api.get('/gi-intelligence/gi-products', { params: state ? { state } : {} }),
  verifyAuthentication: (authCode) => api.get(`/gi-intelligence/gi-authentication/verify/${authCode}`),
}

/** IoT device monitoring (components/IoTIntegration/DeviceMonitor.jsx). */
export const iotAPI = {
  getDevices: () => api.get('/iot-integration/iot-devices'),
  getUnacknowledgedAlerts: () => api.get('/iot-integration/device-alerts/unacknowledged'),
  getSensorData: (deviceId) => api.get(`/iot-integration/sensor-data/${deviceId}`),
}

/** Knowledge graph explorer (components/KnowledgeGraph/KnowledgeExplorer.jsx). */
export const knowledgeGraphAPI = {
  getRelatedNodes: (nodeId) => api.get(`/knowledge-graph/knowledge-nodes/${nodeId}/related`),
  searchNodes: (query) => api.get('/knowledge-graph/knowledge-nodes/search', { params: { q: query } }),
}

/** Laboratory ERP sample intake (components/LaboratoryERP/SampleRegistration.jsx). */
export const laboratoryERPAPI = {
  getLaboratories: () => api.get('/laboratory-erp/laboratories'),
  getTestCategories: () => api.get('/laboratory-erp/test-categories'),
  getTestMethods: (categoryId) => api.get('/laboratory-erp/test-methods', { params: { category_id: categoryId } }),
  registerSample: (data) => api.post('/laboratory-erp/samples', data),
}

/** GST + review sub-resources served under /marketplace (distinct from productsAPI/ordersAPI). */
export const marketplaceAPI = {
  calculateProductGST: (product) => api.post('/marketplace/gst/calculate/product', product),
  calculateOrderGST: (orderId) => api.post(`/marketplace/gst/calculate/order/${orderId}`),
  generateGstInvoice: (orderId) => api.post(`/marketplace/gst/invoice/${orderId}`),
  getProductReviews: (productId) => api.get(`/marketplace/reviews/product/${productId}`),
  getProductReviewStats: (productId) => api.get(`/marketplace/reviews/product/${productId}/stats`),
  getUserReviews: () => api.get('/marketplace/reviews/user'),
  submitReview: (data) => api.post('/marketplace/reviews', data),
  markReviewHelpful: (reviewId) => api.post(`/marketplace/reviews/${reviewId}/helpful`),
}

/** Multilingual content, translation and language preferences. */
export const multilingualAPI = {
  getLanguages: () => api.get('/multilingual/languages'),
  getPreferences: () => api.get('/multilingual/preferences'),
  updatePreferences: (body) => api.put('/multilingual/preferences', body),
  getContent: (language) => api.get('/multilingual/content', { params: { language } }),
  detect: (text) => api.post('/multilingual/detect', { text }),
  translate: (body) => api.post('/multilingual/translate', body),
}

/** Nutrition intelligence (components/NutritionIntelligence/NutritionLabel.jsx). */
export const nutritionAPI = {
  getProductNutrition: (productId) => api.get(`/nutrition-intelligence/product-nutrition/${productId}`),
  getNutritionScore: (productId) => api.get(`/nutrition-intelligence/product-nutrition/${productId}/score`),
  getDietaryProfiles: () => api.get('/nutrition-intelligence/dietary-profiles'),
  getRecommendations: () => api.get('/nutrition-intelligence/recommendations'),
  generateRecommendations: (dietaryProfileId, targetCalories, limit) =>
    api.post('/nutrition-intelligence/recommendations', { dietary_profile_id: dietaryProfileId, target_calories: targetCalories, limit }),
  getWellnessPractices: (params) => api.get('/nutrition-intelligence/wellness-practices', { params }),
  // AI-generated recipe grounded in real dietary profile + real matching AFRERA
  // products — see nutritionIntelligenceService.generateDietBasedRecipe. Returns
  // an honest status: 'generated' | 'ai_not_configured' | 'no_ingredients'.
  generateRecipe: (dietaryProfileId, targetCalories, provider) =>
    api.post('/nutrition-intelligence/recipes', { dietary_profile_id: dietaryProfileId, target_calories: targetCalories, provider }),
  // "Sell by nutrient, not by kg" — real per-100g comparison against category
  // peers, picks whichever recorded compound (protein, curcumin, Scoville,
  // ASTA color, etc.) actually differentiates this product. See
  // nutritionIntelligenceService.calculateValuePerNutrient.
  getValuePerNutrient: (productId) => api.get(`/nutrition-intelligence/product-nutrition/${productId}/value-per-nutrient`),
}

/** Organic traceability — farm registration, standards, consumer QR lookup. */
export const organicTraceabilityAPI = {
  getStandards: () => api.get('/organic-traceability/standards'),
  registerFarm: (data) => api.post('/organic-traceability/farms', data),
  getConsumerTransparency: (qrCode) => api.get(`/organic-traceability/consumer-transparency/qr/${qrCode}`),
}

/** Predictive analytics — demand forecasts and alerts. */
export const predictiveAnalyticsAPI = {
  getForecasts: (params) => api.get('/predictive-analytics/forecasts', { params }),
  getPredictions: (entityId, entityType) => api.get(`/predictive-analytics/predictions/${entityId}/${entityType}`),
  getUnacknowledgedAlerts: () => api.get('/predictive-analytics/prediction-alerts/unacknowledged'),
}

/** Voice AI assistant sessions and commands. */
export const voiceAIAPI = {
  createSession: (language) => api.post('/voice-ai/voice-sessions', { language }),
  getPreferences: () => api.get('/voice-ai/voice-preferences'),
  sendCommand: (body) => api.post('/voice-ai/voice-commands', body),
  endSession: (sessionId) => api.post(`/voice-ai/voice-sessions/${sessionId}/end`),
}

// ---------------------------------------------------------------------------
// Modules built 2026-08-07 for 15 confirmed STUB-ONLY frontends (M067, M031,
// M093, M075, M121, M112, M041, M024, M141, M098, M132, M101, M013, M083,
// M046). None of these had a dedicated backend route as of this change — the
// shapes below follow the same REST convention as every namespace above
// (/api/v1/<resource>) so a backend counterpart can be dropped in without a
// frontend rewrite. See each module's README.md for the specific gap.
// ---------------------------------------------------------------------------

/** M067 — Sowing Management (Crop domain). No backend route found for sowing records. */
export const sowingAPI = {
  getRecords: (params) => api.get('/sowing/records', { params }),
  getRecord: (id) => api.get(`/sowing/records/${id}`),
  createRecord: (data) => api.post('/sowing/records', data),
  updateRecord: (id, data) => api.put(`/sowing/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/sowing/records/${id}`),
}

/** M031 — Land Registry (Land domain). A `farm_plots` table exists (migration
 *  056_named_missing_modules.sql) but no route reads or writes it. */
export const landAPI = {
  getParcels: (params) => api.get('/land/parcels', { params }),
  getParcel: (id) => api.get(`/land/parcels/${id}`),
  createParcel: (data) => api.post('/land/parcels', data),
  updateParcel: (id, data) => api.put(`/land/parcels/${id}`, data),
  deleteParcel: (id) => api.delete(`/land/parcels/${id}`),
}

/** M093 — Labour Management (Operations domain). No backend route found. */
export const labourAPI = {
  getWorkers: (params) => api.get('/labour/workers', { params }),
  createWorker: (data) => api.post('/labour/workers', data),
  updateWorker: (id, data) => api.put(`/labour/workers/${id}`, data),
  getAttendance: (params) => api.get('/labour/attendance', { params }),
  recordAttendance: (data) => api.post('/labour/attendance', data),
  getPayments: (params) => api.get('/labour/payments', { params }),
  recordPayment: (data) => api.post('/labour/payments', data),
}

/** M075 — Irrigation Management (Water domain). No backend route found. */
export const irrigationAPI = {
  getSchedules: (params) => api.get('/irrigation/schedules', { params }),
  createSchedule: (data) => api.post('/irrigation/schedules', data),
  updateSchedule: (id, data) => api.put(`/irrigation/schedules/${id}`, data),
  deleteSchedule: (id) => api.delete(`/irrigation/schedules/${id}`),
  getWaterSources: (params) => api.get('/irrigation/water-sources', { params }),
  createWaterSource: (data) => api.post('/irrigation/water-sources', data),
  getLogs: (params) => api.get('/irrigation/logs', { params }),
  recordLog: (data) => api.post('/irrigation/logs', data),
}

/** M121 — Dairy Management (Livestock domain). Real backend as of 2026-08-10:
 *  backend/src/routes/dairyRoutes.js + dairyService.js, tables added in
 *  migration 065_dairy_management_schema.sql. */
export const dairyAPI = {
  getAnimals: (params) => api.get('/dairy/animals', { params }),
  createAnimal: (data) => api.post('/dairy/animals', data),
  updateAnimal: (id, data) => api.put(`/dairy/animals/${id}`, data),
  deleteAnimal: (id) => api.delete(`/dairy/animals/${id}`),
  getMilkRecords: (params) => api.get('/dairy/milk-records', { params }),
  recordMilk: (data) => api.post('/dairy/milk-records', data),
  // Real trailing-7-day vs prior-7-day milk-yield comparison per animal.
  getMilkYieldTrends: () => api.get('/dairy/milk-yield-trends'),
  // Vaccination-due + breeding/calving-due alerts (real dates, assumed intervals).
  getHealthAlerts: () => api.get('/dairy/health-alerts'),
}

/** M112 — Fertilizer Inventory (Input Supply domain). Real backend as of
 *  2026-08-10: backend/src/routes/fertilizerRoutes.js +
 *  fertilizerInventoryService.js, stock table added in migration
 *  066_fertilizer_inventory_schema.sql. `issueStock` now also writes a real
 *  row into `agri_input_issues` (migration 056) — the table api.js used to
 *  note had no readers/writers. */
export const fertilizerAPI = {
  getInventory: (params) => api.get('/fertilizer/inventory', { params }),
  createInventoryItem: (data) => api.post('/fertilizer/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/fertilizer/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/fertilizer/inventory/${id}`),
  getIssues: (params) => api.get('/fertilizer/issues', { params }),
  issueStock: (id, data) => api.post(`/fertilizer/inventory/${id}/issue`, data),
  // Real stock + real consumption (agri_input_issues) -> computed reorder-point alerts.
  getReorderAlerts: () => api.get('/fertilizer/inventory/reorder-alerts'),
}

/** M041 — Village Registry (Community domain). No backend route found. */
export const villageAPI = {
  getVillages: (params) => api.get('/villages', { params }),
  getVillage: (id) => api.get(`/villages/${id}`),
  createVillage: (data) => api.post('/villages', data),
  updateVillage: (id, data) => api.put(`/villages/${id}`, data),
  deleteVillage: (id) => api.delete(`/villages/${id}`),
}

/** M024 — Farmer KYC (Farmer domain). farmersAPI covers profile/FDI/certs but
 *  no route handles a KYC verification workflow. */
export const kycAPI = {
  getApplications: (params) => api.get('/farmer-kyc/applications', { params }),
  getApplication: (id) => api.get(`/farmer-kyc/applications/${id}`),
  submitApplication: (data) => api.post('/farmer-kyc/applications', data),
  verifyApplication: (id, data) => api.put(`/farmer-kyc/applications/${id}/verify`, data),
  rejectApplication: (id, data) => api.put(`/farmer-kyc/applications/${id}/reject`, data),
}

/** M141 — Orchard Management (Horticulture domain). No backend route found. */
export const orchardAPI = {
  getOrchards: (params) => api.get('/orchards', { params }),
  createOrchard: (data) => api.post('/orchards', data),
  updateOrchard: (id, data) => api.put(`/orchards/${id}`, data),
  deleteOrchard: (id) => api.delete(`/orchards/${id}`),
  getHarvestLog: (orchardId) => api.get(`/orchards/${orchardId}/harvest-log`),
  recordHarvest: (orchardId, data) => api.post(`/orchards/${orchardId}/harvest-log`, data),
}

/** M098 — Farm Costing (Operations domain). economicAPI.costBreakup covers
 *  corridor-level cost models; no route handles per-farm cost records. */
export const farmCostingAPI = {
  getRecords: (params) => api.get('/farm-costing/records', { params }),
  createRecord: (data) => api.post('/farm-costing/records', data),
  updateRecord: (id, data) => api.put(`/farm-costing/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/farm-costing/records/${id}`),
  getSummary: (params) => api.get('/farm-costing/summary', { params }),
}

/** M132 — Pond Management (Fisheries domain). No backend route found. */
export const pondAPI = {
  getPonds: (params) => api.get('/ponds', { params }),
  createPond: (data) => api.post('/ponds', data),
  updatePond: (id, data) => api.put(`/ponds/${id}`, data),
  deletePond: (id) => api.delete(`/ponds/${id}`),
  getWaterQualityLogs: (pondId) => api.get(`/ponds/${pondId}/water-quality-logs`),
  recordWaterQuality: (pondId, data) => api.post(`/ponds/${pondId}/water-quality-logs`, data),
  getHarvestLog: (pondId) => api.get(`/ponds/${pondId}/harvest-log`),
  recordHarvest: (pondId, data) => api.post(`/ponds/${pondId}/harvest-log`, data),
}

/** M101 — Tractor Management (Machinery domain). A `machinery_access` table
 *  exists (migration 041_rural_life_os_schema.sql) but no route reads or
 *  writes it. */
export const machineryAPI = {
  getTractors: (params) => api.get('/machinery/tractors', { params }),
  createTractor: (data) => api.post('/machinery/tractors', data),
  updateTractor: (id, data) => api.put(`/machinery/tractors/${id}`, data),
  deleteTractor: (id) => api.delete(`/machinery/tractors/${id}`),
  getBookings: (params) => api.get('/machinery/bookings', { params }),
  createBooking: (data) => api.post('/machinery/bookings', data),
  updateBooking: (id, data) => api.put(`/machinery/bookings/${id}`, data),
}

/** M013 — Authorization (Identity domain). authService.getUserPermissions()
 *  hardcodes a role→permission map server-side with no route to read, edit,
 *  or audit it, and no route to change a user's role after signup. */
export const authorizationAPI = {
  getRoles: () => api.get('/authorization/roles'),
  getRolePermissions: (role) => api.get(`/authorization/roles/${role}/permissions`),
  updateRolePermissions: (role, data) => api.put(`/authorization/roles/${role}/permissions`, data),
  getUsers: (params) => api.get('/authorization/users', { params }),
  updateUserRole: (userId, data) => api.put(`/authorization/users/${userId}/role`, data),
  getAuditLog: (params) => api.get('/authorization/audit-log', { params }),
}

/** M083 — Climate Advisory (Climate domain). Real backend as of 2026-08-10:
 *  backend/src/routes/climateAdvisoryRoutes.js + weatherService.js, CRUD over
 *  the `agromet_advisories` table (migration 057). weatherAPI.advisoryTriggers
 *  surfaces real threshold-breach candidates a user can turn into an advisory. */
export const climateAdvisoryAPI = {
  getAdvisories: (params) => api.get('/climate-advisory/advisories', { params }),
  getAdvisory: (id) => api.get(`/climate-advisory/advisories/${id}`),
  createAdvisory: (data) => api.post('/climate-advisory/advisories', data),
  updateAdvisory: (id, data) => api.put(`/climate-advisory/advisories/${id}`, data),
}

/** M046 — SHG Management (Community domain, self-help groups). No backend
 *  route found. */
export const shgAPI = {
  getGroups: (params) => api.get('/shg/groups', { params }),
  getGroup: (id) => api.get(`/shg/groups/${id}`),
  createGroup: (data) => api.post('/shg/groups', data),
  updateGroup: (id, data) => api.put(`/shg/groups/${id}`, data),
  getMembers: (groupId) => api.get(`/shg/groups/${groupId}/members`),
  addMember: (groupId, data) => api.post(`/shg/groups/${groupId}/members`, data),
  getSavings: (groupId, params) => api.get(`/shg/groups/${groupId}/savings`, { params }),
  recordSaving: (groupId, data) => api.post(`/shg/groups/${groupId}/savings`, data),
}

// ---------------------------------------------------------------------------
// Modules built 2026-08-07, second batch, for 20 confirmed STUB-ONLY
// frontends (Farmer: M022/M023/M025/M026/M029, Crop: M062-M066/M068, Land:
// M033/M035-M039, FPO: M051/M052/M055/M057/M059). None of these had a
// dedicated backend route as of this change — the shapes below follow the
// same REST convention as every namespace above (/api/v1/<resource>). M032
// (Land Ownership) is not represented here: that capability is already
// fully covered by landAPI + LandRegistryPage.jsx (owner_name,
// ownership_type, title_status per parcel), so M032 points there instead of
// duplicating it. See each module's README.md for the specific gap.
// ---------------------------------------------------------------------------

/** M022 — Farmer Profile (Farmer domain). farmersAPI covers read-only lookup
 *  (getFarmer/getFarmers); no route handles profile create/update/delete. */
export const farmerProfileAPI = {
  getProfiles: (params) => api.get('/farmer-profiles', { params }),
  getProfile: (id) => api.get(`/farmer-profiles/${id}`),
  createProfile: (data) => api.post('/farmer-profiles', data),
  updateProfile: (id, data) => api.put(`/farmer-profiles/${id}`, data),
  deleteProfile: (id) => api.delete(`/farmer-profiles/${id}`),
}

/** M023 — Farmer Family (Farmer domain). No backend route found for
 *  household/dependent records. */
export const farmerFamilyAPI = {
  getMembers: (params) => api.get('/farmer-family/members', { params }),
  createMember: (data) => api.post('/farmer-family/members', data),
  updateMember: (id, data) => api.put(`/farmer-family/members/${id}`, data),
  deleteMember: (id) => api.delete(`/farmer-family/members/${id}`),
}

/** M025 — Farmer Verification (Farmer domain). Distinct from M024 Farmer KYC
 *  (kycAPI, document identity verification) — this tracks field/peer
 *  verification of farmer records (land, cropping, membership claims). */
export const farmerVerificationAPI = {
  getRequests: (params) => api.get('/farmer-verification/requests', { params }),
  getRequest: (id) => api.get(`/farmer-verification/requests/${id}`),
  submitRequest: (data) => api.post('/farmer-verification/requests', data),
  verifyRequest: (id, data) => api.put(`/farmer-verification/requests/${id}/verify`, data),
  rejectRequest: (id, data) => api.put(`/farmer-verification/requests/${id}/reject`, data),
}

/** M026 — Farmer Skill Management (Farmer domain). farmerTrainingService.js
 *  exists server-side but has no mounted route; no CRUD for a farmer's
 *  skill/training records exists. */
export const farmerSkillAPI = {
  getSkills: (params) => api.get('/farmer-skills', { params }),
  addSkill: (data) => api.post('/farmer-skills', data),
  updateSkill: (id, data) => api.put(`/farmer-skills/${id}`, data),
  deleteSkill: (id) => api.delete(`/farmer-skills/${id}`),
}

/** M029 — Farmer Health & Welfare (Farmer domain). No backend route found. */
export const farmerWelfareAPI = {
  getRecords: (params) => api.get('/farmer-welfare/records', { params }),
  createRecord: (data) => api.post('/farmer-welfare/records', data),
  updateRecord: (id, data) => api.put(`/farmer-welfare/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/farmer-welfare/records/${id}`),
}

/** M062 — Crop Calendar (Crop domain). cropPlanningService.js covers
 *  farmer-specific crop plans; no route handles a reusable sowing/harvest
 *  calendar by crop and season. */
export const cropCalendarAPI = {
  getEntries: (params) => api.get('/crop-calendar/entries', { params }),
  createEntry: (data) => api.post('/crop-calendar/entries', data),
  updateEntry: (id, data) => api.put(`/crop-calendar/entries/${id}`, data),
  deleteEntry: (id) => api.delete(`/crop-calendar/entries/${id}`),
}

/** M069 — Harvest Planning (Crop domain). Backend module M069 auto-mounts
 *  at /api/v1/modules/m069 (backend/src/index.js generatedModuleNames
 *  loop), backed by the crop_m069_items table, with plain CRUD at the
 *  module root ('/', '/:id'). Unlike the sibling M022/M055/M056 modules,
 *  M069's controller returns `data` as the flat items array (not
 *  {items, pagination}) so it plugs straight into ResourceManager. */
export const harvestPlanningAPI = {
  getPlans: (params) => api.get('/modules/m069', { params }),
  createPlan: (data) => api.post('/modules/m069', data),
  updatePlan: (id, data) => api.put(`/modules/m069/${id}`, data),
  deletePlan: (id) => api.delete(`/modules/m069/${id}`),
}

/** M063 — Crop Registration (Crop domain). No backend route found for a
 *  crop master/reference registry. */
export const cropRegistrationAPI = {
  getCrops: (params) => api.get('/crop-registration/crops', { params }),
  getCrop: (id) => api.get(`/crop-registration/crops/${id}`),
  registerCrop: (data) => api.post('/crop-registration/crops', data),
  updateCrop: (id, data) => api.put(`/crop-registration/crops/${id}`, data),
  deleteCrop: (id) => api.delete(`/crop-registration/crops/${id}`),
}

/** M064 — Crop Variety Management (Crop domain). No backend route found. */
export const cropVarietyAPI = {
  getVarieties: (params) => api.get('/crop-varieties', { params }),
  createVariety: (data) => api.post('/crop-varieties', data),
  updateVariety: (id, data) => api.put(`/crop-varieties/${id}`, data),
  deleteVariety: (id) => api.delete(`/crop-varieties/${id}`),
}

/** M065 — Seed Planning (Crop domain). No backend route found. */
export const seedPlanningAPI = {
  getPlans: (params) => api.get('/seed-planning/plans', { params }),
  createPlan: (data) => api.post('/seed-planning/plans', data),
  updatePlan: (id, data) => api.put(`/seed-planning/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/seed-planning/plans/${id}`),
}

/** M066 — Nursery Management (Crop domain). No backend route found. */
export const nurseryAPI = {
  getNurseries: (params) => api.get('/nurseries', { params }),
  createNursery: (data) => api.post('/nurseries', data),
  updateNursery: (id, data) => api.put(`/nurseries/${id}`, data),
  deleteNursery: (id) => api.delete(`/nurseries/${id}`),
}

/** M068 — Crop Monitoring (Crop domain). No backend route found for field
 *  observation/scouting records. */
export const cropMonitoringAPI = {
  getObservations: (params) => api.get('/crop-monitoring/observations', { params }),
  createObservation: (data) => api.post('/crop-monitoring/observations', data),
  updateObservation: (id, data) => api.put(`/crop-monitoring/observations/${id}`, data),
  deleteObservation: (id) => api.delete(`/crop-monitoring/observations/${id}`),
}

/** M033 — Land Lease Management (Land domain). landAPI/LandRegistryPage
 *  tracks ownership_type = "Leased" per parcel but no lease term, rent or
 *  lessor/lessee record. No backend route found. */
export const landLeaseAPI = {
  getLeases: (params) => api.get('/land-leases', { params }),
  createLease: (data) => api.post('/land-leases', data),
  updateLease: (id, data) => api.put(`/land-leases/${id}`, data),
  deleteLease: (id) => api.delete(`/land-leases/${id}`),
}

/** M035 — GIS Land Mapping (Land domain). No backend route found for parcel
 *  geo-coordinates/polygon boundaries. */
export const gisLandMappingAPI = {
  getMappings: (params) => api.get('/gis-land-mapping/parcels', { params }),
  createMapping: (data) => api.post('/gis-land-mapping/parcels', data),
  updateMapping: (id, data) => api.put(`/gis-land-mapping/parcels/${id}`, data),
  deleteMapping: (id) => api.delete(`/gis-land-mapping/parcels/${id}`),
}

/** M036 — Soil Mapping (Land domain). soilTestingService.js covers lab
 *  sample intake/results for an individual farmer; no route handles a
 *  zone-level soil map (type, pH, nutrient index by parcel/zone). */
export const soilMappingAPI = {
  getZones: (params) => api.get('/soil-mapping/zones', { params }),
  createZone: (data) => api.post('/soil-mapping/zones', data),
  updateZone: (id, data) => api.put(`/soil-mapping/zones/${id}`, data),
  deleteZone: (id) => api.delete(`/soil-mapping/zones/${id}`),
}

/** M037 — Water Resource Mapping (Land domain). irrigationAPI (M075) tracks
 *  water sources used for scheduling; this is the registry/mapping view of
 *  water bodies (wells, canals, ponds) by location — no backend route found
 *  for that registry. */
export const waterResourceMappingAPI = {
  getResources: (params) => api.get('/water-resource-mapping/resources', { params }),
  createResource: (data) => api.post('/water-resource-mapping/resources', data),
  updateResource: (id, data) => api.put(`/water-resource-mapping/resources/${id}`, data),
  deleteResource: (id) => api.delete(`/water-resource-mapping/resources/${id}`),
}

/** M038 — Geo Boundary Management (Land domain). No backend route found for
 *  administrative/village boundary records. */
export const geoBoundaryAPI = {
  getBoundaries: (params) => api.get('/geo-boundaries', { params }),
  createBoundary: (data) => api.post('/geo-boundaries', data),
  updateBoundary: (id, data) => api.put(`/geo-boundaries/${id}`, data),
  deleteBoundary: (id) => api.delete(`/geo-boundaries/${id}`),
}

/** M039 — Survey Management (Land domain). LandRegistryPage stores a free-
 *  text survey_number per parcel; no route manages the survey workflow
 *  itself (surveyor assignment, scheduled date, completion status). */
export const surveyManagementAPI = {
  getSurveys: (params) => api.get('/land-surveys', { params }),
  createSurvey: (data) => api.post('/land-surveys', data),
  updateSurvey: (id, data) => api.put(`/land-surveys/${id}`, data),
  deleteSurvey: (id) => api.delete(`/land-surveys/${id}`),
}

/** M051 — FPO Registration (FPO domain). No backend route found for FPO
 *  legal-entity registration records (distinct from fpoAPI.getStats). */
export const fpoRegistrationAPI = {
  getRegistrations: (params) => api.get('/fpo-registration/registrations', { params }),
  createRegistration: (data) => api.post('/fpo-registration/registrations', data),
  updateRegistration: (id, data) => api.put(`/fpo-registration/registrations/${id}`, data),
  deleteRegistration: (id) => api.delete(`/fpo-registration/registrations/${id}`),
}

/** M052 — FPO Governance (FPO domain). No backend route found for board
 *  meetings/resolutions. */
export const fpoGovernanceAPI = {
  getMeetings: (params) => api.get('/fpo-governance/meetings', { params }),
  createMeeting: (data) => api.post('/fpo-governance/meetings', data),
  updateMeeting: (id, data) => api.put(`/fpo-governance/meetings/${id}`, data),
  deleteMeeting: (id) => api.delete(`/fpo-governance/meetings/${id}`),
}

/** M055 — FPO Procurement (FPO domain). Distinct from
 *  FPODashboardPage's "Collective Orders" tab (member buy-side bulk
 *  purchasing) — this is FPO-side input/produce procurement from members
 *  and vendors. Backend module M055 auto-mounts at /api/v1/modules/m055
 *  (backend/src/index.js generatedModuleNames loop), with routes.js
 *  exposing plain CRUD at the module root ('/', '/:id') — not under
 *  '/fpo-procurement'. */
export const fpoProcurementAPI = {
  getOrders: (params) => api.get('/modules/m055', { params }),
  createOrder: (data) => api.post('/modules/m055', data),
  updateOrder: (id, data) => api.put(`/modules/m055/${id}`, data),
  deleteOrder: (id) => api.delete(`/modules/m055/${id}`),
}

/** M056 — FPO Inventory (FPO domain). Collective inventory held by the
 *  FPO (produce/inputs in warehouses, cold storage, packhouses). Backed by
 *  the fpo_inventory_items table via backend/src/modules/M056. Auto-mounts
 *  at /api/v1/modules/m056 the same way M055 does, with plain CRUD at the
 *  module root. Not to be confused with fpoComplianceAPI's "M056" doc
 *  comment below (a stale label for a different, tax-focused module). */
export const fpoInventoryAPI = {
  getItems: (params) => api.get('/modules/m056', { params }),
  createItem: (data) => api.post('/modules/m056', data),
  updateItem: (id, data) => api.put(`/modules/m056/${id}`, data),
  deleteItem: (id) => api.delete(`/modules/m056/${id}`),
}

/** M057 — FPO Marketing (FPO domain). No backend route found for
 *  campaign/market-linkage records. */
export const fpoMarketingAPI = {
  getCampaigns: (params) => api.get('/fpo-marketing/campaigns', { params }),
  createCampaign: (data) => api.post('/fpo-marketing/campaigns', data),
  updateCampaign: (id, data) => api.put(`/fpo-marketing/campaigns/${id}`, data),
  deleteCampaign: (id) => api.delete(`/fpo-marketing/campaigns/${id}`),
}

/** M059 — FPO Compliance (FPO domain). complianceAPI (M056) covers
 *  TDS/e-invoice/GSTR filings; no route handles FPO statutory filings
 *  (society/company registrar returns, audit reports, licenses). */
export const fpoComplianceAPI = {
  getFilings: (params) => api.get('/fpo-compliance/filings', { params }),
  createFiling: (data) => api.post('/fpo-compliance/filings', data),
  updateFiling: (id, data) => api.put(`/fpo-compliance/filings/${id}`, data),
  deleteFiling: (id) => api.delete(`/fpo-compliance/filings/${id}`),
}

// ---------------------------------------------------------------------------
// V44 prototype reconciliation (2026-08-08, docs/V44_ADDITIONAL_FEATURES_
// EXTRACTION.md) — scheme registry, MAP-protected contract offers, and mill
// circuit / FPO ledger. Backed by governmentSchemeService.js,
// institutionalProcurementService.js and the new millCircuitService.js /
// migration 9995_scheme_verification_map_protection.sql.
// ---------------------------------------------------------------------------

/** Verified government scheme registry (v44 feature 2) — distinct from
 *  governmentAPI above, which covers the AI-matched discovery endpoints. */
export const schemeRegistryAPI = {
  list: (params) => api.get('/government/schemes/registry', { params }),
  get: (code) => api.get(`/government/schemes/registry/${code}`),
  update: (code, data) => api.put(`/government/schemes/registry/${code}`, data),
  getExpiring: (days) => api.get('/government/schemes/registry/expiring', { params: { days } }),
  checkEligibility: (params) => api.get('/government/schemes/checker', { params }),
}

/** MAP-protected contract offers (v44 feature 7). The farmer's floor price
 *  is never returned by any of these — see institutionalProcurementService.js. */
export const contractOfferAPI = {
  getOffers: (params) => api.get('/institutional-procurement/contract-offers', { params }),
  createOffer: (data) => api.post('/institutional-procurement/contract-offers', data),
  respondToOffer: (id, status) => api.put(`/institutional-procurement/contract-offers/${id}`, { status }),
}

/** Mill Circuit booking (v44 feature 3). */
export const millCircuitAPI = {
  getSlots: (params) => api.get('/mill-fpo/mill-circuit/slots', { params }),
  createSlot: (data) => api.post('/mill-fpo/mill-circuit/slots', data),
  getBookings: (params) => api.get('/mill-fpo/mill-circuit/bookings', { params }),
  createBooking: (data) => api.post('/mill-fpo/mill-circuit/bookings', data),
}

/** FPO Ledger (v44 feature 3) — farmer-owned running ledger. */
export const fpoLedgerAPI = {
  getEntries: (params) => api.get('/mill-fpo/fpo-ledger/entries', { params }),
  createEntry: (data) => api.post('/mill-fpo/fpo-ledger/entries', data),
}

// ---------------------------------------------------------------------------
// Third batch (2026-08-08): Input Supply, Livestock, Community, Soil and
// Water domain modules. Checked against backend/src/routes and services for
// real support first — governanceModule.js has genuine routes for
// panchayats/cooperatives (used below); everything else in this batch has
// no matching backend route, so these are built against a conventional
// REST shape and noted as a gap, same convention as the second batch.
// ---------------------------------------------------------------------------

/** M113 — Biofertilizer Management (Input Supply). No backend route found. */
export const biofertilizerAPI = {
  getItems: (params) => api.get('/biofertilizers', { params }),
  createItem: (data) => api.post('/biofertilizers', data),
  updateItem: (id, data) => api.put(`/biofertilizers/${id}`, data),
  deleteItem: (id) => api.delete(`/biofertilizers/${id}`),
}

/** M114 — Pesticide Inventory (Input Supply). No backend route found. */
export const pesticideInventoryAPI = {
  getItems: (params) => api.get('/pesticide-inventory', { params }),
  createItem: (data) => api.post('/pesticide-inventory', data),
  updateItem: (id, data) => api.put(`/pesticide-inventory/${id}`, data),
  deleteItem: (id) => api.delete(`/pesticide-inventory/${id}`),
}

/** M115 — Bio-Pesticide Management (Input Supply). No backend route found. */
export const bioPesticideAPI = {
  getItems: (params) => api.get('/bio-pesticides', { params }),
  createItem: (data) => api.post('/bio-pesticides', data),
  updateItem: (id, data) => api.put(`/bio-pesticides/${id}`, data),
  deleteItem: (id) => api.delete(`/bio-pesticides/${id}`),
}

/** M116 — Micronutrient Management (Input Supply). No backend route found. */
export const micronutrientAPI = {
  getItems: (params) => api.get('/micronutrients', { params }),
  createItem: (data) => api.post('/micronutrients', data),
  updateItem: (id, data) => api.put(`/micronutrients/${id}`, data),
  deleteItem: (id) => api.delete(`/micronutrients/${id}`),
}

/** M117 — Organic Input Management (Input Supply). No backend route found. */
export const organicInputAPI = {
  getItems: (params) => api.get('/organic-inputs', { params }),
  createItem: (data) => api.post('/organic-inputs', data),
  updateItem: (id, data) => api.put(`/organic-inputs/${id}`, data),
  deleteItem: (id) => api.delete(`/organic-inputs/${id}`),
}

/** M118 — Input Procurement (Input Supply). vendorRoutes.js covers
 *  corporate/logistics/processor/retailer vendor profiles, not farm-input
 *  purchase orders — no matching route found. */
export const inputProcurementAPI = {
  getOrders: (params) => api.get('/input-procurement/orders', { params }),
  createOrder: (data) => api.post('/input-procurement/orders', data),
  updateOrder: (id, data) => api.put(`/input-procurement/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/input-procurement/orders/${id}`),
}

/** M119 — Input Distribution (Input Supply). No backend route found for
 *  outbound distribution to farmers/dealers. */
export const inputDistributionAPI = {
  getRecords: (params) => api.get('/input-distribution/records', { params }),
  createRecord: (data) => api.post('/input-distribution/records', data),
  updateRecord: (id, data) => api.put(`/input-distribution/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/input-distribution/records/${id}`),
}

/** M120 — Input Traceability (Input Supply). No backend route found. */
export const inputTraceabilityAPI = {
  getRecords: (params) => api.get('/input-traceability/records', { params }),
  createRecord: (data) => api.post('/input-traceability/records', data),
  updateRecord: (id, data) => api.put(`/input-traceability/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/input-traceability/records/${id}`),
}

/** M122 — Cattle Registry (Livestock). No backend route found. */
export const cattleRegistryAPI = {
  getAnimals: (params) => api.get('/cattle-registry/animals', { params }),
  createAnimal: (data) => api.post('/cattle-registry/animals', data),
  updateAnimal: (id, data) => api.put(`/cattle-registry/animals/${id}`, data),
  deleteAnimal: (id) => api.delete(`/cattle-registry/animals/${id}`),
}

/** M123 — Poultry Management (Livestock). No backend route found. */
// Fixed 2026-08-24: was calling nonexistent /poultry/batches. The real
// backend (poultryService.js/poultryRoutes.js, migration 067) is a flock
// registry at /poultry/flocks - see LivestockManagementPage.jsx's 'poultry'
// tab, rewired to match its real field names (flock_code/flock_type/etc).
export const poultryManagementAPI = {
  getBatches: (params) => api.get('/poultry/flocks', { params }),
  createBatch: (data) => api.post('/poultry/flocks', data),
  updateBatch: (id, data) => api.put(`/poultry/flocks/${id}`, data),
  deleteBatch: (id) => api.delete(`/poultry/flocks/${id}`),
}

/** M124 — Goat Farming Management (Livestock). No backend route found. */
// Fixed 2026-08-24: was calling nonexistent /goat-farming/animals. The real
// backend (goatService.js/goatRoutes.js, migration 068) is a herd registry
// at /goat/herd - see LivestockManagementPage.jsx's 'goat' tab, rewired to
// match its real field names (tag_id/sex/dob/etc).
export const goatFarmingAPI = {
  getAnimals: (params) => api.get('/goat/herd', { params }),
  createAnimal: (data) => api.post('/goat/herd', data),
  updateAnimal: (id, data) => api.put(`/goat/herd/${id}`, data),
  deleteAnimal: (id) => api.delete(`/goat/herd/${id}`),
}

/** M125 — Sheep Farming Management (Livestock). ABSENT — no trace of this
 *  capability anywhere in the codebase. */
// Fixed 2026-08-24: was calling nonexistent /sheep-farming/animals (and the
// page comment's "catalogued ABSENT" claim was wrong). The real backend
// (sheepService.js/sheepRoutes.js, migration 069) is a flock registry at
// /sheep/flock - see LivestockManagementPage.jsx's 'sheep' tab, rewired to
// match its real field names (tag_id/sex/dob/wool_type/etc).
export const sheepFarmingAPI = {
  getAnimals: (params) => api.get('/sheep/flock', { params }),
  createAnimal: (data) => api.post('/sheep/flock', data),
  updateAnimal: (id, data) => api.put(`/sheep/flock/${id}`, data),
  deleteAnimal: (id) => api.delete(`/sheep/flock/${id}`),
}

/** M126 — Pig Farming Management (Livestock). No backend route found. */
// Fixed 2026-08-24: was calling nonexistent /pig-farming/animals. The real
// backend (pigService.js/pigRoutes.js, migration 070) is a herd registry
// at /pig/herd - see LivestockManagementPage.jsx's 'pig' tab, rewired to
// match its real field names (tag_id/sex/dob/pen_id/etc).
export const pigFarmingAPI = {
  getAnimals: (params) => api.get('/pig/herd', { params }),
  createAnimal: (data) => api.post('/pig/herd', data),
  updateAnimal: (id, data) => api.put(`/pig/herd/${id}`, data),
  deleteAnimal: (id) => api.delete(`/pig/herd/${id}`),
}

/** Livestock feed records — no backend route exists yet (LivestockManagementPage.jsx's
 *  "feed" tab notes this explicitly), but the frontend referenced this group without
 *  it ever being defined, throwing ReferenceError the moment that tab rendered. */
export const feedManagementAPI = {
  getRecords: (params) => api.get('/livestock-feed/records', { params }),
  createRecord: (data) => api.post('/livestock-feed/records', data),
  updateRecord: (id, data) => api.put(`/livestock-feed/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/livestock-feed/records/${id}`),
}

/** Yield management — lots, fare buckets, markdown, booking curve (059).
 *  Served by the existing /pricing routes; dynamicPricingService owns the logic. */
export const yieldManagementAPI = {
  getRecords: (params) => api.get('/pricing/records', { params }),
  createRecord: (data) => api.post('/pricing/records', data),
  updateRecord: (id, data) => api.put(`/pricing/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/pricing/records/${id}`),
}

/** M129 — Breeding Management (Livestock). No backend route found. */
// breedingManagementAPI removed 2026-08-24: the generic cross-species
// "breeding/records" tab it backed was retired (see
// LivestockManagementPage.jsx) - goat/sheep/pig already track breeding for
// real via their own herd/flock endpoints, and cattle/poultry have no
// breeding backend at all. A generic table here would have forked from the
// real per-species data for 3 of 5 species.

/** M130 — Livestock Analytics (Livestock). No backend route found. */
export const livestockAnalyticsAPI = {
  getRecords: (params) => api.get('/livestock-analytics/records', { params }),
  createRecord: (data) => api.post('/livestock-analytics/records', data),
  updateRecord: (id, data) => api.put(`/livestock-analytics/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/livestock-analytics/records/${id}`),
}

/** M042 — Panchayat Management (Community). Real backend route:
 *  governanceModule.js POST/GET /governance/panchayats (create is
 *  admin-only). No update/delete route exists yet, so this tab is
 *  create + list only. */
export const panchayatAPI = {
  getPanchayats: (params) => api.get('/governance/panchayats', { params }),
  createPanchayat: (data) => api.post('/governance/panchayats', data),
}

/** M043 — Block Management (Community). No backend route found. */
export const blockManagementAPI = {
  getBlocks: (params) => api.get('/blocks', { params }),
  createBlock: (data) => api.post('/blocks', data),
  updateBlock: (id, data) => api.put(`/blocks/${id}`, data),
  deleteBlock: (id) => api.delete(`/blocks/${id}`),
}

/** M044 — District Management (Community). No backend route found. */
export const districtManagementAPI = {
  getDistricts: (params) => api.get('/districts', { params }),
  createDistrict: (data) => api.post('/districts', data),
  updateDistrict: (id, data) => api.put(`/districts/${id}`, data),
  deleteDistrict: (id) => api.delete(`/districts/${id}`),
}

/** M045 — State Management (Community). No backend route found. */
export const stateManagementAPI = {
  getStates: (params) => api.get('/states', { params }),
  createState: (data) => api.post('/states', data),
  updateState: (id, data) => api.put(`/states/${id}`, data),
  deleteState: (id) => api.delete(`/states/${id}`),
}

/** M047 — Cooperative Management (Community). Real backend route:
 *  governanceModule.js POST/GET /governance/cooperatives (create is
 *  admin-only). No update/delete route exists yet, so this tab is
 *  create + list only. */
export const cooperativeAPI = {
  getCooperatives: (params) => api.get('/governance/cooperatives', { params }),
  createCooperative: (data) => api.post('/governance/cooperatives', data),
}

/** M048 — Producer Group Management (Community). No backend route found. */
export const producerGroupAPI = {
  getGroups: (params) => api.get('/producer-groups', { params }),
  createGroup: (data) => api.post('/producer-groups', data),
  updateGroup: (id, data) => api.put(`/producer-groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/producer-groups/${id}`),
}

/** M049 — Community Asset Management (Community). No backend route found. */
export const communityAssetAPI = {
  getAssets: (params) => api.get('/community-assets', { params }),
  createAsset: (data) => api.post('/community-assets', data),
  updateAsset: (id, data) => api.put(`/community-assets/${id}`, data),
  deleteAsset: (id) => api.delete(`/community-assets/${id}`),
}

/** M050 — Rural Development Management (Community). ABSENT — no trace of
 *  this capability anywhere in the codebase. */
export const ruralDevelopmentAPI = {
  getProjects: (params) => api.get('/rural-development/projects', { params }),
  createProject: (data) => api.post('/rural-development/projects', data),
  updateProject: (id, data) => api.put(`/rural-development/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/rural-development/projects/${id}`),
}

/** M071 — Soil Health Management (Soil). Distinct from soilTestingService.js
 *  (M072, individual lab test results) — this is a plot/zone-level health
 *  card (organic matter, pH trend, recommendations). No backend route
 *  found. */
export const soilHealthAPI = {
  getCards: (params) => api.get('/soil-health/cards', { params }),
  createCard: (data) => api.post('/soil-health/cards', data),
  updateCard: (id, data) => api.put(`/soil-health/cards/${id}`, data),
  deleteCard: (id) => api.delete(`/soil-health/cards/${id}`),
}

/** M073 — Nutrient Management (Soil). No backend route found. */
export const nutrientManagementAPI = {
  getPlans: (params) => api.get('/nutrient-management/plans', { params }),
  createPlan: (data) => api.post('/nutrient-management/plans', data),
  updatePlan: (id, data) => api.put(`/nutrient-management/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/nutrient-management/plans/${id}`),
}

/** M074 — Fertility Management (Soil). No backend route found. */
export const fertilityManagementAPI = {
  getRecords: (params) => api.get('/fertility-management/records', { params }),
  createRecord: (data) => api.post('/fertility-management/records', data),
  updateRecord: (id, data) => api.put(`/fertility-management/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/fertility-management/records/${id}`),
}

/** M076 — Water Budgeting (Water). No backend route found. */
export const waterBudgetingAPI = {
  getBudgets: (params) => api.get('/water-budgeting/budgets', { params }),
  createBudget: (data) => api.post('/water-budgeting/budgets', data),
  updateBudget: (id, data) => api.put(`/water-budgeting/budgets/${id}`, data),
  deleteBudget: (id) => api.delete(`/water-budgeting/budgets/${id}`),
}

/** M077 — Water Quality Monitoring (Water). No backend route found. */
export const waterQualityAPI = {
  getReadings: (params) => api.get('/water-quality/readings', { params }),
  createReading: (data) => api.post('/water-quality/readings', data),
  updateReading: (id, data) => api.put(`/water-quality/readings/${id}`, data),
  deleteReading: (id) => api.delete(`/water-quality/readings/${id}`),
}

/** M078 — Rainwater Harvesting (Water). No backend route found. */
export const rainwaterHarvestingAPI = {
  getStructures: (params) => api.get('/rainwater-harvesting/structures', { params }),
  createStructure: (data) => api.post('/rainwater-harvesting/structures', data),
  updateStructure: (id, data) => api.put(`/rainwater-harvesting/structures/${id}`, data),
  deleteStructure: (id) => api.delete(`/rainwater-harvesting/structures/${id}`),
}

/** M079 — Watershed Management (Water). No backend route found. */
export const watershedManagementAPI = {
  getWatersheds: (params) => api.get('/watersheds', { params }),
  createWatershed: (data) => api.post('/watersheds', data),
  updateWatershed: (id, data) => api.put(`/watersheds/${id}`, data),
  deleteWatershed: (id) => api.delete(`/watersheds/${id}`),
}

/** M080 — Water Analytics (Water). No backend route found. */
export const waterAnalyticsAPI = {
  getRecords: (params) => api.get('/water-analytics/records', { params }),
  createRecord: (data) => api.post('/water-analytics/records', data),
  updateRecord: (id, data) => api.put(`/water-analytics/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/water-analytics/records/${id}`),
}

// ---------------------------------------------------------------------------
// Batch 4 (2026-08-08): Climate, Operations, Machinery, Horticulture,
// Fisheries, Identity, Platform Foundation. See pages/ClimateMonitoringPage.jsx,
// OperationsManagementPage.jsx, MachineryManagementPage.jsx,
// HorticultureManagementPage.jsx, FisheriesManagementPage.jsx,
// IdentityManagementPage.jsx, PlatformFoundationPage.jsx.
// ---------------------------------------------------------------------------

/** M085 — Drought Monitoring (Climate). No backend route found. */
export const droughtMonitoringAPI = {
  getRecords: (params) => api.get('/drought-monitoring', { params }),
  createRecord: (data) => api.post('/drought-monitoring', data),
  updateRecord: (id, data) => api.put(`/drought-monitoring/${id}`, data),
  deleteRecord: (id) => api.delete(`/drought-monitoring/${id}`),
}

/** M086 — Flood Monitoring (Climate). No backend route found. */
export const floodMonitoringAPI = {
  getRecords: (params) => api.get('/flood-monitoring', { params }),
  createRecord: (data) => api.post('/flood-monitoring', data),
  updateRecord: (id, data) => api.put(`/flood-monitoring/${id}`, data),
  deleteRecord: (id) => api.delete(`/flood-monitoring/${id}`),
}

/** M087 — Pest Forecasting (Climate). Real backend: GET /weather/pest-forecast
 *  (migration 057, same feed weatherAPI.pestForecast already reads). No
 *  create/update/delete route exists for it, so only a read is exposed here. */
export const pestForecastingAPI = {
  getForecasts: (params) => api.get('/weather/pest-forecast', { params }),
}

/** M088 — Disease Forecasting (Climate). No backend route found. */
export const diseaseForecastingAPI = {
  getForecasts: (params) => api.get('/disease-forecasting', { params }),
  createForecast: (data) => api.post('/disease-forecasting', data),
  updateForecast: (id, data) => api.put(`/disease-forecasting/${id}`, data),
  deleteForecast: (id) => api.delete(`/disease-forecasting/${id}`),
}

/** M089 — Climate Risk Assessment (Climate). No backend route found. */
export const climateRiskAPI = {
  getAssessments: (params) => api.get('/climate-risk', { params }),
  createAssessment: (data) => api.post('/climate-risk', data),
  updateAssessment: (id, data) => api.put(`/climate-risk/${id}`, data),
  deleteAssessment: (id) => api.delete(`/climate-risk/${id}`),
}

/** M090 — Agro-Meteorology (Climate). No backend route found. */
export const agroMeteorologyAPI = {
  getRecords: (params) => api.get('/agro-meteorology', { params }),
  createRecord: (data) => api.post('/agro-meteorology', data),
  updateRecord: (id, data) => api.put(`/agro-meteorology/${id}`, data),
  deleteRecord: (id) => api.delete(`/agro-meteorology/${id}`),
}

/** M091 — Farm Activity Management (Operations). No backend route found. */
export const farmActivityAPI = {
  getActivities: (params) => api.get('/farm-activities', { params }),
  createActivity: (data) => api.post('/farm-activities', data),
  updateActivity: (id, data) => api.put(`/farm-activities/${id}`, data),
  deleteActivity: (id) => api.delete(`/farm-activities/${id}`),
}

/** M092 — Farm Task Scheduling (Operations). No backend route found. */
export const farmTaskAPI = {
  getTasks: (params) => api.get('/farm-tasks', { params }),
  createTask: (data) => api.post('/farm-tasks', data),
  updateTask: (id, data) => api.put(`/farm-tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/farm-tasks/${id}`),
}

/** M094 — Contractor Management (Operations). No backend route found. */
export const contractorManagementAPI = {
  getContractors: (params) => api.get('/contractors', { params }),
  createContractor: (data) => api.post('/contractors', data),
  updateContractor: (id, data) => api.put(`/contractors/${id}`, data),
  deleteContractor: (id) => api.delete(`/contractors/${id}`),
}

/** M095 — Machinery Operations (Operations). No backend route found. */
export const machineryOperationsAPI = {
  getOperations: (params) => api.get('/machinery-operations', { params }),
  createOperation: (data) => api.post('/machinery-operations', data),
  updateOperation: (id, data) => api.put(`/machinery-operations/${id}`, data),
  deleteOperation: (id) => api.delete(`/machinery-operations/${id}`),
}

/** M096 — Equipment Scheduling (Operations). No backend route found. */
export const equipmentSchedulingAPI = {
  getSchedules: (params) => api.get('/equipment-scheduling', { params }),
  createSchedule: (data) => api.post('/equipment-scheduling', data),
  updateSchedule: (id, data) => api.put(`/equipment-scheduling/${id}`, data),
  deleteSchedule: (id) => api.delete(`/equipment-scheduling/${id}`),
}

/** M097 — Input Consumption (Operations). No backend route found. */
export const inputConsumptionAPI = {
  getRecords: (params) => api.get('/input-consumption', { params }),
  createRecord: (data) => api.post('/input-consumption', data),
  updateRecord: (id, data) => api.put(`/input-consumption/${id}`, data),
  deleteRecord: (id) => api.delete(`/input-consumption/${id}`),
}

/** M099 — Farm Productivity (Operations). No backend route found. */
export const farmProductivityAPI = {
  getMetrics: (params) => api.get('/farm-productivity', { params }),
  createMetric: (data) => api.post('/farm-productivity', data),
  updateMetric: (id, data) => api.put(`/farm-productivity/${id}`, data),
  deleteMetric: (id) => api.delete(`/farm-productivity/${id}`),
}

/** M100 — Farm Operations Dashboard (Operations). No backend route found. */
export const farmOperationsDashboardAPI = {
  getKpis: (params) => api.get('/farm-operations-dashboard', { params }),
  createKpi: (data) => api.post('/farm-operations-dashboard', data),
  updateKpi: (id, data) => api.put(`/farm-operations-dashboard/${id}`, data),
  deleteKpi: (id) => api.delete(`/farm-operations-dashboard/${id}`),
}

/** M102 — Implement Management (Machinery). No backend route found. */
export const implementManagementAPI = {
  getImplements: (params) => api.get('/machinery-implements', { params }),
  createImplement: (data) => api.post('/machinery-implements', data),
  updateImplement: (id, data) => api.put(`/machinery-implements/${id}`, data),
  deleteImplement: (id) => api.delete(`/machinery-implements/${id}`),
}

/** M103 — Equipment Inventory (Machinery). No backend route found. */
export const equipmentInventoryAPI = {
  getEquipment: (params) => api.get('/equipment-inventory', { params }),
  createEquipment: (data) => api.post('/equipment-inventory', data),
  updateEquipment: (id, data) => api.put(`/equipment-inventory/${id}`, data),
  deleteEquipment: (id) => api.delete(`/equipment-inventory/${id}`),
}

/** M104 — Equipment Rental (Machinery). No backend route found. */
export const equipmentRentalAPI = {
  getRentals: (params) => api.get('/equipment-rental', { params }),
  createRental: (data) => api.post('/equipment-rental', data),
  updateRental: (id, data) => api.put(`/equipment-rental/${id}`, data),
  deleteRental: (id) => api.delete(`/equipment-rental/${id}`),
}

/** M105 — Fleet Management (Machinery). Real backend at
 *  backend/src/routes/logisticsEnhancements.js, mounted at /api/v1/logistics
 *  (logisticsEnhancementService: addVehicle/getFleet/getVehicle/updateVehicle/
 *  scheduleMaintenance). No DELETE route exists, so remove is not wired. */
export const fleetManagementAPI = {
  getFleet: (params) => api.get('/logistics/fleet', { params }),
  getVehicle: (id) => api.get(`/logistics/fleet/${id}`),
  addVehicle: (data) => api.post('/logistics/fleet', data),
  updateVehicle: (id, data) => api.put(`/logistics/fleet/${id}`, data),
  scheduleMaintenance: (id, data) => api.post(`/logistics/fleet/${id}/maintenance`, data),
  // Real due-for-service list: fleet_vehicles.next_maintenance_date +
  // overdue vehicle_maintenance work orders (see
  // logisticsEnhancementService.getMaintenanceDueList — wave-1 machinery
  // business logic, 2026-08-10).
  getMaintenanceDue: (params) => api.get('/logistics/fleet/maintenance-due', { params }),
}

/** M106 — Preventive Maintenance (Machinery). No backend route found. */
export const preventiveMaintenanceAPI = {
  getRecords: (params) => api.get('/preventive-maintenance', { params }),
  createRecord: (data) => api.post('/preventive-maintenance', data),
  updateRecord: (id, data) => api.put(`/preventive-maintenance/${id}`, data),
  deleteRecord: (id) => api.delete(`/preventive-maintenance/${id}`),
}

/** M107 — Breakdown Maintenance (Machinery). No backend route found. */
export const breakdownMaintenanceAPI = {
  getRecords: (params) => api.get('/breakdown-maintenance', { params }),
  createRecord: (data) => api.post('/breakdown-maintenance', data),
  updateRecord: (id, data) => api.put(`/breakdown-maintenance/${id}`, data),
  deleteRecord: (id) => api.delete(`/breakdown-maintenance/${id}`),
}

/** M108 — Fuel Management (Machinery). No backend route found. */
export const fuelManagementAPI = {
  getLogs: (params) => api.get('/fuel-management', { params }),
  createLog: (data) => api.post('/fuel-management', data),
  updateLog: (id, data) => api.put(`/fuel-management/${id}`, data),
  deleteLog: (id) => api.delete(`/fuel-management/${id}`),
}

/** M109 — Spare Parts Management (Machinery). No backend route found. */
export const sparePartsAPI = {
  getParts: (params) => api.get('/spare-parts', { params }),
  createPart: (data) => api.post('/spare-parts', data),
  updatePart: (id, data) => api.put(`/spare-parts/${id}`, data),
  deletePart: (id) => api.delete(`/spare-parts/${id}`),
}

/** M110 — Asset Lifecycle Management (Machinery). No backend route found. */
export const assetLifecycleAPI = {
  getAssets: (params) => api.get('/asset-lifecycle', { params }),
  createAsset: (data) => api.post('/asset-lifecycle', data),
  updateAsset: (id, data) => api.put(`/asset-lifecycle/${id}`, data),
  deleteAsset: (id) => api.delete(`/asset-lifecycle/${id}`),
}

/** M142 — Vegetable Production (Horticulture). No backend route found. */
export const vegetableProductionAPI = {
  getRecords: (params) => api.get('/vegetable-production', { params }),
  createRecord: (data) => api.post('/vegetable-production', data),
  updateRecord: (id, data) => api.put(`/vegetable-production/${id}`, data),
  deleteRecord: (id) => api.delete(`/vegetable-production/${id}`),
}

/** M143 — Floriculture Management (Horticulture). No backend route found. */
export const floricultureAPI = {
  getRecords: (params) => api.get('/floriculture', { params }),
  createRecord: (data) => api.post('/floriculture', data),
  updateRecord: (id, data) => api.put(`/floriculture/${id}`, data),
  deleteRecord: (id) => api.delete(`/floriculture/${id}`),
}

/** M144 — Greenhouse Management (Horticulture). Real backend at
 *  backend/src/services/greenhouseService.js (mounted directly in index.js,
 *  not under a router file), but it is action-based, not a CRUD list:
 *  POST /greenhouse/design, POST /greenhouse/optimize, GET /greenhouse/:id/monitor,
 *  POST /greenhouse/predict-yield, POST /greenhouse/dpr, POST /greenhouse/cost-estimate.
 *  There is no GET /greenhouse list route, so the registry CRUD below still
 *  targets a conventional (not-yet-built) /greenhouse-registry path; the real
 *  action endpoints are exposed separately for the monitor/design tools. */
export const greenhouseAPI = {
  getRegistry: (params) => api.get('/greenhouse-registry', { params }),
  createEntry: (data) => api.post('/greenhouse-registry', data),
  updateEntry: (id, data) => api.put(`/greenhouse-registry/${id}`, data),
  deleteEntry: (id) => api.delete(`/greenhouse-registry/${id}`),
  design: (data) => api.post('/greenhouse/design', data),
  // optimize/dpr added 2026-08-11 — the only two action endpoints
  // greenhouseService.js exposes that weren't already covered here.
  optimize: (data) => api.post('/greenhouse/optimize', data),
  monitor: (id) => api.get(`/greenhouse/${id}/monitor`),
  predictYield: (data) => api.post('/greenhouse/predict-yield', data),
  dpr: (data) => api.post('/greenhouse/dpr', data),
  costEstimate: (data) => api.post('/greenhouse/cost-estimate', data),
}

/** M145 — Polyhouse Management (Horticulture). No backend route found. */
export const polyhouseAPI = {
  getRecords: (params) => api.get('/polyhouse-management', { params }),
  createRecord: (data) => api.post('/polyhouse-management', data),
  updateRecord: (id, data) => api.put(`/polyhouse-management/${id}`, data),
  deleteRecord: (id) => api.delete(`/polyhouse-management/${id}`),
}

/** M146 — Hydroponics Management (Horticulture). No backend route found. */
export const hydroponicsAPI = {
  getSystems: (params) => api.get('/hydroponics', { params }),
  createSystem: (data) => api.post('/hydroponics', data),
  updateSystem: (id, data) => api.put(`/hydroponics/${id}`, data),
  deleteSystem: (id) => api.delete(`/hydroponics/${id}`),
}

/** M147 — Aeroponics Management (Horticulture). No backend route found. */
export const aeroponicsAPI = {
  getSystems: (params) => api.get('/aeroponics', { params }),
  createSystem: (data) => api.post('/aeroponics', data),
  updateSystem: (id, data) => api.put(`/aeroponics/${id}`, data),
  deleteSystem: (id) => api.delete(`/aeroponics/${id}`),
}

/** M148 — Precision Horticulture (Horticulture). Confirmed ABSENT (no trace
 *  anywhere in backend or frontend) — genuinely missing, safe to build. */
export const precisionHorticultureAPI = {
  getSystems: (params) => api.get('/precision-horticulture', { params }),
  createSystem: (data) => api.post('/precision-horticulture', data),
  updateSystem: (id, data) => api.put(`/precision-horticulture/${id}`, data),
  deleteSystem: (id) => api.delete(`/precision-horticulture/${id}`),
  getReadings: (params) => api.get('/precision-horticulture', { params }),
  createReading: (data) => api.post('/precision-horticulture', data),
  updateReading: (id, data) => api.put(`/precision-horticulture/${id}`, data),
  deleteReading: (id) => api.delete(`/precision-horticulture/${id}`),
}

/**
 * User Management API (M006) — AI-enhanced user operations.
 * System settings, audit logs, analytics, anomaly detection, predictive maintenance.
 */
export const userManagementAPI = {
  getSettings: () => api.get('/modules/m006/settings'),
  getSetting: (name) => api.get(`/modules/m006/settings/${name}`),
  upsertSetting: (name, value, description) => api.put(`/modules/m006/settings/${name}`, { value, description }),
  ingestAudit: (entry) => api.post('/modules/m006/audit', entry),
  getSystemAnalytics: () => api.get('/modules/m006/analytics'),
  detectAnomalies: () => api.get('/modules/m006/anomalies'),
  getPredictiveMaintenance: () => api.get('/modules/m006/predictive-maintenance'),
}

/**
 * Role & Permission Management API (M007) — AI-enhanced RBAC.
 * Dynamic roles, permissions, user assignments, AI recommendations, permission matrix.
 */
export const rolePermissionAPI = {
  listRoles: (params) => api.get('/modules/m007/roles', { params }),
  getRole: (id) => api.get(`/modules/m007/roles/${id}`),
  createRole: (data) => api.post('/modules/m007/roles', data),
  updateRole: (id, data) => api.put(`/modules/m007/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/modules/m007/roles/${id}`),
  listPermissions: () => api.get('/modules/m007/permissions'),
  createPermission: (data) => api.post('/modules/m007/permissions', data),
  assignRoleToUser: (userId, roleId) => api.post('/modules/m007/assign-role', { userId, roleId }),
  removeRoleFromUser: (userId, roleId) => api.post('/modules/m007/remove-role', { userId, roleId }),
  getUserRoles: (userId) => api.get(`/modules/m007/users/${userId}/roles`),
  getUserPermissions: (userId) => api.get(`/modules/m007/users/${userId}/permissions`),
  recommendRoleForUser: (userId) => api.get(`/modules/m007/users/${userId}/recommend-role`),
  getPermissionMatrix: () => api.get('/modules/m007/permission-matrix'),
  getRoleHierarchy: () => api.get('/modules/m007/role-hierarchy'),
}

/**
 * Audit & Compliance API (M008) — AI-enhanced compliance.
 * Audit logging, blockchain verification, compliance rules, regulatory reporting, anomaly detection.
 */
export const auditComplianceAPI = {
  createAuditLog: (logData) => api.post('/modules/m008/logs', logData),
  getAuditLogs: (params) => api.get('/modules/m008/logs', { params }),
  getAuditLog: (id) => api.get(`/modules/m008/logs/${id}`),
  verifyAuditLogIntegrity: (id) => api.get(`/modules/m008/logs/${id}/verify`),
  createComplianceRule: (ruleData) => api.post('/modules/m008/compliance-rules', ruleData),
  listComplianceRules: (params) => api.get('/modules/m008/compliance-rules', { params }),
  evaluateComplianceRules: (userId) => api.get(`/modules/m008/users/${userId}/compliance`),
  generateComplianceReport: (params) => api.get('/modules/m008/reports/compliance', { params }),
  detectAuditAnomalies: (params) => api.get('/modules/m008/anomalies', { params }),
}

/**
 * Security & Access Control API (M009) — AI-enhanced security.
 * Security events, IP lists, rate limiting, threat detection, security scores, access policies.
 */
export const securityAccessControlAPI = {
  createSecurityEvent: (eventData) => api.post('/modules/m009/events', eventData),
  getSecurityEvents: (params) => api.get('/modules/m009/events', { params }),
  addToIpList: (listType, ipAddress, description) => api.post('/modules/m009/ip-list', { listType, ipAddress, description }),
  removeFromIpList: (listType, ipAddress) => api.delete('/modules/m009/ip-list', { data: { listType, ipAddress } }),
  getIpLists: (listType) => api.get(`/modules/m009/ip-list/${listType}`),
  checkIpAccess: (ipAddress) => api.post('/modules/m009/ip-list/check', { ipAddress }),
  checkRateLimit: (identifier, limit, windowMinutes) => api.post('/modules/m009/rate-limit/check', { identifier, limit, windowMinutes }),
  detectThreats: () => api.get('/modules/m009/threats/detect'),
  calculateSecurityScore: (userId) => api.get(`/modules/m009/users/${userId}/security-score`),
  createAccessPolicy: (policyData) => api.post('/modules/m009/policies', policyData),
  evaluateAccessPolicy: (userId, resource, action) => api.post('/modules/m009/policies/evaluate', { userId, resource, action }),
}

/**
 * Notification System API (M010) — AI-enhanced notifications.
 * Multi-channel delivery, preferences, templates, batching, analytics, real-time updates.
 */
export const notificationAPI = {
  createNotification: (notificationData) => api.post('/modules/m010/notifications', notificationData),
  getNotifications: (params) => api.get('/modules/m010/notifications', { params }),
  getNotification: (id) => api.get(`/modules/m010/notifications/${id}`),
  markAsRead: (id) => api.put(`/modules/m010/notifications/${id}/read`),
  markAllAsRead: () => api.put('/modules/m010/notifications/read-all'),
  deliverNotification: (id) => api.post(`/modules/m010/notifications/${id}/deliver`),
  getUserPreferences: (userId) => api.get(`/modules/m010/preferences/${userId}`),
  updateUserPreferences: (preferences) => api.put('/modules/m010/preferences', preferences),
  createTemplate: (templateData) => api.post('/modules/m010/templates', templateData),
  getTemplate: (params) => api.get('/modules/m010/templates', { params }),
  renderTemplate: (templateId, variables) => api.post('/modules/m010/templates/render', { templateId, variables }),
  batchNotifications: (notificationIds) => api.post('/modules/m010/batch', { notificationIds }),
  getNotificationAnalytics: (params) => api.get('/modules/m010/analytics', { params }),
}

/** M149 — Protected Cultivation (Horticulture). No backend route found. */
export const protectedCultivationAPI = {
  getStructures: (params) => api.get('/protected-cultivation', { params }),
  createStructure: (data) => api.post('/protected-cultivation', data),
  updateStructure: (id, data) => api.put(`/protected-cultivation/${id}`, data),
  deleteStructure: (id) => api.delete(`/protected-cultivation/${id}`),
}

/** M150 — Horticulture Analytics (Horticulture). No backend route found. */
export const horticultureAnalyticsAPI = {
  getMetrics: (params) => api.get('/horticulture-analytics', { params }),
  createMetric: (data) => api.post('/horticulture-analytics', data),
  updateMetric: (id, data) => api.put(`/horticulture-analytics/${id}`, data),
  deleteMetric: (id) => api.delete(`/horticulture-analytics/${id}`),
}

/** M131 — Biofloc Farm Management (Fisheries). No backend route found. */
export const biofloccFarmAPI = {
  getTanks: (params) => api.get('/biofloc-farms', { params }),
  createTank: (data) => api.post('/biofloc-farms', data),
  updateTank: (id, data) => api.put(`/biofloc-farms/${id}`, data),
  deleteTank: (id) => api.delete(`/biofloc-farms/${id}`),
}

/** M133 — Hatchery Management (Fisheries). No backend route found. */
export const hatcheryManagementAPI = {
  getBatches: (params) => api.get('/hatchery-management', { params }),
  createBatch: (data) => api.post('/hatchery-management', data),
  updateBatch: (id, data) => api.put(`/hatchery-management/${id}`, data),
  deleteBatch: (id) => api.delete(`/hatchery-management/${id}`),
}

/** M134 — Fish Feed Management (Fisheries). No backend route found. */
export const fishFeedAPI = {
  getLogs: (params) => api.get('/fish-feed', { params }),
  createLog: (data) => api.post('/fish-feed', data),
  updateLog: (id, data) => api.put(`/fish-feed/${id}`, data),
  deleteLog: (id) => api.delete(`/fish-feed/${id}`),
}

/** M135 — Water Quality Control, fisheries (Fisheries). No backend route found. */
export const fisheriesWaterQualityAPI = {
  getReadings: (params) => api.get('/fisheries-water-quality', { params }),
  createReading: (data) => api.post('/fisheries-water-quality', data),
  updateReading: (id, data) => api.put(`/fisheries-water-quality/${id}`, data),
  deleteReading: (id) => api.delete(`/fisheries-water-quality/${id}`),
}

/** M136 — Fish Health Management (Fisheries). No backend route found. */
export const fishHealthAPI = {
  getRecords: (params) => api.get('/fish-health', { params }),
  createRecord: (data) => api.post('/fish-health', data),
  updateRecord: (id, data) => api.put(`/fish-health/${id}`, data),
  deleteRecord: (id) => api.delete(`/fish-health/${id}`),
}

/** M137 — Harvest Management, fisheries (Fisheries). No backend route found. */
export const fisheriesHarvestAPI = {
  getHarvests: (params) => api.get('/fisheries-harvest', { params }),
  createHarvest: (data) => api.post('/fisheries-harvest', data),
  updateHarvest: (id, data) => api.put(`/fisheries-harvest/${id}`, data),
  deleteHarvest: (id) => api.delete(`/fisheries-harvest/${id}`),
}

/** M138 — Fish Processing Management (Fisheries). No backend route found. */
export const fishProcessingAPI = {
  getBatches: (params) => api.get('/fish-processing', { params }),
  createBatch: (data) => api.post('/fish-processing', data),
  updateBatch: (id, data) => api.put(`/fish-processing/${id}`, data),
  deleteBatch: (id) => api.delete(`/fish-processing/${id}`),
}

/** M139 — Cold Fish Chain (Fisheries). No backend route found. */
export const coldFishChainAPI = {
  getShipments: (params) => api.get('/cold-fish-chain', { params }),
  createShipment: (data) => api.post('/cold-fish-chain', data),
  updateShipment: (id, data) => api.put(`/cold-fish-chain/${id}`, data),
  deleteShipment: (id) => api.delete(`/cold-fish-chain/${id}`),
}

/** M140 — Aquaculture Analytics (Fisheries). No backend route found. */
export const aquacultureAnalyticsAPI = {
  getMetrics: (params) => api.get('/aquaculture-analytics', { params }),
  createMetric: (data) => api.post('/aquaculture-analytics', data),
  updateMetric: (id, data) => api.put(`/aquaculture-analytics/${id}`, data),
  deleteMetric: (id) => api.delete(`/aquaculture-analytics/${id}`),
}

/** M014 — Role Management (Identity). No backend route found. */
export const roleManagementAPI = {
  getRoles: (params) => api.get('/roles', { params }),
  createRole: (data) => api.post('/roles', data),
  updateRole: (id, data) => api.put(`/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/roles/${id}`),
}

/** M015 — Permission Management (Identity). No backend route found. */
export const permissionManagementAPI = {
  getPermissions: (params) => api.get('/permissions', { params }),
  createPermission: (data) => api.post('/permissions', data),
  updatePermission: (id, data) => api.put(`/permissions/${id}`, data),
  deletePermission: (id) => api.delete(`/permissions/${id}`),
}

/** M016 — Single Sign-On (Identity). No backend route found. */
export const ssoAPI = {
  getProviders: (params) => api.get('/sso-providers', { params }),
  createProvider: (data) => api.post('/sso-providers', data),
  updateProvider: (id, data) => api.put(`/sso-providers/${id}`, data),
  deleteProvider: (id) => api.delete(`/sso-providers/${id}`),
}

/** M017 — Multi-Factor Authentication (Identity). authService.js already has
 *  per-user 2FA setup/verify/disable (authAPI.setup2FA/verify2FA/disable2FA)
 *  — no separate device-registry list route exists, so this stays conventional. */
export const mfaManagementAPI = {
  getDevices: (params) => api.get('/mfa-devices', { params }),
  createDevice: (data) => api.post('/mfa-devices', data),
  updateDevice: (id, data) => api.put(`/mfa-devices/${id}`, data),
  deleteDevice: (id) => api.delete(`/mfa-devices/${id}`),
}

/** M018 — Digital Identity (Identity). No backend route found. */
export const digitalIdentityAPI = {
  getIdentities: (params) => api.get('/digital-identities', { params }),
  createIdentity: (data) => api.post('/digital-identities', data),
  updateIdentity: (id, data) => api.put(`/digital-identities/${id}`, data),
  deleteIdentity: (id) => api.delete(`/digital-identities/${id}`),
}

/** M019 — Consent Management (Identity). No backend route found. */
export const consentManagementAPI = {
  getRecords: (params) => api.get('/consent-records', { params }),
  createRecord: (data) => api.post('/consent-records', data),
  updateRecord: (id, data) => api.put(`/consent-records/${id}`, data),
  deleteRecord: (id) => api.delete(`/consent-records/${id}`),
}

/** M020 — Session Management (Identity). No backend route found. */
export const sessionManagementAPI = {
  getSessions: (params) => api.get('/sessions', { params }),
  createSession: (data) => api.post('/sessions', data),
  updateSession: (id, data) => api.put(`/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/sessions/${id}`),
}

/** M005 — Environment Management (Platform Foundation). No backend route found. */
export const environmentManagementAPI = {
  getEnvironments: (params) => api.get('/environments', { params }),
  createEnvironment: (data) => api.post('/environments', data),
  updateEnvironment: (id, data) => api.put(`/environments/${id}`, data),
  deleteEnvironment: (id) => api.delete(`/environments/${id}`),
}

/** M007 — Feature Flag Management (Platform Foundation). No backend route found. */
export const featureFlagAPI = {
  getFlags: (params) => api.get('/feature-flags', { params }),
  createFlag: (data) => api.post('/feature-flags', data),
  updateFlag: (id, data) => api.put(`/feature-flags/${id}`, data),
  deleteFlag: (id) => api.delete(`/feature-flags/${id}`),
}

/** M009 — Time Zone Management (Platform Foundation). No backend route found. */
export const timeZoneManagementAPI = {
  getZones: (params) => api.get('/timezones', { params }),
  createZone: (data) => api.post('/timezones', data),
  updateZone: (id, data) => api.put(`/timezones/${id}`, data),
  deleteZone: (id) => api.delete(`/timezones/${id}`),
}

/** M010 — Master Configuration (Platform Foundation). No backend route found. */
export const masterConfigAPI = {
  getConfig: (params) => api.get('/master-config', { params }),
  createConfig: (data) => api.post('/master-config', data),
  updateConfig: (id, data) => api.put(`/master-config/${id}`, data),
  deleteConfig: (id) => api.delete(`/master-config/${id}`),
}

// ---------------------------------------------------------------------------
// Enterprise Control Layer (993) — backend/src/services/enterpriseControlService.js,
// mounted at /api/v1/control. One router for six governance concerns that share
// a workflow-engine contract: workflow, CRM, clients, legal, risk, emergency.
//
// The service's own boundary, carried through here: it does not approve,
// escalate or close anything on its own authority. It records, computes and
// surfaces. Every method below is a straight passthrough to a route the
// backend already gates behind a named human actor — none of them approve,
// acknowledge or act on anything by themselves. Emergency incident creation
// returns the standing instruction immediately (no deliberation), but the
// ACTION it describes is still taken by a person, not this client.
// ---------------------------------------------------------------------------
export const enterpriseControlAPI = {
  // Workflow engine — approval chains with amount thresholds.
  startWorkflow: (body) => api.post('/control/workflow/start', body),
  actOnWorkflow: (instanceCode, body) => api.post(`/control/workflow/${instanceCode}/act`, body),
  pendingApprovals: (params) => api.get('/control/workflow/pending', { params }),

  // CRM — leads and pipeline.
  createLead: (body) => api.post('/control/crm/leads', body),
  convertLead: (leadCode, body) => api.post(`/control/crm/leads/${leadCode}/convert`, body),
  pipeline: () => api.get('/control/crm/pipeline'),

  // Clients — account health (no list/create route exists on the backend;
  // clients are created only via convertLead's createClient flag).
  clientHealth: (id) => api.get(`/control/clients/${id}/health`),

  // Legal — admin-gated on the backend (adminMiddleware); calendar/read-only,
  // no create route exists for legal_matters/legal_obligations.
  legalCalendar: (params) => api.get('/control/legal/calendar', { params }),

  // Risk — admin-gated assessment; heatmap is a read-only aggregate.
  assessRisk: (riskCode, body) => api.post(`/control/risk/${riskCode}/assess`, body),
  riskHeatmap: () => api.get('/control/risk/heatmap'),

  // Emergency — raising and acknowledging are authenticated but NOT
  // admin-gated on the backend: the person who sees the problem first is
  // rarely the person with the highest privilege.
  raiseIncident: (body) => api.post('/control/emergency/incidents', body),
  acknowledgeIncident: (incidentCode) => api.post(`/control/emergency/incidents/${incidentCode}/acknowledge`),
  activeIncidents: () => api.get('/control/emergency/active'),
}

/** Complete ERP Integration - Comprehensive ERP integration with all modules.
 *  Integrates farmer, crop, livestock, and inbuilt modules with financial ERP,
 *  supply chain ERP, production ERP, and customer ERP. Real backend as of
 *  2026-08-12: backend/src/routes/completeERPIntegrationRoutes.js */
export const completeERPIntegrationAPI = {
  // Farmer Module ERP Integration
  syncFarmerCropPlanning: (farmerId, data) => api.post(`/complete-erp-integration/farmer/${farmerId}/crop-planning`, data),
  syncFarmerHarvest: (farmerId, data) => api.post(`/complete-erp-integration/farmer/${farmerId}/harvest`, data),
  syncFarmerField: (farmerId, data) => api.post(`/complete-erp-integration/farmer/${farmerId}/field`, data),
  
  // Crop Module ERP Integration
  syncCropLifecycle: (cropId, data) => api.post(`/complete-erp-integration/crop/${cropId}/lifecycle`, data),
  syncCropYield: (cropId, data) => api.post(`/complete-erp-integration/crop/${cropId}/yield`, data),
  
  // Livestock Module ERP Integration
  syncLivestock: (livestockId, data) => api.post(`/complete-erp-integration/livestock/${livestockId}`, data),
  syncLivestockProduction: (livestockId, data) => api.post(`/complete-erp-integration/livestock/${livestockId}/production`, data),
  syncLivestockHealth: (livestockId, data) => api.post(`/complete-erp-integration/livestock/${livestockId}/health`, data),
  
  // Inbuilt Modules ERP Integration
  syncDairyProduction: (dairyId, data) => api.post(`/complete-erp-integration/dairy/${dairyId}/production`, data),
  syncPoultryProduction: (poultryId, data) => api.post(`/complete-erp-integration/poultry/${poultryId}/production`, data),
  syncGoatProduction: (goatId, data) => api.post(`/complete-erp-integration/goat/${goatId}/production`, data),
  syncSheepProduction: (sheepId, data) => api.post(`/complete-erp-integration/sheep/${sheepId}/production`, data),
  syncPigProduction: (pigId, data) => api.post(`/complete-erp-integration/pig/${pigId}/production`, data),
  
  // Bulk ERP Integration
  getERPIntegrationStatus: (params) => api.get('/complete-erp-integration/status', { params }),
  forceSyncAllERPIntegrations: (data) => api.post('/complete-erp-integration/force-sync', data),
}

/** Complete AI Integration - Comprehensive AI integration with all modules.
 *  Integrates farmer, crop, livestock, and inbuilt modules with predictive analytics,
 *  disease detection, yield prediction, and optimization. Real backend as of
 *  2026-08-12: backend/src/routes/completeAIIntegrationRoutes.js */
export const completeAIIntegrationAPI = {
  // Farmer Module AI Integration
  recommendCropPlanning: (farmerId, data) => api.post(`/complete-ai-integration/farmer/${farmerId}/crop-planning-recommendation`, data),
  predictHarvestTiming: (farmerId, data) => api.post(`/complete-ai-integration/farmer/${farmerId}/harvest-timing-prediction`, data),
  optimizeFarmerResources: (farmerId, data) => api.post(`/complete-ai-integration/farmer/${farmerId}/resource-optimization`, data),
  
  // Crop Module AI Integration
  detectCropDisease: (cropId, data) => api.post(`/complete-ai-integration/crop/${cropId}/disease-detection`, data),
  predictCropYield: (cropId, data) => api.post(`/complete-ai-integration/crop/${cropId}/yield-prediction`, data),
  
  // Livestock Module AI Integration
  monitorLivestockHealth: (livestockId, data) => api.post(`/complete-ai-integration/livestock/${livestockId}/health-monitoring`, data),
  recommendLivestockBreeding: (livestockId, data) => api.post(`/complete-ai-integration/livestock/${livestockId}/breeding-recommendation`, data),
  
  // Inbuilt Modules AI Integration
  optimizeDairyProduction: (dairyId, data) => api.post(`/complete-ai-integration/dairy/${dairyId}/production-optimization`, data),
  monitorPoultryHealth: (poultryId, data) => api.post(`/complete-ai-integration/poultry/${poultryId}/health-monitoring`, data),
  optimizeGoatProduction: (goatId, data) => api.post(`/complete-ai-integration/goat/${goatId}/production-optimization`, data),
  optimizeSheepProduction: (sheepId, data) => api.post(`/complete-ai-integration/sheep/${sheepId}/production-optimization`, data),
  optimizePigProduction: (pigId, data) => api.post(`/complete-ai-integration/pig/${pigId}/production-optimization`, data),
  
  // Bulk AI Integration
  getAIIntegrationStatus: (params) => api.get('/complete-ai-integration/status', { params }),
  forceSyncAllAIIntegrations: (data) => api.post('/complete-ai-integration/force-sync', data),
  getAIModelInfo: () => api.get('/complete-ai-integration/model-info'),
}

/** Bulk Order API - Bulk/wholesale orders for marketplace.
 *  Real backend as of 2026-08-12: backend/src/routes/bulkOrderRoutes.js */
export const bulkOrderAPI = {
  createBulkOrder: (data) => api.post('/bulk-orders', data),
  getBulkOrder: (orderId) => api.get(`/bulk-orders/${orderId}`),
  getUserBulkOrders: (userId, params) => api.get(`/bulk-orders/user/${userId}`, { params }),
  updateBulkOrderStatus: (orderId, data) => api.patch(`/bulk-orders/${orderId}/status`, data),
  getBulkOrderQuotations: (orderId) => api.get(`/bulk-orders/${orderId}/quotations`),
  submitQuotation: (orderId, data) => api.post(`/bulk-orders/${orderId}/quotations`, data),
  acceptQuotation: (quotationId, data) => api.post(`/bulk-orders/quotations/${quotationId}/accept`, data),
  getBulkOrderAnalytics: (params) => api.get('/bulk-orders/analytics', { params }),
  cancelBulkOrder: (orderId, data) => api.post(`/bulk-orders/${orderId}/cancel`, data),
}

/** Dairy AI API - AI-powered dairy management.
 *  Real backend as of 2026-08-12: backend/src/routes/dairyRoutes.js */
export const dairyAIAPI = {
  optimizeMilkProduction: (animalId) => api.post(`/dairy/ai/optimize-production/${animalId}`),
  predictHealthRisks: (animalId) => api.post(`/dairy/ai/predict-health/${animalId}`),
  optimizeFeedComposition: (animalId, data) => api.post(`/dairy/ai/optimize-feed/${animalId}`, data),
  recommendBreeding: (animalId) => api.post(`/dairy/ai/recommend-breeding/${animalId}`),
}

/** Poultry AI API - AI-powered poultry management.
 *  Real backend as of 2026-08-12: backend/src/routes/poultryRoutes.js */
export const poultryAIAPI = {
  optimizeEggProduction: (flockId) => api.post(`/poultry/ai/optimize-production/${flockId}`),
  monitorFlockHealth: (flockId) => api.post(`/poultry/ai/monitor-health/${flockId}`),
  optimizePoultryFeed: (flockId, data) => api.post(`/poultry/ai/optimize-feed/${flockId}`, data),
  predictMortalityRisk: (flockId) => api.post(`/poultry/ai/predict-mortality/${flockId}`),
}

/** Goat AI API - AI-powered goat management.
 *  Real backend as of 2026-08-12: backend/src/routes/goatRoutes.js */
export const goatAIAPI = {
  optimizeGoatMilkProduction: (animalId) => api.post(`/goat/ai/optimize-milk/${animalId}`),
  monitorGoatHealth: (animalId) => api.post(`/goat/ai/monitor-health/${animalId}`),
  optimizeGoatFeed: (animalId, data) => api.post(`/goat/ai/optimize-feed/${animalId}`, data),
  recommendGoatBreeding: (animalId) => api.post(`/goat/ai/recommend-breeding/${animalId}`),
}

/** Sheep AI API - AI-powered sheep management.
 *  Real backend as of 2026-08-12: backend/src/routes/sheepRoutes.js */
export const sheepAIAPI = {
  optimizeWoolProduction: (animalId) => api.post(`/sheep/ai/optimize-wool/${animalId}`),
  monitorSheepHealth: (animalId) => api.post(`/sheep/ai/monitor-health/${animalId}`),
  optimizeSheepFeed: (animalId, data) => api.post(`/sheep/ai/optimize-feed/${animalId}`, data),
  recommendSheepBreeding: (animalId) => api.post(`/sheep/ai/recommend-breeding/${animalId}`),
}

/** Pig AI API - AI-powered pig management.
 *  Real backend as of 2026-08-12: backend/src/routes/pigRoutes.js */
export const pigAIAPI = {
  optimizeMeatProduction: (animalId) => api.post(`/pig/ai/optimize-meat/${animalId}`),
  monitorPigHealth: (animalId) => api.post(`/pig/ai/monitor-health/${animalId}`),
  optimizePigFeed: (animalId, data) => api.post(`/pig/ai/optimize-feed/${animalId}`, data),
  recommendPigBreeding: (animalId) => api.post(`/pig/ai/recommend-breeding/${animalId}`),
}

/** Comprehensive ERP API - Oracle/SAP standards complete ERP system.
 *  Real backend as of 2026-08-12: backend/src/routes/comprehensiveERPRoutes.js */
export const comprehensiveERPAPI = {
  // Financial Accounting (FI) / General Ledger (GL)
  createChartOfAccounts: (data) => api.post('/comprehensive-erp/fi/gl/chart-of-accounts', data),
  createGLAccount: (data) => api.post('/comprehensive-erp/fi/gl/accounts', data),
  postJournalEntry: (data) => api.post('/comprehensive-erp/fi/gl/journal-entries', data),
  getTrialBalance: (params) => api.get('/comprehensive-erp/fi/gl/trial-balance', { params }),
  getBalanceSheet: (params) => api.get('/comprehensive-erp/fi/gl/balance-sheet', { params }),
  getProfitLoss: (params) => api.get('/comprehensive-erp/fi/gl/profit-loss', { params }),
  
  // Controlling (CO)
  createCostCenter: (data) => api.post('/comprehensive-erp/co/cost-centers', data),
  createProfitCenter: (data) => api.post('/comprehensive-erp/co/profit-centers', data),
  postCostAllocation: (data) => api.post('/comprehensive-erp/co/cost-allocations', data),
  getCostCenterReport: (params) => api.get('/comprehensive-erp/co/cost-centers/report', { params }),
  getProfitCenterReport: (params) => api.get('/comprehensive-erp/co/profit-centers/report', { params }),
  
  // Materials Management (MM)
  createMaterialMaster: (data) => api.post('/comprehensive-erp/mm/material-master', data),
  createPurchaseOrder: (data) => api.post('/comprehensive-erp/mm/purchase-orders', data),
  createGoodsReceipt: (data) => api.post('/comprehensive-erp/mm/goods-receipts', data),
  getInventoryOverview: (params) => api.get('/comprehensive-erp/mm/inventory', { params }),
  
  // Sales and Distribution (SD)
  createCustomerMaster: (data) => api.post('/comprehensive-erp/sd/customers', data),
  createSalesOrder: (data) => api.post('/comprehensive-erp/sd/sales-orders', data),
  createDelivery: (data) => api.post('/comprehensive-erp/sd/deliveries', data),
  createInvoice: (data) => api.post('/comprehensive-erp/sd/invoices', data),
  
  // Production Planning (PP)
  createProductionOrder: (data) => api.post('/comprehensive-erp/pp/production-orders', data),
  releaseProductionOrder: (productionOrder) => api.post(`/comprehensive-erp/pp/production-orders/${productionOrder}/release`),
  confirmProductionOrder: (productionOrder, data) => api.post(`/comprehensive-erp/pp/production-orders/${productionOrder}/confirm`, data),
  
  // Quality Management (QM)
  createInspectionLot: (data) => api.post('/comprehensive-erp/qm/inspection-lots', data),
  recordInspectionResult: (data) => api.post('/comprehensive-erp/qm/inspection-results', data),
  makeUsageDecision: (inspectionLot, data) => api.post(`/comprehensive-erp/qm/inspection-lots/${inspectionLot}/usage-decision`, data),
  
  // Plant Maintenance (PM)
  createEquipmentMaster: (data) => api.post('/comprehensive-erp/pm/equipment', data),
  createMaintenanceOrder: (data) => api.post('/comprehensive-erp/pm/maintenance-orders', data),
  confirmMaintenanceOrder: (maintenanceOrder, data) => api.post(`/comprehensive-erp/pm/maintenance-orders/${maintenanceOrder}/confirm`, data),
  
  // Human Resources (HR)
  createEmployeeMaster: (data) => api.post('/comprehensive-erp/hr/employees', data),
  createOrganizationalUnit: (data) => api.post('/comprehensive-erp/hr/org-units', data),
  processPayroll: (data) => api.post('/comprehensive-erp/hr/payroll', data),
  
  // Project System (PS)
  createProjectDefinition: (data) => api.post('/comprehensive-erp/ps/projects', data),
  createWBS: (data) => api.post('/comprehensive-erp/ps/wbs-elements', data),
  updateProjectStatus: (projectCode, data) => api.post(`/comprehensive-erp/ps/projects/${projectCode}/status`, data),
  
  // Treasury (TR)
  createBankAccount: (data) => api.post('/comprehensive-erp/tr/bank-accounts', data),
  recordCashFlow: (data) => api.post('/comprehensive-erp/tr/cash-flows', data),
  getCashPosition: (params) => api.get('/comprehensive-erp/tr/cash-position', { params }),
  
  // Asset Management (AM)
  createFixedAsset: (data) => api.post('/comprehensive-erp/am/fixed-assets', data),
  calculateDepreciation: (assetCode, params) => api.post(`/comprehensive-erp/am/fixed-assets/${assetCode}/depreciation`, null, { params }),
  
  // Business Intelligence (BI)
  getExecutiveDashboard: (params) => api.get('/comprehensive-erp/bi/executive-dashboard', { params }),
  getProfitabilityAnalysis: (params) => api.get('/comprehensive-erp/bi/profitability-analysis', { params }),
}

/** AI Backbone API - Real AI integration (Claude, ChatGPT, Gemini, Azure, Hugging Face).
 *  Real backend as of 2026-08-12: backend/src/routes/aiBackboneRoutes.js */
export const aiBackboneAPI = {
  // General AI Operations
  callAI: (data) => api.post('/ai-backbone/call', data),
  getAIProviderStatus: () => api.get('/ai-backbone/status'),
  switchProvider: (data) => api.post('/ai-backbone/switch-provider', data),
  resetAIStatistics: () => api.post('/ai-backbone/reset-statistics'),
  
  // Agricultural AI Operations
  supportAgriculturalDecision: (data) => api.post('/ai-backbone/agricultural-decision', data),
  optimizeLivestock: (data) => api.post('/ai-backbone/livestock-optimization', data),

  // Farmer Module AI Integration
  recommendCropPlanning: (farmerId, data) => api.post(`/complete-ai-integration/farmer/${farmerId}/crop-planning-recommendation`, data),
  predictHarvestTiming: (farmerId, data) => api.post(`/complete-ai-integration/farmer/${farmerId}/harvest-timing-prediction`, data),
  optimizeFarmerResources: (farmerId, data) => api.post(`/complete-ai-integration/farmer/${farmerId}/resource-optimization`, data),
  
  // Crop Module AI Integration
  detectCropDisease: (cropId, data) => api.post(`/complete-ai-integration/crop/${cropId}/disease-detection`, data),
  predictCropYield: (cropId, data) => api.post(`/complete-ai-integration/crop/${cropId}/yield-prediction`, data),
  
  // Livestock Module AI Integration
  monitorLivestockHealth: (livestockId, data) => api.post(`/complete-ai-integration/livestock/${livestockId}/health-monitoring`, data),
  recommendLivestockBreeding: (livestockId, data) => api.post(`/complete-ai-integration/livestock/${livestockId}/breeding-recommendation`, data),
  
  // Inbuilt Modules AI Integration
  optimizeDairyProduction: (dairyId, data) => api.post(`/complete-ai-integration/dairy/${dairyId}/production-optimization`, data),
  monitorPoultryHealth: (poultryId, data) => api.post(`/complete-ai-integration/poultry/${poultryId}/health-monitoring`, data),
  optimizeGoatProduction: (goatId, data) => api.post(`/complete-ai-integration/goat/${goatId}/production-optimization`, data),
  optimizeSheepProduction: (sheepId, data) => api.post(`/complete-ai-integration/sheep/${sheepId}/production-optimization`, data),
  optimizePigProduction: (pigId, data) => api.post(`/complete-ai-integration/pig/${pigId}/production-optimization`, data),
  
  // Bulk AI Integration
  getAIIntegrationStatus: (params) => api.get('/complete-ai-integration/status', { params }),
  forceSyncAllAIIntegrations: (data) => api.post('/complete-ai-integration/force-sync', data),
  getAIModelInfo: () => api.get('/complete-ai-integration/model-info'),
}

export const custodyAPI = {
  appendEvent: (data) => api.post('/custody/events', data),
  getChain: (shipmentId, verify = true) => api.get(`/custody/chain/${shipmentId}`, { params: { verify } }),
  issueSettlementInstruction: (data) => api.post('/custody/settlement/instructions', data),
  confirmSettlementExecution: (instructionId) => api.post(`/custody/settlement/${instructionId}/confirm`),
  getSettlementInstruction: (instructionId) => api.get(`/custody/settlement/${instructionId}`),
  getStateMachine: () => api.get('/custody/state-machine'),
}

export default api
