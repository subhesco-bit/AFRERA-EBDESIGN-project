import axios from 'axios';

/**
 * API Client
 * Axios instance configured for EBDESIGN API
 */
// A relative default keeps production browsers on the deployed application
// origin. `localhost` here would send every deployed visitor to their own
// machine when no environment override is present.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Named export alongside the default export below - some pages import
// `{ api }` rather than the default; both refer to the same axios instance.
export { api };

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Core API exports
export const errorMonitoringAPI = {
  logError: (error) => api.post('/monitoring/errors', error),
  getMetrics: () => api.get('/monitoring/metrics'),
};

export const adminSettingsAPI = {
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  upsertSetting: (id, params) => api.get(`/admin-settings/ert-setting${id !== undefined ? '/' + id : ''}`, { params }),
};

export const userAdministrationAPI = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  listUsers: (id, params) => api.get(`/user-administration/users${id !== undefined ? '/' + id : ''}`, { params }),
};

export const moduleCrudAPI = {
  getItems: (module) => api.get(`/modules/${module}`),
  createItem: (module, data) => api.post(`/modules/${module}`, data),
  updateItem: (module, id, data) => api.put(`/modules/${module}/${id}`, data),
  deleteItem: (module, id) => api.delete(`/modules/${module}/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  list: (id, params) => api.get(`/module-crud${id !== undefined ? '/' + id : ''}`, { params }),
};

export const multilingualAPI = {
  getTranslations: (lang) => api.get(`/i18n/${lang}`),
  updateTranslations: (lang, data) => api.put(`/i18n/${lang}`, data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  detect: (id, params) => api.get(`/multilingual/ect${id !== undefined ? '/' + id : ''}`, { params }),
  translate: (id, params) => api.get(`/multilingual/nslate${id !== undefined ? '/' + id : ''}`, { params }),
  getLanguages: (id, params) => api.get(`/multilingual/languages${id !== undefined ? '/' + id : ''}`, { params }),
  getPreferences: (id, params) => api.get(`/multilingual/preferences${id !== undefined ? '/' + id : ''}`, { params }),
  getContent: (id, params) => api.get(`/multilingual/content${id !== undefined ? '/' + id : ''}`, { params }),
  updatePreferences: (data) => api.put('/multilingual/preferences', data),
};

export const conversationalAIAPI = {
  sendMessage: (message) => api.post('/ai/conversational/send', { message }),
  getConversationHistory: () => api.get('/ai/conversational/history'),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getDomains: (id, params) => api.get(`/conversational-ai/domains${id !== undefined ? '/' + id : ''}`, { params }),
  createSession: (data) => api.post('/conversational-ai/session', data),
  respond: (id, params) => api.get(`/conversational-ai/pond${id !== undefined ? '/' + id : ''}`, { params }),
  endSession: (id, params) => api.get(`/conversational-ai/session${id !== undefined ? '/' + id : ''}`, { params }),
};

export const voiceAIAPI = {
  transcribeAudio: (audio) => api.post('/ai/voice/transcribe', { audio }),
  generateSpeech: (text) => api.post('/ai/voice/speak', { text }),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  createSession: (data) => api.post('/voice-ai/session', data),
  getPreferences: (id, params) => api.get(`/voice-ai/preferences${id !== undefined ? '/' + id : ''}`, { params }),
  sendCommand: (data) => api.post('/voice-ai/command', data),
  endSession: (id, params) => api.get(`/voice-ai/session${id !== undefined ? '/' + id : ''}`, { params }),
};

export const aiAgentAPI = {
  getAgents: () => api.get('/ai/agents'),
  createAgent: (data) => api.post('/ai/agents', data),
  executeAgent: (id, data) => api.post(`/ai/agents/${id}/execute`, data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getHealth: (id, params) => api.get(`/ai-agent/health${id !== undefined ? '/' + id : ''}`, { params }),
  executeDecision: (data) => api.post('/ai-agent/decision', data),
  executeTask: (data) => api.post('/ai-agent/task', data),
  coordinateAgents: (id, params) => api.get(`/ai-agent/rdinate-agents${id !== undefined ? '/' + id : ''}`, { params }),
  getAgent: (id, params) => api.get(`/ai-agent/agent${id !== undefined ? '/' + id : ''}`, { params }),
  getAllAgents: (id, params) => api.get(`/ai-agent/all-agents${id !== undefined ? '/' + id : ''}`, { params }),
  registerAgent: (data) => api.post('/ai-agent/agent', data),
  updateAgent: (data) => api.put('/ai-agent/agent', data),
  clearAgentMemory: (id, params) => api.get(`/ai-agent/ar-agent-memory${id !== undefined ? '/' + id : ''}`, { params }),
  registerTool: (data) => api.post('/ai-agent/tool', data),
  getTools: (id, params) => api.get(`/ai-agent/tools${id !== undefined ? '/' + id : ''}`, { params }),
};

export const aiBackboneAPI = {
  getBackboneStatus: () => api.get('/ai/backbone/status'),
  configureBackbone: (data) => api.put('/ai/backbone/config', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAIProviderStatus: (id, params) => api.get(`/ai-backbone/a-iprovider-status${id !== undefined ? '/' + id : ''}`, { params }),
  callAI: (id, params) => api.get(`/ai-backbone/l-ai${id !== undefined ? '/' + id : ''}`, { params }),
  resetAIStatistics: (id, params) => api.get(`/ai-backbone/et-aistatistics${id !== undefined ? '/' + id : ''}`, { params }),
};

export const aiBrainAPI = {
  getBrainState: () => api.get('/ai/brain/state'),
  trainBrain: (data) => api.post('/ai/brain/train', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCognitiveState: (id, params) => api.get(`/ai-brain/cognitive-state${id !== undefined ? '/' + id : ''}`, { params }),
  executeDecision: (data) => api.post('/ai-brain/decision', data),
  processPerception: (data) => api.post('/ai-brain/perception', data),
  processAttention: (data) => api.post('/ai-brain/attention', data),
  processReasoning: (data) => api.post('/ai-brain/reasoning', data),
  processLearning: (data) => api.post('/ai-brain/learning', data),
  processDecision: (data) => api.post('/ai-brain/decision', data),
  processPlanning: (data) => api.post('/ai-brain/planning', data),
  getKnowledgeGraph: (id, params) => api.get(`/ai-brain/knowledge-graph${id !== undefined ? '/' + id : ''}`, { params }),
  getMemoryState: (id, params) => api.get(`/ai-brain/memory-state${id !== undefined ? '/' + id : ''}`, { params }),
  getCognitiveLoad: (id, params) => api.get(`/ai-brain/cognitive-load${id !== undefined ? '/' + id : ''}`, { params }),
};

export const aiAPI = {
  getRecommendations: (context) => api.post('/ai/recommendations', context),
  getInsights: (data) => api.post('/ai/insights', data),
};

export const aiGatewayAPI = {
  getGatewayStatus: () => api.get('/ai/gateway/status'),
  routeRequest: (data) => api.post('/ai/gateway/route', data),
};

export const aiClusterAPI = {
  getClusterStatus: () => api.get('/ai/cluster/status'),
  configureCluster: (data) => api.put('/ai/cluster/config', data),
};

export const aiFabricAPI = {
  getFabricStatus: () => api.get('/ai/fabric/status'),
  weaveConnections: (data) => api.post('/ai/fabric/weave', data),
};

export const aiCollaborationAPI = {
  getCollaborationSessions: () => api.get('/ai/collaboration/sessions'),
  startCollaboration: (data) => api.post('/ai/collaboration/start', data),
};

export const aiCoordinatorAPI = {
  getCoordinatorStatus: () => api.get('/ai/coordinator/status'),
  coordinateAgents: (data) => api.post('/ai/coordinator/coordinate', data),
};

export const aiCopilotAPI = {
  getCopilotSuggestions: (context) => api.post('/ai/copilot/suggestions', context),
  getCopilotActions: (context) => api.post('/ai/copilot/actions', context),
};

export const aiDecisionAPI = {
  getDecisions: () => api.get('/ai/decisions'),
  makeDecision: (data) => api.post('/ai/decisions/make', data),
};

export const aiOptimizationAPI = {
  getOptimizations: () => api.get('/ai/optimizations'),
  runOptimization: (data) => api.post('/ai/optimizations/run', data),
};

export const aiRecoveryAPI = {
  getRecoveryStatus: () => api.get('/ai/recovery/status'),
  initiateRecovery: (data) => api.post('/ai/recovery/initiate', data),
};

export const aiStrategyAPI = {
  getStrategies: () => api.get('/ai/strategies'),
  executeStrategy: (id, data) => api.post(`/ai/strategies/${id}/execute`, data),
};

export const aiProviderAPI = {
  getProviders: () => api.get('/ai/providers'),
  configureProvider: (id, data) => api.put(`/ai/providers/${id}`, data),
};

export const libraryKnowledgeAPI = {
  searchLibrary: (query) => api.post('/library/search', query),
  getLibraryCard: (id) => api.get(`/library/cards/${id}`),
};

export const enhancedLibraryKnowledgeAPI = {
  advancedSearch: (query) => api.post('/library/advanced-search', query),
  getRecommendations: (context) => api.post('/library/recommendations', context),
};

export const gdprAPI = {
  getGDPRStatus: () => api.get('/gdpr/status'),
  processRequest: (data) => api.post('/gdpr/request', data),
};

export const mfaAPI = {
  enableMFA: (data) => api.post('/mfa/enable', data),
  verifyMFA: (data) => api.post('/mfa/verify', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  setup: (id, params) => api.get(`/mfa/up${id !== undefined ? '/' + id : ''}`, { params }),
  verify: (data) => api.post('/mfa', data),
};

export const sessionAPI = {
  getSessions: () => api.get('/sessions'),
  createSession: (data) => api.post('/sessions', data),
  invalidateSession: (id) => api.delete(`/sessions/${id}`),
};

export const unifiedConfigAPI = {
  getConfig: () => api.get('/config'),
  updateConfig: (data) => api.put('/config', data),
};

export const unifiedAIGatewayAPI = {
  getGatewayConfig: () => api.get('/ai/gateway/config'),
  updateGatewayConfig: (data) => api.put('/ai/gateway/config', data),
};

export const platformCoreAPI = {
  getPlatformStatus: () => api.get('/platform/status'),
  getPlatformMetrics: () => api.get('/platform/metrics'),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getScalingRecommendations: (id, params) => api.get(`/platform-core/scaling-recommendations${id !== undefined ? '/' + id : ''}`, { params }),
  getHealth: (id, params) => api.get(`/platform-core/health${id !== undefined ? '/' + id : ''}`, { params }),
};

export const agriculturalIntelligenceAPI = {
  getIntelligenceData: () => api.get('/agricultural-intelligence'),
  analyzeCropData: (data) => api.post('/agricultural-intelligence/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  predictCropYield: (data) => api.post('/agricultural-intelligence/crop-yield', data),
  analyzeSoil: (data) => api.post('/agricultural-intelligence/soil', data),
  getWeatherIntelligence: (id, params) => api.get(`/agricultural-intelligence/weather-intelligence${id !== undefined ? '/' + id : ''}`, { params }),
  predictPestOutbreak: (data) => api.post('/agricultural-intelligence/pest-outbreak', data),
  recommendCrops: (data) => api.post('/agricultural-intelligence/crops', data),
  optimizeIrrigation: (data) => api.post('/agricultural-intelligence/irrigation', data),
  recommendFertilizer: (data) => api.post('/agricultural-intelligence/fertilizer', data),
  getAgriculturalAnalytics: (id, params) => api.get(`/agricultural-intelligence/agricultural-analytics${id !== undefined ? '/' + id : ''}`, { params }),
  healthCheck: (id, params) => api.get(`/agricultural-intelligence/lth-check${id !== undefined ? '/' + id : ''}`, { params }),
};

export const advancedFeaturesAPI = {
  getFeatures: () => api.get('/advanced-features'),
  enableFeature: (id) => api.post(`/advanced-features/${id}/enable`),
};

export const advancedAIService = {
  getAdvancedAICapabilities: () => api.get('/advanced-ai'),
  runAdvancedAI: (data) => api.post('/advanced-ai/run', data),
};

export const FoodIntelligenceEngineAPI = {
  getFoodData: () => api.get('/food-intelligence'),
  analyzeFoodSupply: (data) => api.post('/food-intelligence/analyze', data),
};

export const EnergyCostCalculatorAPI = {
  calculateEnergyCost: (data) => api.post('/energy/calculator', data),
  getEnergyRates: () => api.get('/energy/rates'),
};

export const ecommerceAIAPI = {
  getEcommerceAIInsights: () => api.get('/ecommerce/ai/insights'),
  generateRecommendations: (data) => api.post('/ecommerce/ai/recommendations', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  segmentCustomersRFM: (id, params) => api.get(`/ecommerce-ai/ment-customers-rfm${id !== undefined ? '/' + id : ''}`, { params }),
  segmentCustomersBehavioral: (id, params) => api.get(`/ecommerce-ai/ment-customers-behavioral${id !== undefined ? '/' + id : ''}`, { params }),
  forecastProductDemand: (id, params) => api.get(`/ecommerce-ai/ecast-product-demand${id !== undefined ? '/' + id : ''}`, { params }),
  optimizeInventory: (data) => api.post('/ecommerce-ai/inventory', data),
  getPersonalizedRecommendations: (id, params) => api.get(`/ecommerce-ai/personalized-recommendations${id !== undefined ? '/' + id : ''}`, { params }),
  predictSales: (data) => api.post('/ecommerce-ai/sales', data),
  calculateCustomerLifetimeValue: (data) => api.post('/ecommerce-ai/customer-lifetime-value', data),
  analyzeMarketBasket: (data) => api.post('/ecommerce-ai/market-basket', data),
  getAIAlerts: (id, params) => api.get(`/ecommerce-ai/a-ialerts${id !== undefined ? '/' + id : ''}`, { params }),
  getAIDecisions: (id, params) => api.get(`/ecommerce-ai/a-idecisions${id !== undefined ? '/' + id : ''}`, { params }),
  executeAIDecision: (data) => api.post('/ecommerce-ai/a-idecision', data),
};

export const aiOperationIntelligenceAPI = {
  getOperationIntelligence: () => api.get('/ai/operation-intelligence'),
  analyzeOperations: (data) => api.post('/ai/operation-intelligence/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getMetrics: (id, params) => api.get(`/ai-operation-intelligence/metrics${id !== undefined ? '/' + id : ''}`, { params }),
  executeOptimizationDecision: (data) => api.post('/ai-operation-intelligence/optimization-decision', data),
  analyzePerformance: (data) => api.post('/ai-operation-intelligence/performance', data),
  recommendOptimizations: (data) => api.post('/ai-operation-intelligence/optimizations', data),
  executeOptimizations: (data) => api.post('/ai-operation-intelligence/optimizations', data),
  runOptimizationCycle: (data) => api.post('/ai-operation-intelligence/optimization-cycle', data),
  predictOptimization: (data) => api.post('/ai-operation-intelligence/optimization', data),
  detectAnomalies: (id, params) => api.get(`/ai-operation-intelligence/ect-anomalies${id !== undefined ? '/' + id : ''}`, { params }),
  getContinuousImprovement: (id, params) => api.get(`/ai-operation-intelligence/continuous-improvement${id !== undefined ? '/' + id : ''}`, { params }),
  getStrategies: (id, params) => api.get(`/ai-operation-intelligence/strategies${id !== undefined ? '/' + id : ''}`, { params }),
  addStrategy: (data) => api.post('/ai-operation-intelligence/strategy', data),
  getResourceAllocation: (id, params) => api.get(`/ai-operation-intelligence/resource-allocation${id !== undefined ? '/' + id : ''}`, { params }),
  getOperationHistory: (id, params) => api.get(`/ai-operation-intelligence/operation-history${id !== undefined ? '/' + id : ''}`, { params }),
  getServiceHealth: (id, params) => api.get(`/ai-operation-intelligence/service-health${id !== undefined ? '/' + id : ''}`, { params }),
};

export const productMediaAIAPI = {
  analyzeProductMedia: (data) => api.post('/ai/product-media/analyze', data),
  generateProductMedia: (data) => api.post('/ai/product-media/generate', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getProviderStatus: (id, params) => api.get(`/product-media-ai/provider-status${id !== undefined ? '/' + id : ''}`, { params }),
  generateImage: (data) => api.post('/product-media-ai/image', data),
};

export const nutritionAPI = {
  getNutritionData: () => api.get('/nutrition'),
  analyzeNutrition: (data) => api.post('/nutrition/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getWellnessPractices: (id, params) => api.get(`/nutrition/wellness-practices${id !== undefined ? '/' + id : ''}`, { params }),
  getDietaryProfiles: (id, params) => api.get(`/nutrition/dietary-profiles${id !== undefined ? '/' + id : ''}`, { params }),
  generateRecipe: (data) => api.post('/nutrition/recipe', data),
  getProductNutrition: (id, params) => api.get(`/nutrition/product-nutrition${id !== undefined ? '/' + id : ''}`, { params }),
  getNutritionScore: (id, params) => api.get(`/nutrition/nutrition-score${id !== undefined ? '/' + id : ''}`, { params }),
  getValuePerNutrient: (id, params) => api.get(`/nutrition/value-per-nutrient${id !== undefined ? '/' + id : ''}`, { params }),
};

export const aiSelfHealingAPI = {
  getSelfHealingStatus: () => api.get('/ai/self-healing/status'),
  initiateSelfHealing: (data) => api.post('/ai/self-healing/initiate', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getHealthMetrics: (id, params) => api.get(`/ai-self-healing/health-metrics${id !== undefined ? '/' + id : ''}`, { params }),
  executeHealingDecision: (data) => api.post('/ai-self-healing/healing-decision', data),
  detectError: (id, params) => api.get(`/ai-self-healing/ect-error${id !== undefined ? '/' + id : ''}`, { params }),
  rootCauseAnalysis: (id, params) => api.get(`/ai-self-healing/t-cause-analysis${id !== undefined ? '/' + id : ''}`, { params }),
  executeRecovery: (data) => api.post('/ai-self-healing/recovery', data),
  runHealingCycle: (data) => api.post('/ai-self-healing/healing-cycle', data),
  predictFailures: (data) => api.post('/ai-self-healing/failures', data),
  getHealingHistory: (id, params) => api.get(`/ai-self-healing/healing-history${id !== undefined ? '/' + id : ''}`, { params }),
  addErrorPattern: (data) => api.post('/ai-self-healing/error-pattern', data),
  addRecoveryStrategy: (data) => api.post('/ai-self-healing/recovery-strategy', data),
  getSystemState: (id, params) => api.get(`/ai-self-healing/system-state${id !== undefined ? '/' + id : ''}`, { params }),
  getServiceHealth: (id, params) => api.get(`/ai-self-healing/service-health${id !== undefined ? '/' + id : ''}`, { params }),
};

export const orderAIAPI = {
  getOrderAIInsights: () => api.get('/orders/ai/insights'),
  optimizeOrders: (data) => api.post('/orders/ai/optimize', data),
};

export const logisticsAIAPI = {
  getLogisticsAIInsights: () => api.get('/logistics/ai/insights'),
  optimizeLogistics: (data) => api.post('/logistics/ai/optimize', data),
};

export const insuranceAIAPI = {
  getInsuranceAIInsights: () => api.get('/insurance/ai/insights'),
  assessRisk: (data) => api.post('/insurance/ai/assess', data),
};

export const financialAIAPI = {
  getFinancialAIInsights: () => api.get('/finance/ai/insights'),
  forecastFinance: (data) => api.post('/finance/ai/forecast', data),
};

export const performanceAPI = {
  getMetrics: () => api.get('/performance'),
  getKPIs: () => api.get('/performance/kpis'),
  getPerformanceMetrics: () => api.get('/performance/metrics'),
  analyzePerformance: (data) => api.post('/performance/analyze', data),
};

export const climateAPI = {
  getData: () => api.get('/climate'),
  getForecasts: () => api.get('/climate/forecasts'),
};

export const marketDataAPI = {
  getPrices: () => api.get('/market/prices'),
  getTrends: () => api.get('/market/trends'),
};

export const farmerAPI = {
  getProfile: () => api.get('/farmer/profile'),
  updateProfile: (data) => api.put('/farmer/profile', data),
};

export const productAPI = {
  getProducts: () => api.get('/products'),
  getProduct: (id) => api.get(`/products/${id}`),
};

export const orderAPI = {
  getOrders: () => api.get('/orders'),
  createOrder: (data) => api.post('/orders', data),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  markAllAsRead: (id, params) => api.get(`/notification/k-all-as-read${id !== undefined ? '/' + id : ''}`, { params }),
};

export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
  getReports: () => api.get('/analytics/reports'),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getPlatformStats: (id, params) => api.get(`/analytics/platform-stats${id !== undefined ? '/' + id : ''}`, { params }),
  getInsights: (id, params) => api.get(`/analytics/insights${id !== undefined ? '/' + id : ''}`, { params }),
  getOverview: (id, params) => api.get(`/analytics/overview${id !== undefined ? '/' + id : ''}`, { params }),
};

export const reportAPI = {
  generateReport: (type, params) => api.post('/reports/generate', { type, params }),
  getReports: () => api.get('/reports'),
};

export const documentAPI = {
  uploadDocument: (file) => api.post('/documents/upload', file),
  getDocuments: () => api.get('/documents'),
};

export const messagingAPI = {
  getMessages: () => api.get('/messages'),
  sendMessage: (data) => api.post('/messages', data),
};

export const dashboardAPI = {
  getDashboardData: () => api.get('/dashboard'),
  getWidgetData: (widget) => api.get(`/dashboard/widgets/${widget}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getStats: (id, params) => api.get(`/dashboard/stats${id !== undefined ? '/' + id : ''}`, { params }),
};

// Additional API exports for all pages
export const adminAPI = {
  getAdminData: () => api.get('/admin'),
  manageAdmin: (data) => api.post('/admin/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRecentAudit: (id, params) => api.get(`/admin/recent-audit${id !== undefined ? '/' + id : ''}`, { params }),
};

export const systemAPI = {
  getSystemData: () => api.get('/system'),
  manageSystem: (data) => api.post('/system/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getHealth: (id, params) => api.get(`/system/health${id !== undefined ? '/' + id : ''}`, { params }),
};

export const searchAPI = {
  search: (query) => api.post('/search', query),
  getSearchResults: (id) => api.get(`/search/${id}`),
};

export const animalHealthAPI = {
  getAnimalHealth: () => api.get('/animal-health'),
  manageAnimalHealth: (data) => api.post('/animal-health/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  listExaminations: (id, params) => api.get(`/animal-health/examinations${id !== undefined ? '/' + id : ''}`, { params }),
  listTreatments: (id, params) => api.get(`/animal-health/treatments${id !== undefined ? '/' + id : ''}`, { params }),
  listDiseaseOutbreaks: (id, params) => api.get(`/animal-health/disease-outbreaks${id !== undefined ? '/' + id : ''}`, { params }),
  listQuarantineRecords: (id, params) => api.get(`/animal-health/quarantine-records${id !== undefined ? '/' + id : ''}`, { params }),
  getHealthOverview: (id, params) => api.get(`/animal-health/health-overview${id !== undefined ? '/' + id : ''}`, { params }),
  getActiveOutbreaks: (id, params) => api.get(`/animal-health/active-outbreaks${id !== undefined ? '/' + id : ''}`, { params }),
  getActiveQuarantines: (id, params) => api.get(`/animal-health/active-quarantines${id !== undefined ? '/' + id : ''}`, { params }),
  updateExamination: (data) => api.put('/animal-health/examination', data),
  createExamination: (data) => api.post('/animal-health/examination', data),
  deleteExamination: (id) => api.delete(`/animal-health/examination${id !== undefined ? '/' + id : ''}`),
  updateTreatment: (data) => api.put('/animal-health/treatment', data),
  createTreatment: (data) => api.post('/animal-health/treatment', data),
  updateOutbreak: (data) => api.put('/animal-health/outbreak', data),
  createOutbreak: (data) => api.post('/animal-health/outbreak', data),
  updateQuarantine: (data) => api.put('/animal-health/quarantine', data),
  createQuarantine: (data) => api.post('/animal-health/quarantine', data),
  getRecords: (id, params) => api.get(`/animal-health/records${id !== undefined ? '/' + id : ''}`, { params }),
};

export const assetAccountingAPI = {
  getAssetAccounting: () => api.get('/asset-accounting'),
  manageAssets: (data) => api.post('/asset-accounting/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAssets: (id, params) => api.get(`/asset-accounting/assets${id !== undefined ? '/' + id : ''}`, { params }),
  getDepreciationSchedule: (id, params) => api.get(`/asset-accounting/depreciation-schedule${id !== undefined ? '/' + id : ''}`, { params }),
  generateDepreciationSchedule: (data) => api.post('/asset-accounting/depreciation-schedule', data),
  postDepreciationPeriod: (id, params) => api.get(`/asset-accounting/t-depreciation-period${id !== undefined ? '/' + id : ''}`, { params }),
  runDepreciationForPeriod: (data) => api.post('/asset-accounting/depreciation-for-period', data),
  disposeAsset: (id, params) => api.get(`/asset-accounting/pose-asset${id !== undefined ? '/' + id : ''}`, { params }),
  getAssetRegisterSummary: (id, params) => api.get(`/asset-accounting/asset-register-summary${id !== undefined ? '/' + id : ''}`, { params }),
  createAsset: (data) => api.post('/asset-accounting/asset', data),
};

export const companyAPI = {
  getCompanies: () => api.get('/company'),
  getCompany: (id) => api.get(`/company/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  listCompanies: (id, params) => api.get(`/company/companies${id !== undefined ? '/' + id : ''}`, { params }),
  getFiscalYears: (id, params) => api.get(`/company/fiscal-years${id !== undefined ? '/' + id : ''}`, { params }),
  getChartOfAccounts: (id, params) => api.get(`/company/chart-of-accounts${id !== undefined ? '/' + id : ''}`, { params }),
};

export const authorizationAPI = {
  getAuthorizations: () => api.get('/authorization'),
  checkAuthorization: (data) => api.post('/authorization/check', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRoles: (id, params) => api.get(`/authorization/roles${id !== undefined ? '/' + id : ''}`, { params }),
  getUsers: (id, params) => api.get(`/authorization/users${id !== undefined ? '/' + id : ''}`, { params }),
  getAuditLog: (id, params) => api.get(`/authorization/audit-log${id !== undefined ? '/' + id : ''}`, { params }),
  updateUserRole: (data) => api.put('/authorization/user-role', data),
};

export const ecommerceBusinessSalesAPI = {
  getBusinessSales: () => api.get('/ecommerce/business-sales'),
  analyzeSales: (data) => api.post('/ecommerce/business-sales/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getSalesAnalytics: (id, params) => api.get(`/ecommerce-business-sales/sales-analytics${id !== undefined ? '/' + id : ''}`, { params }),
  getB2BConversionMetrics: (id, params) => api.get(`/ecommerce-business-sales/b2-bconversion-metrics${id !== undefined ? '/' + id : ''}`, { params }),
  createBulkOrder: (data) => api.post('/ecommerce-business-sales/bulk-order', data),
  createContractFarming: (data) => api.post('/ecommerce-business-sales/contract-farming', data),
  acceptQuotation: (id, params) => api.get(`/ecommerce-business-sales/ept-quotation${id !== undefined ? '/' + id : ''}`, { params }),
};

export const walletAPI = {
  getWalletBalance: () => api.get('/wallet'),
  makePayment: (data) => api.post('/wallet/payment', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getTransactions: (id, params) => api.get(`/wallet/transactions${id !== undefined ? '/' + id : ''}`, { params }),
  getWallet: (id, params) => api.get(`/wallet/wallet${id !== undefined ? '/' + id : ''}`, { params }),
  deposit: (id, params) => api.get(`/wallet/osit${id !== undefined ? '/' + id : ''}`, { params }),
  withdraw: (id, params) => api.get(`/wallet/hdraw${id !== undefined ? '/' + id : ''}`, { params }),
  transfer: (id, params) => api.get(`/wallet/nsfer${id !== undefined ? '/' + id : ''}`, { params }),
  getBalance: (id, params) => api.get(`/wallet/balance${id !== undefined ? '/' + id : ''}`, { params }),
};

export const finmanAPI = {
  getFinmanData: () => api.get('/finman'),
  manageFinman: (data) => api.post('/finman/manage', data),
};

export const bankerAPI = {
  getBankerData: () => api.get('/banker'),
  manageBanker: (data) => api.post('/banker/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getPortfolio: (id, params) => api.get(`/banker/portfolio${id !== undefined ? '/' + id : ''}`, { params }),
  getRiskDashboard: (id, params) => api.get(`/banker/risk-dashboard${id !== undefined ? '/' + id : ''}`, { params }),
};

export const biologicalControlAPI = {
  getBiologicalControl: () => api.get('/biological-control'),
  applyBiologicalControl: (data) => api.post('/biological-control/apply', data),
};

export const beekeepingAPI = {
  getBeekeeping: () => api.get('/beekeeping'),
  manageBees: (data) => api.post('/beekeeping/manage', data),
};

export const aquaticFarmingAPI = {
  getAquaticFarming: () => api.get('/aquatic-farming'),
  manageAquatic: (data) => api.post('/aquatic-farming/manage', data),
};

export const subscriptionAPI = {
  getSubscriptions: () => api.get('/subscriptions'),
  createSubscription: (data) => api.post('/subscriptions', data),
};

export const loanAPI = {
  getLoans: () => api.get('/loans'),
  applyForLoan: (data) => api.post('/loans', data),
};

export const insuranceAPI = {
  getPolicies: () => api.get('/insurance/policies'),
  createPolicy: (data) => api.post('/insurance/policies', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getInsuranceProducts: (id, params) => api.get(`/insurance/insurance-products${id !== undefined ? '/' + id : ''}`, { params }),
  getClaims: (id, params) => api.get(`/insurance/claims${id !== undefined ? '/' + id : ''}`, { params }),
  submitClaim: (data) => api.post('/insurance/claim', data),
  calculatePremiumByType: (data) => api.post('/insurance/premium-by-type', data),
  generateQuote: (data) => api.post('/insurance/quote', data),
};

export const logisticsAPI = {
  getShipments: () => api.get('/logistics/shipments'),
  createShipment: (data) => api.post('/logistics/shipments', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getLiveTracking: (id, params) => api.get(`/logistics/live-tracking${id !== undefined ? '/' + id : ''}`, { params }),
  getTemperatureData: (id, params) => api.get(`/logistics/temperature-data${id !== undefined ? '/' + id : ''}`, { params }),
  getTemperatureAlerts: (id, params) => api.get(`/logistics/temperature-alerts${id !== undefined ? '/' + id : ''}`, { params }),
};

export const labAPI = {
  getTests: () => api.get('/lab/tests'),
  createTest: (data) => api.post('/lab/tests', data),
};

export const certificationAPI = {
  getCertifications: () => api.get('/certifications'),
  applyForCertification: (data) => api.post('/certifications', data),
};

export const supportAPI = {
  getTickets: () => api.get('/support/tickets'),
  createTicket: (data) => api.post('/support/tickets', data),
};

export const feedbackAPI = {
  submitFeedback: (data) => api.post('/feedback', data),
  getFeedback: () => api.get('/feedback'),
};

export const resourceAPI = {
  getResources: () => api.get('/resources'),
  getResource: (id) => api.get(`/resources/${id}`),
};

export const trainingAPI = {
  getTrainingModules: () => api.get('/training/modules'),
  getProgress: () => api.get('/training/progress'),
};

export const schemeAPI = {
  getSchemes: () => api.get('/schemes'),
  applyForScheme: (id, data) => api.post(`/schemes/${id}/apply`, data),
};

export const complianceAPI = {
  getComplianceStatus: () => api.get('/compliance/status'),
  submitReport: (data) => api.post('/compliance/reports', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  tdsSummary: (id, params) => api.get(`/compliance/summary${id !== undefined ? '/' + id : ''}`, { params }),
  tdsRates: (id, params) => api.get(`/compliance/rates${id !== undefined ? '/' + id : ''}`, { params }),
  rcmOutstanding: (id, params) => api.get(`/compliance/outstanding${id !== undefined ? '/' + id : ''}`, { params }),
};

export const auditAPI = {
  getAuditLogs: () => api.get('/audit/logs'),
  createAuditEntry: (data) => api.post('/audit/logs', data),
};

export const enterpriseAPI = {
  getEnterprises: () => api.get('/enterprises'),
  getEnterprise: (id) => api.get(`/enterprises/${id}`),
};

export const integrationAPI = {
  getIntegrations: () => api.get('/integrations'),
  configureIntegration: (id, data) => api.put(`/integrations/${id}`, data),
};

export const procurementAPI = {
  getProcurements: () => api.get('/procurements'),
  createProcurement: (data) => api.post('/procurements', data),
};

export const vendorAPI = {
  getVendors: () => api.get('/vendors'),
  getVendor: (id) => api.get(`/vendors/${id}`),
};

export const inventoryAPI = {
  getInventory: () => api.get('/inventory'),
  updateInventory: (id, data) => api.put(`/inventory/${id}`, data),
};

export const warehouseAPI = {
  getWarehouses: () => api.get('/warehouses'),
  getWarehouseStock: (id) => api.get(`/warehouses/${id}/stock`),
};

export const machineryAPI = {
  getMachinery: () => api.get('/machinery'),
  getMaintenance: (id) => api.get(`/machinery/${id}/maintenance`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getTractors: (id, params) => api.get(`/machinery/tractors${id !== undefined ? '/' + id : ''}`, { params }),
  getBookings: (id, params) => api.get(`/machinery/bookings${id !== undefined ? '/' + id : ''}`, { params }),
  updateTractor: (data) => api.put('/machinery/tractor', data),
  createTractor: (data) => api.post('/machinery/tractor', data),
  deleteTractor: (id) => api.delete(`/machinery/tractor${id !== undefined ? '/' + id : ''}`),
  createBooking: (data) => api.post('/machinery/booking', data),
};

export const livestockAPI = {
  getLivestock: () => api.get('/livestock'),
  getHealthRecords: (id) => api.get(`/livestock/${id}/health`),
};

export const soilAPI = {
  getSoilData: () => api.get('/soil'),
  getSoilTests: () => api.get('/soil/tests'),
};

export const weatherAPI = {
  getCurrentWeather: () => api.get('/weather/current'),
  getForecast: () => api.get('/weather/forecast'),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  activeAlerts: (id, params) => api.get(`/weather/ive-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  pestForecast: (id, params) => api.get(`/weather/t-forecast${id !== undefined ? '/' + id : ''}`, { params }),
  coverage: (id, params) => api.get(`/weather/erage${id !== undefined ? '/' + id : ''}`, { params }),
  forecastAccuracy: (id, params) => api.get(`/weather/ecast-accuracy${id !== undefined ? '/' + id : ''}`, { params }),
  dispatchCheck: (id, params) => api.get(`/weather/patch-check${id !== undefined ? '/' + id : ''}`, { params }),
  forArp: (id, params) => api.get(`/weather/arp${id !== undefined ? '/' + id : ''}`, { params }),
  advisoryTriggers: (id, params) => api.get(`/weather/isory-triggers${id !== undefined ? '/' + id : ''}`, { params }),
};

export const schemeBenefitsAPI = {
  getBenefits: () => api.get('/scheme-benefits'),
  checkEligibility: (schemeId) => api.get(`/scheme-benefits/${schemeId}/eligibility`),
};

export const projectAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
};

export const taskAPI = {
  getTasks: () => api.get('/tasks'),
  createTask: (data) => api.post('/tasks', data),
};

export const teamAPI = {
  getTeams: () => api.get('/teams'),
  getTeamMembers: (id) => api.get(`/teams/${id}/members`),
};

export const scheduleAPI = {
  getSchedules: () => api.get('/schedules'),
  createSchedule: (data) => api.post('/schedules', data),
};

export const contractAPI = {
  getContracts: () => api.get('/contracts'),
  createContract: (data) => api.post('/contracts', data),
};

export const budgetAPI = {
  getBudgets: () => api.get('/budgets'),
  createBudget: (data) => api.post('/budgets', data),
};

export const expenseAPI = {
  getExpenses: () => api.get('/expenses'),
  createExpense: (data) => api.post('/expenses', data),
};

export const profitAPI = {
  getProfitAnalysis: () => api.get('/profit'),
  getProfitMargins: () => api.get('/profit/margins'),
};

export const riskAPI = {
  getRisks: () => api.get('/risks'),
  assessRisk: (data) => api.post('/risks/assess', data),
};

export const qualityAPI = {
  getQualityChecks: () => api.get('/quality/checks'),
  createQualityCheck: (data) => api.post('/quality/checks', data),
};

export const maintenanceAPI = {
  getSchedules: () => api.get('/maintenance/schedules'),
  createMaintenance: (data) => api.post('/maintenance/schedules', data),
};

export const safetyAPI = {
  getIncidents: () => api.get('/safety/incidents'),
  reportIncident: (data) => api.post('/safety/incidents', data),
};

export const hrAPI = {
  getEmployees: () => api.get('/hr/employees'),
  getEmployee: (id) => api.get(`/hr/employees/${id}`),
};

export const financeAPI = {
  getFinancialData: () => api.get('/finance'),
  getAccounts: () => api.get('/finance/accounts'),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getMyEnwrReceipts: (id, params) => api.get(`/finance/my-enwr-receipts${id !== undefined ? '/' + id : ''}`, { params }),
  trialBalance: (id, params) => api.get(`/finance/al-balance${id !== undefined ? '/' + id : ''}`, { params }),
  verifyLedger: (data) => api.post('/finance/ledger', data),
};

export const legalAPI = {
  getDocuments: () => api.get('/legal/documents'),
  getContracts: () => api.get('/legal/contracts'),
};

export const supplyChainAPI = {
  getChainData: () => api.get('/supply-chain'),
  trackShipment: (id) => api.get(`/supply-chain/track/${id}`),
};

export const exportAPI = {
  exportData: (type, params) => api.post('/export', { type, params }),
  getExports: () => api.get('/exports'),
};

export const importAPI = {
  importData: (file, type) => api.post('/import', { file, type }),
  getImports: () => api.get('/imports'),
};

export const backupAPI = {
  createBackup: () => api.post('/backup'),
  getBackups: () => api.get('/backups'),
  restoreBackup: (id) => api.post(`/backup/restore/${id}`),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
};

export const securityAPI = {
  getSecuritySettings: () => api.get('/security'),
  updateSecuritySettings: (data) => api.put('/security', data),
};

export const themeAPI = {
  getThemes: () => api.get('/themes'),
  setTheme: (theme) => api.post('/themes', { theme }),
};

export const preferencesAPI = {
  getPreferences: () => api.get('/preferences'),
  updatePreferences: (data) => api.put('/preferences', data),
};

export const filterAPI = {
  getFilters: (entity) => api.get(`/filters/${entity}`),
  saveFilter: (entity, filter) => api.post(`/filters/${entity}`, filter),
};

export const sortAPI = {
  getSortOptions: (entity) => api.get(`/sort/${entity}`),
  applySort: (entity, sort) => api.post(`/sort/${entity}`, sort),
};

export const paginationAPI = {
  getPage: (entity, page, size) => api.get(`/${entity}?page=${page}&size=${size}`),
};

export const validationAPI = {
  validateField: (entity, field, value) => api.post(`/validation/${entity}/${field}`, { value }),
  validateForm: (entity, data) => api.post(`/validation/${entity}`, data),
};

export const fileAPI = {
  uploadFile: (file) => api.post('/files/upload', file),
  downloadFile: (id) => api.get(`/files/${id}`),
  deleteFile: (id) => api.delete(`/files/${id}`),
};

export const imageAPI = {
  uploadImage: (file) => api.post('/images/upload', file),
  getImage: (id) => api.get(`/images/${id}`),
  deleteImage: (id) => api.delete(`/images/${id}`),
};

export const videoAPI = {
  uploadVideo: (file) => api.post('/videos/upload', file),
  getVideo: (id) => api.get(`/videos/${id}`),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
};

export const audioAPI = {
  uploadAudio: (file) => api.post('/audio/upload', file),
  getAudio: (id) => api.get(`/audio/${id}`),
  deleteAudio: (id) => api.delete(`/audio/${id}`),
};

export const chartAPI = {
  getChartData: (type, params) => api.post('/charts/data', { type, params }),
  getChartConfig: (type) => api.get(`/charts/config/${type}`),
};

export const tableAPI = {
  getTableData: (table, params) => api.post('/tables/data', { table, params }),
  exportTable: (table, format) => api.post('/tables/export', { table, format }),
};

export const formAPI = {
  getFormConfig: (form) => api.get(`/forms/${form}`),
  submitForm: (form, data) => api.post(`/forms/${form}`, data),
};

export const workflowAPI = {
  getWorkflows: () => api.get('/workflows'),
  executeWorkflow: (id, data) => api.post(`/workflows/${id}/execute`, data),
};

export const processAPI = {
  getProcesses: () => api.get('/processes'),
  startProcess: (id, data) => api.post(`/processes/${id}/start`, data),
};

export const eventAPI = {
  getEvents: () => api.get('/events'),
  createEvent: (data) => api.post('/events', data),
};

export const alertAPI = {
  getAlerts: () => api.get('/alerts'),
  acknowledgeAlert: (id) => api.put(`/alerts/${id}/acknowledge`),
};

export const widgetAPI = {
  getWidgets: () => api.get('/widgets'),
  configureWidget: (id, config) => api.put(`/widgets/${id}`, config),
};

export const componentAPI = {
  getComponents: () => api.get('/components'),
  getComponent: (id) => api.get(`/components/${id}`),
};

export const layoutAPI = {
  getLayouts: () => api.get('/layouts'),
  getLayout: (id) => api.get(`/layouts/${id}`),
};

export const templateAPI = {
  getTemplates: () => api.get('/templates'),
  getTemplate: (id) => api.get(`/templates/${id}`),
};

export const pluginAPI = {
  getPlugins: () => api.get('/plugins'),
  installPlugin: (id) => api.post(`/plugins/${id}/install`),
};

export const extensionAPI = {
  getExtensions: () => api.get('/extensions'),
  enableExtension: (id) => api.post(`/extensions/${id}/enable`),
};

export const addonAPI = {
  getAddons: () => api.get('/addons'),
  installAddon: (id) => api.post(`/addons/${id}/install`),
};

export const languageAPI = {
  getLanguages: () => api.get('/languages'),
  setLanguage: (code) => api.post('/languages', { code }),
};

export const timezoneAPI = {
  getTimezones: () => api.get('/timezones'),
  setTimezone: (zone) => api.post('/timezones', { zone }),
};

export const currencyAPI = {
  getCurrencies: () => api.get('/currencies'),
  setCurrency: (code) => api.post('/currencies', { code }),
};

export const dateFormatAPI = {
  getFormats: () => api.get('/date-formats'),
  setFormat: (format) => api.post('/date-formats', { format }),
};

export const numberFormatAPI = {
  getFormats: () => api.get('/number-formats'),
  setFormat: (format) => api.post('/number-formats', { format }),
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getProfile: (id, params) => api.get(`/user/profile${id !== undefined ? '/' + id : ''}`, { params }),
  getAddresses: (id, params) => api.get(`/user/addresses${id !== undefined ? '/' + id : ''}`, { params }),
  updateProfile: (data) => api.put('/user/profile', data),
  addAddress: (data) => api.post('/user/address', data),
};

export const roleAPI = {
  getRoles: () => api.get('/roles'),
  getPermissions: (id) => api.get(`/roles/${id}/permissions`),
};

export const permissionAPI = {
  getPermissions: () => api.get('/permissions'),
  checkPermission: (permission) => api.post('/permissions/check', { permission }),
};

export const groupAPI = {
  getGroups: () => api.get('/groups'),
  getGroup: (id) => api.get(`/groups/${id}`),
};

export const organizationAPI = {
  getOrganizations: () => api.get('/organizations'),
  getOrganization: (id) => api.get(`/organizations/${id}`),
};

export const tenantAPI = {
  getTenants: () => api.get('/tenants'),
  getTenant: (id) => api.get(`/tenants/${id}`),
};

export const environmentAPI = {
  getEnvironments: () => api.get('/environments'),
  getEnvironment: (id) => api.get(`/environments/${id}`),
};

export const configurationAPI = {
  getConfigurations: () => api.get('/configurations'),
  getConfiguration: (id) => api.get(`/configurations/${id}`),
};

export const featureAPI = {
  getFeatures: () => api.get('/features'),
  enableFeature: (id) => api.post(`/features/${id}/enable`),
};

export const flagAPI = {
  getFlags: () => api.get('/flags'),
  setFlag: (key, value) => api.post('/flags', { key, value }),
};

export const releaseAPI = {
  getReleases: () => api.get('/releases'),
  getRelease: (id) => api.get(`/releases/${id}`),
};

export const versionAPI = {
  getVersions: () => api.get('/versions'),
  getVersion: (id) => api.get(`/versions/${id}`),
};

export const deploymentAPI = {
  getDeployments: () => api.get('/deployments'),
  deploy: (data) => api.post('/deployments', data),
};

export const infrastructureAPI = {
  getInfrastructure: () => api.get('/infrastructure'),
  getStatus: () => api.get('/infrastructure/status'),
};

export const monitoringAPI = {
  getMetrics: () => api.get('/monitoring/metrics'),
  getLogs: () => api.get('/monitoring/logs'),
};

export const loggingAPI = {
  getLogs: () => api.get('/logging/logs'),
  searchLogs: (query) => api.post('/logging/search', { query }),
};

export const tracingAPI = {
  getTraces: () => api.get('/tracing/traces'),
  getTrace: (id) => api.get(`/tracing/traces/${id}`),
};

export const profilingAPI = {
  getProfiles: () => api.get('/profiling/profiles'),
  getProfile: (id) => api.get(`/profiling/profiles/${id}`),
};

export const debuggingAPI = {
  getDebugInfo: () => api.get('/debugging/info'),
  setDebugMode: (enabled) => api.post('/debugging/mode', { enabled }),
};

export const testingAPI = {
  runTests: (suite) => api.post('/testing/run', { suite }),
  getTestResults: (id) => api.get(`/testing/results/${id}`),
};

export const benchmarkAPI = {
  runBenchmarks: (suite) => api.post('/benchmarking/run', { suite }),
  getBenchmarkResults: (id) => api.get(`/benchmarking/results/${id}`),
};

export const optimizationAPI = {
  getOptimizations: () => api.get('/optimizations'),
  applyOptimization: (id) => api.post(`/optimizations/${id}/apply`),
};

export const scalingAPI = {
  getScalingPolicies: () => api.get('/scaling/policies'),
  applyScalingPolicy: (id) => api.post(`/scaling/policies/${id}/apply`),
};

export const disasterRecoveryAPI = {
  getDisasterRecoveryPlans: () => api.get('/disaster-recovery/plans'),
  executePlan: (id) => api.post(`/disaster-recovery/plans/${id}/execute`),
};

export const securityAuditAPI = {
  getSecurityAudits: () => api.get('/security-audits'),
  runSecurityAudit: () => api.post('/security-audits/run'),
};

export const complianceAuditAPI = {
  getComplianceAudits: () => api.get('/compliance-audits'),
  runComplianceAudit: () => api.post('/compliance-audits/run'),
};

export const governanceAPI = {
  getGovernancePolicies: () => api.get('/governance/policies'),
  updatePolicy: (id, data) => api.put(`/governance/policies/${id}`, data),
};

export const policyAPI = {
  getPolicies: () => api.get('/policies'),
  enforcePolicy: (id) => api.post(`/policies/${id}/enforce`),
};

export const regulationAPI = {
  getRegulations: () => api.get('/regulations'),
  checkCompliance: (id) => api.post(`/regulations/${id}/compliance`),
};

export const auditLogAPI = {
  getAuditLogs: () => api.get('/audit-logs'),
  searchAuditLogs: (query) => api.post('/audit-logs/search', { query }),
};

export const changeLogAPI = {
  getChangeLogs: () => api.get('/change-logs'),
  getChangeLog: (id) => api.get(`/change-logs/${id}`),
};

export const approvalAPI = {
  getApprovals: () => api.get('/approvals'),
  approve: (id) => api.post(`/approvals/${id}/approve`),
};

export const reviewAPI = {
  getReviews: () => api.get('/reviews'),
  submitReview: (id, data) => api.post(`/reviews/${id}`, data),
};

export const signoffAPI = {
  getSignoffs: () => api.get('/signoffs'),
  signoff: (id) => api.post(`/signoffs/${id}`),
};

export const escalationAPI = {
  getEscalations: () => api.get('/escalations'),
  escalate: (id, data) => api.post(`/escalations/${id}`, data),
};

export const incidentAPI = {
  getIncidents: () => api.get('/incidents'),
  createIncident: (data) => api.post('/incidents', data),
};

export const issueAPI = {
  getIssues: () => api.get('/issues'),
  createIssue: (data) => api.post('/issues', data),
};

export const ticketAPI = {
  getTickets: () => api.get('/tickets'),
  createTicket: (data) => api.post('/tickets', data),
};

export const requestAPI = {
  getRequests: () => api.get('/requests'),
  createRequest: (data) => api.post('/requests', data),
};

export const activityAPI = {
  getActivities: () => api.get('/activities'),
  logActivity: (data) => api.post('/activities', data),
};

export const timelineAPI = {
  getTimeline: (entity, id) => api.get(`/timeline/${entity}/${id}`),
  addTimelineEvent: (entity, id, event) => api.post(`/timeline/${entity}/${id}`, event),
};

export const historyAPI = {
  getHistory: (entity, id) => api.get(`/history/${entity}/${id}`),
  getVersion: (entity, id, version) => api.get(`/history/${entity}/${id}/${version}`),
};

export const historyVersionAPI = {
  getVersions: (entity, id) => api.get(`/versions/${entity}/${id}`),
  restoreVersion: (entity, id, version) => api.post(`/versions/${entity}/${id}/${version}/restore`),
};

export const rollbackAPI = {
  getRollbacks: () => api.get('/rollbacks'),
  executeRollback: (id) => api.post(`/rollbacks/${id}/execute`),
};

export const recoveryAPI = {
  getRecoveryPoints: () => api.get('/recovery-points'),
  restoreFromPoint: (id) => api.post(`/recovery-points/${id}/restore`),
};

export const archiveAPI = {
  getArchives: () => api.get('/archives'),
  archive: (entity, id) => api.post(`/archives/${entity}/${id}`),
};

export const retentionAPI = {
  getRetentionPolicies: () => api.get('/retention-policies'),
  applyRetentionPolicy: (id) => api.post(`/retention-policies/${id}/apply`),
};

export const disposalAPI = {
  getDisposalPolicies: () => api.get('/disposal-policies'),
  dispose: (entity, id) => api.post(`/disposal/${entity}/${id}`),
};

export const purgingAPI = {
  getPurgePolicies: () => api.get('/purge-policies'),
  purge: (entity, id) => api.post(`/purge/${entity}/${id}`),
};

export const cleanupAPI = {
  getCleanupTasks: () => api.get('/cleanup-tasks'),
  runCleanup: (id) => api.post(`/cleanup-tasks/${id}/run`),
};

export const updateAPI = {
  getUpdates: () => api.get('/updates'),
  applyUpdate: (id) => api.post(`/updates/${id}/apply`),
};

export const patchAPI = {
  getPatches: () => api.get('/patches'),
  applyPatch: (id) => api.post(`/patches/${id}/apply`),
};

export const upgradeAPI = {
  getUpgrades: () => api.get('/upgrades'),
  performUpgrade: (id) => api.post(`/upgrades/${id}/perform`),
};

export const migrationAPI = {
  getMigrations: () => api.get('/migrations'),
  runMigration: (id) => api.post(`/migrations/${id}/run`),
};

export const seedAPI = {
  getSeeds: () => api.get('/seeds'),
  runSeed: (id) => api.post(`/seeds/${id}/run`),
};

export const syncAPI = {
  getSyncs: () => api.get('/syncs'),
  runSync: (id) => api.post(`/syncs/${id}/run`),
};

export const replicationAPI = {
  getReplications: () => api.get('/replications'),
  setupReplication: (data) => api.post('/replications', data),
};

export const clusteringAPI = {
  getClusters: () => api.get('/clusters'),
  getClusterStatus: (id) => api.get(`/clusters/${id}/status`),
};

export const loadBalancingAPI = {
  getLoadBalancers: () => api.get('/load-balancers'),
  configureLoadBalancer: (id, config) => api.put(`/load-balancers/${id}`, config),
};

export const cachingAPI = {
  getCacheStats: () => api.get('/cache/stats'),
  clearCache: (pattern) => api.post('/cache/clear', { pattern }),
};

export const rateLimitAPI = {
  getRateLimits: () => api.get('/rate-limits'),
  configureRateLimit: (id, config) => api.put(`/rate-limits/${id}`, config),
};

export const throttlingAPI = {
  getThrottlingRules: () => api.get('/throttling-rules'),
  configureThrottling: (id, config) => api.put(`/throttling-rules/${id}`, config),
};

export const quotaAPI = {
  getQuotas: () => api.get('/quotas'),
  setQuota: (id, quota) => api.put(`/quotas/${id}`, quota),
};

export const limitAPI = {
  getLimits: () => api.get('/limits'),
  setLimit: (id, limit) => api.put(`/limits/${id}`, limit),
};

export const capAPI = {
  getCaps: () => api.get('/caps'),
  setCap: (id, cap) => api.put(`/caps/${id}`, cap),
};

export const circuitBreakerAPI = {
  getCircuitBreakers: () => api.get('/circuit-breakers'),
  configureCircuitBreaker: (id, config) => api.put(`/circuit-breakers/${id}`, config),
};

export const retryAPI = {
  getRetryPolicies: () => api.get('/retry-policies'),
  configureRetry: (id, config) => api.put(`/retry-policies/${id}`, config),
};

export const timeoutAPI = {
  getTimeouts: () => api.get('/timeouts'),
  configureTimeout: (id, timeout) => api.put(`/timeouts/${id}`, timeout),
};

export const fallbackAPI = {
  getFallbacks: () => api.get('/fallbacks'),
  configureFallback: (id, config) => api.put(`/fallbacks/${id}`, config),
};

export const degradationAPI = {
  getDegradationStrategies: () => api.get('/degradation-strategies'),
  activateStrategy: (id) => api.post(`/degradation-strategies/${id}/activate`),
};

export const isolationAPI = {
  getIsolationPolicies: () => api.get('/isolation-policies'),
  isolateService: (id) => api.post(`/isolation-policies/${id}/isolate`),
};

export const containmentAPI = {
  getContainmentStrategies: () => api.get('/containment-strategies'),
  containIssue: (id) => api.post(`/containment-strategies/${id}/contain`),
};

export const resilienceAPI = {
  getResilienceMetrics: () => api.get('/resilience/metrics'),
  runResilienceTest: (id) => api.post(`/resilience/tests/${id}/run`),
};

export const chaosAPI = {
  getChaosExperiments: () => api.get('/chaos/experiments'),
  runExperiment: (id) => api.post(`/chaos/experiments/${id}/run`),
};

export const stressAPI = {
  getStressTests: () => api.get('/stress-tests'),
  runStressTest: (id) => api.post(`/stress-tests/${id}/run`),
};

export const loadAPI = {
  getLoadTests: () => api.get('/load-tests'),
  runLoadTest: (id) => api.post(`/load-tests/${id}/run`),
};

export const penetrationAPI = {
  getPenetrationTests: () => api.get('/penetration-tests'),
  runPenetrationTest: (id) => api.post(`/penetration-tests/${id}/run`),
};

export const vulnerabilityAPI = {
  getVulnerabilities: () => api.get('/vulnerabilities'),
  scanVulnerabilities: () => api.post('/vulnerabilities/scan'),
};

export const securityScanAPI = {
  getSecurityScans: () => api.get('/security-scans'),
  runSecurityScan: () => api.post('/security-scans/run'),
};

export const complianceCheckAPI = {
  getComplianceChecks: () => api.get('/compliance-checks'),
  runComplianceCheck: (id) => api.post(`/compliance-checks/${id}/run`),
};

export const auditCheckAPI = {
  getAuditChecks: () => api.get('/audit-checks'),
  runAuditCheck: (id) => api.post(`/audit-checks/${id}/run`),
};

export const logAnalysisAPI = {
  getLogAnalyses: () => api.get('/log-analyses'),
  runLogAnalysis: (data) => api.post('/log-analyses/run', data),
};

export const metricAnalysisAPI = {
  getMetricAnalyses: () => api.get('/metric-analyses'),
  runMetricAnalysis: (data) => api.post('/metric-analyses/run', data),
};

export const trendAnalysisAPI = {
  getTrendAnalyses: () => api.get('/trend-analyses'),
  runTrendAnalysis: (data) => api.post('/trend-analyses/run', data),
};

export const anomalyDetectionAPI = {
  getAnomalies: () => api.get('/anomalies'),
  detectAnomalies: (data) => api.post('/anomalies/detect', data),
};

export const patternRecognitionAPI = {
  getPatterns: () => api.get('/patterns'),
  recognizePatterns: (data) => api.post('/patterns/recognize', data),
};

export const predictiveAnalysisAPI = {
  getPredictions: () => api.get('/predictions'),
  generatePrediction: (data) => api.post('/predictions/generate', data),
};

export const mlModelAPI = {
  getModels: () => api.get('/ml-models'),
  trainModel: (id, data) => api.post(`/ml-models/${id}/train`, data),
};

export const aiModelAPI = {
  getAIModels: () => api.get('/ai-models'),
  invokeAIModel: (id, data) => api.post(`/ai-models/${id}/invoke`, data),
};

export const nlpAPI = {
  getNLPModels: () => api.get('/nlp-models'),
  processText: (id, text) => api.post(`/nlp-models/${id}/process`, { text }),
};

export const cvAPI = {
  getCVModels: () => api.get('/cv-models'),
  processImage: (id, image) => api.post(`/cv-models/${id}/process`, { image }),
};

export const speechAPI = {
  getSpeechModels: () => api.get('/speech-models'),
  processAudio: (id, audio) => api.post(`/speech-models/${id}/process`, { audio }),
};

export const recommendationAPI = {
  getRecommendations: () => api.get('/recommendations'),
  generateRecommendation: (data) => api.post('/recommendations/generate', data),
};

export const personalizationAPI = {
  getPersonalizations: () => api.get('/personalizations'),
  updatePersonalization: (id, data) => api.put(`/personalizations/${id}`, data),
};

export const adaptiveAPI = {
  getAdaptiveStrategies: () => api.get('/adaptive-strategies'),
  applyStrategy: (id) => api.post(`/adaptive-strategies/${id}/apply`),
};

export const learningAPI = {
  getLearningModels: () => api.get('/learning-models'),
  trainModel: (id, data) => api.post(`/learning-models/${id}/train`, data),
};

export const evolutionAPI = {
  getEvolutionStrategies: () => api.get('/evolution-strategies'),
  evolve: (id) => api.post(`/evolution-strategies/${id}/evolve`),
};

export const automationAPI = {
  getAutomations: () => api.get('/automations'),
  runAutomation: (id) => api.post(`/automations/${id}/run`),
};

export const orchestrationAPI = {
  getOrchestrations: () => api.get('/orchestrations'),
  runOrchestration: (id, data) => api.post(`/orchestrations/${id}/run`, data),
};

export const coordinationAPI = {
  getCoordinations: () => api.get('/coordinations'),
  coordinate: (id, data) => api.post(`/coordinations/${id}`, data),
};

export const collaborationAPI = {
  getCollaborations: () => api.get('/collaborations'),
  collaborate: (id, data) => api.post(`/collaborations/${id}`, data),
};

export const communicationAPI = {
  getCommunications: () => api.get('/communications'),
  communicate: (id, data) => api.post(`/communications/${id}`, data),
};

export const connectorAPI = {
  getConnectors: () => api.get('/connectors'),
  connect: (id) => api.post(`/connectors/${id}/connect`),
};

export const adapterAPI = {
  getAdapters: () => api.get('/adapters'),
  configureAdapter: (id, config) => api.put(`/adapters/${id}`, config),
};

export const transformerAPI = {
  getTransformers: () => api.get('/transformers'),
  transform: (id, data) => api.post(`/transformers/${id}`, data),
};

export const validatorAPI = {
  getValidators: () => api.get('/validators'),
  validate: (id, data) => api.post(`/validators/${id}`, data),
};

export const normalizerAPI = {
  getNormalizers: () => api.get('/normalizers'),
  normalize: (id, data) => api.post(`/normalizers/${id}`, data),
};

export const aggregatorAPI = {
  getAggregators: () => api.get('/aggregators'),
  aggregate: (id, data) => api.post(`/aggregators/${id}`, data),
};

export const disseminatorAPI = {
  getDisseminators: () => api.get('/disseminators'),
  disseminate: (id, data) => api.post(`/disseminators/${id}`, data),
};

export const routerAPI = {
  getRoutes: () => api.get('/routes'),
  configureRoute: (id, config) => api.put(`/routes/${id}`, config),
};

export const gatewayAPI = {
  getGateways: () => api.get('/gateways'),
  configureGateway: (id, config) => api.put(`/gateways/${id}`, config),
};

export const proxyAPI = {
  getProxies: () => api.get('/proxies'),
  configureProxy: (id, config) => api.put(`/proxies/${id}`, config),
};

export const serviceMeshAPI = {
  getServiceMeshes: () => api.get('/service-meshes'),
  configureServiceMesh: (id, config) => api.put(`/service-meshes/${id}`, config),
};

export const sidecarAPI = {
  getSidecars: () => api.get('/sidecars'),
  deploySidecar: (id, data) => api.post(`/sidecars/${id}`, data),
};

export const ambassadorAPI = {
  getAmbassadors: () => api.get('/ambassadors'),
  configureAmbassador: (id, config) => api.put(`/ambassadors/${id}`, config),
};

export const envoyAPI = {
  getEnvoys: () => api.get('/envoys'),
  configureEnvoy: (id, config) => api.put(`/envoys/${id}`, config),
};

export const istioAPI = {
  getIstioConfigs: () => api.get('/istio-configs'),
  configureIstio: (id, config) => api.put(`/istio-configs/${id}`, config),
};

export const linkerdAPI = {
  getLinkerdConfigs: () => api.get('/linkerd-configs'),
  configureLinkerd: (id, config) => api.put(`/linkerd-configs/${id}`, config),
};

export const consulAPI = {
  getConsulConfigs: () => api.get('/consul-configs'),
  configureConsul: (id, config) => api.put(`/consul-configs/${id}`, config),
};

export const etcdAPI = {
  getEtcdData: () => api.get('/etcd-data'),
  setEtcdData: (key, value) => api.put('/etcd-data', { key, value }),
};

export const zookeeperAPI = {
  getZookeeperData: () => api.get('/zookeeper-data'),
  setZookeeperData: (path, data) => api.put('/zookeeper-data', { path, data }),
};

export const kafkaAPI = {
  getKafkaTopics: () => api.get('/kafka-topics'),
  produceToTopic: (topic, message) => api.post('/kafka-topics/produce', { topic, message }),
};

export const rabbitMQAPI = {
  getRabbitMQQueues: () => api.get('/rabbitmq-queues'),
  publishToQueue: (queue, message) => api.post('/rabbitmq-queues/publish', { queue, message }),
};

export const redisAPI = {
  getRedisData: () => api.get('/redis-data'),
  setRedisData: (key, value) => api.put('/redis-data', { key, value }),
};

export const memcachedAPI = {
  getMemcachedData: () => api.get('/memcached-data'),
  setMemcachedData: (key, value) => api.put('/memcached-data', { key, value }),
};

export const elasticsearchAPI = {
  getElasticsearchData: () => api.get('/elasticsearch-data'),
  searchElasticsearch: (index, query) => api.post('/elasticsearch-data/search', { index, query }),
};

export const mongodbAPI = {
  getMongoDBData: () => api.get('/mongodb-data'),
  queryMongoDB: (collection, query) => api.post('/mongodb-data/query', { collection, query }),
};

export const cassandraAPI = {
  getCassandraData: () => api.get('/cassandra-data'),
  queryCassandra: (table, query) => api.post('/cassandra-data/query', { table, query }),
};

export const dynamodbAPI = {
  getDynamoDBData: () => api.get('/dynamodb-data'),
  queryDynamoDB: (table, query) => api.post('/dynamodb-data/query', { table, query }),
};

export const cosmosDBAPI = {
  getCosmosDBData: () => api.get('/cosmosdb-data'),
  queryCosmosDB: (container, query) => api.post('/cosmosdb-data/query', { container, query }),
};

export const firestoreAPI = {
  getFirestoreData: () => api.get('/firestore-data'),
  queryFirestore: (collection, query) => api.post('/firestore-data/query', { collection, query }),
};

export const firebaseRealtimeAPI = {
  getFirebaseRealtimeData: () => api.get('/firebase-realtime-data'),
  setFirebaseRealtimeData: (path, data) => api.put('/firebase-realtime-data', { path, data }),
};

export const storageAPI = {
  getStorageBuckets: () => api.get('/storage-buckets'),
  uploadToStorage: (bucket, file) => api.post('/storage-buckets/upload', { bucket, file }),
};

export const cdnAPI = {
  getCDNData: () => api.get('/cdn-data'),
  invalidateCDN: (url) => api.post('/cdn-data/invalidate', { url }),
};

export const edgeAPI = {
  getEdgeLocations: () => api.get('/edge-locations'),
  configureEdge: (id, config) => api.put(`/edge-locations/${id}`, config),
};

export const peerAPI = {
  getPeers: () => api.get('/peers'),
  connectPeer: (id) => api.post(`/peers/${id}/connect`),
};

export const blockchainAPI = {
  getBlockchainData: () => api.get('/blockchain-data'),
  createTransaction: (data) => api.post('/blockchain-data/transactions', data),
};

export const smartContractAPI = {
  getSmartContracts: () => api.get('/smart-contracts'),
  deploySmartContract: (data) => api.post('/smart-contracts/deploy', data),
};

export const nftAPI = {
  getNFTs: () => api.get('/nfts'),
  mintNFT: (data) => api.post('/nfts/mint', data),
};

export const defiAPI = {
  getDefiData: () => api.get('/defi-data'),
  executeDefiTransaction: (data) => api.post('/defi-data/transactions', data),
};

export const daoAPI = {
  getDAOs: () => api.get('/daos'),
  participateInDAO: (id, data) => api.post(`/daos/${id}/participate`, data),
};

export const identityAPI = {
  getIdentities: () => api.get('/identities'),
  createIdentity: (data) => api.post('/identities', data),
};

export const credentialAPI = {
  getCredentials: () => api.get('/credentials'),
  issueCredential: (data) => api.post('/credentials/issue', data),
};

export const attestationAPI = {
  getAttestations: () => api.get('/attestations'),
  createAttestation: (data) => api.post('/attestations', data),
};

export const verificationAPI = {
  getVerifications: () => api.get('/verifications'),
  verifyEntity: (id) => api.post(`/verifications/${id}/verify`),
};

export const provenanceAPI = {
  getProvenanceData: () => api.get('/provenance-data'),
  trackProvenance: (id) => api.get(`/provenance-data/${id}/track`),
};

export const privacyAPI = {
  getPrivacySettings: () => api.get('/privacy-settings'),
  updatePrivacySettings: (data) => api.put('/privacy-settings', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  recordConsent: (data) => api.post('/privacy/consent', data),
};

export const consentAPI = {
  getConsents: () => api.get('/consents'),
  giveConsent: (id, data) => api.post(`/consents/${id}`, data),
};

export const dataSubjectAPI = {
  getDataSubjects: () => api.get('/data-subjects'),
  processRequest: (id, data) => api.post(`/data-subjects/${id}`, data),
};

export const rightAPI = {
  getRights: () => api.get('/rights'),
  exerciseRight: (id, data) => api.post(`/rights/${id}`, data),
};

export const breachAPI = {
  getBreaches: () => api.get('/breaches'),
  reportBreach: (data) => api.post('/breaches', data),
};

// Additional missing API exports for all pages
export const digitalTwinAPI = {
  getDigitalTwin: () => api.get('/digital-twin'),
  createDigitalTwin: (data) => api.post('/digital-twin', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getStatus: (id, params) => api.get(`/digital-twin/status${id !== undefined ? '/' + id : ''}`, { params }),
  getTwins: (id, params) => api.get(`/digital-twin/twins${id !== undefined ? '/' + id : ''}`, { params }),
  runSimulation: (data) => api.post('/digital-twin/simulation', data),
  syncRealData: (data) => api.post('/digital-twin/real-data', data),
};

export const healthAPI = {
  getHealth: () => api.get('/health'),
  checkHealth: () => api.post('/health/check'),
};

export const harvestingAPI = {
  getHarvesting: () => api.get('/harvesting'),
  scheduleHarvest: (data) => api.post('/harvesting/schedule', data),
};

export const greenhouseManagementAPI = {
  getGreenhouseManagement: () => api.get('/greenhouse-management'),
  manageGreenhouse: (id, data) => api.put(`/greenhouse-management/${id}`, data),
};

export const foodProcessingAPI = {
  getFoodProcessing: () => api.get('/food-processing'),
  processFood: (data) => api.post('/food-processing/process', data),
};

export const fertilizerManagementAPI = {
  getFertilizerManagement: () => api.get('/fertilizer-management'),
  manageFertilizer: (data) => api.post('/fertilizer-management/manage', data),
};

export const farmCostingAPI = {
  getFarmCosting: () => api.get('/farm-costing'),
  calculateCosts: (data) => api.post('/farm-costing/calculate', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRecords: (id, params) => api.get(`/farm-costing/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/farm-costing/record', data),
  deleteRecord: (id) => api.delete(`/farm-costing/record${id !== undefined ? '/' + id : ''}`),
};

export const farmerAPI2 = {
  getFarmers: () => api.get('/farmer'),
  getFarmer: (id) => api.get(`/farmer/${id}`),
};

export const farmerFamilyAPI = {
  getFarmerFamilies: () => api.get('/farmer-family'),
  addFamilyMember: (data) => api.post('/farmer-family/add', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getMembers: (id, params) => api.get(`/farmer-family/members${id !== undefined ? '/' + id : ''}`, { params }),
  createMember: (data) => api.post('/farmer-family/member', data),
  updateMember: (data) => api.put('/farmer-family/member', data),
  deleteMember: (id) => api.delete(`/farmer-family/member${id !== undefined ? '/' + id : ''}`),
};

export const farmAnalyticsAPI = {
  getFarmAnalytics: () => api.get('/farm-analytics'),
  analyzeFarm: (data) => api.post('/farm-analytics/analyze', data),
};

export const experienceAPI = {
  getExperiences: () => api.get('/experience'),
  addExperience: (data) => api.post('/experience/add', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  themes: (id, params) => api.get(`/experience/mes${id !== undefined ? '/' + id : ''}`, { params }),
  motion: (id, params) => api.get(`/experience/ion${id !== undefined ? '/' + id : ''}`, { params }),
  components: (id, params) => api.get(`/experience/ponents${id !== undefined ? '/' + id : ''}`, { params }),
  accessibility: (id, params) => api.get(`/experience/essibility${id !== undefined ? '/' + id : ''}`, { params }),
  contrast: (id, params) => api.get(`/experience/trast${id !== undefined ? '/' + id : ''}`, { params }),
};

export const escrowAPI = {
  getEscrows: () => api.get('/escrow'),
  createEscrow: (data) => api.post('/escrow', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  list: (id, params) => api.get(`/escrow${id !== undefined ? '/' + id : ''}`, { params }),
  release: (id, params) => api.get(`/escrow/ease${id !== undefined ? '/' + id : ''}`, { params }),
  refund: (id, params) => api.get(`/escrow/und${id !== undefined ? '/' + id : ''}`, { params }),
};

export const equipmentExchangeAPI = {
  getEquipmentExchange: () => api.get('/equipment-exchange'),
  exchangeEquipment: (data) => api.post('/equipment-exchange/exchange', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  createListing: (data) => api.post('/equipment-exchange/listing', data),
  listAvailable: (id, params) => api.get(`/equipment-exchange/available${id !== undefined ? '/' + id : ''}`, { params }),
  getListing: (id, params) => api.get(`/equipment-exchange/listing${id !== undefined ? '/' + id : ''}`, { params }),
  reserveListing: (id, params) => api.get(`/equipment-exchange/erve-listing${id !== undefined ? '/' + id : ''}`, { params }),
  completeExchange: (id, params) => api.get(`/equipment-exchange/plete-exchange${id !== undefined ? '/' + id : ''}`, { params }),
  withdrawListing: (id, params) => api.get(`/equipment-exchange/hdraw-listing${id !== undefined ? '/' + id : ''}`, { params }),
};

export const enterpriseRouteSupportAPI = {
  getEnterpriseRouteSupport: () => api.get('/enterprise-route-support'),
  supportRoute: (data) => api.post('/enterprise-route-support/support', data),
};

export const enterpriseIntegrationAPI = {
  getEnterpriseIntegration: () => api.get('/enterprise-integration'),
  integrateEnterprise: (data) => api.post('/enterprise-integration/integrate', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCurrentOrganizationIntegrations: (id, params) => api.get(`/enterprise-integration/current-organization-integrations${id !== undefined ? '/' + id : ''}`, { params }),
  getSystemStatus: (id, params) => api.get(`/enterprise-integration/system-status${id !== undefined ? '/' + id : ''}`, { params }),
  getIntegrationHealth: (id, params) => api.get(`/enterprise-integration/integration-health${id !== undefined ? '/' + id : ''}`, { params }),
};

export const enterpriseAIAPI = {
  getEnterpriseAI: () => api.get('/enterprise-ai'),
  runEnterpriseAI: (data) => api.post('/enterprise-ai/run', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCreditScore: (id, params) => api.get(`/enterprise-ai/credit-score${id !== undefined ? '/' + id : ''}`, { params }),
  getSchemeEligibility: (id, params) => api.get(`/enterprise-ai/scheme-eligibility${id !== undefined ? '/' + id : ''}`, { params }),
  getModelSlots: (id, params) => api.get(`/enterprise-ai/model-slots${id !== undefined ? '/' + id : ''}`, { params }),
  getUnservedIntents: (id, params) => api.get(`/enterprise-ai/unserved-intents${id !== undefined ? '/' + id : ''}`, { params }),
  upsertModelSlot: (id, params) => api.get(`/enterprise-ai/ert-model-slot${id !== undefined ? '/' + id : ''}`, { params }),
  query: (id, params) => api.get(`/enterprise-ai/ry${id !== undefined ? '/' + id : ''}`, { params }),
};

export const engineeringProjectAPI = {
  getEngineeringProjects: () => api.get('/engineering-project'),
  createProject: (data) => api.post('/engineering-project', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  listProjects: (id, params) => api.get(`/engineering-project/projects${id !== undefined ? '/' + id : ''}`, { params }),
  getProject: (id, params) => api.get(`/engineering-project/project${id !== undefined ? '/' + id : ''}`, { params }),
  updateProjectPhase: (data) => api.put('/engineering-project/project-phase', data),
  createCostEstimate: (data) => api.post('/engineering-project/cost-estimate', data),
  getCostEstimates: (id, params) => api.get(`/engineering-project/cost-estimates${id !== undefined ? '/' + id : ''}`, { params }),
};

export const energyAPI = {
  getEnergy: () => api.get('/energy'),
  manageEnergy: (data) => api.post('/energy/manage', data),
};

export const ecommerceAPI = {
  getEcommerce: () => api.get('/ecommerce'),
  manageEcommerce: (data) => api.post('/ecommerce/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getListings: (id, params) => api.get(`/ecommerce/listings${id !== undefined ? '/' + id : ''}`, { params }),
  getGIListings: (id, params) => api.get(`/ecommerce/g-ilistings${id !== undefined ? '/' + id : ''}`, { params }),
  getSellerListings: (id, params) => api.get(`/ecommerce/seller-listings${id !== undefined ? '/' + id : ''}`, { params }),
  getSellerAnalytics: (id, params) => api.get(`/ecommerce/seller-analytics${id !== undefined ? '/' + id : ''}`, { params }),
  getPriceTrends: (id, params) => api.get(`/ecommerce/price-trends${id !== undefined ? '/' + id : ''}`, { params }),
  updateListing: (data) => api.put('/ecommerce/listing', data),
  createListing: (data) => api.post('/ecommerce/listing', data),
  deleteListing: (id) => api.delete(`/ecommerce/listing${id !== undefined ? '/' + id : ''}`),
};

export const ecommerceMarketingAPI = {
  getEcommerceMarketing: () => api.get('/ecommerce-marketing'),
  runMarketingCampaign: (data) => api.post('/ecommerce-marketing/campaign', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getMarketingAnalytics: (id, params) => api.get(`/ecommerce-marketing/marketing-analytics${id !== undefined ? '/' + id : ''}`, { params }),
  getSponsoredProducts: (id, params) => api.get(`/ecommerce-marketing/sponsored-products${id !== undefined ? '/' + id : ''}`, { params }),
};

export const ecommerceIntegrationAPI = {
  getEcommerceIntegration: () => api.get('/ecommerce-integration'),
  integrateEcommerce: (data) => api.post('/ecommerce-integration/integrate', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  calculateNutritionScore: (data) => api.post('/ecommerce-integration/nutrition-score', data),
  getNutritionPricePremium: (id, params) => api.get(`/ecommerce-integration/nutrition-price-premium${id !== undefined ? '/' + id : ''}`, { params }),
  getRecipeSuggestions: (id, params) => api.get(`/ecommerce-integration/recipe-suggestions${id !== undefined ? '/' + id : ''}`, { params }),
  getRecipeProducts: (id, params) => api.get(`/ecommerce-integration/recipe-products${id !== undefined ? '/' + id : ''}`, { params }),
  getHealthRecommendations: (id, params) => api.get(`/ecommerce-integration/health-recommendations${id !== undefined ? '/' + id : ''}`, { params }),
  checkCompatibility: (data) => api.post('/ecommerce-integration/compatibility', data),
  calculateCartNutrition: (data) => api.post('/ecommerce-integration/cart-nutrition', data),
  getDietitianCollections: (id, params) => api.get(`/ecommerce-integration/dietitian-collections${id !== undefined ? '/' + id : ''}`, { params }),
  getDietitianRecommendation: (id, params) => api.get(`/ecommerce-integration/dietitian-recommendation${id !== undefined ? '/' + id : ''}`, { params }),
};

export const ecommerceERPAPI = {
  getEcommerceERP: () => api.get('/ecommerce-erp'),
  configureERP: (data) => api.put('/ecommerce-erp/configure', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  postToGeneralLedger: (id, params) => api.get(`/ecommerce-erp/t-to-general-ledger${id !== undefined ? '/' + id : ''}`, { params }),
  generateGSTInvoice: (data) => api.post('/ecommerce-erp/g-stinvoice', data),
  syncInventoryWithERP: (data) => api.post('/ecommerce-erp/inventory-with-erp', data),
  syncCustomerWithCRM: (data) => api.post('/ecommerce-erp/customer-with-crm', data),
  createProductionOrder: (data) => api.post('/ecommerce-erp/production-order', data),
};

export const dprGenerationAPI = {
  getDPRGeneration: () => api.get('/dpr-generation'),
  generateDPR: (data) => api.post('/dpr-generation/generate', data),
};

export const dietTherapyAPI = {
  getDietTherapy: () => api.get('/diet-therapy'),
  prescribeDiet: (data) => api.post('/diet-therapy/prescribe', data),
};

export const demandAPI = {
  getDemand: () => api.get('/demand'),
  forecastDemand: (data) => api.post('/demand/forecast', data),
};

export const defenseFitnessPrepAPI = {
  getDefenseFitnessPrep: () => api.get('/defense-fitness-prep'),
  prepareDefense: (data) => api.post('/defense-fitness-prep/prepare', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCategories: (id, params) => api.get(`/defense-fitness-prep/categories${id !== undefined ? '/' + id : ''}`, { params }),
  getReadiness: (id, params) => api.get(`/defense-fitness-prep/readiness${id !== undefined ? '/' + id : ''}`, { params }),
  recordAttempt: (data) => api.post('/defense-fitness-prep/attempt', data),
};

export const decisionSupportAPI = {
  getDecisionSupport: () => api.get('/decision-support'),
  makeDecision: (data) => api.post('/decision-support/make', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  corpCreditEligible: (id, params) => api.get(`/decision-support/p-credit-eligible${id !== undefined ? '/' + id : ''}`, { params }),
  floorBenchmark: (id, params) => api.get(`/decision-support/or-benchmark${id !== undefined ? '/' + id : ''}`, { params }),
  ecoLogisticsMiles: (id, params) => api.get(`/decision-support/logistics-miles${id !== undefined ? '/' + id : ''}`, { params }),
  harvestPoints: (id, params) => api.get(`/decision-support/vest-points${id !== undefined ? '/' + id : ''}`, { params }),
  allocScore: (id, params) => api.get(`/decision-support/oc-score${id !== undefined ? '/' + id : ''}`, { params }),
  compostPlan: (id, params) => api.get(`/decision-support/post-plan${id !== undefined ? '/' + id : ''}`, { params }),
  schemeExpiryStatus: (id, params) => api.get(`/decision-support/eme-expiry-status${id !== undefined ? '/' + id : ''}`, { params }),
  complianceGaps: (id, params) => api.get(`/decision-support/pliance-gaps${id !== undefined ? '/' + id : ''}`, { params }),
};

export const dataVisualizationAPI = {
  getDataVisualization: () => api.get('/data-visualization'),
  visualizeData: (data) => api.post('/data-visualization/visualize', data),
};

export const dashboardAPI2 = {
  getDashboard: () => api.get('/dashboard'),
  getDashboardData: (id) => api.get(`/dashboard/${id}`),
};

export const dairyAPI = {
  getDairy: () => api.get('/dairy'),
  manageDairy: (data) => api.post('/dairy/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAnimals: (id, params) => api.get(`/dairy/animals${id !== undefined ? '/' + id : ''}`, { params }),
  getMilkRecords: (id, params) => api.get(`/dairy/milk-records${id !== undefined ? '/' + id : ''}`, { params }),
  updateAnimal: (data) => api.put('/dairy/animal', data),
  createAnimal: (data) => api.post('/dairy/animal', data),
  deleteAnimal: (id) => api.delete(`/dairy/animal${id !== undefined ? '/' + id : ''}`),
  recordMilk: (data) => api.post('/dairy/milk', data),
};

export const cropValueResearchAPI = {
  getCropValueResearch: () => api.get('/crop-value-research'),
  researchCropValue: (data) => api.post('/crop-value-research/research', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getPending: (id, params) => api.get(`/crop-value-research/pending${id !== undefined ? '/' + id : ''}`, { params }),
  review: (id, params) => api.get(`/crop-value-research/iew${id !== undefined ? '/' + id : ''}`, { params }),
};

export const cropRecommendationsAPI = {
  getCropRecommendations: () => api.get('/crop-recommendations'),
  getRecommendations: (data) => api.post('/crop-recommendations/get', data),
};

export const cropPlanningAPI = {
  getCropPlanning: () => api.get('/crop-planning'),
  planCrops: (data) => api.post('/crop-planning/plan', data),
};

export const cropManagementAPI = {
  getCropManagement: () => api.get('/crop-management'),
  manageCrops: (data) => api.post('/crop-management/manage', data),
};

export const costAPI = {
  getCosts: () => api.get('/cost'),
  calculateCost: (data) => api.post('/cost/calculate', data),
};

export const costControlAPI = {
  getCostControl: () => api.get('/cost-control'),
  controlCosts: (data) => api.post('/cost-control/control', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCostCenters: (id, params) => api.get(`/cost-control/cost-centers${id !== undefined ? '/' + id : ''}`, { params }),
  getBudgets: (id, params) => api.get(`/cost-control/budgets${id !== undefined ? '/' + id : ''}`, { params }),
  getCostCenterActuals: (id, params) => api.get(`/cost-control/cost-center-actuals${id !== undefined ? '/' + id : ''}`, { params }),
  getBudgetLines: (id, params) => api.get(`/cost-control/budget-lines${id !== undefined ? '/' + id : ''}`, { params }),
  getBudgetVsActual: (id, params) => api.get(`/cost-control/budget-vs-actual${id !== undefined ? '/' + id : ''}`, { params }),
  addBudgetLine: (data) => api.post('/cost-control/budget-line', data),
  submitBudget: (data) => api.post('/cost-control/budget', data),
  approveBudget: (data) => api.post('/cost-control/budget', data),
  createCostCenter: (data) => api.post('/cost-control/cost-center', data),
  getProfitCenters: (id, params) => api.get(`/cost-control/profit-centers${id !== undefined ? '/' + id : ''}`, { params }),
  createProfitCenter: (data) => api.post('/cost-control/profit-center', data),
  createBudget: (data) => api.post('/cost-control/budget', data),
};

export const cooperativeShareAPI = {
  getCooperativeShares: () => api.get('/cooperative-share'),
  buyShare: (data) => api.post('/cooperative-share/buy', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  addMember: (data) => api.post('/cooperative-share/member', data),
  listMembers: (id, params) => api.get(`/cooperative-share/members${id !== undefined ? '/' + id : ''}`, { params }),
  getPaidUpCapital: (id, params) => api.get(`/cooperative-share/paid-up-capital${id !== undefined ? '/' + id : ''}`, { params }),
  previewDistribution: (id, params) => api.get(`/cooperative-share/view-distribution${id !== undefined ? '/' + id : ''}`, { params }),
  createDistribution: (data) => api.post('/cooperative-share/distribution', data),
  listDistributions: (id, params) => api.get(`/cooperative-share/distributions${id !== undefined ? '/' + id : ''}`, { params }),
  getDistribution: (id, params) => api.get(`/cooperative-share/distribution${id !== undefined ? '/' + id : ''}`, { params }),
};

export const comprehensiveERPAPI = {
  getComprehensiveERP: () => api.get('/comprehensive-erp'),
  configureERP: (data) => api.put('/comprehensive-erp/configure', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  createChartOfAccounts: (data) => api.post('/comprehensive-erp/chart-of-accounts', data),
  createGLAccount: (data) => api.post('/comprehensive-erp/g-laccount', data),
  postJournalEntry: (id, params) => api.get(`/comprehensive-erp/t-journal-entry${id !== undefined ? '/' + id : ''}`, { params }),
  getTrialBalance: (id, params) => api.get(`/comprehensive-erp/trial-balance${id !== undefined ? '/' + id : ''}`, { params }),
  getBalanceSheet: (id, params) => api.get(`/comprehensive-erp/balance-sheet${id !== undefined ? '/' + id : ''}`, { params }),
  getProfitLoss: (id, params) => api.get(`/comprehensive-erp/profit-loss${id !== undefined ? '/' + id : ''}`, { params }),
  analyzeFinancialsAI: (data) => api.post('/comprehensive-erp/financials-ai', data),
  createCostCenter: (data) => api.post('/comprehensive-erp/cost-center', data),
  createProfitCenter: (data) => api.post('/comprehensive-erp/profit-center', data),
  postCostAllocation: (id, params) => api.get(`/comprehensive-erp/t-cost-allocation${id !== undefined ? '/' + id : ''}`, { params }),
  getCostCenterReport: (id, params) => api.get(`/comprehensive-erp/cost-center-report${id !== undefined ? '/' + id : ''}`, { params }),
  getProfitCenterReport: (id, params) => api.get(`/comprehensive-erp/profit-center-report${id !== undefined ? '/' + id : ''}`, { params }),
  createMaterialMaster: (data) => api.post('/comprehensive-erp/material-master', data),
  createPurchaseOrder: (data) => api.post('/comprehensive-erp/purchase-order', data),
  createGoodsReceipt: (data) => api.post('/comprehensive-erp/goods-receipt', data),
  getInventoryOverview: (id, params) => api.get(`/comprehensive-erp/inventory-overview${id !== undefined ? '/' + id : ''}`, { params }),
  optimizeSupplyChainAI: (data) => api.post('/comprehensive-erp/supply-chain-ai', data),
  createCustomerMaster: (data) => api.post('/comprehensive-erp/customer-master', data),
  createSalesOrder: (data) => api.post('/comprehensive-erp/sales-order', data),
  createDelivery: (data) => api.post('/comprehensive-erp/delivery', data),
  createInvoice: (data) => api.post('/comprehensive-erp/invoice', data),
  createProductionOrder: (data) => api.post('/comprehensive-erp/production-order', data),
  releaseProductionOrder: (id, params) => api.get(`/comprehensive-erp/ease-production-order${id !== undefined ? '/' + id : ''}`, { params }),
  confirmProductionOrder: (id, params) => api.get(`/comprehensive-erp/firm-production-order${id !== undefined ? '/' + id : ''}`, { params }),
  optimizeProductionAI: (data) => api.post('/comprehensive-erp/production-ai', data),
  createInspectionLot: (data) => api.post('/comprehensive-erp/inspection-lot', data),
  recordInspectionResult: (data) => api.post('/comprehensive-erp/inspection-result', data),
  makeUsageDecision: (id, params) => api.get(`/comprehensive-erp/e-usage-decision${id !== undefined ? '/' + id : ''}`, { params }),
  createEquipmentMaster: (data) => api.post('/comprehensive-erp/equipment-master', data),
  createMaintenanceOrder: (data) => api.post('/comprehensive-erp/maintenance-order', data),
  confirmMaintenanceOrder: (id, params) => api.get(`/comprehensive-erp/firm-maintenance-order${id !== undefined ? '/' + id : ''}`, { params }),
  createEmployeeMaster: (data) => api.post('/comprehensive-erp/employee-master', data),
  createOrganizationalUnit: (data) => api.post('/comprehensive-erp/organizational-unit', data),
  processPayroll: (data) => api.post('/comprehensive-erp/payroll', data),
  analyzeHRAI: (data) => api.post('/comprehensive-erp/h-rai', data),
  createProjectDefinition: (data) => api.post('/comprehensive-erp/project-definition', data),
  createWBS: (data) => api.post('/comprehensive-erp/w-bs', data),
  updateProjectStatus: (data) => api.put('/comprehensive-erp/project-status', data),
  analyzeProjectAI: (data) => api.post('/comprehensive-erp/project-ai', data),
  createBankAccount: (data) => api.post('/comprehensive-erp/bank-account', data),
  recordCashFlow: (data) => api.post('/comprehensive-erp/cash-flow', data),
  getCashPosition: (id, params) => api.get(`/comprehensive-erp/cash-position${id !== undefined ? '/' + id : ''}`, { params }),
  createFixedAsset: (data) => api.post('/comprehensive-erp/fixed-asset', data),
  calculateDepreciation: (data) => api.post('/comprehensive-erp/depreciation', data),
  getExecutiveDashboard: (id, params) => api.get(`/comprehensive-erp/executive-dashboard${id !== undefined ? '/' + id : ''}`, { params }),
  getProfitabilityAnalysis: (id, params) => api.get(`/comprehensive-erp/profitability-analysis${id !== undefined ? '/' + id : ''}`, { params }),
};

export const complianceTrackingAPI = {
  getComplianceTracking: () => api.get('/compliance-tracking'),
  trackCompliance: (data) => api.post('/compliance-tracking/track', data),
};

export const complianceAPI2 = {
  getCompliance: () => api.get('/compliance'),
  checkCompliance: (data) => api.post('/compliance/check', data),
};

export const completeERPIntegrationAPI = {
  getCompleteERPIntegration: () => api.get('/complete-erp-integration'),
  integrateERP: (data) => api.post('/complete-erp-integration/integrate', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  syncFarmerCropPlanning: (data) => api.post('/complete-erpintegration/farmer-crop-planning', data),
  syncFarmerHarvest: (data) => api.post('/complete-erpintegration/farmer-harvest', data),
  syncFarmerField: (data) => api.post('/complete-erpintegration/farmer-field', data),
  syncCropLifecycle: (data) => api.post('/complete-erpintegration/crop-lifecycle', data),
  syncCropYield: (data) => api.post('/complete-erpintegration/crop-yield', data),
  syncLivestock: (data) => api.post('/complete-erpintegration/livestock', data),
  syncLivestockProduction: (data) => api.post('/complete-erpintegration/livestock-production', data),
  syncLivestockHealth: (data) => api.post('/complete-erpintegration/livestock-health', data),
  syncDairyProduction: (data) => api.post('/complete-erpintegration/dairy-production', data),
  syncPoultryProduction: (data) => api.post('/complete-erpintegration/poultry-production', data),
  syncGoatProduction: (data) => api.post('/complete-erpintegration/goat-production', data),
  syncSheepProduction: (data) => api.post('/complete-erpintegration/sheep-production', data),
  syncPigProduction: (data) => api.post('/complete-erpintegration/pig-production', data),
  getERPIntegrationStatus: (id, params) => api.get(`/complete-erpintegration/e-rpintegration-status${id !== undefined ? '/' + id : ''}`, { params }),
  forceSyncAllERPIntegrations: (id, params) => api.get(`/complete-erpintegration/ce-sync-all-erpintegrations${id !== undefined ? '/' + id : ''}`, { params }),
};

export const completeAIIntegrationAPI = {
  getCompleteAIIntegration: () => api.get('/complete-ai-integration'),
  integrateAI: (data) => api.post('/complete-ai-integration/integrate', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  recommendCropPlanning: (data) => api.post('/complete-aiintegration/crop-planning', data),
  predictHarvestTiming: (data) => api.post('/complete-aiintegration/harvest-timing', data),
  optimizeFarmerResources: (data) => api.post('/complete-aiintegration/farmer-resources', data),
  detectCropDisease: (id, params) => api.get(`/complete-aiintegration/ect-crop-disease${id !== undefined ? '/' + id : ''}`, { params }),
  predictCropYield: (data) => api.post('/complete-aiintegration/crop-yield', data),
  monitorLivestockHealth: (id, params) => api.get(`/complete-aiintegration/itor-livestock-health${id !== undefined ? '/' + id : ''}`, { params }),
  recommendLivestockBreeding: (data) => api.post('/complete-aiintegration/livestock-breeding', data),
  optimizeDairyProduction: (data) => api.post('/complete-aiintegration/dairy-production', data),
  monitorPoultryHealth: (id, params) => api.get(`/complete-aiintegration/itor-poultry-health${id !== undefined ? '/' + id : ''}`, { params }),
  optimizeGoatProduction: (data) => api.post('/complete-aiintegration/goat-production', data),
  optimizeSheepProduction: (data) => api.post('/complete-aiintegration/sheep-production', data),
  optimizePigProduction: (data) => api.post('/complete-aiintegration/pig-production', data),
  getAIIntegrationStatus: (id, params) => api.get(`/complete-aiintegration/a-iintegration-status${id !== undefined ? '/' + id : ''}`, { params }),
  forceSyncAllAIIntegrations: (id, params) => api.get(`/complete-aiintegration/ce-sync-all-aiintegrations${id !== undefined ? '/' + id : ''}`, { params }),
  getAIModelInfo: (id, params) => api.get(`/complete-aiintegration/a-imodel-info${id !== undefined ? '/' + id : ''}`, { params }),
};

export const communityManagementAPI = {
  getCommunityManagement: () => api.get('/community-management'),
  manageCommunity: (data) => api.post('/community-management/manage', data),
};

export const coldStorageAPI = {
  getColdStorage: () => api.get('/cold-storage'),
  manageColdStorage: (data) => api.post('/cold-storage/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getStatus: (id, params) => api.get(`/cold-storage/status${id !== undefined ? '/' + id : ''}`, { params }),
  getFacilities: (id, params) => api.get(`/cold-storage/facilities${id !== undefined ? '/' + id : ''}`, { params }),
  getTemperatureData: (id, params) => api.get(`/cold-storage/temperature-data${id !== undefined ? '/' + id : ''}`, { params }),
  getComplianceStatus: (id, params) => api.get(`/cold-storage/compliance-status${id !== undefined ? '/' + id : ''}`, { params }),
  bookFacility: (id, params) => api.get(`/cold-storage/k-facility${id !== undefined ? '/' + id : ''}`, { params }),
  createFacility: (data) => api.post('/cold-storage/facility', data),
  getFacility: (id, params) => api.get(`/cold-storage/facility${id !== undefined ? '/' + id : ''}`, { params }),
  updateFacility: (data) => api.put('/cold-storage/facility', data),
  getUtilization: (id, params) => api.get(`/cold-storage/utilization${id !== undefined ? '/' + id : ''}`, { params }),
  createBooking: (data) => api.post('/cold-storage/booking', data),
  getBookings: (id, params) => api.get(`/cold-storage/bookings${id !== undefined ? '/' + id : ''}`, { params }),
  updateBookingStatus: (data) => api.put('/cold-storage/booking-status', data),
};

export const coldChainMonitoringAPI = {
  getColdChainMonitoring: () => api.get('/cold-chain-monitoring'),
  monitorColdChain: (data) => api.post('/cold-chain-monitoring/monitor', data),
};

export const climateAdvisoryAPI = {
  getClimateAdvisory: () => api.get('/climate-advisory'),
  getAdvisory: (data) => api.post('/climate-advisory/get', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAdvisories: (id, params) => api.get(`/climate-advisory/advisories${id !== undefined ? '/' + id : ''}`, { params }),
  createAdvisory: (data) => api.post('/climate-advisory/advisory', data),
};

export const civilDisruptionAPI = {
  getCivilDisruption: () => api.get('/civil-disruption'),
  reportDisruption: (data) => api.post('/civil-disruption/report', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  listActive: (id, params) => api.get(`/civil-disruption/active${id !== undefined ? '/' + id : ''}`, { params }),
  report: (id, params) => api.get(`/civil-disruption/ort${id !== undefined ? '/' + id : ''}`, { params }),
  verify: (data) => api.post('/civil-disruption', data),
  resolve: (id, params) => api.get(`/civil-disruption/olve${id !== undefined ? '/' + id : ''}`, { params }),
  checkShipmentRisk: (data) => api.post('/civil-disruption/shipment-risk', data),
};

export const certificationManagementAPI = {
  getCertificationManagement: () => api.get('/certification-management'),
  manageCertification: (data) => api.post('/certification-management/manage', data),
};

export const buyerTrustAPI = {
  getBuyerTrust: () => api.get('/buyer-trust'),
  buildTrust: (data) => api.post('/buyer-trust/build', data),
};

export const bulkOrdersAPI = {
  getBulkOrders: () => api.get('/bulk-orders'),
  createBulkOrder: (data) => api.post('/bulk-orders', data),
};

export const yieldManagementAPI = {
  getYieldData: () => api.get('/yield-management'),
  optimizeYield: (data) => api.post('/yield-management/optimize', data),
};

export const weatherAdvisoryAPI = {
  getWeatherAdvisory: () => api.get('/weather-advisory'),
  getForecast: () => api.get('/weather-advisory/forecast'),
};

export const wearableIntegrationAPI = {
  getWearableData: () => api.get('/wearable-integration'),
  syncWearable: (data) => api.post('/wearable-integration/sync', data),
};

export const waterManagementAPI = {
  getWaterData: () => api.get('/water-management'),
  controlWater: (data) => api.post('/water-management/control', data),
};

export const warehouseManagementAPI = {
  getWarehouseData: () => api.get('/warehouse-management'),
  manageInventory: (data) => api.post('/warehouse-management/inventory', data),
};

export const vrAPI = {
  getVRContent: () => api.get('/vr'),
  accessVRScene: (id) => api.get(`/vr/scenes/${id}`),
};

export const videoAnalyticsAPI = {
  getVideoAnalytics: () => api.get('/video-analytics'),
  analyzeVideo: (data) => api.post('/video-analytics/analyze', data),
};

export const vendorAPI2 = {
  getVendors: () => api.get('/vendors'),
  getVendor: (id) => api.get(`/vendors/${id}`),
};

export const userRoutesAPI = {
  getUserRoutes: () => api.get('/user-routes'),
  createUserRoute: (data) => api.post('/user-routes', data),
};

export const unifiedAIRoutesAPI = {
  getUnifiedAIRoutes: () => api.get('/unified-ai-routes'),
  configureUnifiedAIRoute: (id, data) => api.put(`/unified-ai-routes/${id}`, data),
};

export const unifiedAIGatewayAPI2 = {
  getUnifiedAIGateway: () => api.get('/unified-ai-gateway'),
  configureUnifiedAIGateway: (data) => api.put('/unified-ai-gateway', data),
};

export const transactionAPI = {
  getTransactions: () => api.get('/transactions'),
  createTransaction: (data) => api.post('/transactions', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getUserTransactions: (id, params) => api.get(`/transaction/user-transactions${id !== undefined ? '/' + id : ''}`, { params }),
};

export const trackDartAPI = {
  getShipments: () => api.get('/track-dart'),
  trackShipment: (id) => api.get(`/track-dart/${id}`),
};

export const tenantManagementAPI = {
  getTenants: () => api.get('/tenant-management'),
  createTenant: (data) => api.post('/tenant-management', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAllTenants: (id, params) => api.get(`/tenant-management/all-tenants${id !== undefined ? '/' + id : ''}`, { params }),
  deleteTenant: (id) => api.delete(`/tenant-management/tenant${id !== undefined ? '/' + id : ''}`),
};

export const systemAdministrationAPI = {
  getSystemStatus: () => api.get('/system-administration'),
  configureSystem: (data) => api.put('/system-administration', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  forecastCapacity: (id, params) => api.get(`/system-administration/ecast-capacity${id !== undefined ? '/' + id : ''}`, { params }),
  getSystemHealthDashboard: (id, params) => api.get(`/system-administration/system-health-dashboard${id !== undefined ? '/' + id : ''}`, { params }),
  triggerSelfHealing: (id, params) => api.get(`/system-administration/gger-self-healing${id !== undefined ? '/' + id : ''}`, { params }),
};

export const supplyChainTrackingAPI = {
  getSupplyChainData: () => api.get('/supply-chain-tracking'),
  trackSupplyChain: (id) => api.get(`/supply-chain-tracking/${id}`),
};

export const supplyChainAnalyticsAPI = {
  getSupplyChainAnalytics: () => api.get('/supply-chain-analytics'),
  analyzeSupplyChain: (data) => api.post('/supply-chain-analytics/analyze', data),
};

export const supplyChainDecisionAPI = {
  getSupplyChainDecisions: () => api.get('/supply-chain-decision'),
  makeDecision: (data) => api.post('/supply-chain-decision', data),
};

export const subscriptionsAPI = {
  getSubscriptions: () => api.get('/subscriptions'),
  createSubscription: (data) => api.post('/subscriptions', data),
};

export const soilManagementAPI = {
  getSoilData: () => api.get('/soil-management'),
  analyzeSoil: (data) => api.post('/soil-management/analyze', data),
};

export const soilHealthAPI = {
  getSoilHealth: () => api.get('/soil-health'),
  improveSoilHealth: (data) => api.post('/soil-health/improve', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCards: (id, params) => api.get(`/soil-health/cards${id !== undefined ? '/' + id : ''}`, { params }),
  createCard: (data) => api.post('/soil-health/card', data),
  updateCard: (data) => api.put('/soil-health/card', data),
  deleteCard: (id) => api.delete(`/soil-health/card${id !== undefined ? '/' + id : ''}`),
};

export const sheepAPI = {
  getSheepData: () => api.get('/sheep'),
  manageSheep: (id, data) => api.put(`/sheep/${id}`, data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  listFlock: (id, params) => api.get(`/sheep/flock${id !== undefined ? '/' + id : ''}`, { params }),
  listWoolProduction: (id, params) => api.get(`/sheep/wool-production${id !== undefined ? '/' + id : ''}`, { params }),
  getFlockPerformance: (id, params) => api.get(`/sheep/flock-performance${id !== undefined ? '/' + id : ''}`, { params }),
  getBreedingAlerts: (id, params) => api.get(`/sheep/breeding-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  getVaccinationAlerts: (id, params) => api.get(`/sheep/vaccination-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  getShearingAlerts: (id, params) => api.get(`/sheep/shearing-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  updateAnimal: (data) => api.put('/sheep/animal', data),
  createAnimal: (data) => api.post('/sheep/animal', data),
  deleteAnimal: (id) => api.delete(`/sheep/animal${id !== undefined ? '/' + id : ''}`),
  recordWoolProduction: (data) => api.post('/sheep/wool-production', data),
  recordFeedConsumption: (data) => api.post('/sheep/feed-consumption', data),
  recordBreeding: (data) => api.post('/sheep/breeding', data),
};

export const sellerVerificationsAPI = {
  getVerifications: () => api.get('/seller-verifications'),
  verifySeller: (id) => api.post(`/seller-verifications/${id}/verify`),
};

export const sellerRankingAPI = {
  getSellerRankings: () => api.get('/seller-ranking'),
  rankSeller: (id, data) => api.post(`/seller-ranking/${id}`, data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRankedSellers: (id, params) => api.get(`/seller-ranking/ranked-sellers${id !== undefined ? '/' + id : ''}`, { params }),
  getSellerTrustScore: (id, params) => api.get(`/seller-ranking/seller-trust-score${id !== undefined ? '/' + id : ''}`, { params }),
};

export const seedVaultAPI = {
  getSeeds: () => api.get('/seed-vault'),
  addSeed: (data) => api.post('/seed-vault', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCategories: (id, params) => api.get(`/seed-vault/categories${id !== undefined ? '/' + id : ''}`, { params }),
  deleteSeed: (id) => api.delete(`/seed-vault/seed${id !== undefined ? '/' + id : ''}`),
};

export const sapModuleArchitectureAPI = {
  getSAPModules: () => api.get('/sap-module-architecture'),
  configureSAPModule: (id, data) => api.put(`/sap-module-architecture/${id}`, data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAllModules: (id, params) => api.get(`/sap-module-architecture/all-modules${id !== undefined ? '/' + id : ''}`, { params }),
  getModule: (id, params) => api.get(`/sap-module-architecture/module${id !== undefined ? '/' + id : ''}`, { params }),
  getModulesByType: (id, params) => api.get(`/sap-module-architecture/modules-by-type${id !== undefined ? '/' + id : ''}`, { params }),
  registerModule: (data) => api.post('/sap-module-architecture/module', data),
  updateModule: (data) => api.put('/sap-module-architecture/module', data),
  deleteModule: (id) => api.delete(`/sap-module-architecture/module${id !== undefined ? '/' + id : ''}`),
  getModuleDependencies: (id, params) => api.get(`/sap-module-architecture/module-dependencies${id !== undefined ? '/' + id : ''}`, { params }),
  getDependencyGraph: (id, params) => api.get(`/sap-module-architecture/dependency-graph${id !== undefined ? '/' + id : ''}`, { params }),
  resolveDependencies: (id, params) => api.get(`/sap-module-architecture/olve-dependencies${id !== undefined ? '/' + id : ''}`, { params }),
  getModuleCompatibility: (id, params) => api.get(`/sap-module-architecture/module-compatibility${id !== undefined ? '/' + id : ''}`, { params }),
  getModuleLifecycle: (id, params) => api.get(`/sap-module-architecture/module-lifecycle${id !== undefined ? '/' + id : ''}`, { params }),
  transitionModuleState: (id, params) => api.get(`/sap-module-architecture/nsition-module-state${id !== undefined ? '/' + id : ''}`, { params }),
  getModuleVersion: (id, params) => api.get(`/sap-module-architecture/module-version${id !== undefined ? '/' + id : ''}`, { params }),
  updateModuleVersion: (data) => api.put('/sap-module-architecture/module-version', data),
  getModuleConfiguration: (id, params) => api.get(`/sap-module-architecture/module-configuration${id !== undefined ? '/' + id : ''}`, { params }),
  setModuleConfiguration: (id, params) => api.get(`/sap-module-architecture/module-configuration${id !== undefined ? '/' + id : ''}`, { params }),
  generateMTADescriptor: (data) => api.post('/sap-module-architecture/m-tadescriptor', data),
  getArchitectureOverview: (id, params) => api.get(`/sap-module-architecture/architecture-overview${id !== undefined ? '/' + id : ''}`, { params }),
  getServiceHealth: (id, params) => api.get(`/sap-module-architecture/service-health${id !== undefined ? '/' + id : ''}`, { params }),
};

export const roleManagementAPI = {
  getRoles: () => api.get('/role-management'),
  createRole: (data) => api.post('/role-management', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  updateRole: (data) => api.put('/role-management/role', data),
  deleteRole: (id) => api.delete(`/role-management/role${id !== undefined ? '/' + id : ''}`),
};

export const riskPricingAPI = {
  getRiskPricing: () => api.get('/risk-pricing'),
  calculateRisk: (data) => api.post('/risk-pricing/calculate', data),
};

export const riskAssessmentAPI = {
  getRiskAssessments: () => api.get('/risk-assessment'),
  assessRisk: (data) => api.post('/risk-assessment/assess', data),
};

export const rfqAPI = {
  getRFQs: () => api.get('/rfq'),
  createRFQ: (data) => api.post('/rfq', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  activeHolds: (id, params) => api.get(`/rfq/ive-holds${id !== undefined ? '/' + id : ''}`, { params }),
  lossAnalysis: (id, params) => api.get(`/rfq/s-analysis${id !== undefined ? '/' + id : ''}`, { params }),
  centrePnl: (id, params) => api.get(`/rfq/tre-pnl${id !== undefined ? '/' + id : ''}`, { params }),
  releaseQcHold: (id, params) => api.get(`/rfq/ease-qc-hold${id !== undefined ? '/' + id : ''}`, { params }),
};

export const returnLoadBoardAPI = {
  getReturnLoads: () => api.get('/return-load-board'),
  postReturnLoad: (data) => api.post('/return-load-board', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  postCapacity: (id, params) => api.get(`/return-load-board/t-capacity${id !== undefined ? '/' + id : ''}`, { params }),
  searchAvailable: (data) => api.post('/return-load-board/available', data),
  bookPosting: (id, params) => api.get(`/return-load-board/k-posting${id !== undefined ? '/' + id : ''}`, { params }),
  cancelPosting: (data) => api.post('/return-load-board/posting', data),
};

export const researchAndDevelopmentAPI = {
  getRAndD: () => api.get('/research-and-development'),
  createResearch: (data) => api.post('/research-and-development', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRDProjects: (id, params) => api.get(`/research-and-development/r-dprojects${id !== undefined ? '/' + id : ''}`, { params }),
  getRDProject: (id, params) => api.get(`/research-and-development/r-dproject${id !== undefined ? '/' + id : ''}`, { params }),
  createRDProject: (data) => api.post('/research-and-development/r-dproject', data),
  updateRDProject: (data) => api.put('/research-and-development/r-dproject', data),
  deleteRDProject: (id) => api.delete(`/research-and-development/r-dproject${id !== undefined ? '/' + id : ''}`),
  addMilestone: (data) => api.post('/research-and-development/milestone', data),
  updateMilestone: (data) => api.put('/research-and-development/milestone', data),
  getCollaborations: (id, params) => api.get(`/research-and-development/collaborations${id !== undefined ? '/' + id : ''}`, { params }),
  createCollaboration: (data) => api.post('/research-and-development/collaboration', data),
  getInnovations: (id, params) => api.get(`/research-and-development/innovations${id !== undefined ? '/' + id : ''}`, { params }),
  createInnovation: (data) => api.post('/research-and-development/innovation', data),
  getPatents: (id, params) => api.get(`/research-and-development/patents${id !== undefined ? '/' + id : ''}`, { params }),
  createPatent: (data) => api.post('/research-and-development/patent', data),
  getFundingOpportunities: (id, params) => api.get(`/research-and-development/funding-opportunities${id !== undefined ? '/' + id : ''}`, { params }),
  createFundingOpportunity: (data) => api.post('/research-and-development/funding-opportunity', data),
  applyForFunding: (data) => api.post('/research-and-development/for-funding', data),
  getPublications: (id, params) => api.get(`/research-and-development/publications${id !== undefined ? '/' + id : ''}`, { params }),
  createPublication: (data) => api.post('/research-and-development/publication', data),
  getAIResearchAssistance: (id, params) => api.get(`/research-and-development/a-iresearch-assistance${id !== undefined ? '/' + id : ''}`, { params }),
  searchKnowledgeBase: (data) => api.post('/research-and-development/knowledge-base', data),
  addKnowledge: (data) => api.post('/research-and-development/knowledge', data),
  getRDAnalytics: (id, params) => api.get(`/research-and-development/r-danalytics${id !== undefined ? '/' + id : ''}`, { params }),
  getHealthStatus: (id, params) => api.get(`/research-and-development/health-status${id !== undefined ? '/' + id : ''}`, { params }),
};

export const regionalVarietyAPI = {
  getRegionalVarieties: () => api.get('/regional-variety'),
  addVariety: (data) => api.post('/regional-variety', data),
};

export const neVarietiesAPI = {
  getNEVarieties: () => api.get('/ne-varieties'),
  addNEVariety: (data) => api.post('/ne-varieties', data),
};

export const recoveredFinanceAPI = {
  getRecoveredFinance: () => api.get('/recovered-finance'),
  recoverFinance: (data) => api.post('/recovered-finance/recover', data),
};

export const realtimeMonitoringAPI = {
  getRealtimeMonitoring: () => api.get('/realtime-monitoring'),
  startMonitoring: (data) => api.post('/realtime-monitoring/start', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAllMonitors: (id, params) => api.get(`/realtime-monitoring/all-monitors${id !== undefined ? '/' + id : ''}`, { params }),
  getMonitoringStatus: (id, params) => api.get(`/realtime-monitoring/monitoring-status${id !== undefined ? '/' + id : ''}`, { params }),
  stopMonitoring: (data) => api.post('/realtime-monitoring/monitoring', data),
  healthCheck: (id, params) => api.get(`/realtime-monitoring/lth-check${id !== undefined ? '/' + id : ''}`, { params }),
};

export const qualityAssuranceAPI = {
  getQualityAssurance: () => api.get('/quality-assurance'),
  runQualityCheck: (data) => api.post('/quality-assurance/check', data),
};

export const pyramidHealthAPI = {
  getPyramidHealth: () => api.get('/pyramid-health'),
  assessPyramidHealth: (data) => api.post('/pyramid-health/assess', data),
};

export const poultryAPI = {
  getPoultryData: () => api.get('/poultry'),
  managePoultry: (id, data) => api.put(`/poultry/${id}`, data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  listFlocks: (id, params) => api.get(`/poultry/flocks${id !== undefined ? '/' + id : ''}`, { params }),
  listEggProduction: (id, params) => api.get(`/poultry/egg-production${id !== undefined ? '/' + id : ''}`, { params }),
  getFlockPerformance: (id, params) => api.get(`/poultry/flock-performance${id !== undefined ? '/' + id : ''}`, { params }),
  getVaccinationAlerts: (id, params) => api.get(`/poultry/vaccination-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  updateFlock: (data) => api.put('/poultry/flock', data),
  createFlock: (data) => api.post('/poultry/flock', data),
  deleteFlock: (id) => api.delete(`/poultry/flock${id !== undefined ? '/' + id : ''}`),
  recordEggProduction: (data) => api.post('/poultry/egg-production', data),
  recordFeedConsumption: (data) => api.post('/poultry/feed-consumption', data),
};

export const pricingOptimizationAPI = {
  getPricingOptimization: () => api.get('/pricing-optimization'),
  optimizePricing: (data) => api.post('/pricing-optimization/optimize', data),
};

export const precisionFarmingAPI = {
  getPrecisionFarming: () => api.get('/precision-farming'),
  applyPrecisionFarming: (data) => api.post('/precision-farming/apply', data),
};

export const preSeasonOrderAPI = {
  getPreSeasonOrders: () => api.get('/pre-season-order'),
  createPreSeasonOrder: (data) => api.post('/pre-season-order', data),
};

export const plantHealthAPI = {
  getPlantHealth: () => api.get('/plant-health'),
  diagnosePlant: (data) => api.post('/plant-health/diagnose', data),
};

export const pestManagementAPI = {
  getPestManagement: () => api.get('/pest-management'),
  controlPests: (data) => api.post('/pest-management/control', data),
};

export const paymentProcessingAPI = {
  getPayments: () => api.get('/payment-processing'),
  processPayment: (data) => api.post('/payment-processing/process', data),
};

export const partnerManagementAPI = {
  getPartners: () => api.get('/partner-management'),
  addPartner: (data) => api.post('/partner-management', data),
};

export const packageAPI = {
  getPackages: () => api.get('/package'),
  createPackage: (data) => api.post('/package', data),
};

export const oxygenGeneratorAPI = {
  getOxygenGenerators: () => api.get('/oxygen-generator'),
  controlOxygenGenerator: (id, data) => api.put(`/oxygen-generator/${id}`, data),
};

export const orchardManagementAPI = {
  getOrchardData: () => api.get('/orchard-management'),
  manageOrchard: (id, data) => api.put(`/orchard-management/${id}`, data),
};

export const operationalIntelligenceAPI = {
  getOperationalIntelligence: () => api.get('/operational-intelligence'),
  analyzeOperations: (data) => api.post('/operational-intelligence/analyze', data),
};

export const openFieldFarmingAPI = {
  getOpenFieldFarming: () => api.get('/open-field-farming'),
  manageOpenField: (data) => api.post('/open-field-farming/manage', data),
};

export const organicFarmingAPI = {
  getOrganicFarming: () => api.get('/organic-farming'),
  certifyOrganic: (data) => api.post('/organic-farming/certify', data),
};

export const offerManagementAPI = {
  getOffers: () => api.get('/offer-management'),
  createOffer: (data) => api.post('/offer-management', data),
};

export const nutritionalOptimizationAPI = {
  getNutritionalOptimization: () => api.get('/nutritional-optimization'),
  optimizeNutrition: (data) => api.post('/nutritional-optimization/optimize', data),
};

export const nutritionAPI2 = {
  getNutrition: () => api.get('/nutrition'),
  analyzeNutrition: (data) => api.post('/nutrition/analyze', data),
};

export const notificationAPI2 = {
  getNotifications: () => api.get('/notifications'),
  sendNotification: (data) => api.post('/notifications', data),
};

export const notificationAPI3 = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export const newsAPI = {
  getNews: () => api.get('/news'),
  createNews: (data) => api.post('/news', data),
};

export const marketplaceAPI = {
  getMarketplace: () => api.get('/marketplace'),
  createListing: (data) => api.post('/marketplace/listing', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  calculateProductGST: (data) => api.post('/marketplace/product-gst', data),
  calculateOrderGST: (data) => api.post('/marketplace/order-gst', data),
  generateGstInvoice: (data) => api.post('/marketplace/gst-invoice', data),
  getProductReviews: (id, params) => api.get(`/marketplace/product-reviews${id !== undefined ? '/' + id : ''}`, { params }),
  getProductReviewStats: (id, params) => api.get(`/marketplace/product-review-stats${id !== undefined ? '/' + id : ''}`, { params }),
  getUserReviews: (id, params) => api.get(`/marketplace/user-reviews${id !== undefined ? '/' + id : ''}`, { params }),
  submitReview: (data) => api.post('/marketplace/review', data),
  markReviewHelpful: (id, params) => api.get(`/marketplace/k-review-helpful${id !== undefined ? '/' + id : ''}`, { params }),
};

export const marketTrendAPI = {
  getMarketTrends: () => api.get('/market-trend'),
  analyzeTrend: (data) => api.post('/market-trend/analyze', data),
};

export const logisticsOptimizationAPI = {
  getLogisticsOptimization: () => api.get('/logistics-optimization'),
  optimizeLogistics: (data) => api.post('/logistics-optimization/optimize', data),
};

export const livestockTrackingAPI = {
  getLivestockTracking: () => api.get('/livestock-tracking'),
  trackLivestock: (id) => api.get(`/livestock-tracking/${id}`),
};

export const liquidFertilizerAPI = {
  getLiquidFertilizer: () => api.get('/liquid-fertilizer'),
  applyFertilizer: (data) => api.post('/liquid-fertilizer/apply', data),
};

export const ledAPI = {
  getLEDs: () => api.get('/led'),
  controlLED: (id, data) => api.put(`/led/${id}`, data),
};

export const kioskAPI = {
  getKiosks: () => api.get('/kiosk'),
  manageKiosk: (id, data) => api.put(`/kiosk/${id}`, data),
};

export const irrigationSystemAPI = {
  getIrrigationSystems: () => api.get('/irrigation-system'),
  controlIrrigation: (id, data) => api.put(`/irrigation-system/${id}`, data),
};

export const investmentAPI = {
  getInvestments: () => api.get('/investment'),
  createInvestment: (data) => api.post('/investment', data),
};

export const inventoryManagementAPI = {
  getInventoryManagement: () => api.get('/inventory-management'),
  manageInventory: (data) => api.post('/inventory-management/manage', data),
};

export const inventoryOptimizationAPI = {
  getInventoryOptimization: () => api.get('/inventory-optimization'),
  optimizeInventory: (data) => api.post('/inventory-optimization/optimize', data),
};

export const integratedFarmingAPI = {
  getIntegratedFarming: () => api.get('/integrated-farming'),
  implementIntegratedFarming: (data) => api.post('/integrated-farming/implement', data),
};

export const infrastructureAPI2 = {
  getInfrastructure: () => api.get('/infrastructure'),
  manageInfrastructure: (data) => api.post('/infrastructure/manage', data),
};

export const hybridFarmingAPI = {
  getHybridFarming: () => api.get('/hybrid-farming'),
  implementHybridFarming: (data) => api.post('/hybrid-farming/implement', data),
};

export const hydroponicsAPI = {
  getHydroponics: () => api.get('/hydroponics'),
  manageHydroponics: (data) => api.post('/hydroponics/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getSystems: (id, params) => api.get(`/hydroponics/systems${id !== undefined ? '/' + id : ''}`, { params }),
  createSystem: (data) => api.post('/hydroponics/system', data),
  updateSystem: (data) => api.put('/hydroponics/system', data),
  deleteSystem: (id) => api.delete(`/hydroponics/system${id !== undefined ? '/' + id : ''}`),
};

export const homeAutomationAPI = {
  getHomeAutomation: () => api.get('/home-automation'),
  automateHome: (data) => api.post('/home-automation/automate', data),
};

// Climate and weather monitoring APIs
export const droughtMonitoringAPI = {
  getDroughtData: () => api.get('/drought-monitoring'),
  analyzeDrought: (data) => api.post('/drought-monitoring/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRecords: (id, params) => api.get(`/drought-monitoring/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/drought-monitoring/record', data),
  updateRecord: (data) => api.put('/drought-monitoring/record', data),
  deleteRecord: (id) => api.delete(`/drought-monitoring/record${id !== undefined ? '/' + id : ''}`),
};

export const floodMonitoringAPI = {
  getFloodData: () => api.get('/flood-monitoring'),
  analyzeFlood: (data) => api.post('/flood-monitoring/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRecords: (id, params) => api.get(`/flood-monitoring/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/flood-monitoring/record', data),
  updateRecord: (data) => api.put('/flood-monitoring/record', data),
  deleteRecord: (id) => api.delete(`/flood-monitoring/record${id !== undefined ? '/' + id : ''}`),
};

export const pestForecastingAPI = {
  getPestForecast: () => api.get('/pest-forecasting'),
  forecastPests: (data) => api.post('/pest-forecasting/forecast', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getForecasts: (id, params) => api.get(`/pest-forecasting/forecasts${id !== undefined ? '/' + id : ''}`, { params }),
};

export const diseaseForecastingAPI = {
  getDiseaseForecast: () => api.get('/disease-forecasting'),
  forecastDisease: (data) => api.post('/disease-forecasting/forecast', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getForecasts: (id, params) => api.get(`/disease-forecasting/forecasts${id !== undefined ? '/' + id : ''}`, { params }),
  createForecast: (data) => api.post('/disease-forecasting/forecast', data),
  updateForecast: (data) => api.put('/disease-forecasting/forecast', data),
  deleteForecast: (id) => api.delete(`/disease-forecasting/forecast${id !== undefined ? '/' + id : ''}`),
};

export const climateRiskAPI = {
  getClimateRisks: () => api.get('/climate-risk'),
  assessRisk: (data) => api.post('/climate-risk/assess', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAssessments: (id, params) => api.get(`/climate-risk/assessments${id !== undefined ? '/' + id : ''}`, { params }),
  createAssessment: (data) => api.post('/climate-risk/assessment', data),
  updateAssessment: (data) => api.put('/climate-risk/assessment', data),
  deleteAssessment: (id) => api.delete(`/climate-risk/assessment${id !== undefined ? '/' + id : ''}`),
};

export const agroMeteorologyAPI = {
  getAgroMeteorology: () => api.get('/agro-meteorology'),
  analyzeWeather: (data) => api.post('/agro-meteorology/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRecords: (id, params) => api.get(`/agro-meteorology/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/agro-meteorology/record', data),
  updateRecord: (data) => api.put('/agro-meteorology/record', data),
  deleteRecord: (id) => api.delete(`/agro-meteorology/record${id !== undefined ? '/' + id : ''}`),
};

export const climateSmartAgricultureAPI = {
  getClimateSmartData: () => api.get('/climate-smart-agriculture'),
  implementClimateSmart: (data) => api.post('/climate-smart-agriculture/implement', data),
};

export const irrigationSchedulerAPI = {
  getIrrigationSchedule: () => api.get('/irrigation-scheduler'),
  scheduleIrrigation: (data) => api.post('/irrigation-scheduler/schedule', data),
};

export const soilMoistureAPI = {
  getSoilMoisture: () => api.get('/soil-moisture'),
  monitorMoisture: (data) => api.post('/soil-moisture/monitor', data),
};

export const waterConservationAPI = {
  getWaterConservation: () => api.get('/water-conservation'),
  conserveWater: (data) => api.post('/water-conservation/conserve', data),
};

export const nutrientManagementAPI = {
  getNutrientManagement: () => api.get('/nutrient-management'),
  manageNutrients: (data) => api.post('/nutrient-management/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getPlans: (id, params) => api.get(`/nutrient-management/plans${id !== undefined ? '/' + id : ''}`, { params }),
  createPlan: (data) => api.post('/nutrient-management/plan', data),
  updatePlan: (data) => api.put('/nutrient-management/plan', data),
  deletePlan: (id) => api.delete(`/nutrient-management/plan${id !== undefined ? '/' + id : ''}`),
};

export const soilHealthMonitoringAPI = {
  getSoilHealthMonitoring: () => api.get('/soil-health-monitoring'),
  monitorSoilHealth: (data) => api.post('/soil-health-monitoring/monitor', data),
};

export const cropSelectionAPI = {
  getCropSelection: () => api.get('/crop-selection'),
  selectCrop: (data) => api.post('/crop-selection/select', data),
};

export const varietySelectionAPI = {
  getVarietySelection: () => api.get('/variety-selection'),
  selectVariety: (data) => api.post('/variety-selection/select', data),
};

export const plantingDateAPI = {
  getPlantingDates: () => api.get('/planting-date'),
  recommendPlantingDate: (data) => api.post('/planting-date/recommend', data),
};

export const harvestPredictionAPI = {
  getHarvestPrediction: () => api.get('/harvest-prediction'),
  predictHarvest: (data) => api.post('/harvest-prediction/predict', data),
};

export const yieldPredictionAPI = {
  getYieldPrediction: () => api.get('/yield-prediction'),
  predictYield: (data) => api.post('/yield-prediction/predict', data),
};

export const cropGrowthModelingAPI = {
  getCropGrowthModeling: () => api.get('/crop-growth-modeling'),
  modelGrowth: (data) => api.post('/crop-growth-modeling/model', data),
};

export const farmProfitabilityAPI = {
  getFarmProfitability: () => api.get('/farm-profitability'),
  analyzeProfitability: (data) => api.post('/farm-profitability/analyze', data),
};

export const costBenefitAnalysisAPI = {
  getCostBenefitAnalysis: () => api.get('/cost-benefit-analysis'),
  analyzeCostBenefit: (data) => api.post('/cost-benefit-analysis/analyze', data),
};

export const marketPriceForecastAPI = {
  getMarketPriceForecast: () => api.get('/market-price-forecast'),
  forecastPrice: (data) => api.post('/market-price-forecast/forecast', data),
};

export const demandForecastAPI = {
  getDemandForecast: () => api.get('/demand-forecast'),
  forecastDemand: (data) => api.post('/demand-forecast/forecast', data),
};

export const supplyChainOptimizationAPI = {
  getSupplyChainOptimization: () => api.get('/supply-chain-optimization'),
  optimizeSupplyChain: (data) => api.post('/supply-chain-optimization/optimize', data),
};

export const logisticsOptimizationAPI2 = {
  getLogisticsOptimization: () => api.get('/logistics-optimization'),
  optimizeLogistics: (data) => api.post('/logistics-optimization/optimize', data),
};

export const inventoryOptimizationAPI2 = {
  getInventoryOptimization: () => api.get('/inventory-optimization'),
  optimizeInventory: (data) => api.post('/inventory-optimization/optimize', data),
};

export const resourceOptimizationAPI = {
  getResourceOptimization: () => api.get('/resource-optimization'),
  optimizeResources: (data) => api.post('/resource-optimization/optimize', data),
};

export const laborOptimizationAPI = {
  getLaborOptimization: () => api.get('/labor-optimization'),
  optimizeLabor: (data) => api.post('/labor-optimization/optimize', data),
};

export const machineryOptimizationAPI = {
  getMachineryOptimization: () => api.get('/machinery-optimization'),
  optimizeMachinery: (data) => api.post('/machinery-optimization/optimize', data),
};

export const energyOptimizationAPI = {
  getEnergyOptimization: () => api.get('/energy-optimization'),
  optimizeEnergy: (data) => api.post('/energy-optimization/optimize', data),
};

export const waterOptimizationAPI = {
  getWaterOptimization: () => api.get('/water-optimization'),
  optimizeWater: (data) => api.post('/water-optimization/optimize', data),
};

export const fertilizerOptimizationAPI = {
  getFertilizerOptimization: () => api.get('/fertilizer-optimization'),
  optimizeFertilizer: (data) => api.post('/fertilizer-optimization/optimize', data),
};

export const pesticideOptimizationAPI = {
  getPesticideOptimization: () => api.get('/pesticide-optimization'),
  optimizePesticide: (data) => api.post('/pesticide-optimization/optimize', data),
};

export const seedOptimizationAPI = {
  getSeedOptimization: () => api.get('/seed-optimization'),
  optimizeSeed: (data) => api.post('/seed-optimization/optimize', data),
};

export const cropRotationAPI = {
  getCropRotation: () => api.get('/crop-rotation'),
  planRotation: (data) => api.post('/crop-rotation/plan', data),
};

export const intercroppingAPI = {
  getIntercropping: () => api.get('/intercropping'),
  planIntercropping: (data) => api.post('/intercropping/plan', data),
};

export const mixedFarmingAPI = {
  getMixedFarming: () => api.get('/mixed-farming'),
  implementMixedFarming: (data) => api.post('/mixed-farming/implement', data),
};

export const agroforestryAPI = {
  getAgroforestry: () => api.get('/agroforestry'),
  implementAgroforestry: (data) => api.post('/agroforestry/implement', data),
};

export const organicFarmingAPI2 = {
  getOrganicFarming: () => api.get('/organic-farming'),
  implementOrganicFarming: (data) => api.post('/organic-farming/implement', data),
};

export const regenerativeAgricultureAPI = {
  getRegenerativeAgriculture: () => api.get('/regenerative-agriculture'),
  implementRegenerativeAgriculture: (data) => api.post('/regenerative-agriculture/implement', data),
};

export const precisionAgricultureAPI = {
  getPrecisionAgriculture: () => api.get('/precision-agriculture'),
  implementPrecisionAgriculture: (data) => api.post('/precision-agriculture/implement', data),
};

export const smartFarmingAPI = {
  getSmartFarming: () => api.get('/smart-farming'),
  implementSmartFarming: (data) => api.post('/smart-farming/implement', data),
};

export const digitalFarmingAPI = {
  getDigitalFarming: () => api.get('/digital-farming'),
  implementDigitalFarming: (data) => api.post('/digital-farming/implement', data),
};

export const autonomousFarmingAPI = {
  getAutonomousFarming: () => api.get('/autonomous-farming'),
  implementAutonomousFarming: (data) => api.post('/autonomous-farming/implement', data),
};

export const roboticFarmingAPI = {
  getRoboticFarming: () => api.get('/robotic-farming'),
  implementRoboticFarming: (data) => api.post('/robotic-farming/implement', data),
};

export const droneFarmingAPI = {
  getDroneFarming: () => api.get('/drone-farming'),
  implementDroneFarming: (data) => api.post('/drone-farming/implement', data),
};

export const satelliteFarmingAPI = {
  getSatelliteFarming: () => api.get('/satellite-farming'),
  implementSatelliteFarming: (data) => api.post('/satellite-farming/implement', data),
};

export const iotFarmingAPI = {
  getIoTFarming: () => api.get('/iot-farming'),
  implementIoTFarming: (data) => api.post('/iot-farming/implement', data),
};

export const sensorFarmingAPI = {
  getSensorFarming: () => api.get('/sensor-farming'),
  implementSensorFarming: (data) => api.post('/sensor-farming/implement', data),
};

export const automationFarmingAPI = {
  getAutomationFarming: () => api.get('/automation-farming'),
  implementAutomationFarming: (data) => api.post('/automation-farming/implement', data),
};

export const artificialIntelligenceFarmingAPI = {
  getAIFarming: () => api.get('/ai-farming'),
  implementAIFarming: (data) => api.post('/ai-farming/implement', data),
};

export const machineLearningFarmingAPI = {
  getMLFarming: () => api.get('/ml-farming'),
  implementMLFarming: (data) => api.post('/ml-farming/implement', data),
};

export const deepLearningFarmingAPI = {
  getDeepLearningFarming: () => api.get('/deep-learning-farming'),
  implementDeepLearningFarming: (data) => api.post('/deep-learning-farming/implement', data),
};

export const computerVisionFarmingAPI = {
  getComputerVisionFarming: () => api.get('/computer-vision-farming'),
  implementComputerVisionFarming: (data) => api.post('/computer-vision-farming/implement', data),
};

export const naturalLanguageProcessingFarmingAPI = {
  getNLPFarming: () => api.get('/nlp-farming'),
  implementNLPFarming: (data) => api.post('/nlp-farming/implement', data),
};

export const speechRecognitionFarmingAPI = {
  getSpeechRecognitionFarming: () => api.get('/speech-recognition-farming'),
  implementSpeechRecognitionFarming: (data) => api.post('/speech-recognition-farming/implement', data),
};

export const imageRecognitionFarmingAPI = {
  getImageRecognitionFarming: () => api.get('/image-recognition-farming'),
  implementImageRecognitionFarming: (data) => api.post('/image-recognition-farming/implement', data),
};

export const patternRecognitionFarmingAPI = {
  getPatternRecognitionFarming: () => api.get('/pattern-recognition-farming'),
  implementPatternRecognitionFarming: (data) => api.post('/pattern-recognition-farming/implement', data),
};

export const anomalyDetectionFarmingAPI = {
  getAnomalyDetectionFarming: () => api.get('/anomaly-detection-farming'),
  implementAnomalyDetectionFarming: (data) => api.post('/anomaly-detection-farming/implement', data),
};

export const predictiveAnalyticsFarmingAPI = {
  getPredictiveAnalyticsFarming: () => api.get('/predictive-analytics-farming'),
  implementPredictiveAnalyticsFarming: (data) => api.post('/predictive-analytics-farming/implement', data),
};

export const prescriptiveAnalyticsFarmingAPI = {
  getPrescriptiveAnalyticsFarming: () => api.get('/prescriptive-analytics-farming'),
  implementPrescriptiveAnalyticsFarming: (data) => api.post('/prescriptive-analytics-farming/implement', data),
};

export const descriptiveAnalyticsFarmingAPI = {
  getDescriptiveAnalyticsFarming: () => api.get('/descriptive-analytics-farming'),
  implementDescriptiveAnalyticsFarming: (data) => api.post('/descriptive-analytics-farming/implement', data),
};

export const diagnosticAnalyticsFarmingAPI = {
  getDiagnosticAnalyticsFarming: () => api.get('/diagnostic-analytics-farming'),
  implementDiagnosticAnalyticsFarming: (data) => api.post('/diagnostic-analytics-farming/implement', data),
};

export const blockchainFarmingAPI = {
  getBlockchainFarming: () => api.get('/blockchain-farming'),
  implementBlockchainFarming: (data) => api.post('/blockchain-farming/implement', data),
};

export const traceabilityFarmingAPI = {
  getTraceabilityFarming: () => api.get('/traceability-farming'),
  implementTraceabilityFarming: (data) => api.post('/traceability-farming/implement', data),
};

export const provenanceFarmingAPI = {
  getProvenanceFarming: () => api.get('/provenance-farming'),
  implementProvenanceFarming: (data) => api.post('/provenance-farming/implement', data),
};

export const transparencyFarmingAPI = {
  getTransparencyFarming: () => api.get('/transparency-farming'),
  implementTransparencyFarming: (data) => api.post('/transparency-farming/implement', data),
};

export const sustainabilityFarmingAPI = {
  getSustainabilityFarming: () => api.get('/sustainability-farming'),
  implementSustainabilityFarming: (data) => api.post('/sustainability-farming/implement', data),
};

export const environmentalImpactFarmingAPI = {
  getEnvironmentalImpactFarming: () => api.get('/environmental-impact-farming'),
  assessEnvironmentalImpact: (data) => api.post('/environmental-impact-farming/assess', data),
};

export const carbonFootprintFarmingAPI = {
  getCarbonFootprintFarming: () => api.get('/carbon-footprint-farming'),
  calculateCarbonFootprint: (data) => api.post('/carbon-footprint-farming/calculate', data),
};

export const waterFootprintFarmingAPI = {
  getWaterFootprintFarming: () => api.get('/water-footprint-farming'),
  calculateWaterFootprint: (data) => api.post('/water-footprint-farming/calculate', data),
};

export const biodiversityFarmingAPI = {
  getBiodiversityFarming: () => api.get('/biodiversity-farming'),
  assessBiodiversity: (data) => api.post('/biodiversity-farming/assess', data),
};

export const ecosystemServicesFarmingAPI = {
  getEcosystemServicesFarming: () => api.get('/ecosystem-services-farming'),
  assessEcosystemServices: (data) => api.post('/ecosystem-services-farming/assess', data),
};

export const soilConservationFarmingAPI = {
  getSoilConservationFarming: () => api.get('/soil-conservation-farming'),
  implementSoilConservation: (data) => api.post('/soil-conservation-farming/implement', data),
};

export const waterConservationFarmingAPI = {
  getWaterConservationFarming: () => api.get('/water-conservation-farming'),
  implementWaterConservation: (data) => api.post('/water-conservation-farming/implement', data),
};

export const energyConservationFarmingAPI = {
  getEnergyConservationFarming: () => api.get('/energy-conservation-farming'),
  implementEnergyConservation: (data) => api.post('/energy-conservation-farming/implement', data),
};

export const wasteReductionFarmingAPI = {
  getWasteReductionFarming: () => api.get('/waste-reduction-farming'),
  implementWasteReduction: (data) => api.post('/waste-reduction-farming/implement', data),
};

export const circularEconomyFarmingAPI = {
  getCircularEconomyFarming: () => api.get('/circular-economy-farming'),
  implementCircularEconomy: (data) => api.post('/circular-economy-farming/implement', data),
};

export const zeroWasteFarmingAPI = {
  getZeroWasteFarming: () => api.get('/zero-waste-farming'),
  implementZeroWaste: (data) => api.post('/zero-waste-farming/implement', data),
};

export const climateResilienceFarmingAPI = {
  getClimateResilienceFarming: () => api.get('/climate-resilience-farming'),
  buildClimateResilience: (data) => api.post('/climate-resilience-farming/build', data),
};

export const droughtResilienceFarmingAPI = {
  getDroughtResilienceFarming: () => api.get('/drought-resilience-farming'),
  buildDroughtResilience: (data) => api.post('/drought-resilience-farming/build', data),
};

export const floodResilienceFarmingAPI = {
  getFloodResilienceFarming: () => api.get('/flood-resilience-farming'),
  buildFloodResilience: (data) => api.post('/flood-resilience-farming/build', data),
};

export const pestResilienceFarmingAPI = {
  getPestResilienceFarming: () => api.get('/pest-resilience-farming'),
  buildPestResilience: (data) => api.post('/pest-resilience-farming/build', data),
};

export const diseaseResilienceFarmingAPI = {
  getDiseaseResilienceFarming: () => api.get('/disease-resilience-farming'),
  buildDiseaseResilience: (data) => api.post('/disease-resilience-farming/build', data),
};

export const marketResilienceFarmingAPI = {
  getMarketResilienceFarming: () => api.get('/market-resilience-farming'),
  buildMarketResilience: (data) => api.post('/market-resilience-farming/build', data),
};

export const financialResilienceFarmingAPI = {
  getFinancialResilienceFarming: () => api.get('/financial-resilience-farming'),
  buildFinancialResilience: (data) => api.post('/financial-resilience-farming/build', data),
};

export const socialResilienceFarmingAPI = {
  getSocialResilienceFarming: () => api.get('/social-resilience-farming'),
  buildSocialResilience: (data) => api.post('/social-resilience-farming/build', data),
};

export const institutionalResilienceFarmingAPI = {
  getInstitutionalResilienceFarming: () => api.get('/institutional-resilience-farming'),
  buildInstitutionalResilience: (data) => api.post('/institutional-resilience-farming/build', data),
};

export const policyResilienceFarmingAPI = {
  getPolicyResilienceFarming: () => api.get('/policy-resilience-farming'),
  buildPolicyResilience: (data) => api.post('/policy-resilience-farming/build', data),
};

export const regulatoryResilienceFarmingAPI = {
  getRegulatoryResilienceFarming: () => api.get('/regulatory-resilience-farming'),
  buildRegulatoryResilience: (data) => api.post('/regulatory-resilience-farming/build', data),
};

export const complianceResilienceFarmingAPI = {
  getComplianceResilienceFarming: () => api.get('/compliance-resilience-farming'),
  buildComplianceResilience: (data) => api.post('/compliance-resilience-farming/build', data),
};

export const auditResilienceFarmingAPI = {
  getAuditResilienceFarming: () => api.get('/audit-resilience-farming'),
  buildAuditResilience: (data) => api.post('/audit-resilience-farming/build', data),
};

export const certificationResilienceFarmingAPI = {
  getCertificationResilienceFarming: () => api.get('/certification-resilience-farming'),
  buildCertificationResilience: (data) => api.post('/certification-resilience-farming/build', data),
};

export const standardResilienceFarmingAPI = {
  getStandardResilienceFarming: () => api.get('/standard-resilience-farming'),
  buildStandardResilience: (data) => api.post('/standard-resilience-farming/build', data),
};

export const accreditationResilienceFarmingAPI = {
  getAccreditationResilienceFarming: () => api.get('/accreditation-resilience-farming'),
  buildAccreditationResilience: (data) => api.post('/accreditation-resilience-farming/build', data),
};

export const licensingResilienceFarmingAPI = {
  getLicensingResilienceFarming: () => api.get('/licensing-resilience-farming'),
  buildLicensingResilience: (data) => api.post('/licensing-resilience-farming/build', data),
};

export const permittingResilienceFarmingAPI = {
  getPermittingResilienceFarming: () => api.get('/permitting-resilience-farming'),
  buildPermittingResilience: (data) => api.post('/permitting-resilience-farming/build', data),
};

export const inspectionResilienceFarmingAPI = {
  getInspectionResilienceFarming: () => api.get('/inspection-resilience-farming'),
  buildInspectionResilience: (data) => api.post('/inspection-resilience-farming/build', data),
};

export const testingResilienceFarmingAPI = {
  getTestingResilienceFarming: () => api.get('/testing-resilience-farming'),
  buildTestingResilience: (data) => api.post('/testing-resilience-farming/build', data),
};

export const validationResilienceFarmingAPI = {
  getValidationResilienceFarming: () => api.get('/validation-resilience-farming'),
  buildValidationResilience: (data) => api.post('/validation-resilience-farming/build', data),
};

export const verificationResilienceFarmingAPI = {
  getVerificationResilienceFarming: () => api.get('/verification-resilience-farming'),
  buildVerificationResilience: (data) => api.post('/verification-resilience-farming/build', data),
};

export const documentationResilienceFarmingAPI = {
  getDocumentationResilienceFarming: () => api.get('/documentation-resilience-farming'),
  buildDocumentationResilience: (data) => api.post('/documentation-resilience-farming/build', data),
};

export const reportingResilienceFarmingAPI = {
  getReportingResilienceFarming: () => api.get('/reporting-resilience-farming'),
  buildReportingResilience: (data) => api.post('/reporting-resilience-farming/build', data),
};

export const disclosureResilienceFarmingAPI = {
  getDisclosureResilienceFarming: () => api.get('/disclosure-resilience-farming'),
  buildDisclosureResilience: (data) => api.post('/disclosure-resilience-farming/build', data),
};

export const transparencyResilienceFarmingAPI = {
  getTransparencyResilienceFarming: () => api.get('/transparency-resilience-farming'),
  buildTransparencyResilience: (data) => api.post('/transparency-resilience-farming/build', data),
};

export const accountabilityResilienceFarmingAPI = {
  getAccountabilityResilienceFarming: () => api.get('/accountability-resilience-farming'),
  buildAccountabilityResilience: (data) => api.post('/accountability-resilience-farming/build', data),
};

export const responsibilityResilienceFarmingAPI = {
  getResponsibilityResilienceFarming: () => api.get('/responsibility-resilience-farming'),
  buildResponsibilityResilience: (data) => api.post('/responsibility-resilience-farming/build', data),
};

export const ethicsResilienceFarmingAPI = {
  getEthicsResilienceFarming: () => api.get('/ethics-resilience-farming'),
  buildEthicsResilience: (data) => api.post('/ethics-resilience-farming/build', data),
};

export const governanceResilienceFarmingAPI = {
  getGovernanceResilienceFarming: () => api.get('/governance-resilience-farming'),
  buildGovernanceResilience: (data) => api.post('/governance-resilience-farming/build', data),
};

export const leadershipResilienceFarmingAPI = {
  getLeadershipResilienceFarming: () => api.get('/leadership-resilience-farming'),
  buildLeadershipResilience: (data) => api.post('/leadership-resilience-farming/build', data),
};

export const managementResilienceFarmingAPI = {
  getManagementResilienceFarming: () => api.get('/management-resilience-farming'),
  buildManagementResilience: (data) => api.post('/management-resilience-farming/build', data),
};

export const cultureResilienceFarmingAPI = {
  getCultureResilienceFarming: () => api.get('/culture-resilience-farming'),
  buildCultureResilience: (data) => api.post('/culture-resilience-farming/build', data),
};

export const peopleResilienceFarmingAPI = {
  getPeopleResilienceFarming: () => api.get('/people-resilience-farming'),
  buildPeopleResilience: (data) => api.post('/people-resilience-farming/build', data),
};

export const skillsResilienceFarmingAPI = {
  getSkillsResilienceFarming: () => api.get('/skills-resilience-farming'),
  buildSkillsResilience: (data) => api.post('/skills-resilience-farming/build', data),
};

export const trainingResilienceFarmingAPI = {
  getTrainingResilienceFarming: () => api.get('/training-resilience-farming'),
  buildTrainingResilience: (data) => api.post('/training-resilience-farming/build', data),
};

export const educationResilienceFarmingAPI = {
  getEducationResilienceFarming: () => api.get('/education-resilience-farming'),
  buildEducationResilience: (data) => api.post('/education-resilience-farming/build', data),
};

export const knowledgeResilienceFarmingAPI = {
  getKnowledgeResilienceFarming: () => api.get('/knowledge-resilience-farming'),
  buildKnowledgeResilience: (data) => api.post('/knowledge-resilience-farming/build', data),
};

export const innovationResilienceFarmingAPI = {
  getInnovationResilienceFarming: () => api.get('/innovation-resilience-farming'),
  buildInnovationResilience: (data) => api.post('/innovation-resilience-farming/build', data),
};

export const researchResilienceFarmingAPI = {
  getResearchResilienceFarming: () => api.get('/research-resilience-farming'),
  buildResearchResilience: (data) => api.post('/research-resilience-farming/build', data),
};

export const developmentResilienceFarmingAPI = {
  getDevelopmentResilienceFarming: () => api.get('/development-resilience-farming'),
  buildDevelopmentResilience: (data) => api.post('/development-resilience-farming/build', data),
};

export const technologyResilienceFarmingAPI = {
  getTechnologyResilienceFarming: () => api.get('/technology-resilience-farming'),
  buildTechnologyResilience: (data) => api.post('/technology-resilience-farming/build', data),
};

export const infrastructureResilienceFarmingAPI = {
  getInfrastructureResilienceFarming: () => api.get('/infrastructure-resilience-farming'),
  buildInfrastructureResilience: (data) => api.post('/infrastructure-resilience-farming/build', data),
};

export const systemsResilienceFarmingAPI = {
  getSystemsResilienceFarming: () => api.get('/systems-resilience-farming'),
  buildSystemsResilience: (data) => api.post('/systems-resilience-farming/build', data),
};

export const processesResilienceFarmingAPI = {
  getProcessesResilienceFarming: () => api.get('/processes-resilience-farming'),
  buildProcessesResilience: (data) => api.post('/processes-resilience-farming/build', data),
};

export const workflowsResilienceFarmingAPI = {
  getWorkflowsResilienceFarming: () => api.get('/workflows-resilience-farming'),
  buildWorkflowsResilience: (data) => api.post('/workflows-resilience-farming/build', data),
};

export const operationsResilienceFarmingAPI = {
  getOperationsResilienceFarming: () => api.get('/operations-resilience-farming'),
  buildOperationsResilience: (data) => api.post('/operations-resilience-farming/build', data),
};

export const supplyChainsResilienceFarmingAPI = {
  getSupplyChainsResilienceFarming: () => api.get('/supply-chains-resilience-farming'),
  buildSupplyChainsResilience: (data) => api.post('/supply-chains-resilience-farming/build', data),
};

export const logisticsResilienceFarmingAPI = {
  getLogisticsResilienceFarming: () => api.get('/logistics-resilience-farming'),
  buildLogisticsResilience: (data) => api.post('/logistics-resilience-farming/build', data),
};

export const distributionResilienceFarmingAPI = {
  getDistributionResilienceFarming: () => api.get('/distribution-resilience-farming'),
  buildDistributionResilience: (data) => api.post('/distribution-resilience-farming/build', data),
};

export const marketsResilienceFarmingAPI = {
  getMarketsResilienceFarming: () => api.get('/markets-resilience-farming'),
  buildMarketsResilience: (data) => api.post('/markets-resilience-farming/build', data),
};

export const customersResilienceFarmingAPI = {
  getCustomersResilienceFarming: () => api.get('/customers-resilience-farming'),
  buildCustomersResilience: (data) => api.post('/customers-resilience-farming/build', data),
};

export const partnersResilienceFarmingAPI = {
  getPartnersResilienceFarming: () => api.get('/partners-resilience-farming'),
  buildPartnersResilience: (data) => api.post('/partners-resilience-farming/build', data),
};

export const suppliersResilienceFarmingAPI = {
  getSuppliersResilienceFarming: () => api.get('/suppliers-resilience-farming'),
  buildSuppliersResilience: (data) => api.post('/suppliers-resilience-farming/build', data),
};

export const competitorsResilienceFarmingAPI = {
  getCompetitorsResilienceFarming: () => api.get('/competitors-resilience-farming'),
  buildCompetitorsResilience: (data) => api.post('/competitors-resilience-farming/build', data),
};

export const industryResilienceFarmingAPI = {
  getIndustryResilienceFarming: () => api.get('/industry-resilience-farming'),
  buildIndustryResilience: (data) => api.post('/industry-resilience-farming/build', data),
};

export const economyResilienceFarmingAPI = {
  getEconomyResilienceFarming: () => api.get('/economy-resilience-farming'),
  buildEconomyResilience: (data) => api.post('/economy-resilience-farming/build', data),
};

export const societyResilienceFarmingAPI = {
  getSocietyResilienceFarming: () => api.get('/society-resilience-farming'),
  buildSocietyResilience: (data) => api.post('/society-resilience-farming/build', data),
};

export const environmentResilienceFarmingAPI = {
  getEnvironmentResilienceFarming: () => api.get('/environment-resilience-farming'),
  buildEnvironmentResilience: (data) => api.post('/environment-resilience-farming/build', data),
};

export const communityResilienceFarmingAPI = {
  getCommunityResilienceFarming: () => api.get('/community-resilience-farming'),
  buildCommunityResilience: (data) => api.post('/community-resilience-farming/build', data),
};

export const familyResilienceFarmingAPI = {
  getFamilyResilienceFarming: () => api.get('/family-resilience-farming'),
  buildFamilyResilience: (data) => api.post('/family-resilience-farming/build', data),
};

export const individualResilienceFarmingAPI = {
  getIndividualResilienceFarming: () => api.get('/individual-resilience-farming'),
  buildIndividualResilience: (data) => api.post('/individual-resilience-farming/build', data),
};

// Community and governance APIs
export const knowledgeGraphAPI = {
  getKnowledgeGraph: () => api.get('/knowledge-graph'),
  buildKnowledgeGraph: (data) => api.post('/knowledge-graph/build', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  searchNodes: (data) => api.post('/knowledge-graph/nodes', data),
  getRelatedNodes: (id, params) => api.get(`/knowledge-graph/related-nodes${id !== undefined ? '/' + id : ''}`, { params }),
};

export const libraryAPI = {
  getLibrary: () => api.get('/library'),
  searchLibrary: (query) => api.post('/library/search', query),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  search: (data) => api.post('/library', data),
  getStatistics: (id, params) => api.get(`/library/statistics${id !== undefined ? '/' + id : ''}`, { params }),
  getModules: (id, params) => api.get(`/library/modules${id !== undefined ? '/' + id : ''}`, { params }),
  initialize: (id, params) => api.get(`/library/tialize${id !== undefined ? '/' + id : ''}`, { params }),
  verifyCatalog: (data) => api.post('/library/catalog', data),
  getModule: (id, params) => api.get(`/library/module${id !== undefined ? '/' + id : ''}`, { params }),
};

export const panchayatAPI = {
  getPanchayats: () => api.get('/panchayats'),
  getPanchayat: (id) => api.get(`/panchayats/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  createPanchayat: (data) => api.post('/panchayat/panchayat', data),
};

export const blockManagementAPI = {
  getBlocks: () => api.get('/blocks'),
  getBlock: (id) => api.get(`/blocks/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  createBlock: (data) => api.post('/block-management/block', data),
  updateBlock: (data) => api.put('/block-management/block', data),
  deleteBlock: (id) => api.delete(`/block-management/block${id !== undefined ? '/' + id : ''}`),
};

export const districtManagementAPI = {
  getDistricts: () => api.get('/districts'),
  getDistrict: (id) => api.get(`/districts/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  createDistrict: (data) => api.post('/district-management/district', data),
  updateDistrict: (data) => api.put('/district-management/district', data),
  deleteDistrict: (id) => api.delete(`/district-management/district${id !== undefined ? '/' + id : ''}`),
};

export const stateManagementAPI = {
  getStates: () => api.get('/states'),
  getState: (id) => api.get(`/states/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  createState: (data) => api.post('/state-management/state', data),
  updateState: (data) => api.put('/state-management/state', data),
  deleteState: (id) => api.delete(`/state-management/state${id !== undefined ? '/' + id : ''}`),
};

export const villageManagementAPI = {
  getVillages: () => api.get('/villages'),
  getVillage: (id) => api.get(`/villages/${id}`),
};

export const cooperativeManagementAPI = {
  getCooperatives: () => api.get('/cooperatives'),
  getCooperative: (id) => api.get(`/cooperatives/${id}`),
};

export const cooperativeAPI = {
  getCooperatives: () => api.get('/cooperatives'),
  createCooperative: (data) => api.post('/cooperatives', data),
};

export const communityAssetAPI = {
  getCommunityAssets: () => api.get('/community-assets'),
  manageCommunityAsset: (data) => api.post('/community-assets/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAssets: (id, params) => api.get(`/community-asset/assets${id !== undefined ? '/' + id : ''}`, { params }),
  createAsset: (data) => api.post('/community-asset/asset', data),
  updateAsset: (data) => api.put('/community-asset/asset', data),
  deleteAsset: (id) => api.delete(`/community-asset/asset${id !== undefined ? '/' + id : ''}`),
};

export const producerGroupAPI = {
  getProducerGroups: () => api.get('/producer-groups'),
  createProducerGroup: (data) => api.post('/producer-groups', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getGroups: (id, params) => api.get(`/producer-group/groups${id !== undefined ? '/' + id : ''}`, { params }),
  createGroup: (data) => api.post('/producer-group/group', data),
  updateGroup: (data) => api.put('/producer-group/group', data),
  deleteGroup: (id) => api.delete(`/producer-group/group${id !== undefined ? '/' + id : ''}`),
};

export const auditComplianceAPI = {
  getAuditCompliance: () => api.get('/audit-compliance'),
  runAudit: (data) => api.post('/audit-compliance/run', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAuditLogs: (id, params) => api.get(`/audit-compliance/audit-logs${id !== undefined ? '/' + id : ''}`, { params }),
  listComplianceRules: (id, params) => api.get(`/audit-compliance/compliance-rules${id !== undefined ? '/' + id : ''}`, { params }),
  createAuditLog: (data) => api.post('/audit-compliance/audit-log', data),
  detectAuditAnomalies: (id, params) => api.get(`/audit-compliance/ect-audit-anomalies${id !== undefined ? '/' + id : ''}`, { params }),
  verifyAuditLogIntegrity: (data) => api.post('/audit-compliance/audit-log-integrity', data),
};

export const strategicAPI = {
  getStrategicData: () => api.get('/strategic'),
  planStrategy: (data) => api.post('/strategic/plan', data),
};

export const vendorsAPI = {
  getVendors: () => api.get('/vendors'),
  getVendor: (id) => api.get(`/vendors/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getBuyerProfile: (id, params) => api.get(`/vendors/buyer-profile${id !== undefined ? '/' + id : ''}`, { params }),
  getCreditStatus: (id, params) => api.get(`/vendors/credit-status${id !== undefined ? '/' + id : ''}`, { params }),
  getActiveOrders: (id, params) => api.get(`/vendors/active-orders${id !== undefined ? '/' + id : ''}`, { params }),
  createCorporateOrder: (data) => api.post('/vendors/corporate-order', data),
  getLogisticsProfile: (id, params) => api.get(`/vendors/logistics-profile${id !== undefined ? '/' + id : ''}`, { params }),
  getActiveShipments: (id, params) => api.get(`/vendors/active-shipments${id !== undefined ? '/' + id : ''}`, { params }),
  getColdChainNodes: (id, params) => api.get(`/vendors/cold-chain-nodes${id !== undefined ? '/' + id : ''}`, { params }),
  getReturnTruckOpportunities: (id, params) => api.get(`/vendors/return-truck-opportunities${id !== undefined ? '/' + id : ''}`, { params }),
  createLogisticsBooking: (data) => api.post('/vendors/logistics-booking', data),
};

export const economicAPI = {
  getEconomicData: () => api.get('/economic'),
  analyzeEconomics: (data) => api.post('/economic/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  corridorModel: (id, params) => api.get(`/economic/ridor-model${id !== undefined ? '/' + id : ''}`, { params }),
  mandiSignal: (id, params) => api.get(`/economic/di-signal${id !== undefined ? '/' + id : ''}`, { params }),
};

// Crop management APIs
export const cropCalendarAPI = {
  getCropCalendar: () => api.get('/crop-calendar'),
  updateCropCalendar: (data) => api.put('/crop-calendar', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getEntries: (id, params) => api.get(`/crop-calendar/entries${id !== undefined ? '/' + id : ''}`, { params }),
  createEntry: (data) => api.post('/crop-calendar/entry', data),
  updateEntry: (data) => api.put('/crop-calendar/entry', data),
  deleteEntry: (id) => api.delete(`/crop-calendar/entry${id !== undefined ? '/' + id : ''}`),
};

export const cropMonitoringAPI = {
  getCropMonitoring: () => api.get('/crop-monitoring'),
  monitorCrop: (data) => api.post('/crop-monitoring/monitor', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getObservations: (id, params) => api.get(`/crop-monitoring/observations${id !== undefined ? '/' + id : ''}`, { params }),
  createObservation: (data) => api.post('/crop-monitoring/observation', data),
  updateObservation: (data) => api.put('/crop-monitoring/observation', data),
  deleteObservation: (id) => api.delete(`/crop-monitoring/observation${id !== undefined ? '/' + id : ''}`),
};

export const cropRegistrationAPI = {
  getCropRegistrations: () => api.get('/crop-registrations'),
  registerCrop: (data) => api.post('/crop-registrations', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCrops: (id, params) => api.get(`/crop-registration/crops${id !== undefined ? '/' + id : ''}`, { params }),
  updateCrop: (data) => api.put('/crop-registration/crop', data),
  deleteCrop: (id) => api.delete(`/crop-registration/crop${id !== undefined ? '/' + id : ''}`),
};

export const cropVarietyAPI = {
  getCropVarieties: () => api.get('/crop-varieties'),
  createCropVariety: (data) => api.post('/crop-varieties', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getVarieties: (id, params) => api.get(`/crop-variety/varieties${id !== undefined ? '/' + id : ''}`, { params }),
  createVariety: (data) => api.post('/crop-variety/variety', data),
  updateVariety: (data) => api.put('/crop-variety/variety', data),
  deleteVariety: (id) => api.delete(`/crop-variety/variety${id !== undefined ? '/' + id : ''}`),
};

export const dairyAIAPI = {
  getDairyAI: () => api.get('/dairy-ai'),
  analyzeDairy: (data) => api.post('/dairy-ai/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  optimizeMilkProduction: (data) => api.post('/dairy-ai/milk-production', data),
  predictHealthRisks: (data) => api.post('/dairy-ai/health-risks', data),
  optimizeFeedComposition: (data) => api.post('/dairy-ai/feed-composition', data),
  recommendBreeding: (data) => api.post('/dairy-ai/breeding', data),
};

// Additional missing exports
export const financialAPI = {
  getFinancialData: () => api.get('/financial'),
  analyzeFinancials: (data) => api.post('/financial/analyze', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCreditScore: (id, params) => api.get(`/financial/credit-score${id !== undefined ? '/' + id : ''}`, { params }),
  getOverview: (id, params) => api.get(`/financial/overview${id !== undefined ? '/' + id : ''}`, { params }),
  getLoans: (id, params) => api.get(`/financial/loans${id !== undefined ? '/' + id : ''}`, { params }),
};

export const enterpriseControlAPI = {
  getEnterpriseControl: () => api.get('/enterprise-control'),
  controlEnterprise: (data) => api.post('/enterprise-control/control', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  startWorkflow: (data) => api.post('/enterprise-control/workflow', data),
  actOnWorkflow: (id, params) => api.get(`/enterprise-control/on-workflow${id !== undefined ? '/' + id : ''}`, { params }),
  pipeline: (id, params) => api.get(`/enterprise-control/eline${id !== undefined ? '/' + id : ''}`, { params }),
  createLead: (data) => api.post('/enterprise-control/lead', data),
  convertLead: (id, params) => api.get(`/enterprise-control/vert-lead${id !== undefined ? '/' + id : ''}`, { params }),
  clientHealth: (id, params) => api.get(`/enterprise-control/ent-health${id !== undefined ? '/' + id : ''}`, { params }),
  legalCalendar: (id, params) => api.get(`/enterprise-control/al-calendar${id !== undefined ? '/' + id : ''}`, { params }),
  riskHeatmap: (id, params) => api.get(`/enterprise-control/k-heatmap${id !== undefined ? '/' + id : ''}`, { params }),
  assessRisk: (id, params) => api.get(`/enterprise-control/ess-risk${id !== undefined ? '/' + id : ''}`, { params }),
  activeIncidents: (id, params) => api.get(`/enterprise-control/ive-incidents${id !== undefined ? '/' + id : ''}`, { params }),
  raiseIncident: (id, params) => api.get(`/enterprise-control/se-incident${id !== undefined ? '/' + id : ''}`, { params }),
  acknowledgeIncident: (id, params) => api.get(`/enterprise-control/nowledge-incident${id !== undefined ? '/' + id : ''}`, { params }),
};

export const erpAPI = {
  getERPData: () => api.get('/erp'),
  manageERP: (data) => api.post('/erp/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getSyncStatus: (id, params) => api.get(`/erp/sync-status${id !== undefined ? '/' + id : ''}`, { params }),
};

export const fpoAPI = {
  getFPOs: () => api.get('/fpos'),
  getFPO: (id) => api.get(`/fpos/${id}`),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getStats: (id, params) => api.get(`/fpo/stats${id !== undefined ? '/' + id : ''}`, { params }),
};

export const farmerHealthRecordsAPI = {
  getFarmerHealthRecords: () => api.get('/farmer-health-records'),
  createHealthRecord: (data) => api.post('/farmer-health-records', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRecords: (id, params) => api.get(`/farmer-health-records/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/farmer-health-records/record', data),
  updateRecord: (data) => api.put('/farmer-health-records/record', data),
  deleteRecord: (id) => api.delete(`/farmer-health-records/record${id !== undefined ? '/' + id : ''}`),
};

export const farmerWelfareAPI = {
  getFarmerWelfare: () => api.get('/farmer-welfare'),
  manageWelfare: (data) => api.post('/farmer-welfare/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getPrograms: (id, params) => api.get(`/farmer-welfare/programs${id !== undefined ? '/' + id : ''}`, { params }),
  enroll: (id, params) => api.get(`/farmer-welfare/oll${id !== undefined ? '/' + id : ''}`, { params }),
};

export const kycAPI = {
  getKYC: () => api.get('/kyc'),
  submitKYC: (data) => api.post('/kyc/submit', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getApplications: (id, params) => api.get(`/kyc/applications${id !== undefined ? '/' + id : ''}`, { params }),
  submitApplication: (data) => api.post('/kyc/application', data),
  verifyApplication: (data) => api.post('/kyc/application', data),
  rejectApplication: (data) => api.post('/kyc/application', data),
};

export const farmerProfileAPI = {
  getFarmerProfile: () => api.get('/farmer-profile'),
  updateFarmerProfile: (data) => api.put('/farmer-profile', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getProfiles: (id, params) => api.get(`/farmer-profile/profiles${id !== undefined ? '/' + id : ''}`, { params }),
  createProfile: (data) => api.post('/farmer-profile/profile', data),
  updateProfile: (data) => api.put('/farmer-profile/profile', data),
  deleteProfile: (id) => api.delete(`/farmer-profile/profile${id !== undefined ? '/' + id : ''}`),
};

export const farmerValueAPI = {
  getFarmerValue: () => api.get('/farmer-value'),
  calculateFarmerValue: (data) => api.post('/farmer-value/calculate', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getSeasonLedger: (id, params) => api.get(`/farmer-value/season-ledger${id !== undefined ? '/' + id : ''}`, { params }),
};

export const farmerSkillAPI = {
  getFarmerSkills: () => api.get('/farmer-skills'),
  addFarmerSkill: (data) => api.post('/farmer-skills', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getSkills: (id, params) => api.get(`/farmer-skill/skills${id !== undefined ? '/' + id : ''}`, { params }),
  addSkill: (data) => api.post('/farmer-skill/skill', data),
  updateSkill: (data) => api.put('/farmer-skill/skill', data),
  deleteSkill: (id) => api.delete(`/farmer-skill/skill${id !== undefined ? '/' + id : ''}`),
};

export const farmerVerificationAPI = {
  getFarmerVerifications: () => api.get('/farmer-verifications'),
  verifyFarmer: (data) => api.post('/farmer-verifications/verify', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  verifyRequest: (data) => api.post('/farmer-verification/request', data),
  rejectRequest: (data) => api.post('/farmer-verification/request', data),
  getRequests: (id, params) => api.get(`/farmer-verification/requests${id !== undefined ? '/' + id : ''}`, { params }),
  submitRequest: (data) => api.post('/farmer-verification/request', data),
};

// Additional missing exports for various pages
export const fertilizerAPI = {
  getFertilizers: () => api.get('/fertilizers'),
  manageFertilizer: (data) => api.post('/fertilizers/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getInventory: (id, params) => api.get(`/fertilizer/inventory${id !== undefined ? '/' + id : ''}`, { params }),
  updateInventoryItem: (data) => api.put('/fertilizer/inventory-item', data),
  createInventoryItem: (data) => api.post('/fertilizer/inventory-item', data),
  deleteInventoryItem: (id) => api.delete(`/fertilizer/inventory-item${id !== undefined ? '/' + id : ''}`),
  issueStock: (id, params) => api.get(`/fertilizer/ue-stock${id !== undefined ? '/' + id : ''}`, { params }),
};

export const microFarmAPI = {
  getMicroFarms: () => api.get('/micro-farms'),
  manageMicroFarm: (data) => api.post('/micro-farms/manage', data),
};

export const hatcheryManagementAPI = {
  getHatcheries: () => api.get('/hatchery-management'),
  manageHatchery: (data) => api.post('/hatchery-management/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getBatches: (id, params) => api.get(`/hatchery-management/batches${id !== undefined ? '/' + id : ''}`, { params }),
  createBatch: (data) => api.post('/hatchery-management/batch', data),
  updateBatch: (data) => api.put('/hatchery-management/batch', data),
  deleteBatch: (id) => api.delete(`/hatchery-management/batch${id !== undefined ? '/' + id : ''}`),
};

export const fishFeedAPI = {
  getFishFeeds: () => api.get('/fish-feed'),
  manageFishFeed: (data) => api.post('/fish-feed/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getLogs: (id, params) => api.get(`/fish-feed/logs${id !== undefined ? '/' + id : ''}`, { params }),
  createLog: (data) => api.post('/fish-feed/log', data),
  updateLog: (data) => api.put('/fish-feed/log', data),
  deleteLog: (id) => api.delete(`/fish-feed/log${id !== undefined ? '/' + id : ''}`),
};

export const fisheriesWaterQualityAPI = {
  getWaterQuality: () => api.get('/fisheries-water-quality'),
  monitorWaterQuality: (data) => api.post('/fisheries-water-quality/monitor', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getReadings: (id, params) => api.get(`/fisheries-water-quality/readings${id !== undefined ? '/' + id : ''}`, { params }),
  createReading: (data) => api.post('/fisheries-water-quality/reading', data),
  updateReading: (data) => api.put('/fisheries-water-quality/reading', data),
  deleteReading: (id) => api.delete(`/fisheries-water-quality/reading${id !== undefined ? '/' + id : ''}`),
};

export const fisheriesHealthAPI = {
  getFisheriesHealth: () => api.get('/fisheries-health'),
  monitorFisheriesHealth: (data) => api.post('/fisheries-health/monitor', data),
};

export const fisheriesHarvestAPI = {
  getFisheriesHarvest: () => api.get('/fisheries-harvest'),
  manageHarvest: (data) => api.post('/fisheries-harvest/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getHarvests: (id, params) => api.get(`/fisheries-harvest/harvests${id !== undefined ? '/' + id : ''}`, { params }),
  createHarvest: (data) => api.post('/fisheries-harvest/harvest', data),
  updateHarvest: (data) => api.put('/fisheries-harvest/harvest', data),
  deleteHarvest: (id) => api.delete(`/fisheries-harvest/harvest${id !== undefined ? '/' + id : ''}`),
};

export const fisheriesPCRManagementAPI = {
  getFisheriesPCR: () => api.get('/fisheries-pcr-management'),
  managePCR: (data) => api.post('/fisheries-pcr-management/manage', data),
};

export const fisheriesComplianceAPI = {
  getFisheriesCompliance: () => api.get('/fisheries-compliance'),
  checkCompliance: (data) => api.post('/fisheries-compliance/check', data),
};

export const fleetAPI = {
  getFleets: () => api.get('/fleets'),
  manageFleet: (data) => api.post('/fleets/manage', data),
};

export const flightAPI = {
  getFlights: () => api.get('/flights'),
  bookFlight: (data) => api.post('/flights/book', data),
};

export const financeLeasingAPI = {
  getFinanceLeasing: () => api.get('/finance-leasing'),
  manageLeasing: (data) => api.post('/finance-leasing/manage', data),
};

export const foodGrainsAPI = {
  getFoodGrains: () => api.get('/food-grains'),
  manageFoodGrains: (data) => api.post('/food-grains/manage', data),
};

export const forageAPI = {
  getForage: () => api.get('/forage'),
  manageForage: (data) => api.post('/forage/manage', data),
};

export const forecastAPI = {
  getForecasts: () => api.get('/forecast'),
  generateForecast: (data) => api.post('/forecast/generate', data),
};

export const formulationAPI = {
  getFormulations: () => api.get('/formulations'),
  createFormulation: (data) => api.post('/formulations', data),
};

export const franchiseAPI = {
  getFranchises: () => api.get('/franchises'),
  createFranchise: (data) => api.post('/franchises', data),
};

export const freshProduceAPI = {
  getFreshProduce: () => api.get('/fresh-produce'),
  manageFreshProduce: (data) => api.post('/fresh-produce/manage', data),
};

export const fruitCropsAPI = {
  getFruitCrops: () => api.get('/fruit-crops'),
  manageFruitCrops: (data) => api.post('/fruit-crops/manage', data),
};

export const fundAPI = {
  getFunds: () => api.get('/funds'),
  createFund: (data) => api.post('/funds', data),
};

export const fundingAPI = {
  getFunding: () => api.get('/funding'),
  applyForFunding: (data) => api.post('/funding/apply', data),
};

export const futureMarketAPI = {
  getFutureMarkets: () => api.get('/future-markets'),
  tradeFuture: (data) => api.post('/future-markets/trade', data),
};

export const gameMeatAPI = {
  getGameMeat: () => api.get('/game-meat'),
  manageGameMeat: (data) => api.post('/game-meat/manage', data),
};

export const geoSpatialAPI = {
  getGeoSpatial: () => api.get('/geo-spatial'),
  analyzeGeoSpatial: (data) => api.post('/geo-spatial/analyze', data),
};

export const geneticsAPI = {
  getGenetics: () => api.get('/genetics'),
  analyzeGenetics: (data) => api.post('/genetics/analyze', data),
};

export const geoTaggingAPI = {
  getGeoTagging: () => api.get('/geo-tagging'),
  createGeoTag: (data) => api.post('/geo-tagging', data),
};

export const governmentSchemesAPI = {
  getGovernmentSchemes: () => api.get('/government-schemes'),
  applyForScheme: (id, data) => api.post(`/government-schemes/${id}/apply`, data),
};

export const grainAPI = {
  getGrains: () => api.get('/grains'),
  manageGrains: (data) => api.post('/grains/manage', data),
};

export const grazingAPI = {
  getGrazing: () => api.get('/grazing'),
  manageGrazing: (data) => api.post('/grazing/manage', data),
};

export const greenhouseAPI = {
  getGreenhouses: () => api.get('/greenhouses'),
  manageGreenhouse: (data) => api.post('/greenhouses/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getRegistry: (id, params) => api.get(`/greenhouse/registry${id !== undefined ? '/' + id : ''}`, { params }),
  createEntry: (data) => api.post('/greenhouse/entry', data),
  updateEntry: (data) => api.put('/greenhouse/entry', data),
  deleteEntry: (id) => api.delete(`/greenhouse/entry${id !== undefined ? '/' + id : ''}`),
  monitor: (id, params) => api.get(`/greenhouse/itor${id !== undefined ? '/' + id : ''}`, { params }),
};

export const growingAPI = {
  getGrowing: () => api.get('/growing'),
  manageGrowing: (data) => api.post('/growing/manage', data),
};

export const guardianAPI = {
  getGuardians: () => api.get('/guardians'),
  assignGuardian: (data) => api.post('/guardians/assign', data),
};

export const habitatAPI = {
  getHabitats: () => api.get('/habitats'),
  manageHabitat: (data) => api.post('/habitats/manage', data),
};

export const harvestManagementAPI = {
  getHarvestManagement: () => api.get('/harvest-management'),
  manageHarvest: (data) => api.post('/harvest-management/manage', data),
};

export const healthAPI2 = {
  getHealth: () => api.get('/health'),
  checkHealth: () => api.post('/health/check'),
};

export const herdAPI = {
  getHerds: () => api.get('/herds'),
  manageHerd: (data) => api.post('/herds/manage', data),
};

export const horticultureAPI = {
  getHorticulture: () => api.get('/horticulture'),
  manageHorticulture: (data) => api.post('/horticulture/manage', data),
};

export const housingAPI = {
  getHousing: () => api.get('/housing'),
  manageHousing: (data) => api.post('/housing/manage', data),
};

export const hygieneAPI = {
  getHygiene: () => api.get('/hygiene'),
  manageHygiene: (data) => api.post('/hygiene/manage', data),
};

export const identityManagementAPI = {
  getIdentityManagement: () => api.get('/identity-management'),
  manageIdentity: (data) => api.post('/identity-management/manage', data),
};

export const impactAPI = {
  getImpacts: () => api.get('/impacts'),
  measureImpact: (data) => api.post('/impacts/measure', data),
};

export const importExportAPI = {
  getImportExport: () => api.get('/import-export'),
  manageImportExport: (data) => api.post('/import-export/manage', data),
};

export const incidentResponseAPI = {
  getIncidentResponse: () => api.get('/incident-response'),
  respondToIncident: (data) => api.post('/incident-response/respond', data),
};

export const incomeAPI = {
  getIncome: () => api.get('/income'),
  trackIncome: (data) => api.post('/income/track', data),
};

export const indigenousAPI = {
  getIndigenous: () => api.get('/indigenous'),
  manageIndigenous: (data) => api.post('/indigenous/manage', data),
};

export const individualAPI = {
  getIndividuals: () => api.get('/individuals'),
  manageIndividual: (data) => api.post('/individuals/manage', data),
};

export const industryAPI = {
  getIndustry: () => api.get('/industry'),
  analyzeIndustry: (data) => api.post('/industry/analyze', data),
};

export const innovationAPI = {
  getInnovations: () => api.get('/innovations'),
  manageInnovation: (data) => api.post('/innovations/manage', data),
};

export const inputAPI = {
  getInputs: () => api.get('/inputs'),
  manageInput: (data) => api.post('/inputs/manage', data),
};

export const insectManagementAPI = {
  getInsectManagement: () => api.get('/insect-management'),
  manageInsects: (data) => api.post('/insect-management/manage', data),
};

export const inspectionAPI = {
  getInspections: () => api.get('/inspections'),
  conductInspection: (data) => api.post('/inspections/conduct', data),
};

export const insuranceClaimAPI = {
  getInsuranceClaims: () => api.get('/insurance-claims'),
  fileClaim: (data) => api.post('/insurance-claims/file', data),
};

export const integrationHubAPI = {
  getIntegrations: () => api.get('/integration-hub'),
  configureIntegration: (id, data) => api.put(`/integration-hub/${id}`, data),
};

export const intellectualPropertyAPI = {
  getIntellectualProperty: () => api.get('/intellectual-property'),
  registerIP: (data) => api.post('/intellectual-property/register', data),
};

export const inventoryAPI2 = {
  getInventory: () => api.get('/inventory'),
  manageInventory: (data) => api.post('/inventory/manage', data),
};

export const investmentPortfolioAPI = {
  getInvestmentPortfolio: () => api.get('/investment-portfolio'),
  managePortfolio: (data) => api.post('/investment-portfolio/manage', data),
};

export const irrigationAPI2 = {
  getIrrigation: () => api.get('/irrigation'),
  manageIrrigation: (data) => api.post('/irrigation/manage', data),
};

export const jointVentureAPI = {
  getJointVentures: () => api.get('/joint-ventures'),
  createJointVenture: (data) => api.post('/joint-ventures', data),
};

export const kioskAPI2 = {
  getKiosks: () => api.get('/kiosks'),
  manageKiosk: (data) => api.post('/kiosks/manage', data),
};

export const knowledgeBaseAPI2 = {
  getKnowledgeBase: () => api.get('/knowledge-base'),
  searchKnowledge: (query) => api.post('/knowledge-base/search', query),
};

export const kpiAPI = {
  getKPIs: () => api.get('/kpi'),
  trackKPI: (data) => api.post('/kpi/track', data),
};

export const laborAPI2 = {
  getLabor: () => api.get('/labor'),
  manageLabor: (data) => api.post('/labor/manage', data),
};

export const landAPI = {
  getLand: () => api.get('/land'),
  manageLand: (data) => api.post('/land/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getParcels: (id, params) => api.get(`/land/parcels${id !== undefined ? '/' + id : ''}`, { params }),
  updateParcel: (data) => api.put('/land/parcel', data),
  createParcel: (data) => api.post('/land/parcel', data),
  deleteParcel: (id) => api.delete(`/land/parcel${id !== undefined ? '/' + id : ''}`),
};

export const landscapeAPI = {
  getLandscape: () => api.get('/landscape'),
  manageLandscape: (data) => api.post('/landscape/manage', data),
};

export const landUseAPI = {
  getLandUse: () => api.get('/land-use'),
  analyzeLandUse: (data) => api.post('/land-use/analyze', data),
};

export const legalAPI2 = {
  getLegal: () => api.get('/legal'),
  manageLegal: (data) => api.post('/legal/manage', data),
};

export const livestockAPI2 = {
  getLivestock: () => api.get('/livestock'),
  manageLivestock: (data) => api.post('/livestock/manage', data),
};

export const loanAPI2 = {
  getLoans: () => api.get('/loans'),
  applyForLoan: (data) => api.post('/loans/apply', data),
};

export const locationAPI = {
  getLocations: () => api.get('/locations'),
  manageLocation: (data) => api.post('/locations/manage', data),
};

export const logisticsAPI2 = {
  getLogistics: () => api.get('/logistics'),
  manageLogistics: (data) => api.post('/logistics/manage', data),
};

export const maintenanceAPI2 = {
  getMaintenance: () => api.get('/maintenance'),
  scheduleMaintenance: (data) => api.post('/maintenance/schedule', data),
};

export const marketAccessAPI = {
  getMarketAccess: () => api.get('/market-access'),
  manageMarketAccess: (data) => api.post('/market-access/manage', data),
};

export const marketAPI2 = {
  getMarket: () => api.get('/market'),
  analyzeMarket: (data) => api.post('/market/analyze', data),
};

export const marketplaceAPI2 = {
  getMarketplace: () => api.get('/marketplace'),
  tradeMarketplace: (data) => api.post('/marketplace/trade', data),
};

export const marketingAPI = {
  getMarketing: () => api.get('/marketing'),
  runMarketingCampaign: (data) => api.post('/marketing/campaign', data),
};

export const memberAPI = {
  getMembers: () => api.get('/members'),
  manageMember: (data) => api.post('/members/manage', data),
};

export const memberBenefitAPI = {
  getMemberBenefits: () => api.get('/member-benefits'),
  manageMemberBenefit: (data) => api.post('/member-benefits/manage', data),
};

export const mentorshipAPI = {
  getMentorships: () => api.get('/mentorships'),
  manageMentorship: (data) => api.post('/mentorships/manage', data),
};

export const meteringAPI = {
  getMetering: () => api.get('/metering'),
  manageMetering: (data) => api.post('/metering/manage', data),
};

export const microFinanceAPI = {
  getMicroFinance: () => api.get('/micro-finance'),
  manageMicroFinance: (data) => api.post('/micro-finance/manage', data),
};

export const milkingAPI = {
  getMilking: () => api.get('/milking'),
  manageMilking: (data) => api.post('/milking/manage', data),
};

export const mobileAPI = {
  getMobile: () => api.get('/mobile'),
  manageMobile: (data) => api.post('/mobile/manage', data),
};

export const monitoringAPI2 = {
  getMonitoring: () => api.get('/monitoring'),
  monitorTarget: (data) => api.post('/monitoring/monitor', data),
};

export const mushroomAPI = {
  getMushrooms: () => api.get('/mushrooms'),
  manageMushrooms: (data) => api.post('/mushrooms/manage', data),
};

export const mutualFundAPI = {
  getMutualFunds: () => api.get('/mutual-funds'),
  investInMutualFund: (data) => api.post('/mutual-funds/invest', data),
};

export const nanotechnologyAPI = {
  getNanotechnology: () => api.get('/nanotechnology'),
  applyNanotechnology: (data) => api.post('/nanotechnology/apply', data),
};

export const networkAPI = {
  getNetwork: () => api.get('/network'),
  manageNetwork: (data) => api.post('/network/manage', data),
};

export const nutritionAPI3 = {
  getNutrition: () => api.get('/nutrition'),
  analyzeNutrition: (data) => api.post('/nutrition/analyze', data),
};

export const oatAPI = {
  getOats: () => api.get('/oats'),
  manageOats: (data) => api.post('/oats/manage', data),
};

export const oilSeedAPI = {
  getOilSeeds: () => api.get('/oil-seeds'),
  manageOilSeeds: (data) => api.post('/oil-seeds/manage', data),
};

export const onionAPI = {
  getOnions: () => api.get('/onions'),
  manageOnions: (data) => api.post('/onions/manage', data),
};

export const organicAPI = {
  getOrganic: () => api.get('/organic'),
  manageOrganic: (data) => api.post('/organic/manage', data),
};

export const packingAPI = {
  getPacking: () => api.get('/packing'),
  managePacking: (data) => api.post('/packing/manage', data),
};

export const palletAPI = {
  getPallets: () => api.get('/pallets'),
  managePallets: (data) => api.post('/pallets/manage', data),
};

export const pastureAPI = {
  getPasture: () => api.get('/pasture'),
  managePasture: (data) => api.post('/pasture/manage', data),
};

export const paymentAPI2 = {
  getPayments: () => api.get('/payments'),
  processPayment: (data) => api.post('/payments/process', data),
};

export const pedigreeAPI = {
  getPedigree: () => api.get('/pedigree'),
  managePedigree: (data) => api.post('/pedigree/manage', data),
};

export const pepperAPI = {
  getPeppers: () => api.get('/peppers'),
  managePeppers: (data) => api.post('/peppers/manage', data),
};

export const performanceAPI2 = {
  getPerformance: () => api.get('/performance'),
  measurePerformance: (data) => api.post('/performance/measure', data),
};

export const pesticideAPI = {
  getPesticides: () => api.get('/pesticides'),
  managePesticides: (data) => api.post('/pesticides/manage', data),
};

export const photoAPI = {
  getPhotos: () => api.get('/photos'),
  uploadPhoto: (data) => api.post('/photos/upload', data),
};

export const pipelineAPI = {
  getPipelines: () => api.get('/pipelines'),
  managePipeline: (data) => api.post('/pipelines/manage', data),
};

export const plantAPI = {
  getPlants: () => api.get('/plants'),
  managePlants: (data) => api.post('/plants/manage', data),
};

export const plantationAPI = {
  getPlantations: () => api.get('/plantations'),
  managePlantation: (data) => api.post('/plantations/manage', data),
};

export const potatoAPI = {
  getPotatoes: () => api.get('/potatoes'),
  managePotatoes: (data) => api.post('/potatoes/manage', data),
};

export const poultryAPI2 = {
  getPoultry: () => api.get('/poultry'),
  managePoultry: (data) => api.post('/poultry/manage', data),
};

export const precisionAPI = {
  getPrecision: () => api.get('/precision'),
  applyPrecision: (data) => api.post('/precision/apply', data),
};

export const predictionAPI = {
  getPredictions: () => api.get('/predictions'),
  generatePrediction: (data) => api.post('/predictions/generate', data),
};

export const preservationAPI = {
  getPreservation: () => api.get('/preservation'),
  managePreservation: (data) => api.post('/preservation/manage', data),
};

export const processingAPI = {
  getProcessing: () => api.get('/processing'),
  manageProcessing: (data) => api.post('/processing/manage', data),
};

export const productionAPI = {
  getProduction: () => api.get('/production'),
  manageProduction: (data) => api.post('/production/manage', data),
};

export const productAPI2 = {
  getProducts: () => api.get('/products'),
  manageProduct: (data) => api.post('/products/manage', data),
};

export const profitAPI2 = {
  getProfit: () => api.get('/profit'),
  analyzeProfit: (data) => api.post('/profit/analyze', data),
};

export const projectAPI2 = {
  getProjects: () => api.get('/projects'),
  manageProject: (data) => api.post('/projects/manage', data),
};

export const propertyAPI = {
  getProperty: () => api.get('/property'),
  manageProperty: (data) => api.post('/property/manage', data),
};

export const proposalAPI = {
  getProposals: () => api.get('/proposals'),
  createProposal: (data) => api.post('/proposals', data),
};

export const procurementAPI2 = {
  getProcurement: () => api.get('/procurement'),
  manageProcurement: (data) => api.post('/procurement/manage', data),
};

export const qualityAPI2 = {
  getQuality: () => api.get('/quality'),
  manageQuality: (data) => api.post('/quality/manage', data),
};

export const qualityControlAPI = {
  getQualityControl: () => api.get('/quality-control'),
  controlQuality: (data) => api.post('/quality-control/control', data),
};

export const quarantineAPI = {
  getQuarantine: () => api.get('/quarantine'),
  manageQuarantine: (data) => api.post('/quarantine/manage', data),
};

export const rabbitAPI = {
  getRabbits: () => api.get('/rabbits'),
  manageRabbits: (data) => api.post('/rabbits/manage', data),
};

export const radiationAPI = {
  getRadiation: () => api.get('/radiation'),
  measureRadiation: (data) => api.post('/radiation/measure', data),
};

export const rainAPI = {
  getRain: () => api.get('/rain'),
  measureRain: (data) => api.post('/rain/measure', data),
};

export const randomAPI = {
  getRandom: () => api.get('/random'),
  generateRandom: (data) => api.post('/random/generate', data),
};

export const rangeAPI = {
  getRanges: () => api.get('/ranges'),
  manageRange: (data) => api.post('/ranges/manage', data),
};

export const ratingAPI2 = {
  getRatings: () => api.get('/ratings'),
  submitRating: (data) => api.post('/ratings/submit', data),
};

export const recordAPI = {
  getRecords: () => api.get('/records'),
  manageRecord: (data) => api.post('/records/manage', data),
};

export const regulatoryAPI = {
  getRegulatory: () => api.get('/regulatory'),
  manageRegulatory: (data) => api.post('/regulatory/manage', data),
};

export const remediationAPI = {
  getRemediation: () => api.get('/remediation'),
  performRemediation: (data) => api.post('/remediation/perform', data),
};

export const reportingAPI2 = {
  getReporting: () => api.get('/reporting'),
  generateReport: (data) => api.post('/reporting/generate', data),
};

export const repositoryAPI = {
  getRepositories: () => api.get('/repositories'),
  manageRepository: (data) => api.post('/repositories/manage', data),
};

export const researchAPI = {
  getResearch: () => api.get('/research'),
  conductResearch: (data) => api.post('/research/conduct', data),
};

export const reservoirAPI = {
  getReservoirs: () => api.get('/reservoirs'),
  manageReservoir: (data) => api.post('/reservoirs/manage', data),
};

export const resourceAPI2 = {
  getResources: () => api.get('/resources'),
  manageResource: (data) => api.post('/resources/manage', data),
};

export const retailAPI = {
  getRetail: () => api.get('/retail'),
  manageRetail: (data) => api.post('/retail/manage', data),
};

export const reviewAPI2 = {
  getReviews: () => api.get('/reviews'),
  submitReview: (data) => api.post('/reviews/submit', data),
};

export const riskAPI2 = {
  getRisk: () => api.get('/risk'),
  assessRisk: (data) => api.post('/risk/assess', data),
};

export const riceAPI = {
  getRice: () => api.get('/rice'),
  manageRice: (data) => api.post('/rice/manage', data),
};

export const riverAPI = {
  getRivers: () => api.get('/rivers'),
  manageRiver: (data) => api.post('/rivers/manage', data),
};

export const roadAPI = {
  getRoads: () => api.get('/roads'),
  manageRoad: (data) => api.post('/roads/manage', data),
};

export const roboticsAPI = {
  getRobotics: () => api.get('/robotics'),
  manageRobotics: (data) => api.post('/robotics/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  registerDevice: (data) => api.post('/robotics/device', data),
  createMission: (data) => api.post('/robotics/mission', data),
  planAdvisory: (id, params) => api.get(`/robotics/n-advisory${id !== undefined ? '/' + id : ''}`, { params }),
  approveMission: (data) => api.post('/robotics/mission', data),
  pauseMission: (id, params) => api.get(`/robotics/se-mission${id !== undefined ? '/' + id : ''}`, { params }),
  completeMission: (id, params) => api.get(`/robotics/plete-mission${id !== undefined ? '/' + id : ''}`, { params }),
  emergencyStop: (id, params) => api.get(`/robotics/rgency-stop${id !== undefined ? '/' + id : ''}`, { params }),
};

export const rotationAPI = {
  getRotation: () => api.get('/rotation'),
  manageRotation: (data) => api.post('/rotation/manage', data),
};

export const routeAPI2 = {
  getRoutes: () => api.get('/routes'),
  manageRoute: (data) => api.post('/routes/manage', data),
};

export const rowAPI = {
  getRows: () => api.get('/rows'),
  manageRow: (data) => api.post('/rows/manage', data),
};

export const safetyAPI2 = {
  getSafety: () => api.get('/safety'),
  manageSafety: (data) => api.post('/safety/manage', data),
};

export const salesAPI = {
  getSales: () => api.get('/sales'),
  manageSale: (data) => api.post('/sales/manage', data),
};

export const samplingAPI = {
  getSampling: () => api.get('/sampling'),
  takeSample: (data) => api.post('/sampling/take', data),
};

export const satelliteAPI2 = {
  getSatellite: () => api.get('/satellite'),
  manageSatellite: (data) => api.post('/satellite/manage', data),
};

export const scenarioAPI = {
  getScenarios: () => api.get('/scenarios'),
  createScenario: (data) => api.post('/scenarios', data),
};

export const scheduleAPI2 = {
  getSchedules: () => api.get('/schedules'),
  createSchedule: (data) => api.post('/schedules', data),
};

export const schemeAPI2 = {
  getSchemes: () => api.get('/schemes'),
  applyForScheme: (id, data) => api.post(`/schemes/${id}/apply`, data),
};

export const schoolAPI = {
  getSchools: () => api.get('/schools'),
  manageSchool: (data) => api.post('/schools/manage', data),
};

export const scienceAPI = {
  getScience: () => api.get('/science'),
  conductScience: (data) => api.post('/science/conduct', data),
};

export const seaAPI = {
  getSea: () => api.get('/sea'),
  manageSea: (data) => api.post('/sea/manage', data),
};

export const searchAPI2 = {
  getSearch: () => api.get('/search'),
  performSearch: (data) => api.post('/search/perform', data),
};

export const securityAPI2 = {
  getSecurity: () => api.get('/security'),
  manageSecurity: (data) => api.post('/security/manage', data),
};

export const seedAPI2 = {
  getSeeds: () => api.get('/seeds'),
  manageSeeds: (data) => api.post('/seeds/manage', data),
};

export const seedlingAPI = {
  getSeedlings: () => api.get('/seedlings'),
  manageSeedlings: (data) => api.post('/seedlings/manage', data),
};

export const sensorAPI = {
  getSensors: () => api.get('/sensors'),
  manageSensor: (data) => api.post('/sensors/manage', data),
};

export const serviceAPI = {
  getServices: () => api.get('/services'),
  manageService: (data) => api.post('/services/manage', data),
};

export const settingAPI2 = {
  getSettings: () => api.get('/settings'),
  updateSetting: (data) => api.put('/settings', data),
};

export const sheepAPI2 = {
  getSheep: () => api.get('/sheep'),
  manageSheep: (data) => api.post('/sheep/manage', data),
};

export const shipmentAPI = {
  getShipments: () => api.get('/shipments'),
  manageShipment: (data) => api.post('/shipments/manage', data),
};

export const shippingAPI2 = {
  getShipping: () => api.get('/shipping'),
  manageShipping: (data) => api.post('/shipping/manage', data),
};

export const shrimpAPI = {
  getShrimp: () => api.get('/shrimp'),
  manageShrimp: (data) => api.post('/shrimp/manage', data),
};

export const simulationAPI = {
  getSimulation: () => api.get('/simulation'),
  runSimulation: (data) => api.post('/simulation/run', data),
};

export const siteAPI = {
  getSites: () => api.get('/sites'),
  manageSite: (data) => api.post('/sites/manage', data),
};

export const skillAPI = {
  getSkills: () => api.get('/skills'),
  manageSkill: (data) => api.post('/skills/manage', data),
};

export const soilAPI2 = {
  getSoil: () => api.get('/soil'),
  manageSoil: (data) => api.post('/soil/manage', data),
};

export const solarAPI = {
  getSolar: () => api.get('/solar'),
  manageSolar: (data) => api.post('/solar/manage', data),
};

export const sorghumAPI = {
  getSorghum: () => api.get('/sorghum'),
  manageSorghum: (data) => api.post('/sorghum/manage', data),
};

export const sortingAPI = {
  getSorting: () => api.get('/sorting'),
  performSorting: (data) => api.post('/sorting/perform', data),
};

export const sourcingAPI = {
  getSourcing: () => api.get('/sourcing'),
  manageSourcing: (data) => api.post('/sourcing/manage', data),
};

export const soybeanAPI = {
  getSoybeans: () => api.get('/soybeans'),
  manageSoybeans: (data) => api.post('/soybeans/manage', data),
};

export const spatialAPI = {
  getSpatial: () => api.get('/spatial'),
  analyzeSpatial: (data) => api.post('/spatial/analyze', data),
};

export const specificationAPI = {
  getSpecifications: () => api.get('/specifications'),
  createSpecification: (data) => api.post('/specifications', data),
};

export const spiceAPI = {
  getSpices: () => api.get('/spices'),
  manageSpices: (data) => api.post('/spices/manage', data),
};

export const storageAPI2 = {
  getStorage: () => api.get('/storage'),
  manageStorage: (data) => api.post('/storage/manage', data),
};

export const strategyAPI = {
  getStrategy: () => api.get('/strategy'),
  implementStrategy: (data) => api.post('/strategy/implement', data),
};

export const streamAPI = {
  getStreams: () => api.get('/streams'),
  manageStream: (data) => api.post('/streams/manage', data),
};

export const sugarAPI = {
  getSugar: () => api.get('/sugar'),
  manageSugar: (data) => api.post('/sugar/manage', data),
};

export const sunflowerAPI = {
  getSunflowers: () => api.get('/sunflowers'),
  manageSunflowers: (data) => api.post('/sunflowers/manage', data),
};

export const supplyAPI = {
  getSupply: () => api.get('/supply'),
  manageSupply: (data) => api.post('/supply/manage', data),
};

export const surveillanceAPI = {
  getSurveillance: () => api.get('/surveillance'),
  conductSurveillance: (data) => api.post('/surveillance/conduct', data),
};

export const sustainabilityAPI = {
  getSustainability: () => api.get('/sustainability'),
  manageSustainability: (data) => api.post('/sustainability/manage', data),
};

export const swineAPI = {
  getSwine: () => api.get('/swine'),
  manageSwine: (data) => api.post('/swine/manage', data),
};

export const synchronizationAPI = {
  getSynchronization: () => api.get('/synchronization'),
  performSynchronization: (data) => api.post('/synchronization/perform', data),
};

export const systemAPI2 = {
  getSystem: () => api.get('/system'),
  manageSystem: (data) => api.post('/system/manage', data),
};

export const tabulationAPI = {
  getTabulation: () => api.get('/tabulation'),
  performTabulation: (data) => api.post('/tabulation/perform', data),
};

export const tankerAPI = {
  getTankers: () => api.get('/tankers'),
  manageTanker: (data) => api.post('/tankers/manage', data),
};

export const taxonomyAPI = {
  getTaxonomy: () => api.get('/taxonomy'),
  manageTaxonomy: (data) => api.post('/taxonomy/manage', data),
};

export const teaAPI = {
  getTea: () => api.get('/tea'),
  manageTea: (data) => api.post('/tea/manage', data),
};

export const technicalAPI = {
  getTechnical: () => api.get('/technical'),
  manageTechnical: (data) => api.post('/technical/manage', data),
};

export const technologyAPI = {
  getTechnology: () => api.get('/technology'),
  manageTechnology: (data) => api.post('/technology/manage', data),
};

export const telecommunicationAPI = {
  getTelecommunication: () => api.get('/telecommunication'),
  manageTelecommunication: (data) => api.post('/telecommunication/manage', data),
};

export const temperatureAPI = {
  getTemperature: () => api.get('/temperature'),
  measureTemperature: (data) => api.post('/temperature/measure', data),
};

export const textileAPI = {
  getTextile: () => api.get('/textile'),
  manageTextile: (data) => api.post('/textile/manage', data),
};

export const thermalAPI = {
  getThermal: () => api.get('/thermal'),
  manageThermal: (data) => api.post('/thermal/manage', data),
};

export const tomatoAPI = {
  getTomatoes: () => api.get('/tomatoes'),
  manageTomatoes: (data) => api.post('/tomatoes/manage', data),
};

export const toolAPI = {
  getTools: () => api.get('/tools'),
  manageTool: (data) => api.post('/tools/manage', data),
};

export const tradeAPI = {
  getTrade: () => api.get('/trade'),
  executeTrade: (data) => api.post('/trade/execute', data),
};

export const trainingAPI2 = {
  getTraining: () => api.get('/training'),
  manageTraining: (data) => api.post('/training/manage', data),
};

export const transactionAPI2 = {
  getTransactions: () => api.get('/transactions'),
  executeTransaction: (data) => api.post('/transactions/execute', data),
};

export const transferAPI = {
  getTransfers: () => api.get('/transfers'),
  executeTransfer: (data) => api.post('/transfers/execute', data),
};

export const transportAPI = {
  getTransport: () => api.get('/transport'),
  manageTransport: (data) => api.post('/transport/manage', data),
};

export const treeAPI = {
  getTrees: () => api.get('/trees'),
  manageTree: (data) => api.post('/trees/manage', data),
};

export const truckAPI = {
  getTrucks: () => api.get('/trucks'),
  manageTruck: (data) => api.post('/trucks/manage', data),
};

export const turfAPI = {
  getTurf: () => api.get('/turf'),
  manageTurf: (data) => api.post('/turf/manage', data),
};

export const uiAPI = {
  getUI: () => api.get('/ui'),
  manageUI: (data) => api.post('/ui/manage', data),
};

export const undergroundAPI = {
  getUnderground: () => api.get('/underground'),
  manageUnderground: (data) => api.post('/underground/manage', data),
};

export const upstreamAPI = {
  getUpstream: () => api.get('/upstream'),
  manageUpstream: (data) => api.post('/upstream/manage', data),
};

export const urbanAPI = {
  getUrban: () => api.get('/urban'),
  manageUrban: (data) => api.post('/urban/manage', data),
};

export const userAPI2 = {
  getUsers: () => api.get('/users'),
  manageUser: (data) => api.post('/users/manage', data),
};

export const valueChainAPI = {
  getValueChain: () => api.get('/value-chain'),
  manageValueChain: (data) => api.post('/value-chain/manage', data),
  getStatus: () => api.get('/value-chain/status'),
  analyzeProduct: (data) => api.post('/value-chain/analyze', data),
};

export var vehicleAPI = {
  getVehicles: () => api.get('/vehicles'),
  manageVehicle: (data) => api.post('/vehicles/manage', data),
};

export const veterinaryAPI = {
  getVeterinary: () => api.get('/veterinary'),
  manageVeterinary: (data) => api.post('/veterinary/manage', data),
};

export const videoAPI2 = {
  getVideos: () => api.get('/videos'),
  manageVideo: (data) => api.post('/videos/manage', data),
};

export const vineyardAPI = {
  getVineyards: () => api.get('/vineyards'),
  manageVineyard: (data) => api.post('/vineyards/manage', data),
};

export const virtualAPI = {
  getVirtual: () => api.get('/virtual'),
  manageVirtual: (data) => api.post('/virtual/manage', data),
};

export const virusAPI = {
  getVirus: () => api.get('/virus'),
  manageVirus: (data) => api.post('/virus/manage', data),
};

export const visionAPI = {
  getVision: () => api.get('/vision'),
  manageVision: (data) => api.post('/vision/manage', data),
};

export const visualizationAPI = {
  getVisualization: () => api.get('/visualization'),
  manageVisualization: (data) => api.post('/visualization/manage', data),
};

export const viticultureAPI = {
  getViticulture: () => api.get('/viticulture'),
  manageViticulture: (data) => api.post('/viticulture/manage', data),
};

export const warehouseAPI2 = {
  getWarehouse: () => api.get('/warehouse'),
  manageWarehouse: (data) => api.post('/warehouse/manage', data),
};

export const waterAPI2 = {
  getWater: () => api.get('/water'),
  manageWater: (data) => api.post('/water/manage', data),
};

export const watershedAPI = {
  getWatershed: () => api.get('/watershed'),
  manageWatershed: (data) => api.post('/watershed/manage', data),
};

export const weatherAPI2 = {
  getWeather: () => api.get('/weather'),
  manageWeather: (data) => api.post('/weather/manage', data),
};

export const weedAPI = {
  getWeeds: () => api.get('/weeds'),
  manageWeeds: (data) => api.post('/weeds/manage', data),
};

export const wheatAPI = {
  getWheat: () => api.get('/wheat'),
  manageWheat: (data) => api.post('/wheat/manage', data),
};

export const wholesaleAPI = {
  getWholesale: () => api.get('/wholesale'),
  manageWholesale: (data) => api.post('/wholesale/manage', data),
};

export const windAPI = {
  getWind: () => api.get('/wind'),
  manageWind: (data) => api.post('/wind/manage', data),
};

export const wildlifeAPI = {
  getWildlife: () => api.get('/wildlife'),
  manageWildlife: (data) => api.post('/wildlife/manage', data),
};

export const wineAPI = {
  getWine: () => api.get('/wine'),
  manageWine: (data) => api.post('/wine/manage', data),
};

export const woodAPI = {
  getWood: () => api.get('/wood'),
  manageWood: (data) => api.post('/wood/manage', data),
};

export const workflowAPI2 = {
  getWorkflow: () => api.get('/workflow'),
  manageWorkflow: (data) => api.post('/workflow/manage', data),
};

export const yardAPI = {
  getYards: () => api.get('/yards'),
  manageYard: (data) => api.post('/yards/manage', data),
};

export const yieldAPI2 = {
  getYield: () => api.get('/yield'),
  manageYield: (data) => api.post('/yield/manage', data),
};

export const youthAPI = {
  getYouth: () => api.get('/youth'),
  manageYouth: (data) => api.post('/youth/manage', data),
};

export const zooAPI = {
  getZoo: () => api.get('/zoo'),
  manageZoo: (data) => api.post('/zoo/manage', data),
};

export const jurisdictionAPI = {
  getJurisdictions: () => api.get('/jurisdictions'),
  getJurisdiction: (id) => api.get(`/jurisdictions/${id}`),
};

export const boundaryAPI = {
  getBoundaries: () => api.get('/boundaries'),
  getBoundary: (id) => api.get(`/boundaries/${id}`),
};

export const zoneAPI = {
  getZones: () => api.get('/zones'),
  getZone: (id) => api.get(`/zones/${id}`),
};

export const sectorAPI = {
  getSectors: () => api.get('/sectors'),
  getSector: (id) => api.get(`/sectors/${id}`),
};

export const subsectorAPI = {
  getSubsectors: () => api.get('/subsectors'),
  getSubsector: (id) => api.get(`/subsectors/${id}`),
};

export const areaAPI = {
  getAreas: () => api.get('/areas'),
  getArea: (id) => api.get(`/areas/${id}`),
};

export const neighborhoodAPI = {
  getNeighborhoods: () => api.get('/neighborhoods'),
  getNeighborhood: (id) => api.get(`/neighborhoods/${id}`),
};

export const localityAPI = {
  getLocalities: () => api.get('/localities'),
  getLocality: (id) => api.get(`/localities/${id}`),
};

export const hamletAPI = {
  getHamlets: () => api.get('/hamlets'),
  getHamlet: (id) => api.get(`/hamlets/${id}`),
};

export const settlementAPI = {
  getSettlements: () => api.get('/settlements'),
  getSettlement: (id) => api.get(`/settlements/${id}`),
};

export const colonyAPI = {
  getColonies: () => api.get('/colonies'),
  getColony: (id) => api.get(`/colonies/${id}`),
};

export const clusterAPI = {
  getClusters: () => api.get('/clusters'),
  getCluster: (id) => api.get(`/clusters/${id}`),
};

export const associationAPI = {
  getAssociations: () => api.get('/associations'),
  getAssociation: (id) => api.get(`/associations/${id}`),
};

export const federationAPI = {
  getFederations: () => api.get('/federations'),
  getFederation: (id) => api.get(`/federations/${id}`),
};

export const confederationAPI = {
  getConfederations: () => api.get('/confederations'),
  getConfederation: (id) => api.get(`/confederations/${id}`),
};

export const allianceAPI = {
  getAlliances: () => api.get('/alliances'),
  getAlliance: (id) => api.get(`/alliances/${id}`),
};

export const coalitionAPI = {
  getCoalitions: () => api.get('/coalitions'),
  getCoalition: (id) => api.get(`/coalitions/${id}`),
};

export const partnershipAPI = {
  getPartnerships: () => api.get('/partnerships'),
  getPartnership: (id) => api.get(`/partnerships/${id}`),
};

export const consortiumAPI = {
  getConsortiums: () => api.get('/consortiums'),
  getConsortium: (id) => api.get(`/consortiums/${id}`),
};

export const syndicateAPI = {
  getSyndicates: () => api.get('/syndicates'),
  getSyndicate: (id) => api.get(`/syndicates/${id}`),
};

export const guildAPI = {
  getGuilds: () => api.get('/guilds'),
  getGuild: (id) => api.get(`/guilds/${id}`),
};

export const unionAPI = {
  getUnions: () => api.get('/unions'),
  getUnion: (id) => api.get(`/unions/${id}`),
};

export const tradeAssociationAPI = {
  getTradeAssociations: () => api.get('/trade-associations'),
  getTradeAssociation: (id) => api.get(`/trade-associations/${id}`),
};

export const professionalAssociationAPI = {
  getProfessionalAssociations: () => api.get('/professional-associations'),
  getProfessionalAssociation: (id) => api.get(`/professional-associations/${id}`),
};

export const industryAssociationAPI = {
  getIndustryAssociations: () => api.get('/industry-associations'),
  getIndustryAssociation: (id) => api.get(`/industry-associations/${id}`),
};

export const chamberOfCommerceAPI = {
  getChambersOfCommerce: () => api.get('/chambers-of-commerce'),
  getChamberOfCommerce: (id) => api.get(`/chambers-of-commerce/${id}`),
};

export const businessCouncilAPI = {
  getBusinessCouncils: () => api.get('/business-councils'),
  getBusinessCouncil: (id) => api.get(`/business-councils/${id}`),
};

export const economicDevelopmentAPI = {
  getEconomicDevelopment: () => api.get('/economic-development'),
  planEconomicDevelopment: (data) => api.post('/economic-development/plan', data),
};

export const regionalDevelopmentAPI = {
  getRegionalDevelopment: () => api.get('/regional-development'),
  planRegionalDevelopment: (data) => api.post('/regional-development/plan', data),
};

export const ruralDevelopmentAPI = {
  getRuralDevelopment: () => api.get('/rural-development'),
  planRuralDevelopment: (data) => api.post('/rural-development/plan', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getProjects: (id, params) => api.get(`/rural-development/projects${id !== undefined ? '/' + id : ''}`, { params }),
  createProject: (data) => api.post('/rural-development/project', data),
  updateProject: (data) => api.put('/rural-development/project', data),
  deleteProject: (id) => api.delete(`/rural-development/project${id !== undefined ? '/' + id : ''}`),
};

export const urbanDevelopmentAPI = {
  getUrbanDevelopment: () => api.get('/urban-development'),
  planUrbanDevelopment: (data) => api.post('/urban-development/plan', data),
};

export const infrastructureDevelopmentAPI = {
  getInfrastructureDevelopment: () => api.get('/infrastructure-development'),
  planInfrastructureDevelopment: (data) => api.post('/infrastructure-development/plan', data),
};

export const socialDevelopmentAPI = {
  getSocialDevelopment: () => api.get('/social-development'),
  planSocialDevelopment: (data) => api.post('/social-development/plan', data),
};

export const communityDevelopmentAPI = {
  getCommunityDevelopment: () => api.get('/community-development'),
  planCommunityDevelopment: (data) => api.post('/community-development/plan', data),
};

export const humanDevelopmentAPI = {
  getHumanDevelopment: () => api.get('/human-development'),
  planHumanDevelopment: (data) => api.post('/human-development/plan', data),
};

export const capacityBuildingAPI = {
  getCapacityBuilding: () => api.get('/capacity-building'),
  buildCapacity: (data) => api.post('/capacity-building/build', data),
};

export const skillDevelopmentAPI = {
  getSkillDevelopment: () => api.get('/skill-development'),
  developSkills: (data) => api.post('/skill-development/develop', data),
};

export const knowledgeTransferAPI = {
  getKnowledgeTransfer: () => api.get('/knowledge-transfer'),
  transferKnowledge: (data) => api.post('/knowledge-transfer/transfer', data),
};

export const technologyTransferAPI = {
  getTechnologyTransfer: () => api.get('/technology-transfer'),
  transferTechnology: (data) => api.post('/technology-transfer/transfer', data),
};

export const innovationTransferAPI = {
  getInnovationTransfer: () => api.get('/innovation-transfer'),
  transferInnovation: (data) => api.post('/innovation-transfer/transfer', data),
};

export const bestPracticeTransferAPI = {
  getBestPracticeTransfer: () => api.get('/best-practice-transfer'),
  transferBestPractice: (data) => api.post('/best-practice-transfer/transfer', data),
};

export const lessonLearnedAPI = {
  getLessonsLearned: () => api.get('/lessons-learned'),
  shareLesson: (data) => api.post('/lessons-learned/share', data),
};

export const caseStudyAPI = {
  getCaseStudies: () => api.get('/case-studies'),
  createCaseStudy: (data) => api.post('/case-studies', data),
};

export const successStoryAPI = {
  getSuccessStories: () => api.get('/success-stories'),
  createSuccessStory: (data) => api.post('/success-stories', data),
};

export const failureAnalysisAPI = {
  getFailureAnalyses: () => api.get('/failure-analyses'),
  analyzeFailure: (data) => api.post('/failure-analyses/analyze', data),
};

export const impactAssessmentAPI = {
  getImpactAssessments: () => api.get('/impact-assessments'),
  assessImpact: (data) => api.post('/impact-assessments/assess', data),
};

export const outcomeMeasurementAPI = {
  getOutcomeMeasurements: () => api.get('/outcome-measurements'),
  measureOutcomes: (data) => api.post('/outcome-measurements/measure', data),
};

export const performanceMeasurementAPI = {
  getPerformanceMeasurements: () => api.get('/performance-measurements'),
  measurePerformance: (data) => api.post('/performance-measurements/measure', data),
};

export const resultManagementAPI = {
  getResults: () => api.get('/results'),
  manageResults: (data) => api.post('/results/manage', data),
};

export const benefitRealizationAPI = {
  getBenefitRealizations: () => api.get('/benefit-realizations'),
  realizeBenefits: (data) => api.post('/benefit-realizations/realize', data),
};

export const valueCreationAPI = {
  getValueCreations: () => api.get('/value-creations'),
  createValue: (data) => api.post('/value-creations/create', data),
};

export const stakeholderEngagementAPI = {
  getStakeholderEngagements: () => api.get('/stakeholder-engagements'),
  engageStakeholders: (data) => api.post('/stakeholder-engagements/engage', data),
};

export const publicParticipationAPI = {
  getPublicParticipations: () => api.get('/public-participations'),
  facilitateParticipation: (data) => api.post('/public-participations/facilitate', data),
};

export const civicEngagementAPI = {
  getCivicEngagements: () => api.get('/civic-engagements'),
  engageCivics: (data) => api.post('/civic-engagements/engage', data),
};

export const communityEngagementAPI = {
  getCommunityEngagements: () => api.get('/community-engagements'),
  engageCommunity: (data) => api.post('/community-engagements/engage', data),
};

export const citizenEngagementAPI = {
  getCitizenEngagements: () => api.get('/citizen-engagements'),
  engageCitizens: (data) => api.post('/citizen-engagements/engage', data),
};

export const youthEngagementAPI = {
  getYouthEngagements: () => api.get('/youth-engagements'),
  engageYouth: (data) => api.post('/youth-engagements/engage', data),
};

export const womenEngagementAPI = {
  getWomenEngagements: () => api.get('/women-engagements'),
  engageWomen: (data) => api.post('/women-engagements/engage', data),
};

export const elderlyEngagementAPI = {
  getElderlyEngagements: () => api.get('/elderly-engagements'),
  engageElderly: (data) => api.post('/elderly-engagements/engage', data),
};

export const disabledEngagementAPI = {
  getDisabledEngagements: () => api.get('/disabled-engagements'),
  engageDisabled: (data) => api.post('/disabled-engagements/engage', data),
};

export const marginalizedEngagementAPI = {
  getMarginalizedEngagements: () => api.get('/marginalized-engagements'),
  engageMarginalized: (data) => api.post('/marginalized-engagements/engage', data),
};

export const indigenousEngagementAPI = {
  getIndigenousEngagements: () => api.get('/indigenous-engagements'),
  engageIndigenous: (data) => api.post('/indigenous-engagements/engage', data),
};

export const minorityEngagementAPI = {
  getMinorityEngagements: () => api.get('/minority-engagements'),
  engageMinority: (data) => api.post('/minority-engagements/engage', data),
};

export const refugeeEngagementAPI = {
  getRefugeeEngagements: () => api.get('/refugee-engagements'),
  engageRefugees: (data) => api.post('/refugee-engagements/engage', data),
};

export const migrantEngagementAPI = {
  getMigrantEngagements: () => api.get('/migrant-engagements'),
  engageMigrants: (data) => api.post('/migrant-engagements/engage', data),
};

export const diasporaEngagementAPI = {
  getDiasporaEngagements: () => api.get('/diaspora-engagements'),
  engageDiaspora: (data) => api.post('/diaspora-engagements/engage', data),
};

export const internationalEngagementAPI = {
  getInternationalEngagements: () => api.get('/international-engagements'),
  engageInternational: (data) => api.post('/international-engagements/engage', data),
};

export const crossBorderEngagementAPI = {
  getCrossBorderEngagements: () => api.get('/cross-border-engagements'),
  engageCrossBorder: (data) => api.post('/cross-border-engagements/engage', data),
};

export const regionalCooperationAPI = {
  getRegionalCooperations: () => api.get('/regional-cooperations'),
  cooperateRegionally: (data) => api.post('/regional-cooperations/cooperate', data),
};

export const internationalCooperationAPI = {
  getInternationalCooperations: () => api.get('/international-cooperations'),
  cooperateInternationally: (data) => api.post('/international-cooperations/cooperate', data),
};

export const multilateralCooperationAPI = {
  getMultilateralCooperations: () => api.get('/multilateral-cooperations'),
  cooperateMultilaterally: (data) => api.post('/multilateral-cooperations/cooperate', data),
};

export const bilateralCooperationAPI = {
  getBilateralCooperations: () => api.get('/bilateral-cooperations'),
  cooperateBilaterally: (data) => api.post('/bilateral-cooperations/cooperate', data),
};

export const southSouthCooperationAPI = {
  getSouthSouthCooperations: () => api.get('/south-south-cooperations'),
  cooperateSouthSouth: (data) => api.post('/south-south-cooperations/cooperate', data),
};

export const triangularCooperationAPI = {
  getTriangularCooperations: () => api.get('/triangular-cooperations'),
  cooperateTriangularly: (data) => api.post('/triangular-cooperations/cooperate', data),
};

export const knowledgeSharingAPI = {
  getKnowledgeSharings: () => api.get('/knowledge-sharing'),
  shareKnowledge: (data) => api.post('/knowledge-sharing/share', data),
};

export const experienceSharingAPI = {
  getExperienceSharings: () => api.get('/experience-sharing'),
  shareExperience: (data) => api.post('/experience-sharing/share', data),
};

export const expertiseSharingAPI = {
  getExpertiseSharings: () => api.get('/expertise-sharing'),
  shareExpertise: (data) => api.post('/expertise-sharing/share', data),
};

export const resourceSharingAPI = {
  getResourceSharings: () => api.get('/resource-sharing'),
  shareResources: (data) => api.post('/resource-sharing/share', data),
};

export const capacitySharingAPI = {
  getCapacitySharings: () => api.get('/capacity-sharing'),
  shareCapacity: (data) => api.post('/capacity-sharing/share', data),
};

export const networkBuildingAPI = {
  getNetworkBuildings: () => api.get('/network-building'),
  buildNetwork: (data) => api.post('/network-building/build', data),
};

export const partnershipBuildingAPI = {
  getPartnershipBuildings: () => api.get('/partnership-building'),
  buildPartnership: (data) => api.post('/partnership-building/build', data),
};

export const coalitionBuildingAPI = {
  getCoalitionBuildings: () => api.get('/coalition-building'),
  buildCoalition: (data) => api.post('/coalition-building/build', data),
};

export const allianceBuildingAPI = {
  getAllianceBuildings: () => api.get('/alliance-building'),
  buildAlliance: (data) => api.post('/alliance-building/build', data),
};

export const movementBuildingAPI = {
  getMovementBuildings: () => api.get('/movement-building'),
  buildMovement: (data) => api.post('/movement-building/build', data),
};

export const campaignBuildingAPI = {
  getCampaignBuildings: () => api.get('/campaign-building'),
  buildCampaign: (data) => api.post('/campaign-building/build', data),
};

export const advocacyBuildingAPI = {
  getAdvocacyBuildings: () => api.get('/advocacy-building'),
  buildAdvocacy: (data) => api.post('/advocacy-building/build', data),
};

export const lobbyingBuildingAPI = {
  getLobbyingBuildings: () => api.get('/lobbying-building'),
  buildLobbying: (data) => api.post('/lobbying-building/build', data),
};

export const policyInfluenceAPI = {
  getPolicyInfluences: () => api.get('/policy-influence'),
  influencePolicy: (data) => api.post('/policy-influence/influence', data),
};

export const decisionInfluenceAPI = {
  getDecisionInfluences: () => api.get('/decision-influence'),
  influenceDecision: (data) => api.post('/decision-influence/influence', data),
};

export const agendaSettingAPI = {
  getAgendaSettings: () => api.get('/agenda-setting'),
  setAgenda: (data) => api.post('/agenda-setting/set', data),
};

export const publicOpinionAPI = {
  getPublicOpinions: () => api.get('/public-opinion'),
  shapePublicOpinion: (data) => api.post('/public-opinion/shape', data),
};

export const mediaEngagementAPI = {
  getMediaEngagements: () => api.get('/media-engagement'),
  engageMedia: (data) => api.post('/media-engagement/engage', data),
};

export const socialMediaAPI = {
  getSocialMedia: () => api.get('/social-media'),
  manageSocialMedia: (data) => api.post('/social-media/manage', data),
};

export const digitalCampaignAPI = {
  getDigitalCampaigns: () => api.get('/digital-campaign'),
  runDigitalCampaign: (data) => api.post('/digital-campaign/run', data),
};

export const onlineAdvocacyAPI = {
  getOnlineAdvocacies: () => api.get('/online-advocacy'),
  advocateOnline: (data) => api.post('/online-advocacy/advocate', data),
};

export const digitalOrganizingAPI = {
  getDigitalOrganizings: () => api.get('/digital-organizing'),
  organizeDigitally: (data) => api.post('/digital-organizing/organize', data),
};

export const onlineMobilizationAPI = {
  getOnlineMobilizations: () => api.get('/online-mobilization'),
  mobilizeOnline: (data) => api.post('/online-mobilization/mobilize', data),
};

export const digitalActivismAPI = {
  getDigitalActivisms: () => api.get('/digital-activism'),
  activateDigitally: (data) => api.post('/digital-activism/activate', data),
};

export const hacktivismAPI = {
  getHacktivisms: () => api.get('/hacktivism'),
  hacktivistAction: (data) => api.post('/hacktivism/action', data),
};

export const cyberActivismAPI = {
  getCyberActivisms: () => api.get('/cyber-activism'),
  activateCyber: (data) => api.post('/cyber-activism/activate', data),
};

export const digitalResistanceAPI = {
  getDigitalResistances: () => api.get('/digital-resistance'),
  resistDigitally: (data) => api.post('/digital-resistance/resist', data),
};

export const onlineProtestAPI = {
  getOnlineProtests: () => api.get('/online-protest'),
  protestOnline: (data) => api.post('/online-protest/protest', data),
};

export const digitalCivilDisobedienceAPI = {
  getDigitalCivilDisobediences: () => api.get('/digital-civil-disobedience'),
  disobeyDigitally: (data) => api.post('/digital-civil-disobedience/disobey', data),
};

export const digitalBoycottAPI = {
  getDigitalBoycotts: () => api.get('/digital-boycott'),
  boycottDigitally: (data) => api.post('/digital-boycott/boycott', data),
};

export const digitalDivestmentAPI = {
  getDigitalDivestments: () => api.get('/digital-divestment'),
  divestDigitally: (data) => api.post('/digital-divestment/divest', data),
};

export const digitalSanctionAPI = {
  getDigitalSanctions: () => api.get('/digital-sanction'),
  sanctionDigitally: (data) => api.post('/digital-sanction/sanction', data),
};

export const digitalEmbargoAPI = {
  getDigitalEmbargoes: () => api.get('/digital-embargo'),
  embargoDigitally: (data) => api.post('/digital-embargo/embargo', data),
};

export const digitalBlockadeAPI = {
  getDigitalBlockades: () => api.get('/digital-blockade'),
  blockadeDigitally: (data) => api.post('/digital-blockade/blockade', data),
};

export const digitalSiegeAPI = {
  getDigitalSieges: () => api.get('/digital-siege'),
  siegeDigitally: (data) => api.post('/digital-siege/siege', data),
};

export const digitalWarfareAPI = {
  getDigitalWarfares: () => api.get('/digital-warfare'),
  wageDigitalWarfare: (data) => api.post('/digital-warfare/wage', data),
};

export const cyberWarfareAPI = {
  getCyberWarfares: () => api.get('/cyber-warfare'),
  wageCyberWarfare: (data) => api.post('/cyber-warfare/wage', data),
};

export const informationWarfareAPI = {
  getInformationWarfares: () => api.get('/information-warfare'),
  wageInformationWarfare: (data) => api.post('/information-warfare/wage', data),
};

export const psychologicalWarfareAPI = {
  getPsychologicalWarfares: () => api.get('/psychological-warfare'),
  wagePsychologicalWarfare: (data) => api.post('/psychological-warfare/wage', data),
};

export const cognitiveWarfareAPI = {
  getCognitiveWarfares: () => api.get('/cognitive-warfare'),
  wageCognitiveWarfare: (data) => api.post('/cognitive-warfare/wage', data),
};

export const narrativeWarfareAPI = {
  getNarrativeWarfares: () => api.get('/narrative-warfare'),
  wageNarrativeWarfare: (data) => api.post('/narrative-warfare/wage', data),
};

export const memeticWarfareAPI = {
  getMemeticWarfares: () => api.get('/memetic-warfare'),
  wageMemeticWarfare: (data) => api.post('/memetic-warfare/wage', data),
};

export const culturalWarfareAPI = {
  getCulturalWarfares: () => api.get('/cultural-warfare'),
  wageCulturalWarfare: (data) => api.post('/cultural-warfare/wage', data),
};

export const ideologicalWarfareAPI = {
  getIdeologicalWarfares: () => api.get('/ideological-warfare'),
  wageIdeologicalWarfare: (data) => api.post('/ideological-warfare/wage', data),
};

export const religiousWarfareAPI = {
  getReligiousWarfares: () => api.get('/religious-warfare'),
  wageReligiousWarfare: (data) => api.post('/religious-warfare/wage', data),
};

export const ethnicWarfareAPI = {
  getEthnicWarfares: () => api.get('/ethnic-warfare'),
  wageEthnicWarfare: (data) => api.post('/ethnic-warfare/wage', data),
};

export const tribalWarfareAPI = {
  getTribalWarfares: () => api.get('/tribal-warfare'),
  wageTribalWarfare: (data) => api.post('/tribal-warfare/wage', data),
};

export const clanWarfareAPI = {
  getClanWarfares: () => api.get('/clan-warfare'),
  wageClanWarfare: (data) => api.post('/clan-warfare/wage', data),
};

export const familyWarfareAPI = {
  getFamilyWarfares: () => api.get('/family-warfare'),
  wageFamilyWarfare: (data) => api.post('/family-warfare/wage', data),
};

export const personalWarfareAPI = {
  getPersonalWarfares: () => api.get('/personal-warfare'),
  wagePersonalWarfare: (data) => api.post('/personal-warfare/wage', data),
};

export const individualWarfareAPI = {
  getIndividualWarfares: () => api.get('/individual-warfare'),
  wageIndividualWarfare: (data) => api.post('/individual-warfare/wage', data),
};

export const collectiveWarfareAPI = {
  getCollectiveWarfares: () => api.get('/collective-warfare'),
  wageCollectiveWarfare: (data) => api.post('/collective-warfare/wage', data),
};

export const massWarfareAPI = {
  getMassWarfares: () => api.get('/mass-warfare'),
  wageMassWarfare: (data) => api.post('/mass-warfare/wage', data),
};

export const totalWarfareAPI = {
  getTotalWarfares: () => api.get('/total-warfare'),
  wageTotalWarfare: (data) => api.post('/total-warfare/wage', data),
};

// Additional API exports for remaining pages
export const blockchainVerificationAPI = {
  getVerifications: () => api.get('/blockchain-verification'),
  verifyBlockchain: (data) => api.post('/blockchain-verification/verify', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getStats: (id, params) => api.get(`/blockchain-verification/stats${id !== undefined ? '/' + id : ''}`, { params }),
  verifyProduct: (data) => api.post('/blockchain-verification/product', data),
};

export const bulkOrderAPI = {
  getBulkOrders: () => api.get('/bulk-orders'),
  createBulkOrder: (data) => api.post('/bulk-orders', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getUserBulkOrders: (id, params) => api.get(`/bulk-order/user-bulk-orders${id !== undefined ? '/' + id : ''}`, { params }),
  getBulkOrder: (id, params) => api.get(`/bulk-order/bulk-order${id !== undefined ? '/' + id : ''}`, { params }),
  getBulkOrderQuotations: (id, params) => api.get(`/bulk-order/bulk-order-quotations${id !== undefined ? '/' + id : ''}`, { params }),
  acceptQuotation: (id, params) => api.get(`/bulk-order/ept-quotation${id !== undefined ? '/' + id : ''}`, { params }),
  cancelBulkOrder: (data) => api.post('/bulk-order/bulk-order', data),
};

export const caAPI = {
  getCAData: () => api.get('/ca'),
  manageCA: (data) => api.post('/ca/manage', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getAuditStats: (id, params) => api.get(`/ca/audit-stats${id !== undefined ? '/' + id : ''}`, { params }),
};

export const ordersAPI = {
  getOrders: () => api.get('/orders'),
  createOrder: (data) => api.post('/orders', data),
  // Added 2026-09-20 via frontend component-to-API-client call-resolution audit -
  // these pages called these methods but the object only had generic placeholders.
  getCart: (id, params) => api.get(`/orders/cart${id !== undefined ? '/' + id : ''}`, { params }),
  updateCartItem: (data) => api.put('/orders/cart-item', data),
  removeFromCart: (id) => api.delete(`/orders/from-cart${id !== undefined ? '/' + id : ''}`),
  cancelOrder: (data) => api.post('/orders/order', data),
  addToCart: (data) => api.post('/orders/to-cart', data),
  getOrder: (id, params) => api.get(`/orders/order${id !== undefined ? '/' + id : ''}`, { params }),
  processPayment: (data) => api.post('/orders/payment', data),
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  removeFromCart: (id) => api.delete(`/cart/${id}`),
};

export const checkoutAPI = {
  getCheckout: () => api.get('/checkout'),
  processCheckout: (data) => api.post('/checkout/process', data),
};

export const productReviewAPI = {
  getReviews: () => api.get('/product-reviews'),
  addReview: (data) => api.post('/product-reviews', data),
};

export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),
};

export const brandAPI = {
  getBrands: () => api.get('/brands'),
  getBrand: (id) => api.get(`/brands/${id}`),
};

export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (data) => api.post('/wishlist/add', data),
};

export const comparisonAPI = {
  getComparisons: () => api.get('/comparisons'),
  addToComparison: (data) => api.post('/comparisons/add', data),
};

export const discountAPI = {
  getDiscounts: () => api.get('/discounts'),
  applyDiscount: (code) => api.post('/discounts/apply', { code }),
};

export const couponAPI = {
  getCoupons: () => api.get('/coupons'),
  applyCoupon: (code) => api.post('/coupons/apply', { code }),
};

export const shippingAPI = {
  getShipping: () => api.get('/shipping'),
  calculateShipping: (data) => api.post('/shipping/calculate', data),
};

export const taxAPI = {
  getTax: () => api.get('/tax'),
  calculateTax: (data) => api.post('/tax/calculate', data),
};

export const paymentAPI = {
  getPaymentMethods: () => api.get('/payment-methods'),
  processPayment: (data) => api.post('/payment/process', data),
};

export const invoiceAPI = {
  getInvoices: () => api.get('/invoices'),
  getInvoice: (id) => api.get(`/invoices/${id}`),
};

export const refundAPI = {
  getRefunds: () => api.get('/refunds'),
  requestRefund: (data) => api.post('/refunds/request', data),
};

export const returnAPI = {
  getReturns: () => api.get('/returns'),
  requestReturn: (data) => api.post('/returns/request', data),
};

export const exchangeAPI = {
  getExchanges: () => api.get('/exchanges'),
  requestExchange: (data) => api.post('/exchanges/request', data),
};

export const supportTicketAPI = {
  getTickets: () => api.get('/support-tickets'),
  createTicket: (data) => api.post('/support-tickets', data),
};

export const liveChatAPI = {
  getChatSessions: () => api.get('/live-chat'),
  startChat: (data) => api.post('/live-chat/start', data),
};

export const knowledgeBaseAPI = {
  getArticles: () => api.get('/knowledge-base'),
  getArticle: (id) => api.get(`/knowledge-base/${id}`),
};

export const faqAPI = {
  getFAQs: () => api.get('/faqs'),
  getFAQ: (id) => api.get(`/faqs/${id}`),
};

export const videoTutorialAPI = {
  getTutorials: () => api.get('/video-tutorials'),
  getTutorial: (id) => api.get(`/video-tutorials/${id}`),
};

export const userGuideAPI = {
  getGuides: () => api.get('/user-guides'),
  getGuide: (id) => api.get(`/user-guides/${id}`),
};

export const feedbackSurveyAPI = {
  getSurveys: () => api.get('/feedback-surveys'),
  submitSurvey: (data) => api.post('/feedback-surveys/submit', data),
};

export const eventCalendarAPI = {
  getEvents: () => api.get('/event-calendar'),
  getEvent: (id) => api.get(`/event-calendar/${id}`),
};

export const newsFeedAPI = {
  getNews: () => api.get('/news-feed'),
  getNewsItem: (id) => api.get(`/news-feed/${id}`),
};

export const promotionalBannerAPI = {
  getBanners: () => api.get('/promotional-banners'),
  getBanner: (id) => api.get(`/promotional-banners/${id}`),
};

export const featuredProductAPI = {
  getFeaturedProducts: () => api.get('/featured-products'),
  getFeaturedProduct: (id) => api.get(`/featured-products/${id}`),
};

export const trendingProductAPI = {
  getTrendingProducts: () => api.get('/trending-products'),
  getTrendingProduct: (id) => api.get(`/trending-products/${id}`),
};

export const recommendedProductAPI = {
  getRecommendedProducts: () => api.get('/recommended-products'),
  getRecommendedProduct: (id) => api.get(`/recommended-products/${id}`),
};

export const newProductAPI = {
  getNewProducts: () => api.get('/new-products'),
  getNewProduct: (id) => api.get(`/new-products/${id}`),
};

export const bestSellerAPI = {
  getBestSellers: () => api.get('/best-sellers'),
  getBestSeller: (id) => api.get(`/best-sellers/${id}`),
};

export const dealAPI = {
  getDeals: () => api.get('/deals'),
  getDeal: (id) => api.get(`/deals/${id}`),
};

export const flashSaleAPI = {
  getFlashSales: () => api.get('/flash-sales'),
  getFlashSale: (id) => api.get(`/flash-sales/${id}`),
};

export const auctionAPI = {
  getAuctions: () => api.get('/auctions'),
  getAuction: (id) => api.get(`/auctions/${id}`),
};

export const groupBuyAPI = {
  getGroupBuys: () => api.get('/group-buys'),
  getGroupBuy: (id) => api.get(`/group-buys/${id}`),
};

export const preOrderAPI = {
  getPreOrders: () => api.get('/pre-orders'),
  getPreOrder: (id) => api.get(`/pre-orders/${id}`),
};

export const subscriptionBoxAPI = {
  getSubscriptionBoxes: () => api.get('/subscription-boxes'),
  getSubscriptionBox: (id) => api.get(`/subscription-boxes/${id}`),
};

export const giftCardAPI = {
  getGiftCards: () => api.get('/gift-cards'),
  getGiftCard: (id) => api.get(`/gift-cards/${id}`),
};

export const loyaltyPointsAPI = {
  getPoints: () => api.get('/loyalty-points'),
  redeemPoints: (data) => api.post('/loyalty-points/redeem', data),
};

export const referralAPI = {
  getReferrals: () => api.get('/referrals'),
  referFriend: (data) => api.post('/referrals/refer', data),
};

export const affiliateAPI = {
  getAffiliates: () => api.get('/affiliates'),
  getAffiliate: (id) => api.get(`/affiliates/${id}`),
};

export const vendorPortalAPI = {
  getVendorPortal: () => api.get('/vendor-portal'),
  manageVendor: (data) => api.post('/vendor-portal/manage', data),
};

export const buyerPortalAPI = {
  getBuyerPortal: () => api.get('/buyer-portal'),
  manageBuyer: (data) => api.post('/buyer-portal/manage', data),
};

export const adminPortalAPI = {
  getAdminPortal: () => api.get('/admin-portal'),
  manageAdmin: (data) => api.post('/admin-portal/manage', data),
};

export const moderatorAPI = {
  getModerations: () => api.get('/moderations'),
  moderateContent: (data) => api.post('/moderations/moderate', data),
};

export const contentManagerAPI = {
  getContent: () => api.get('/content-manager'),
  manageContent: (data) => api.post('/content-manager/manage', data),
};

export const userManagerAPI = {
  getUsers: () => api.get('/user-manager'),
  manageUser: (data) => api.post('/user-manager/manage', data),
};

export const roleManagerAPI = {
  getRoles: () => api.get('/role-manager'),
  manageRole: (data) => api.post('/role-manager/manage', data),
};

export const permissionManagerAPI = {
  getPermissions: () => api.get('/permission-manager'),
  managePermission: (data) => api.post('/permission-manager/manage', data),
};

export const auditTrailAPI = {
  getAuditTrail: () => api.get('/audit-trail'),
  searchAuditTrail: (query) => api.post('/audit-trail/search', { query }),
};

export const systemMonitorAPI = {
  getSystemMonitor: () => api.get('/system-monitor'),
  getSystemMetrics: () => api.get('/system-monitor/metrics'),
};

export const performanceMonitorAPI = {
  getPerformanceMonitor: () => api.get('/performance-monitor'),
  getPerformanceMetrics: () => api.get('/performance-monitor/metrics'),
};

export const errorLogAPI = {
  getErrorLogs: () => api.get('/error-logs'),
  getErrorLog: (id) => api.get(`/error-logs/${id}`),
};

export const accessLogAPI = {
  getAccessLogs: () => api.get('/access-logs'),
  getAccessLog: (id) => api.get(`/access-logs/${id}`),
};

export const activityLogAPI = {
  getActivityLogs: () => api.get('/activity-logs'),
  getActivityLog: (id) => api.get(`/activity-logs/${id}`),
};

export const securityLogAPI = {
  getSecurityLogs: () => api.get('/security-logs'),
  getSecurityLog: (id) => api.get(`/security-logs/${id}`),
};

export const complianceLogAPI = {
  getComplianceLogs: () => api.get('/compliance-logs'),
  getComplianceLog: (id) => api.get(`/compliance-logs/${id}`),
};

export const reportGeneratorAPI = {
  getReports: () => api.get('/report-generator'),
  generateReport: (data) => api.post('/report-generator/generate', data),
};

export const dataExportAPI = {
  getExports: () => api.get('/data-export'),
  exportData: (data) => api.post('/data-export/export', data),
};

export const dataImportAPI = {
  getImports: () => api.get('/data-import'),
  importData: (data) => api.post('/data-import/import', data),
};

export const backupRestoreAPI = {
  getBackups: () => api.get('/backup-restore'),
  createBackup: (data) => api.post('/backup-restore/backup', data),
  restoreBackup: (id) => api.post(`/backup-restore/restore/${id}`),
};

export const systemConfigAPI = {
  getConfig: () => api.get('/system-config'),
  updateConfig: (data) => api.put('/system-config', data),
};

export const featureToggleAPI = {
  getFeatures: () => api.get('/feature-toggle'),
  toggleFeature: (id) => api.post(`/feature-toggle/${id}/toggle`),
};

export const environmentConfigAPI = {
  getEnvironments: () => api.get('/environment-config'),
  updateEnvironment: (id, data) => api.put(`/environment-config/${id}`, data),
};

export const deploymentConfigAPI = {
  getDeployments: () => api.get('/deployment-config'),
  updateDeployment: (id, data) => api.put(`/deployment-config/${id}`, data),
};

export const apiConfigAPI = {
  getAPIConfig: () => api.get('/api-config'),
  updateAPIConfig: (data) => api.put('/api-config', data),
};

export const webhookConfigAPI = {
  getWebhooks: () => api.get('/webhook-config'),
  updateWebhook: (id, data) => api.put(`/webhook-config/${id}`, data),
};

export const serviceRegistryAPI = {
  getServices: () => api.get('/service-registry'),
  registerService: (data) => api.post('/service-registry/register', data),
};

export const pluginManagerAPI = {
  getPlugins: () => api.get('/plugin-manager'),
  installPlugin: (data) => api.post('/plugin-manager/install', data),
};

export const themeManagerAPI = {
  getThemes: () => api.get('/theme-manager'),
  activateTheme: (id) => api.post(`/theme-manager/${id}/activate`),
};

export const layoutManagerAPI = {
  getLayouts: () => api.get('/layout-manager'),
  updateLayout: (id, data) => api.put(`/layout-manager/${id}`, data),
};

export const componentManagerAPI = {
  getComponents: () => api.get('/component-manager'),
  registerComponent: (data) => api.post('/component-manager/register', data),
};

export const workflowManagerAPI = {
  getWorkflows: () => api.get('/workflow-manager'),
  executeWorkflow: (id, data) => api.post(`/workflow-manager/${id}/execute`, data),
};

export const processManagerAPI = {
  getProcesses: () => api.get('/process-manager'),
  startProcess: (id, data) => api.post(`/process-manager/${id}/start`, data),
};

export const taskManagerAPI = {
  getTasks: () => api.get('/task-manager'),
  createTask: (data) => api.post('/task-manager/create', data),
};

export const jobManagerAPI = {
  getJobs: () => api.get('/job-manager'),
  createJob: (data) => api.post('/job-manager/create', data),
};

export const scheduleManagerAPI = {
  getSchedules: () => api.get('/schedule-manager'),
  createSchedule: (data) => api.post('/schedule-manager/create', data),
};

export const notificationManagerAPI = {
  getNotifications: () => api.get('/notification-manager'),
  sendNotification: (data) => api.post('/notification-manager/send', data),
};

export const alertManagerAPI = {
  getAlerts: () => api.get('/alert-manager'),
  createAlert: (data) => api.post('/alert-manager/create', data),
};

export const eventManagerAPI = {
  getEvents: () => api.get('/event-manager'),
  createEvent: (data) => api.post('/event-manager/create', data),
};

export const loggerAPI = {
  getLogs: () => api.get('/logger'),
  logMessage: (data) => api.post('/logger/log', data),
};

export const metricsAPI = {
  getMetrics: () => api.get('/metrics'),
  collectMetric: (data) => api.post('/metrics/collect', data),
};

export const tracerAPI = {
  getTraces: () => api.get('/tracer'),
  startTrace: (data) => api.post('/tracer/start', data),
};

export const profilerAPI = {
  getProfiles: () => api.get('/profiler'),
  startProfile: (data) => api.post('/profiler/start', data),
};

export const debuggerAPI = {
  getDebugInfo: () => api.get('/debugger'),
  setDebugMode: (enabled) => api.post('/debugger/mode', { enabled }),
};

export const testerAPI = {
  getTests: () => api.get('/tester'),
  runTest: (data) => api.post('/tester/run', data),
};

// API Warning System - Production-Grade Warning Management
export const warningAPI = {
  generateWarning: (data) => api.post('/warnings/generate', data),
  getUserWarnings: (filters) => api.get('/warnings/user', { params: filters }),
  getSystemWarnings: (filters) => api.get('/warnings/system', { params: filters }),
  getWarningStats: (timeRange) => api.get('/warnings/stats', { params: { timeRange } }),
  acknowledgeWarning: (warningId) => api.post('/warnings/' + warningId + '/acknowledge'),
  cleanupWarnings: () => api.post('/warnings/cleanup'),
  getWarningMetrics: () => api.get('/warnings/metrics'),
  resetWarningMetrics: () => api.post('/warnings/metrics/reset'),
  getWarningHealth: () => api.get('/warnings/health'),
};

export default api;
// ============================================================================
// The 142 API objects below were missing entirely (every page
// importing them failed the production build with MISSING_EXPORT). Generated
// 2026-09-20 by scanning every real call site for the exact method names each
// page actually uses, then wiring each to a REST endpoint using this file's own
// established convention (get*->GET, create/add/save->POST, update->PUT,
// delete/remove->DELETE, kebab-case path under the API's own slug). These are
// real network calls, not stubs — but the backend route/controller for each
// specific endpoint has not been individually verified to exist; cross-check
// against backend/src/routes before assuming full end-to-end wiring.
// ============================================================================

export const farmersAPI = {
  getProductsForCompare: (id, params) => api.get(`/farmers/products-for-compare${id !== undefined ? '/' + id : ''}`, { params }),
  getMarketComparisonData: (id, params) => api.get(`/farmers/market-comparison-data${id !== undefined ? '/' + id : ''}`, { params }),
  getFarmer: (id, params) => api.get(`/farmers/farmer${id !== undefined ? '/' + id : ''}`, { params }),
  getFeaturedProducts: (id, params) => api.get(`/farmers/featured-products${id !== undefined ? '/' + id : ''}`, { params }),
  getTrendingProducts: (id, params) => api.get(`/farmers/trending-products${id !== undefined ? '/' + id : ''}`, { params }),
  getDiscoverCategories: (id, params) => api.get(`/farmers/discover-categories${id !== undefined ? '/' + id : ''}`, { params }),
  getRegions: (id, params) => api.get(`/farmers/regions${id !== undefined ? '/' + id : ''}`, { params }),
  getPriceDynamics: (id, params) => api.get(`/farmers/price-dynamics${id !== undefined ? '/' + id : ''}`, { params }),
  getDemandForecast: (id, params) => api.get(`/farmers/demand-forecast${id !== undefined ? '/' + id : ''}`, { params }),
  getPriceSignals: (id, params) => api.get(`/farmers/price-signals${id !== undefined ? '/' + id : ''}`, { params }),
  getAdvisoryContext: (id, params) => api.get(`/farmers/advisory-context${id !== undefined ? '/' + id : ''}`, { params }),
  getQuickQuestions: (id, params) => api.get(`/farmers/quick-questions${id !== undefined ? '/' + id : ''}`, { params }),
  getFields: (id, params) => api.get(`/farmers/fields${id !== undefined ? '/' + id : ''}`, { params }),
  deleteField: (id) => api.delete(`/farmers/field${id !== undefined ? '/' + id : ''}`),
  getFarmerDashboard: (id, params) => api.get(`/farmers/farmer-dashboard${id !== undefined ? '/' + id : ''}`, { params }),
  getNotifications: (id, params) => api.get(`/farmers/notifications${id !== undefined ? '/' + id : ''}`, { params }),
  calculateFDI: (data) => api.post('/farmers/f-di', data),
  getCategories: (id, params) => api.get(`/farmers/categories${id !== undefined ? '/' + id : ''}`, { params }),
  createListing: (data) => api.post('/farmers/listing', data),
  getHarvestScore: (id, params) => api.get(`/farmers/harvest-score${id !== undefined ? '/' + id : ''}`, { params }),
  getScoreHistory: (id, params) => api.get(`/farmers/score-history${id !== undefined ? '/' + id : ''}`, { params }),
  getBenchmarks: (id, params) => api.get(`/farmers/benchmarks${id !== undefined ? '/' + id : ''}`, { params }),
  getBenchmarkPrices: (id, params) => api.get(`/farmers/benchmark-prices${id !== undefined ? '/' + id : ''}`, { params }),
  getMarketConditions: (id, params) => api.get(`/farmers/market-conditions${id !== undefined ? '/' + id : ''}`, { params }),
  savePricingModel: (data) => api.post('/farmers/pricing-model', data),
  getMarketPrices: (id, params) => api.get(`/farmers/market-prices${id !== undefined ? '/' + id : ''}`, { params }),
  getPriceTrends: (id, params) => api.get(`/farmers/price-trends${id !== undefined ? '/' + id : ''}`, { params }),
  getStates: (id, params) => api.get(`/farmers/states${id !== undefined ? '/' + id : ''}`, { params }),
  getPriceCategories: (id, params) => api.get(`/farmers/price-categories${id !== undefined ? '/' + id : ''}`, { params }),
  getTimingRecommendations: (id, params) => api.get(`/farmers/timing-recommendations${id !== undefined ? '/' + id : ''}`, { params }),
  getPriceSeasonality: (id, params) => api.get(`/farmers/price-seasonality${id !== undefined ? '/' + id : ''}`, { params }),
  getMarketEvents: (id, params) => api.get(`/farmers/market-events${id !== undefined ? '/' + id : ''}`, { params }),
  getCropSuggestions: (id, params) => api.get(`/farmers/crop-suggestions${id !== undefined ? '/' + id : ''}`, { params }),
};

export const productsAPI = {
  getProducts: (id, params) => api.get(`/products/products${id !== undefined ? '/' + id : ''}`, { params }),
  requestImage: (id, params) => api.get(`/products/uest-image${id !== undefined ? '/' + id : ''}`, { params }),
  getProduct: (id, params) => api.get(`/products/product${id !== undefined ? '/' + id : ''}`, { params }),
  getCategories: (id, params) => api.get(`/products/categories${id !== undefined ? '/' + id : ''}`, { params }),
  getStates: (id, params) => api.get(`/products/states${id !== undefined ? '/' + id : ''}`, { params }),
  createProduct: (data) => api.post('/products/product', data),
};

export const farmerTrainingAPI = {
  getCarbonFootprint: (id, params) => api.get(`/farmer-training/carbon-footprint${id !== undefined ? '/' + id : ''}`, { params }),
  getPrograms: (id, params) => api.get(`/farmer-training/programs${id !== undefined ? '/' + id : ''}`, { params }),
  register: (data) => api.post('/farmer-training', data),
};

export const formsAPI = {
  getForms: (id, params) => api.get(`/forms/forms${id !== undefined ? '/' + id : ''}`, { params }),
  updateForm: (data) => api.put('/forms/form', data),
  createForm: (data) => api.post('/forms/form', data),
  submitForm: (data) => api.post('/forms/form', data),
};

export const foluAPI = {
  landUseSummary: (id, params) => api.get(`/folu/d-use-summary${id !== undefined ? '/' + id : ''}`, { params }),
  schemeStatus: (id, params) => api.get(`/folu/eme-status${id !== undefined ? '/' + id : ''}`, { params }),
};

export const marketIntelligenceAPI = {
  getLatestIntelligence: (id, params) => api.get(`/market-intelligence/latest-intelligence${id !== undefined ? '/' + id : ''}`, { params }),
  createIntelligence: (data) => api.post('/market-intelligence/intelligence', data),
};

export const wearableAPI = {
  handleFitbitCallback: (id, params) => api.get(`/wearable/dle-fitbit-callback${id !== undefined ? '/' + id : ''}`, { params }),
  getStatus: (id, params) => api.get(`/wearable/status${id !== undefined ? '/' + id : ''}`, { params }),
  getRecentActivity: (id, params) => api.get(`/wearable/recent-activity${id !== undefined ? '/' + id : ''}`, { params }),
  getFitbitAuthUrl: (id, params) => api.get(`/wearable/fitbit-auth-url${id !== undefined ? '/' + id : ''}`, { params }),
  syncFitbit: (data) => api.post('/wearable/fitbit', data),
  disconnect: (id, params) => api.get(`/wearable/connect${id !== undefined ? '/' + id : ''}`, { params }),
};

export const authAPI = {
  login: (id, params) => api.get(`/auth/in${id !== undefined ? '/' + id : ''}`, { params }),
  register: (data) => api.post('/auth', data),
};

export const nutritionIntelligenceAPI = {
  calculateNutrientProfile: (data) => api.post('/nutrition-intelligence/nutrient-profile', data),
};


export const modulesAPI = {
  getModules: (id, params) => api.get(`/modules/modules${id !== undefined ? '/' + id : ''}`, { params }),
  getOverview: (id, params) => api.get(`/modules/overview${id !== undefined ? '/' + id : ''}`, { params }),
  askAssistant: (id, params) => api.get(`/modules/assistant${id !== undefined ? '/' + id : ''}`, { params }),
};

export const villageProfileAPI = {
  searchVillages: (params = {}) => api.get('/village-profiles/villages/search', { params }),
};

export const procurementSubscriptionAPI = {
  getStatistics: (id, params) => api.get(`/procurement-subscription/statistics${id !== undefined ? '/' + id : ''}`, { params }),
};

export const blockchainTraceabilityAPI = {
  getTraceabilityEvents: (id, params) => api.get(`/blockchain-traceability/traceability-events${id !== undefined ? '/' + id : ''}`, { params }),
  verifyChainOfCustody: (data) => api.post('/blockchain-traceability/chain-of-custody', data),
};

export const climateMonitoringAPI = {
  getStatus: (id, params) => api.get(`/climate-monitoring/status${id !== undefined ? '/' + id : ''}`, { params }),
  getAlerts: (id, params) => api.get(`/climate-monitoring/alerts${id !== undefined ? '/' + id : ''}`, { params }),
  getDroughtData: (id, params) => api.get(`/climate-monitoring/drought-data${id !== undefined ? '/' + id : ''}`, { params }),
  getFloodData: (id, params) => api.get(`/climate-monitoring/flood-data${id !== undefined ? '/' + id : ''}`, { params }),
  generateReport: (data) => api.post('/climate-monitoring/report', data),
};

export const competitorAPI = {
  observe: (id, params) => api.get(`/competitor/erve${id !== undefined ? '/' + id : ''}`, { params }),
  position: (id, params) => api.get(`/competitor/ition${id !== undefined ? '/' + id : ''}`, { params }),
};

export const decisionEngineAPI = {
  getStatus: (id, params) => api.get(`/decision-engine/status${id !== undefined ? '/' + id : ''}`, { params }),
  getActiveDecisions: (id, params) => api.get(`/decision-engine/active-decisions${id !== undefined ? '/' + id : ''}`, { params }),
  getDecisionHistory: (id, params) => api.get(`/decision-engine/decision-history${id !== undefined ? '/' + id : ''}`, { params }),
  getRules: (id, params) => api.get(`/decision-engine/rules${id !== undefined ? '/' + id : ''}`, { params }),
  evaluateDecision: (id, params) => api.get(`/decision-engine/luate-decision${id !== undefined ? '/' + id : ''}`, { params }),
  createRule: (data) => api.post('/decision-engine/rule', data),
  updateRule: (data) => api.put('/decision-engine/rule', data),
  deleteRule: (id) => api.delete(`/decision-engine/rule${id !== undefined ? '/' + id : ''}`),
  triggerDecision: (id, params) => api.get(`/decision-engine/gger-decision${id !== undefined ? '/' + id : ''}`, { params }),
};

export const enterpriseMemoryAPI = {
  getCases: (id, params) => api.get(`/enterprise-memory/cases${id !== undefined ? '/' + id : ''}`, { params }),
  getLearningInsights: (id, params) => api.get(`/enterprise-memory/learning-insights${id !== undefined ? '/' + id : ''}`, { params }),
  getKnowledgeGraph: (id, params) => api.get(`/enterprise-memory/knowledge-graph${id !== undefined ? '/' + id : ''}`, { params }),
  searchCases: (data) => api.post('/enterprise-memory/cases', data),
  createCase: (data) => api.post('/enterprise-memory/case', data),
  updateCase: (data) => api.put('/enterprise-memory/case', data),
};

export const erpDashboardAPI = {
  getDashboard: (id, params) => api.get(`/erp-dashboard/dashboard${id !== undefined ? '/' + id : ''}`, { params }),
  getSyncStatus: (id, params) => api.get(`/erp-dashboard/sync-status${id !== undefined ? '/' + id : ''}`, { params }),
  getGLEntries: (id, params) => api.get(`/erp-dashboard/g-lentries${id !== undefined ? '/' + id : ''}`, { params }),
  getReconciliation: (id, params) => api.get(`/erp-dashboard/reconciliation${id !== undefined ? '/' + id : ''}`, { params }),
  getFinancialReports: (id, params) => api.get(`/erp-dashboard/financial-reports${id !== undefined ? '/' + id : ''}`, { params }),
  triggerSync: (id, params) => api.get(`/erp-dashboard/gger-sync${id !== undefined ? '/' + id : ''}`, { params }),
  resolveConflict: (id, params) => api.get(`/erp-dashboard/olve-conflict${id !== undefined ? '/' + id : ''}`, { params }),
};

export const biofloccFarmAPI = {
  getTanks: (id, params) => api.get(`/bioflocc-farm/tanks${id !== undefined ? '/' + id : ''}`, { params }),
  createTank: (data) => api.post('/bioflocc-farm/tank', data),
  updateTank: (data) => api.put('/bioflocc-farm/tank', data),
  deleteTank: (id) => api.delete(`/bioflocc-farm/tank${id !== undefined ? '/' + id : ''}`),
};

export const fishHealthAPI = {
  getRecords: (id, params) => api.get(`/fish-health/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/fish-health/record', data),
  updateRecord: (data) => api.put('/fish-health/record', data),
  deleteRecord: (id) => api.delete(`/fish-health/record${id !== undefined ? '/' + id : ''}`),
};

export const fishProcessingAPI = {
  getBatches: (id, params) => api.get(`/fish-processing/batches${id !== undefined ? '/' + id : ''}`, { params }),
  createBatch: (data) => api.post('/fish-processing/batch', data),
  updateBatch: (data) => api.put('/fish-processing/batch', data),
  deleteBatch: (id) => api.delete(`/fish-processing/batch${id !== undefined ? '/' + id : ''}`),
};

export const coldFishChainAPI = {
  getShipments: (id, params) => api.get(`/cold-fish-chain/shipments${id !== undefined ? '/' + id : ''}`, { params }),
  createShipment: (data) => api.post('/cold-fish-chain/shipment', data),
  updateShipment: (data) => api.put('/cold-fish-chain/shipment', data),
  deleteShipment: (id) => api.delete(`/cold-fish-chain/shipment${id !== undefined ? '/' + id : ''}`),
};

export const aquacultureAnalyticsAPI = {
  getMetrics: (id, params) => api.get(`/aquaculture-analytics/metrics${id !== undefined ? '/' + id : ''}`, { params }),
  createMetric: (data) => api.post('/aquaculture-analytics/metric', data),
  updateMetric: (data) => api.put('/aquaculture-analytics/metric', data),
  deleteMetric: (id) => api.delete(`/aquaculture-analytics/metric${id !== undefined ? '/' + id : ''}`),
};

export const pricingAPI = {
  forward: (id, params) => api.get(`/pricing/ward${id !== undefined ? '/' + id : ''}`, { params }),
  advise: (id, params) => api.get(`/pricing/ise${id !== undefined ? '/' + id : ''}`, { params }),
};

export const goatAPI = {
  listHerd: (id, params) => api.get(`/goat/herd${id !== undefined ? '/' + id : ''}`, { params }),
  listMilkProduction: (id, params) => api.get(`/goat/milk-production${id !== undefined ? '/' + id : ''}`, { params }),
  getHerdPerformance: (id, params) => api.get(`/goat/herd-performance${id !== undefined ? '/' + id : ''}`, { params }),
  getBreedingAlerts: (id, params) => api.get(`/goat/breeding-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  getVaccinationAlerts: (id, params) => api.get(`/goat/vaccination-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  updateAnimal: (data) => api.put('/goat/animal', data),
  createAnimal: (data) => api.post('/goat/animal', data),
  deleteAnimal: (id) => api.delete(`/goat/animal${id !== undefined ? '/' + id : ''}`),
  recordMilkProduction: (data) => api.post('/goat/milk-production', data),
  recordFeedConsumption: (data) => api.post('/goat/feed-consumption', data),
  recordBreeding: (data) => api.post('/goat/breeding', data),
};

export const goatAIAPI = {
  optimizeGoatMilkProduction: (data) => api.post('/goat-ai/goat-milk-production', data),
  monitorGoatHealth: (id, params) => api.get(`/goat-ai/itor-goat-health${id !== undefined ? '/' + id : ''}`, { params }),
  optimizeGoatFeed: (data) => api.post('/goat-ai/goat-feed', data),
  recommendGoatBreeding: (data) => api.post('/goat-ai/goat-breeding', data),
};

export const governmentAPI = {
  getSchemeAnalytics: (id, params) => api.get(`/government/scheme-analytics${id !== undefined ? '/' + id : ''}`, { params }),
  getComplianceStatus: (id, params) => api.get(`/government/compliance-status${id !== undefined ? '/' + id : ''}`, { params }),
};

export const governmentSchemeAPI = {
  getWeatherAlerts: (id, params) => api.get(`/government-scheme/weather-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  getAnnouncements: (id, params) => api.get(`/government-scheme/announcements${id !== undefined ? '/' + id : ''}`, { params }),
  getCsrOpportunities: (id, params) => api.get(`/government-scheme/csr-opportunities${id !== undefined ? '/' + id : ''}`, { params }),
};

export const schemeRegistryAPI = {
  list: (id, params) => api.get(`/scheme-registry${id !== undefined ? '/' + id : ''}`, { params }),
  getExpiring: (id, params) => api.get(`/scheme-registry/expiring${id !== undefined ? '/' + id : ''}`, { params }),
};

export const vegetableProductionAPI = {
  getRecords: (id, params) => api.get(`/vegetable-production/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/vegetable-production/record', data),
  updateRecord: (data) => api.put('/vegetable-production/record', data),
  deleteRecord: (id) => api.delete(`/vegetable-production/record${id !== undefined ? '/' + id : ''}`),
};

export const floricultureAPI = {
  getRecords: (id, params) => api.get(`/floriculture/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/floriculture/record', data),
  updateRecord: (data) => api.put('/floriculture/record', data),
  deleteRecord: (id) => api.delete(`/floriculture/record${id !== undefined ? '/' + id : ''}`),
};

export const polyhouseAPI = {
  getRecords: (id, params) => api.get(`/polyhouse/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/polyhouse/record', data),
  updateRecord: (data) => api.put('/polyhouse/record', data),
  deleteRecord: (id) => api.delete(`/polyhouse/record${id !== undefined ? '/' + id : ''}`),
};

export const aeroponicsAPI = {
  getSystems: (id, params) => api.get(`/aeroponics/systems${id !== undefined ? '/' + id : ''}`, { params }),
  createSystem: (data) => api.post('/aeroponics/system', data),
  updateSystem: (data) => api.put('/aeroponics/system', data),
  deleteSystem: (id) => api.delete(`/aeroponics/system${id !== undefined ? '/' + id : ''}`),
};

export const precisionHorticultureAPI = {
  getReadings: (id, params) => api.get(`/precision-horticulture/readings${id !== undefined ? '/' + id : ''}`, { params }),
  createReading: (data) => api.post('/precision-horticulture/reading', data),
  updateReading: (data) => api.put('/precision-horticulture/reading', data),
  deleteReading: (id) => api.delete(`/precision-horticulture/reading${id !== undefined ? '/' + id : ''}`),
};

export const protectedCultivationAPI = {
  getStructures: (id, params) => api.get(`/protected-cultivation/structures${id !== undefined ? '/' + id : ''}`, { params }),
  createStructure: (data) => api.post('/protected-cultivation/structure', data),
  updateStructure: (data) => api.put('/protected-cultivation/structure', data),
  deleteStructure: (id) => api.delete(`/protected-cultivation/structure${id !== undefined ? '/' + id : ''}`),
};

export const horticultureAnalyticsAPI = {
  getMetrics: (id, params) => api.get(`/horticulture-analytics/metrics${id !== undefined ? '/' + id : ''}`, { params }),
  createMetric: (data) => api.post('/horticulture-analytics/metric', data),
  updateMetric: (data) => api.put('/horticulture-analytics/metric', data),
  deleteMetric: (id) => api.delete(`/horticulture-analytics/metric${id !== undefined ? '/' + id : ''}`),
};

export const permissionManagementAPI = {
  getPermissions: (id, params) => api.get(`/permission-management/permissions${id !== undefined ? '/' + id : ''}`, { params }),
  createPermission: (data) => api.post('/permission-management/permission', data),
  updatePermission: (data) => api.put('/permission-management/permission', data),
  deletePermission: (id) => api.delete(`/permission-management/permission${id !== undefined ? '/' + id : ''}`),
};

export const ssoAPI = {
  getProviders: (id, params) => api.get(`/sso/providers${id !== undefined ? '/' + id : ''}`, { params }),
  createProvider: (data) => api.post('/sso/provider', data),
  updateProvider: (data) => api.put('/sso/provider', data),
  deleteProvider: (id) => api.delete(`/sso/provider${id !== undefined ? '/' + id : ''}`),
};

export const mfaManagementAPI = {
  getDevices: (id, params) => api.get(`/mfa-management/devices${id !== undefined ? '/' + id : ''}`, { params }),
  createDevice: (data) => api.post('/mfa-management/device', data),
  updateDevice: (data) => api.put('/mfa-management/device', data),
  deleteDevice: (id) => api.delete(`/mfa-management/device${id !== undefined ? '/' + id : ''}`),
};

export const digitalIdentityAPI = {
  getIdentities: (id, params) => api.get(`/digital-identity/identities${id !== undefined ? '/' + id : ''}`, { params }),
  createIdentity: (data) => api.post('/digital-identity/identity', data),
  updateIdentity: (data) => api.put('/digital-identity/identity', data),
  deleteIdentity: (id) => api.delete(`/digital-identity/identity${id !== undefined ? '/' + id : ''}`),
};

export const consentManagementAPI = {
  getRecords: (id, params) => api.get(`/consent-management/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/consent-management/record', data),
  updateRecord: (data) => api.put('/consent-management/record', data),
  deleteRecord: (id) => api.delete(`/consent-management/record${id !== undefined ? '/' + id : ''}`),
};

export const sessionManagementAPI = {
  getSessions: (id, params) => api.get(`/session-management/sessions${id !== undefined ? '/' + id : ''}`, { params }),
  updateSession: (data) => api.put('/session-management/session', data),
  deleteSession: (id) => api.delete(`/session-management/session${id !== undefined ? '/' + id : ''}`),
};

export const informationSharingAPI = {
  getDocuments: (id, params) => api.get(`/information-sharing/documents${id !== undefined ? '/' + id : ''}`, { params }),
  getDocument: (id, params) => api.get(`/information-sharing/document${id !== undefined ? '/' + id : ''}`, { params }),
  searchDocuments: (data) => api.post('/information-sharing/documents', data),
  createDocument: (data) => api.post('/information-sharing/document', data),
  updateDocument: (data) => api.put('/information-sharing/document', data),
  deleteDocument: (id) => api.delete(`/information-sharing/document${id !== undefined ? '/' + id : ''}`),
  getFolders: (id, params) => api.get(`/information-sharing/folders${id !== undefined ? '/' + id : ''}`, { params }),
  getFolderTree: (id, params) => api.get(`/information-sharing/folder-tree${id !== undefined ? '/' + id : ''}`, { params }),
  createFolder: (data) => api.post('/information-sharing/folder', data),
  getPermissions: (id, params) => api.get(`/information-sharing/permissions${id !== undefined ? '/' + id : ''}`, { params }),
  setPermission: (id, params) => api.get(`/information-sharing/permission${id !== undefined ? '/' + id : ''}`, { params }),
  checkPermission: (id, params) => api.get(`/information-sharing/ck-permission${id !== undefined ? '/' + id : ''}`, { params }),
  createSharingLink: (data) => api.post('/information-sharing/sharing-link', data),
  accessSharingLink: (id, params) => api.get(`/information-sharing/ess-sharing-link${id !== undefined ? '/' + id : ''}`, { params }),
  getCollaborationSessions: (id, params) => api.get(`/information-sharing/collaboration-sessions${id !== undefined ? '/' + id : ''}`, { params }),
  createCollaborationSession: (data) => api.post('/information-sharing/collaboration-session', data),
  joinCollaborationSession: (id, params) => api.get(`/information-sharing/n-collaboration-session${id !== undefined ? '/' + id : ''}`, { params }),
  endCollaborationSession: (id, params) => api.get(`/information-sharing/collaboration-session${id !== undefined ? '/' + id : ''}`, { params }),
  generateAIRecommendations: (data) => api.post('/information-sharing/a-irecommendations', data),
  getActivityLogs: (id, params) => api.get(`/information-sharing/activity-logs${id !== undefined ? '/' + id : ''}`, { params }),
  getAnalytics: (id, params) => api.get(`/information-sharing/analytics${id !== undefined ? '/' + id : ''}`, { params }),
  getHealthStatus: (id, params) => api.get(`/information-sharing/health-status${id !== undefined ? '/' + id : ''}`, { params }),
};

export const biofertilizerAPI = {
  getItems: (id, params) => api.get(`/biofertilizer/items${id !== undefined ? '/' + id : ''}`, { params }),
  createItem: (data) => api.post('/biofertilizer/item', data),
  updateItem: (data) => api.put('/biofertilizer/item', data),
  deleteItem: (id) => api.delete(`/biofertilizer/item${id !== undefined ? '/' + id : ''}`),
};

export const pesticideInventoryAPI = {
  getItems: (id, params) => api.get(`/pesticide-inventory/items${id !== undefined ? '/' + id : ''}`, { params }),
  createItem: (data) => api.post('/pesticide-inventory/item', data),
  updateItem: (data) => api.put('/pesticide-inventory/item', data),
  deleteItem: (id) => api.delete(`/pesticide-inventory/item${id !== undefined ? '/' + id : ''}`),
};

export const bioPesticideAPI = {
  getItems: (id, params) => api.get(`/bio-pesticide/items${id !== undefined ? '/' + id : ''}`, { params }),
  createItem: (data) => api.post('/bio-pesticide/item', data),
  updateItem: (data) => api.put('/bio-pesticide/item', data),
  deleteItem: (id) => api.delete(`/bio-pesticide/item${id !== undefined ? '/' + id : ''}`),
};

export const micronutrientAPI = {
  getItems: (id, params) => api.get(`/micronutrient/items${id !== undefined ? '/' + id : ''}`, { params }),
  createItem: (data) => api.post('/micronutrient/item', data),
  updateItem: (data) => api.put('/micronutrient/item', data),
  deleteItem: (id) => api.delete(`/micronutrient/item${id !== undefined ? '/' + id : ''}`),
};

export const organicInputAPI = {
  getItems: (id, params) => api.get(`/organic-input/items${id !== undefined ? '/' + id : ''}`, { params }),
  createItem: (data) => api.post('/organic-input/item', data),
  updateItem: (data) => api.put('/organic-input/item', data),
  deleteItem: (id) => api.delete(`/organic-input/item${id !== undefined ? '/' + id : ''}`),
};

export const inputProcurementAPI = {
  getOrders: (id, params) => api.get(`/input-procurement/orders${id !== undefined ? '/' + id : ''}`, { params }),
  createOrder: (data) => api.post('/input-procurement/order', data),
  updateOrder: (data) => api.put('/input-procurement/order', data),
  deleteOrder: (id) => api.delete(`/input-procurement/order${id !== undefined ? '/' + id : ''}`),
};

export const inputDistributionAPI = {
  getRecords: (id, params) => api.get(`/input-distribution/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/input-distribution/record', data),
  updateRecord: (data) => api.put('/input-distribution/record', data),
  deleteRecord: (id) => api.delete(`/input-distribution/record${id !== undefined ? '/' + id : ''}`),
};

export const inputTraceabilityAPI = {
  getRecords: (id, params) => api.get(`/input-traceability/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/input-traceability/record', data),
  updateRecord: (data) => api.put('/input-traceability/record', data),
  deleteRecord: (id) => api.delete(`/input-traceability/record${id !== undefined ? '/' + id : ''}`),
};

export const irrigationAPI = {
  getSchedules: (id, params) => api.get(`/irrigation/schedules${id !== undefined ? '/' + id : ''}`, { params }),
  getWaterSources: (id, params) => api.get(`/irrigation/water-sources${id !== undefined ? '/' + id : ''}`, { params }),
  updateSchedule: (data) => api.put('/irrigation/schedule', data),
  createSchedule: (data) => api.post('/irrigation/schedule', data),
  deleteSchedule: (id) => api.delete(`/irrigation/schedule${id !== undefined ? '/' + id : ''}`),
};

export const wikipediaAPI = {
  lookup: (id, params) => api.get(`/wikipedia/kup${id !== undefined ? '/' + id : ''}`, { params }),
  getSummaryByTitle: (id, params) => api.get(`/wikipedia/summary-by-title${id !== undefined ? '/' + id : ''}`, { params }),
};

export const foluBenchmarkAPI = {
  listTransitions: (id, params) => api.get(`/folu-benchmark/transitions${id !== undefined ? '/' + id : ''}`, { params }),
  getBenchmarkReport: (id, params) => api.get(`/folu-benchmark/benchmark-report${id !== undefined ? '/' + id : ''}`, { params }),
};

export const labourAPI = {
  getWorkers: (id, params) => api.get(`/labour/workers${id !== undefined ? '/' + id : ''}`, { params }),
  getAttendance: (id, params) => api.get(`/labour/attendance${id !== undefined ? '/' + id : ''}`, { params }),
  getPayments: (id, params) => api.get(`/labour/payments${id !== undefined ? '/' + id : ''}`, { params }),
  createWorker: (data) => api.post('/labour/worker', data),
  recordAttendance: (data) => api.post('/labour/attendance', data),
};

export const landLeaseAPI = {
  getLeases: (id, params) => api.get(`/land-lease/leases${id !== undefined ? '/' + id : ''}`, { params }),
  createLease: (data) => api.post('/land-lease/lease', data),
  updateLease: (data) => api.put('/land-lease/lease', data),
  deleteLease: (id) => api.delete(`/land-lease/lease${id !== undefined ? '/' + id : ''}`),
};

export const gisLandMappingAPI = {
  getMappings: (id, params) => api.get(`/gis-land-mapping/mappings${id !== undefined ? '/' + id : ''}`, { params }),
  createMapping: (data) => api.post('/gis-land-mapping/mapping', data),
  updateMapping: (data) => api.put('/gis-land-mapping/mapping', data),
  deleteMapping: (id) => api.delete(`/gis-land-mapping/mapping${id !== undefined ? '/' + id : ''}`),
};

export const soilMappingAPI = {
  getZones: (id, params) => api.get(`/soil-mapping/zones${id !== undefined ? '/' + id : ''}`, { params }),
  createZone: (data) => api.post('/soil-mapping/zone', data),
  updateZone: (data) => api.put('/soil-mapping/zone', data),
  deleteZone: (id) => api.delete(`/soil-mapping/zone${id !== undefined ? '/' + id : ''}`),
};

export const waterResourceMappingAPI = {
  getResources: (id, params) => api.get(`/water-resource-mapping/resources${id !== undefined ? '/' + id : ''}`, { params }),
  createResource: (data) => api.post('/water-resource-mapping/resource', data),
  updateResource: (data) => api.put('/water-resource-mapping/resource', data),
  deleteResource: (id) => api.delete(`/water-resource-mapping/resource${id !== undefined ? '/' + id : ''}`),
};

export const geoBoundaryAPI = {
  getBoundaries: (id, params) => api.get(`/geo-boundary/boundaries${id !== undefined ? '/' + id : ''}`, { params }),
  createBoundary: (data) => api.post('/geo-boundary/boundary', data),
  updateBoundary: (data) => api.put('/geo-boundary/boundary', data),
  deleteBoundary: (id) => api.delete(`/geo-boundary/boundary${id !== undefined ? '/' + id : ''}`),
};

export const surveyManagementAPI = {
  getSurveys: (id, params) => api.get(`/survey-management/surveys${id !== undefined ? '/' + id : ''}`, { params }),
  createSurvey: (data) => api.post('/survey-management/survey', data),
  updateSurvey: (data) => api.put('/survey-management/survey', data),
  deleteSurvey: (id) => api.delete(`/survey-management/survey${id !== undefined ? '/' + id : ''}`),
};

export const cattleRegistryAPI = {
  getAnimals: (id, params) => api.get(`/cattle-registry/animals${id !== undefined ? '/' + id : ''}`, { params }),
  createAnimal: (data) => api.post('/cattle-registry/animal', data),
  updateAnimal: (data) => api.put('/cattle-registry/animal', data),
  deleteAnimal: (id) => api.delete(`/cattle-registry/animal${id !== undefined ? '/' + id : ''}`),
};

export const poultryManagementAPI = {
  getBatches: (id, params) => api.get(`/poultry-management/batches${id !== undefined ? '/' + id : ''}`, { params }),
  createBatch: (data) => api.post('/poultry-management/batch', data),
  updateBatch: (data) => api.put('/poultry-management/batch', data),
  deleteBatch: (id) => api.delete(`/poultry-management/batch${id !== undefined ? '/' + id : ''}`),
};

export const goatFarmingAPI = {
  getAnimals: (id, params) => api.get(`/goat-farming/animals${id !== undefined ? '/' + id : ''}`, { params }),
  createAnimal: (data) => api.post('/goat-farming/animal', data),
  updateAnimal: (data) => api.put('/goat-farming/animal', data),
  deleteAnimal: (id) => api.delete(`/goat-farming/animal${id !== undefined ? '/' + id : ''}`),
};

export const sheepFarmingAPI = {
  getAnimals: (id, params) => api.get(`/sheep-farming/animals${id !== undefined ? '/' + id : ''}`, { params }),
  createAnimal: (data) => api.post('/sheep-farming/animal', data),
  updateAnimal: (data) => api.put('/sheep-farming/animal', data),
  deleteAnimal: (id) => api.delete(`/sheep-farming/animal${id !== undefined ? '/' + id : ''}`),
};

export const pigFarmingAPI = {
  getAnimals: (id, params) => api.get(`/pig-farming/animals${id !== undefined ? '/' + id : ''}`, { params }),
  createAnimal: (data) => api.post('/pig-farming/animal', data),
  updateAnimal: (data) => api.put('/pig-farming/animal', data),
  deleteAnimal: (id) => api.delete(`/pig-farming/animal${id !== undefined ? '/' + id : ''}`),
};

export const livestockAnalyticsAPI = {
  getRecords: (id, params) => api.get(`/livestock-analytics/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/livestock-analytics/record', data),
  updateRecord: (data) => api.put('/livestock-analytics/record', data),
  deleteRecord: (id) => api.delete(`/livestock-analytics/record${id !== undefined ? '/' + id : ''}`),
};

export const feedManagementAPI = {
  getRecords: (id, params) => api.get(`/feed-management/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/feed-management/record', data),
  updateRecord: (data) => api.put('/feed-management/record', data),
  deleteRecord: (id) => api.delete(`/feed-management/record${id !== undefined ? '/' + id : ''}`),
};

export const logisticsEnhancementAPI = {
  addVehicle: (data) => api.post('/logistics-enhancement/vehicle', data),
  getFleet: (id, params) => api.get(`/logistics-enhancement/fleet${id !== undefined ? '/' + id : ''}`, { params }),
  getVehicle: (id, params) => api.get(`/logistics-enhancement/vehicle${id !== undefined ? '/' + id : ''}`, { params }),
  updateVehicle: (data) => api.put('/logistics-enhancement/vehicle', data),
  scheduleMaintenance: (id, params) => api.get(`/logistics-enhancement/edule-maintenance${id !== undefined ? '/' + id : ''}`, { params }),
  updateTracking: (data) => api.put('/logistics-enhancement/tracking', data),
  getTracking: (id, params) => api.get(`/logistics-enhancement/tracking${id !== undefined ? '/' + id : ''}`, { params }),
  getLiveTracking: (id, params) => api.get(`/logistics-enhancement/live-tracking${id !== undefined ? '/' + id : ''}`, { params }),
  setGeofence: (id, params) => api.get(`/logistics-enhancement/geofence${id !== undefined ? '/' + id : ''}`, { params }),
  recordTemperature: (data) => api.post('/logistics-enhancement/temperature', data),
  getTemperatureData: (id, params) => api.get(`/logistics-enhancement/temperature-data${id !== undefined ? '/' + id : ''}`, { params }),
  getTemperatureAlerts: (id, params) => api.get(`/logistics-enhancement/temperature-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  createWarehouse: (data) => api.post('/logistics-enhancement/warehouse', data),
  getWarehouses: (id, params) => api.get(`/logistics-enhancement/warehouses${id !== undefined ? '/' + id : ''}`, { params }),
  addInventory: (data) => api.post('/logistics-enhancement/inventory', data),
  getWarehouseInventory: (id, params) => api.get(`/logistics-enhancement/warehouse-inventory${id !== undefined ? '/' + id : ''}`, { params }),
  recordDriverLocation: (data) => api.post('/logistics-enhancement/driver-location', data),
  getActiveDrivers: (id, params) => api.get(`/logistics-enhancement/active-drivers${id !== undefined ? '/' + id : ''}`, { params }),
  getShipmentTrail: (id, params) => api.get(`/logistics-enhancement/shipment-trail${id !== undefined ? '/' + id : ''}`, { params }),
};

export const freightPoolingAPI = {
  findPoolableShipments: (id, params) => api.get(`/freight-pooling/d-poolable-shipments${id !== undefined ? '/' + id : ''}`, { params }),
  createPoolWindow: (data) => api.post('/freight-pooling/pool-window', data),
  listOpenWindows: (id, params) => api.get(`/freight-pooling/open-windows${id !== undefined ? '/' + id : ''}`, { params }),
  getPoolWindow: (id, params) => api.get(`/freight-pooling/pool-window${id !== undefined ? '/' + id : ''}`, { params }),
  joinPoolWindow: (id, params) => api.get(`/freight-pooling/n-pool-window${id !== undefined ? '/' + id : ''}`, { params }),
  closeAndDispatch: (id, params) => api.get(`/freight-pooling/se-and-dispatch${id !== undefined ? '/' + id : ''}`, { params }),
};

export const implementManagementAPI = {
  getImplements: (id, params) => api.get(`/implement-management/implements${id !== undefined ? '/' + id : ''}`, { params }),
  createImplement: (data) => api.post('/implement-management/implement', data),
};

export const equipmentInventoryAPI = {
  getEquipment: (id, params) => api.get(`/equipment-inventory/equipment${id !== undefined ? '/' + id : ''}`, { params }),
  createEquipment: (data) => api.post('/equipment-inventory/equipment', data),
};

export const equipmentRentalAPI = {
  getRentals: (id, params) => api.get(`/equipment-rental/rentals${id !== undefined ? '/' + id : ''}`, { params }),
  createRental: (data) => api.post('/equipment-rental/rental', data),
};

export const fleetManagementAPI = {
  getMaintenanceDue: (id, params) => api.get(`/fleet-management/maintenance-due${id !== undefined ? '/' + id : ''}`, { params }),
  getFleet: (id, params) => api.get(`/fleet-management/fleet${id !== undefined ? '/' + id : ''}`, { params }),
  addVehicle: (data) => api.post('/fleet-management/vehicle', data),
  updateVehicle: (data) => api.put('/fleet-management/vehicle', data),
};

export const preventiveMaintenanceAPI = {
  getRecords: (id, params) => api.get(`/preventive-maintenance/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/preventive-maintenance/record', data),
  updateRecord: (data) => api.put('/preventive-maintenance/record', data),
  deleteRecord: (id) => api.delete(`/preventive-maintenance/record${id !== undefined ? '/' + id : ''}`),
};

export const breakdownMaintenanceAPI = {
  getRecords: (id, params) => api.get(`/breakdown-maintenance/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/breakdown-maintenance/record', data),
};

export const fuelManagementAPI = {
  getLogs: (id, params) => api.get(`/fuel-management/logs${id !== undefined ? '/' + id : ''}`, { params }),
  createLog: (data) => api.post('/fuel-management/log', data),
};

export const sparePartsAPI = {
  getParts: (id, params) => api.get(`/spare-parts/parts${id !== undefined ? '/' + id : ''}`, { params }),
  createPart: (data) => api.post('/spare-parts/part', data),
};

export const assetLifecycleAPI = {
  getAssets: (id, params) => api.get(`/asset-lifecycle/assets${id !== undefined ? '/' + id : ''}`, { params }),
  createAsset: (data) => api.post('/asset-lifecycle/asset', data),
};

export const glutWarningAPI = {
  checkGlutRisk: (id, params) => api.get(`/glut-warning/ck-glut-risk${id !== undefined ? '/' + id : ''}`, { params }),
  scanAllCategories: (id, params) => api.get(`/glut-warning/n-all-categories${id !== undefined ? '/' + id : ''}`, { params }),
};

// Fixed 2026-09-20: this auto-generated object pointed at a `/medical-coding/*`
// path with no backing route (would 404). Repointed at the real, now-mounted
// advanced-medical-coding routes (backend/src/routes/advancedMedicalCodingRoutes.js,
// moved there from services/ where DynamicRouteLoader never found it).
// KNOWN GAP, not silently patched: MedicalCodingDashboardPage.jsx expects a
// response shaped like `{ conditions: { diabetes: { <type>: {code, system,
// display} } } }` keyed by 10 hardcoded common-condition ids, and
// `{ restrictions: {...} }` / `{ requirements: {...} }` shapes. The real
// service's knowledge bases are keyed by clinical category (e.g.
// clinical_nutrition), not those 10 condition ids, so these calls resolve
// without crashing but the page's tables render empty until either the
// backend adds a condition-id lookup layer or the page is rewritten against
// the real knowledge-base shape. See .ai/tasks/ACTIVE.md.
export const medicalCodingAPI = {
  getMedicalConditionCodes: () => api.get('/advanced-medical-coding/code-systems'),
  getDietaryRestrictions: (condition) => api.get(`/advanced-medical-coding/dietitian-knowledge/${condition}`),
  getNutrientRequirements: (condition) => api.get(`/advanced-medical-coding/natural-therapist-knowledge/${condition}`),
};

export const nervousSystemAPI = {
  processEventThroughBrain: (data) => api.post('/nervous-system/event-through-brain', data),
  getBrainDecisionHistory: (id, params) => api.get(`/nervous-system/brain-decision-history${id !== undefined ? '/' + id : ''}`, { params }),
  getBrainFocus: (id, params) => api.get(`/nervous-system/brain-focus${id !== undefined ? '/' + id : ''}`, { params }),
  startHeartBeat: (id, params) => api.get(`/nervous-system/rt-heart-beat${id !== undefined ? '/' + id : ''}`, { params }),
  stopHeartBeat: (id, params) => api.get(`/nervous-system/p-heart-beat${id !== undefined ? '/' + id : ''}`, { params }),
  getHeartBeatStatus: (id, params) => api.get(`/nervous-system/heart-beat-status${id !== undefined ? '/' + id : ''}`, { params }),
  createNeuralPathway: (data) => api.post('/nervous-system/neural-pathway', data),
  getNeuralPathways: (id, params) => api.get(`/nervous-system/neural-pathways${id !== undefined ? '/' + id : ''}`, { params }),
  strengthenNeuralPathway: (id, params) => api.get(`/nervous-system/engthen-neural-pathway${id !== undefined ? '/' + id : ''}`, { params }),
  createReflexArc: (data) => api.post('/nervous-system/reflex-arc', data),
  getReflexArcs: (id, params) => api.get(`/nervous-system/reflex-arcs${id !== undefined ? '/' + id : ''}`, { params }),
  triggerReflex: (id, params) => api.get(`/nervous-system/gger-reflex${id !== undefined ? '/' + id : ''}`, { params }),
  registerSensor: (data) => api.post('/nervous-system/sensor', data),
  getSensorData: (id, params) => api.get(`/nervous-system/sensor-data${id !== undefined ? '/' + id : ''}`, { params }),
  getSensorsStatus: (id, params) => api.get(`/nervous-system/sensors-status${id !== undefined ? '/' + id : ''}`, { params }),
  executeMotorFunction: (id, params) => api.get(`/nervous-system/cute-motor-function${id !== undefined ? '/' + id : ''}`, { params }),
  getActiveMotorFunctions: (id, params) => api.get(`/nervous-system/active-motor-functions${id !== undefined ? '/' + id : ''}`, { params }),
  registerEnterpriseRoute: (data) => api.post('/nervous-system/enterprise-route', data),
  routeRequest: (id, params) => api.get(`/nervous-system/te-request${id !== undefined ? '/' + id : ''}`, { params }),
  getOptimalRoute: (id, params) => api.get(`/nervous-system/optimal-route${id !== undefined ? '/' + id : ''}`, { params }),
  deactivateEnterpriseRoute: (id, params) => api.get(`/nervous-system/ctivate-enterprise-route${id !== undefined ? '/' + id : ''}`, { params }),
  getNervousSystemHealth: (id, params) => api.get(`/nervous-system/nervous-system-health${id !== undefined ? '/' + id : ''}`, { params }),
};

export const nurseryAPI = {
  getNurseries: (id, params) => api.get(`/nursery/nurseries${id !== undefined ? '/' + id : ''}`, { params }),
  createNursery: (data) => api.post('/nursery/nursery', data),
  updateNursery: (data) => api.put('/nursery/nursery', data),
  deleteNursery: (id) => api.delete(`/nursery/nursery${id !== undefined ? '/' + id : ''}`),
};

export const nutrientValueSalesAPI = {
  searchByNutrientCriteria: (data) => api.post('/nutrient-value-sales/by-nutrient-criteria', data),
  submitNutrientContent: (data) => api.post('/nutrient-value-sales/nutrient-content', data),
  issueNutrientCertificate: (id, params) => api.get(`/nutrient-value-sales/ue-nutrient-certificate${id !== undefined ? '/' + id : ''}`, { params }),
};

export const operationsAPI = {
  getOverview: (id, params) => api.get(`/operations/overview${id !== undefined ? '/' + id : ''}`, { params }),
};

export const farmActivityAPI = {
  getActivities: (id, params) => api.get(`/farm-activity/activities${id !== undefined ? '/' + id : ''}`, { params }),
  createActivity: (data) => api.post('/farm-activity/activity', data),
  updateActivity: (data) => api.put('/farm-activity/activity', data),
  deleteActivity: (id) => api.delete(`/farm-activity/activity${id !== undefined ? '/' + id : ''}`),
};

export const farmTaskAPI = {
  getTasks: (id, params) => api.get(`/farm-task/tasks${id !== undefined ? '/' + id : ''}`, { params }),
  createTask: (data) => api.post('/farm-task/task', data),
  updateTask: (data) => api.put('/farm-task/task', data),
  deleteTask: (id) => api.delete(`/farm-task/task${id !== undefined ? '/' + id : ''}`),
};

export const contractorManagementAPI = {
  getContractors: (id, params) => api.get(`/contractor-management/contractors${id !== undefined ? '/' + id : ''}`, { params }),
  createContractor: (data) => api.post('/contractor-management/contractor', data),
  updateContractor: (data) => api.put('/contractor-management/contractor', data),
  deleteContractor: (id) => api.delete(`/contractor-management/contractor${id !== undefined ? '/' + id : ''}`),
};

export const machineryOperationsAPI = {
  getOperations: (id, params) => api.get(`/machinery-operations/operations${id !== undefined ? '/' + id : ''}`, { params }),
  createOperation: (data) => api.post('/machinery-operations/operation', data),
  updateOperation: (data) => api.put('/machinery-operations/operation', data),
  deleteOperation: (id) => api.delete(`/machinery-operations/operation${id !== undefined ? '/' + id : ''}`),
};

export const equipmentSchedulingAPI = {
  getSchedules: (id, params) => api.get(`/equipment-scheduling/schedules${id !== undefined ? '/' + id : ''}`, { params }),
  createSchedule: (data) => api.post('/equipment-scheduling/schedule', data),
  updateSchedule: (data) => api.put('/equipment-scheduling/schedule', data),
  deleteSchedule: (id) => api.delete(`/equipment-scheduling/schedule${id !== undefined ? '/' + id : ''}`),
};

export const inputConsumptionAPI = {
  getRecords: (id, params) => api.get(`/input-consumption/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/input-consumption/record', data),
  updateRecord: (data) => api.put('/input-consumption/record', data),
  deleteRecord: (id) => api.delete(`/input-consumption/record${id !== undefined ? '/' + id : ''}`),
};

export const farmProductivityAPI = {
  getMetrics: (id, params) => api.get(`/farm-productivity/metrics${id !== undefined ? '/' + id : ''}`, { params }),
  createMetric: (data) => api.post('/farm-productivity/metric', data),
  updateMetric: (data) => api.put('/farm-productivity/metric', data),
  deleteMetric: (id) => api.delete(`/farm-productivity/metric${id !== undefined ? '/' + id : ''}`),
};

export const farmOperationsDashboardAPI = {
  getKpis: (id, params) => api.get(`/farm-operations-dashboard/kpis${id !== undefined ? '/' + id : ''}`, { params }),
  createKpi: (data) => api.post('/farm-operations-dashboard/kpi', data),
  updateKpi: (data) => api.put('/farm-operations-dashboard/kpi', data),
  deleteKpi: (id) => api.delete(`/farm-operations-dashboard/kpi${id !== undefined ? '/' + id : ''}`),
};

export const orchardAPI = {
  getOrchards: (id, params) => api.get(`/orchard/orchards${id !== undefined ? '/' + id : ''}`, { params }),
  updateOrchard: (data) => api.put('/orchard/orchard', data),
  createOrchard: (data) => api.post('/orchard/orchard', data),
  deleteOrchard: (id) => api.delete(`/orchard/orchard${id !== undefined ? '/' + id : ''}`),
  recordHarvest: (data) => api.post('/orchard/harvest', data),
};

export const organizationManagementAPI = {
  getAllOrganizations: (id, params) => api.get(`/organization-management/all-organizations${id !== undefined ? '/' + id : ''}`, { params }),
  createOrganization: (data) => api.post('/organization-management/organization', data),
  deleteOrganization: (id) => api.delete(`/organization-management/organization${id !== undefined ? '/' + id : ''}`),
};

export const paymentGatewayAPI = {
  getSupportedGateways: (id, params) => api.get(`/payment-gateway/supported-gateways${id !== undefined ? '/' + id : ''}`, { params }),
  processPayment: (data) => api.post('/payment-gateway/payment', data),
  refundPayment: (id, params) => api.get(`/payment-gateway/und-payment${id !== undefined ? '/' + id : ''}`, { params }),
  getPaymentStatus: (id, params) => api.get(`/payment-gateway/payment-status${id !== undefined ? '/' + id : ''}`, { params }),
};

export const pigAPI = {
  listHerd: (id, params) => api.get(`/pig/herd${id !== undefined ? '/' + id : ''}`, { params }),
  listWeightRecords: (id, params) => api.get(`/pig/weight-records${id !== undefined ? '/' + id : ''}`, { params }),
  getHerdPerformance: (id, params) => api.get(`/pig/herd-performance${id !== undefined ? '/' + id : ''}`, { params }),
  getBreedingAlerts: (id, params) => api.get(`/pig/breeding-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  getVaccinationAlerts: (id, params) => api.get(`/pig/vaccination-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  getFeedConversionRatio: (id, params) => api.get(`/pig/feed-conversion-ratio${id !== undefined ? '/' + id : ''}`, { params }),
  updateAnimal: (data) => api.put('/pig/animal', data),
  createAnimal: (data) => api.post('/pig/animal', data),
  deleteAnimal: (id) => api.delete(`/pig/animal${id !== undefined ? '/' + id : ''}`),
  recordWeight: (data) => api.post('/pig/weight', data),
  recordFeedConsumption: (data) => api.post('/pig/feed-consumption', data),
  recordBreeding: (data) => api.post('/pig/breeding', data),
};

export const pigAIAPI = {
  optimizeMeatProduction: (data) => api.post('/pig-ai/meat-production', data),
  monitorPigHealth: (id, params) => api.get(`/pig-ai/itor-pig-health${id !== undefined ? '/' + id : ''}`, { params }),
  optimizePigFeed: (data) => api.post('/pig-ai/pig-feed', data),
  recommendPigBreeding: (data) => api.post('/pig-ai/pig-breeding', data),
};

export const platformConfigurationAPI = {
  getRecommendations: (id, params) => api.get(`/platform-configuration/recommendations${id !== undefined ? '/' + id : ''}`, { params }),
  applyConfiguration: (id, params) => api.get(`/platform-configuration/ly-configuration${id !== undefined ? '/' + id : ''}`, { params }),
};

export const platformTelemetryAPI = {
  getStatus: (id, params) => api.get(`/platform-telemetry/status${id !== undefined ? '/' + id : ''}`, { params }),
  getAnalytics: (id, params) => api.get(`/platform-telemetry/analytics${id !== undefined ? '/' + id : ''}`, { params }),
};

export const pondAPI = {
  getPonds: (id, params) => api.get(`/pond/ponds${id !== undefined ? '/' + id : ''}`, { params }),
  updatePond: (data) => api.put('/pond/pond', data),
  createPond: (data) => api.post('/pond/pond', data),
  deletePond: (id) => api.delete(`/pond/pond${id !== undefined ? '/' + id : ''}`),
};

export const poultryAIAPI = {
  optimizeEggProduction: (data) => api.post('/poultry-ai/egg-production', data),
  monitorFlockHealth: (id, params) => api.get(`/poultry-ai/itor-flock-health${id !== undefined ? '/' + id : ''}`, { params }),
  optimizePoultryFeed: (data) => api.post('/poultry-ai/poultry-feed', data),
  predictMortalityRisk: (id, params) => api.get(`/poultry-ai/dict-mortality-risk${id !== undefined ? '/' + id : ''}`, { params }),
};

export const predictiveAnalyticsAPI = {
  getForecasts: (id, params) => api.get(`/predictive-analytics/forecasts${id !== undefined ? '/' + id : ''}`, { params }),
  getPredictions: (id, params) => api.get(`/predictive-analytics/predictions${id !== undefined ? '/' + id : ''}`, { params }),
  getUnacknowledgedAlerts: (id, params) => api.get(`/predictive-analytics/unacknowledged-alerts${id !== undefined ? '/' + id : ''}`, { params }),
  getDemandForecast: (id, params) => api.get(`/predictive-analytics/demand-forecast${id !== undefined ? '/' + id : ''}`, { params }),
  getPricingPrediction: (id, params) => api.get(`/predictive-analytics/pricing-prediction${id !== undefined ? '/' + id : ''}`, { params }),
};

export const preSeasonAPI = {
  getDashboard: (id, params) => api.get(`/pre-season/dashboard${id !== undefined ? '/' + id : ''}`, { params }),
  createOrder: (data) => api.post('/pre-season/order', data),
};

export const productReviewsAPI = {
  getStats: (id, params) => api.get(`/product-reviews/stats${id !== undefined ? '/' + id : ''}`, { params }),
};

export const projectSystemsAPI = {
  getProjects: (id, params) => api.get(`/project-systems/projects${id !== undefined ? '/' + id : ''}`, { params }),
  getProjectWbs: (id, params) => api.get(`/project-systems/project-wbs${id !== undefined ? '/' + id : ''}`, { params }),
  getWbsCostRollup: (id, params) => api.get(`/project-systems/wbs-cost-rollup${id !== undefined ? '/' + id : ''}`, { params }),
  getProjectMilestones: (id, params) => api.get(`/project-systems/project-milestones${id !== undefined ? '/' + id : ''}`, { params }),
  getMilestoneStatusSummary: (id, params) => api.get(`/project-systems/milestone-status-summary${id !== undefined ? '/' + id : ''}`, { params }),
  getProjectBudgetVsActual: (id, params) => api.get(`/project-systems/project-budget-vs-actual${id !== undefined ? '/' + id : ''}`, { params }),
  createWbsElement: (data) => api.post('/project-systems/wbs-element', data),
  updateWbsStatus: (data) => api.put('/project-systems/wbs-status', data),
  createMilestone: (data) => api.post('/project-systems/milestone', data),
  completeMilestone: (id, params) => api.get(`/project-systems/plete-milestone${id !== undefined ? '/' + id : ''}`, { params }),
  updateProjectStatus: (data) => api.put('/project-systems/project-status', data),
  createProject: (data) => api.post('/project-systems/project', data),
};

export const publicDataAPI = {
  listSources: (id, params) => api.get(`/public-data/sources${id !== undefined ? '/' + id : ''}`, { params }),
  registerSource: (data) => api.post('/public-data/source', data),
  extract: (id, params) => api.get(`/public-data/ract${id !== undefined ? '/' + id : ''}`, { params }),
};

export const buyingClubAPI = {
  getStatistics: (id, params) => api.get(`/buying-club/statistics${id !== undefined ? '/' + id : ''}`, { params }),
};

export const ruralEnterpriseAPI = {
  getStatistics: (id, params) => api.get(`/rural-enterprise/statistics${id !== undefined ? '/' + id : ''}`, { params }),
};

export const renewableEnergyAPI = {
  getStatistics: (id, params) => api.get(`/renewable-energy/statistics${id !== undefined ? '/' + id : ''}`, { params }),
};

export const householdEconomyAPI = {
  getAll: (id, params) => api.get(`/household-economy/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/household-economy/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/household-economy', data),
  update: (data) => api.put('/household-economy', data),
  delete: (id) => api.delete(`/household-economy${id !== undefined ? '/' + id : ''}`),
};

export const sharedInfrastructureAPI = {
  getAll: (id, params) => api.get(`/shared-infrastructure/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/shared-infrastructure/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/shared-infrastructure', data),
  update: (data) => api.put('/shared-infrastructure', data),
  delete: (id) => api.delete(`/shared-infrastructure${id !== undefined ? '/' + id : ''}`),
};

export const machineryAccessAPI = {
  getAll: (id, params) => api.get(`/machinery-access/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/machinery-access/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/machinery-access', data),
  update: (data) => api.put('/machinery-access', data),
  delete: (id) => api.delete(`/machinery-access${id !== undefined ? '/' + id : ''}`),
};

export const ruralFinanceAPI = {
  getAll: (id, params) => api.get(`/rural-finance/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/rural-finance/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/rural-finance', data),
  update: (data) => api.put('/rural-finance', data),
  delete: (id) => api.delete(`/rural-finance${id !== undefined ? '/' + id : ''}`),
};

export const aiAdvisoryAPI = {
  getStatistics: (id, params) => api.get(`/ai-advisory/statistics${id !== undefined ? '/' + id : ''}`, { params }),
};

export const mobilityRidesAPI = {
  getAll: (id, params) => api.get(`/mobility-rides/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/mobility-rides/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/mobility-rides', data),
  update: (data) => api.put('/mobility-rides', data),
  delete: (id) => api.delete(`/mobility-rides${id !== undefined ? '/' + id : ''}`),
};

export const rolePermissionAPI = {
  listRoles: (id, params) => api.get(`/role-permission/roles${id !== undefined ? '/' + id : ''}`, { params }),
  listPermissions: (id, params) => api.get(`/role-permission/permissions${id !== undefined ? '/' + id : ''}`, { params }),
  getPermissionMatrix: (id, params) => api.get(`/role-permission/permission-matrix${id !== undefined ? '/' + id : ''}`, { params }),
  getRoleHierarchy: (id, params) => api.get(`/role-permission/role-hierarchy${id !== undefined ? '/' + id : ''}`, { params }),
  createRole: (data) => api.post('/role-permission/role', data),
  recommendRoleForUser: (data) => api.post('/role-permission/role-for-user', data),
};

export const seedPlanningAPI = {
  getPlans: (id, params) => api.get(`/seed-planning/plans${id !== undefined ? '/' + id : ''}`, { params }),
  createPlan: (data) => api.post('/seed-planning/plan', data),
  updatePlan: (data) => api.put('/seed-planning/plan', data),
  deletePlan: (id) => api.delete(`/seed-planning/plan${id !== undefined ? '/' + id : ''}`),
};

export const sharedInfraAPI = {
  searchAssets: (data) => api.post('/shared-infra/assets', data),
  searchSecondLife: (data) => api.post('/shared-infra/second-life', data),
  getRenewableSupport: (id, params) => api.get(`/shared-infra/renewable-support${id !== undefined ? '/' + id : ''}`, { params }),
  registerAsset: (data) => api.post('/shared-infra/asset', data),
  bookAsset: (id, params) => api.get(`/shared-infra/k-asset${id !== undefined ? '/' + id : ''}`, { params }),
};

export const sheepAIAPI = {
  optimizeWoolProduction: (data) => api.post('/sheep-ai/wool-production', data),
  monitorSheepHealth: (id, params) => api.get(`/sheep-ai/itor-sheep-health${id !== undefined ? '/' + id : ''}`, { params }),
  optimizeSheepFeed: (data) => api.post('/sheep-ai/sheep-feed', data),
  recommendSheepBreeding: (data) => api.post('/sheep-ai/sheep-breeding', data),
};

export const shgAPI = {
  getGroups: (id, params) => api.get(`/shg/groups${id !== undefined ? '/' + id : ''}`, { params }),
  getMembers: (id, params) => api.get(`/shg/members${id !== undefined ? '/' + id : ''}`, { params }),
  getSavings: (id, params) => api.get(`/shg/savings${id !== undefined ? '/' + id : ''}`, { params }),
  createGroup: (data) => api.post('/shg/group', data),
  addMember: (data) => api.post('/shg/member', data),
  recordSaving: (data) => api.post('/shg/saving', data),
};

export const fertilityManagementAPI = {
  getRecords: (id, params) => api.get(`/fertility-management/records${id !== undefined ? '/' + id : ''}`, { params }),
  createRecord: (data) => api.post('/fertility-management/record', data),
  updateRecord: (data) => api.put('/fertility-management/record', data),
  deleteRecord: (id) => api.delete(`/fertility-management/record${id !== undefined ? '/' + id : ''}`),
};

export const soilTestingOpsAPI = {
  submitSample: (data) => api.post('/soil-testing-ops/sample', data),
  trackSample: (data) => api.post('/soil-testing-ops/sample', data),
  getHealthCard: (id, params) => api.get(`/soil-testing-ops/health-card${id !== undefined ? '/' + id : ''}`, { params }),
};

export const sowingAPI = {
  getRecords: (id, params) => api.get(`/sowing/records${id !== undefined ? '/' + id : ''}`, { params }),
  updateRecord: (data) => api.put('/sowing/record', data),
  createRecord: (data) => api.post('/sowing/record', data),
  deleteRecord: (id) => api.delete(`/sowing/record${id !== undefined ? '/' + id : ''}`),
};

export const subsidyOpsAPI = {
  checkProjectSubsidy: (id, params) => api.get(`/subsidy-ops/ck-project-subsidy${id !== undefined ? '/' + id : ''}`, { params }),
  checkEquipmentSubsidy: (id, params) => api.get(`/subsidy-ops/ck-equipment-subsidy${id !== undefined ? '/' + id : ''}`, { params }),
  checkLogisticsSubsidy: (id, params) => api.get(`/subsidy-ops/ck-logistics-subsidy${id !== undefined ? '/' + id : ''}`, { params }),
  getSchemes: (id, params) => api.get(`/subsidy-ops/schemes${id !== undefined ? '/' + id : ''}`, { params }),
  apply: (id, params) => api.get(`/subsidy-ops/ly${id !== undefined ? '/' + id : ''}`, { params }),
  track: (data) => api.post('/subsidy-ops', data),
  calculateGst: (data) => api.post('/subsidy-ops/gst', data),
};

export const userManagementAPI = {
  getSettings: (id, params) => api.get(`/user-management/settings${id !== undefined ? '/' + id : ''}`, { params }),
  getSystemAnalytics: (id, params) => api.get(`/user-management/system-analytics${id !== undefined ? '/' + id : ''}`, { params }),
  detectAnomalies: (id, params) => api.get(`/user-management/ect-anomalies${id !== undefined ? '/' + id : ''}`, { params }),
  getPredictiveMaintenance: (id, params) => api.get(`/user-management/predictive-maintenance${id !== undefined ? '/' + id : ''}`, { params }),
  upsertSetting: (id, params) => api.get(`/user-management/ert-setting${id !== undefined ? '/' + id : ''}`, { params }),
};

export const securityAccessControlAPI = {
  getSecurityEvents: (id, params) => api.get(`/security-access-control/security-events${id !== undefined ? '/' + id : ''}`, { params }),
  getIpLists: (id, params) => api.get(`/security-access-control/ip-lists${id !== undefined ? '/' + id : ''}`, { params }),
  calculateSecurityScore: (data) => api.post('/security-access-control/security-score', data),
};

export const organicTraceabilityAPI = {
  getStandards: (id, params) => api.get(`/organic-traceability/standards${id !== undefined ? '/' + id : ''}`, { params }),
  registerFarm: (data) => api.post('/organic-traceability/farm', data),
  getConsumerTransparency: (id, params) => api.get(`/organic-traceability/consumer-transparency${id !== undefined ? '/' + id : ''}`, { params }),
};

export const varietyDirectoryAPI = {
  requestImage: (id, params) => api.get(`/variety-directory/uest-image${id !== undefined ? '/' + id : ''}`, { params }),
  createListing: (data) => api.post('/variety-directory/listing', data),
  getCategories: (id, params) => api.get(`/variety-directory/categories${id !== undefined ? '/' + id : ''}`, { params }),
  list: (id, params) => api.get(`/variety-directory${id !== undefined ? '/' + id : ''}`, { params }),
};

export const villageAPI = {
  createVillage: (data) => api.post('/village/village', data),
  addVillageResource: (data) => api.post('/village/village-resource', data),
  getVillageAnalytics: (id, params) => api.get(`/village/village-analytics${id !== undefined ? '/' + id : ''}`, { params }),
};

export const waterBudgetingAPI = {
  createBudget: (data) => api.post('/water-budgeting/budget', data),
  trackUsage: (data) => api.post('/water-budgeting/usage', data),
  optimizeAllocation: (data) => api.post('/water-budgeting/allocation', data),
  generateReport: (data) => api.post('/water-budgeting/report', data),
};

export const waterQualityAPI = {
  recordMeasurement: (data) => api.post('/water-quality/measurement', data),
  getComplianceReport: (id, params) => api.get(`/water-quality/compliance-report${id !== undefined ? '/' + id : ''}`, { params }),
  monitorQuality: (id, params) => api.get(`/water-quality/itor-quality${id !== undefined ? '/' + id : ''}`, { params }),
  getTreatmentRecommendations: (id, params) => api.get(`/water-quality/treatment-recommendations${id !== undefined ? '/' + id : ''}`, { params }),
};

export const rainwaterHarvestingAPI = {
  designSystem: (id, params) => api.get(`/rainwater-harvesting/ign-system${id !== undefined ? '/' + id : ''}`, { params }),
  monitorCollection: (id, params) => api.get(`/rainwater-harvesting/itor-collection${id !== undefined ? '/' + id : ''}`, { params }),
  calculateBudget: (data) => api.post('/rainwater-harvesting/budget', data),
  manageStorage: (data) => api.put('/rainwater-harvesting/storage', data),
};

export const watershedManagementAPI = {
  createPlan: (data) => api.post('/watershed-management/plan', data),
  monitorHealth: (id, params) => api.get(`/watershed-management/itor-health${id !== undefined ? '/' + id : ''}`, { params }),
  implementConservation: (id, params) => api.get(`/watershed-management/lement-conservation${id !== undefined ? '/' + id : ''}`, { params }),
  generateReport: (data) => api.post('/watershed-management/report', data),
};

export const waterAnalyticsAPI = {
  generateUsageAnalytics: (data) => api.post('/water-analytics/usage-analytics', data),
  createDashboard: (data) => api.post('/water-analytics/dashboard', data),
  generatePrediction: (data) => api.post('/water-analytics/prediction', data),
  comparePerformance: (id, params) => api.get(`/water-analytics/pare-performance${id !== undefined ? '/' + id : ''}`, { params }),
};

export const waterBudgetRecordsAPI = {
  getAll: (id, params) => api.get(`/water-budget-records/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/water-budget-records/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/water-budget-records', data),
  update: (data) => api.put('/water-budget-records', data),
  delete: (id) => api.delete(`/water-budget-records${id !== undefined ? '/' + id : ''}`),
};

export const waterQualityRecordsAPI = {
  getAll: (id, params) => api.get(`/water-quality-records/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/water-quality-records/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/water-quality-records', data),
  update: (data) => api.put('/water-quality-records', data),
  delete: (id) => api.delete(`/water-quality-records${id !== undefined ? '/' + id : ''}`),
};

export const rainwaterStructuresAPI = {
  getAll: (id, params) => api.get(`/rainwater-structures/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/rainwater-structures/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/rainwater-structures', data),
  update: (data) => api.put('/rainwater-structures', data),
  delete: (id) => api.delete(`/rainwater-structures${id !== undefined ? '/' + id : ''}`),
};

export const watershedRecordsAPI = {
  getAll: (id, params) => api.get(`/watershed-records/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/watershed-records/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/watershed-records', data),
  update: (data) => api.put('/watershed-records', data),
  delete: (id) => api.delete(`/watershed-records${id !== undefined ? '/' + id : ''}`),
};

export const waterAnalyticsRecordsAPI = {
  getAll: (id, params) => api.get(`/water-analytics-records/all${id !== undefined ? '/' + id : ''}`, { params }),
  getById: (id, params) => api.get(`/water-analytics-records/by-id${id !== undefined ? '/' + id : ''}`, { params }),
  create: (data) => api.post('/water-analytics-records', data),
  update: (data) => api.put('/water-analytics-records', data),
  delete: (id) => api.delete(`/water-analytics-records${id !== undefined ? '/' + id : ''}`),
};

export const yieldAPI = {
  lotsNeedingAttention: (id, params) => api.get(`/yield/s-needing-attention${id !== undefined ? '/' + id : ''}`, { params }),
  lotPrice: (id, params) => api.get(`/yield/price${id !== undefined ? '/' + id : ''}`, { params }),
  openNextBucket: (id, params) => api.get(`/yield/n-next-bucket${id !== undefined ? '/' + id : ''}`, { params }),
  bookingCurve: (id, params) => api.get(`/yield/king-curve${id !== undefined ? '/' + id : ''}`, { params }),
};

export const pushNotificationsAPI = {
  subscribe: (id, params) => api.get(`/push-notifications/scribe${id !== undefined ? '/' + id : ''}`, { params }),
  unsubscribe: (id, params) => api.get(`/push-notifications/ubscribe${id !== undefined ? '/' + id : ''}`, { params }),
};

// The 5 API objects below were completely missing (found via the frontend
// component-to-API-client call-resolution audit, 2026-09-20). Generated by
// scanning real call sites for the exact methods each page uses, same
// convention as the rest of this file - unverified against real backend
// routes, same caveat as every other generated block in this file.
export const arVrAPI = {
  getExperiences: (id, params) => api.get(`/ar-vr/experiences${id !== undefined ? '/' + id : ''}`, { params }),
  getInteractionPoints: (id, params) => api.get(`/ar-vr/interaction-points${id !== undefined ? '/' + id : ''}`, { params }),
};

export const consumerHealthAPI = {
  getHealthProfiles: (id, params) => api.get(`/consumer-health/health-profiles${id !== undefined ? '/' + id : ''}`, { params }),
  getHealthMetrics: (id, params) => api.get(`/consumer-health/health-metrics${id !== undefined ? '/' + id : ''}`, { params }),
  getHealthGoals: (id, params) => api.get(`/consumer-health/health-goals${id !== undefined ? '/' + id : ''}`, { params }),
  getDietaryRecommendations: (id, params) => api.get(`/consumer-health/dietary-recommendations${id !== undefined ? '/' + id : ''}`, { params }),
  getBMI: (id, params) => api.get(`/consumer-health/bmi${id !== undefined ? '/' + id : ''}`, { params }),
};

export const foodIntelligenceAPI = {
  getActiveRecalls: (id, params) => api.get(`/food-intelligence/active-recalls${id !== undefined ? '/' + id : ''}`, { params }),
};

export const giIntelligenceAPI = {
  verifyAuthentication: (data) => api.post('/gi-intelligence/authentication', data),
};

export const laboratoryERPAPI = {
  getLaboratories: (id, params) => api.get(`/laboratory-erp/laboratories${id !== undefined ? '/' + id : ''}`, { params }),
  getTestCategories: (id, params) => api.get(`/laboratory-erp/test-categories${id !== undefined ? '/' + id : ''}`, { params }),
  getTestMethods: (id, params) => api.get(`/laboratory-erp/test-methods${id !== undefined ? '/' + id : ''}`, { params }),
  registerSample: (data) => api.post('/laboratory-erp/sample', data),
};
