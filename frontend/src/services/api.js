import axios from 'axios'

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
}

// AI API
export const aiAPI = {
  predictDemand: (data) => api.post('/ai/predict/demand', data),
  optimizePrice: (data) => api.post('/ai/optimize/price', data),
  assessCreditRisk: (data) => api.post('/ai/assess/credit-risk', data),
  detectFraud: (data) => api.post('/ai/detect/fraud', data),
  generateRecommendations: (data) => api.post('/ai/recommend', data),
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

/** GST, hash-chained ledger, schemes, eNWR, freight, risk (053). */
export const financeAPI = {
  classifyGst: (params) => api.get('/finance/gst/classify', { params }),
  buildInvoice: (body) => api.post('/finance/gst/invoice', body),
  ledgerEntry: (body) => api.post('/finance/ledger/entry', body),
  trialBalance: () => api.get('/finance/ledger/trial-balance'),
  verifyLedger: () => api.get('/finance/ledger/verify'),
  matchSchemes: (params) => api.get('/finance/schemes/match', { params }),
  issueEnwr: (body) => api.post('/finance/enwr/issue', body),
  freightRate: (params) => api.get('/finance/freight/rate', { params }),
  equipmentSubsidy: (params) => api.get('/finance/subsidy/equipment', { params }),
  recordRiskEvent: (body) => api.post('/finance/risk/event', body),
  partyRisk: (partyId) => api.get(`/finance/risk/${partyId}`),
  expiringCertificates: (params) => api.get('/finance/certificates/expiring', { params }),
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

/** RFQ, quote outcomes, QC holds, FPO cost centres (056). */
export const rfqAPI = {
  create: (body) => api.post('/rfq/rfq', body),
  bid: (rfqId, body) => api.post(`/rfq/rfq/${rfqId}/bid`, body),
  bids: (rfqId, asBuyer = false) => api.get(`/rfq/rfq/${rfqId}/bids`, { params: { asBuyer } }),
  recordQuoteOutcome: (body) => api.post('/rfq/quotes/outcome', body),
  lossAnalysis: (params) => api.get('/rfq/quotes/loss-analysis', { params }),
  raiseQcHold: (body) => api.post('/rfq/qc/hold', body),
  releaseQcHold: (body) => api.post('/rfq/qc/release', body),
  activeHolds: () => api.get('/rfq/qc/holds'),
  centrePnl: (fpoId) => api.get('/rfq/fpo/centre-pnl', { params: { fpoId } }),
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
  getBuyerProfile: (buyerId) => api.get(`/vendors/buyers/${buyerId}/profile`),
  getCreditStatus: (buyerId) => api.get(`/vendors/buyers/${buyerId}/credit-status`),
  getActiveOrders: (buyerId) => api.get(`/vendors/buyers/${buyerId}/orders`),
  createCorporateOrder: (body) => api.post('/vendors/buyers/orders', body),
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

export default api
