import axios from 'axios';

/**
 * API Client
 * Axios instance configured for EBDESIGN API
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 2026-09-15: the backend mounts most non-AI routes unversioned (e.g.
// /api/order, /api/product), not under /api/v1 like this file's own
// baseURL - same mismatch already documented and fixed for auth
// (coreApi.js's AUTH_BASE) and multilingual/conversational-ai/voice-ai
// (componentApi.js). Reused here for the product/order/review/media
// endpoints below.
const UNVERSIONED_BASE = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

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
};

export const userAdministrationAPI = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const moduleCrudAPI = {
  getItems: (module) => api.get(`/modules/${module}`),
  createItem: (module, data) => api.post(`/modules/${module}`, data),
  updateItem: (module, id, data) => api.put(`/modules/${module}/${id}`, data),
  deleteItem: (module, id) => api.delete(`/modules/${module}/${id}`),
};

export const multilingualAPI = {
  getTranslations: (lang) => api.get(`/i18n/${lang}`),
  updateTranslations: (lang, data) => api.put(`/i18n/${lang}`, data),
};

export const conversationalAIAPI = {
  sendMessage: (message) => api.post('/ai/conversational/send', { message }),
  getConversationHistory: () => api.get('/ai/conversational/history'),
};

export const voiceAIAPI = {
  transcribeAudio: (audio) => api.post('/ai/voice/transcribe', { audio }),
  generateSpeech: (text) => api.post('/ai/voice/speak', { text }),
};

export const aiAgentAPI = {
  getAgents: () => api.get('/ai/agents'),
  createAgent: (data) => api.post('/ai/agents', data),
  executeAgent: (id, data) => api.post(`/ai/agents/${id}/execute`, data),
};

export const aiBackboneAPI = {
  getBackboneStatus: () => api.get('/ai/backbone/status'),
  configureBackbone: (data) => api.put('/ai/backbone/config', data),
  // 2026-09-17: real, mounted at /api/v1/aibackbone (routes/
  // aiBackboneRoutes_merged.js -> services/legacy/aiBackboneService.js's
  // getAIProviderStatus(), now mounted in index.js). PlatformManagementPage.jsx
  // calls this exact method.
  getAIProviderStatus: () => api.get(`${UNVERSIONED_BASE}/api/v1/aibackbone/status`),
};

export const aiBrainAPI = {
  getBrainState: () => api.get('/ai/brain/state'),
  trainBrain: (data) => api.post('/ai/brain/train', data),
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
  // 2026-09-17: real, mounted at /api/platformcore/health (routes/
  // platformCoreRoutes_merged.js -> services/dual-use/platformCoreService.js's
  // getPlatformHealth(), a genuine DB-connectivity check). PlatformFoundationPage.jsx
  // calls this via Promise.allSettled - previously a synchronous TypeError
  // thrown while building that array aborted all 5 of its independent data
  // sources, not just this one.
  getHealth: () => api.get(`${UNVERSIONED_BASE}/api/platformcore/health`),
};

export const agriculturalIntelligenceAPI = {
  getIntelligenceData: () => api.get('/agricultural-intelligence'),
  analyzeCropData: (data) => api.post('/agricultural-intelligence/analyze', data),
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
};

export const aiOperationIntelligenceAPI = {
  getOperationIntelligence: () => api.get('/ai/operation-intelligence'),
  analyzeOperations: (data) => api.post('/ai/operation-intelligence/analyze', data),
};

// 2026-09-15: analyzeProductMedia/generateProductMedia were never called
// anywhere in the frontend, and pointed at /ai/product-media/... which
// doesn't exist on the backend under any mount. ProductDetailPage.jsx
// actually calls productMediaAIAPI.generateImage(id, prompt) - added to
// match the real, already-implemented routes/productMediaAIRoutes.js
// (routes/controllers, not a scaffold) mounted at /api/productmediaai.
const PRODUCT_MEDIA_AI_BASE = `${UNVERSIONED_BASE}/api/productmediaai`;

export const productMediaAIAPI = {
  getStatus: () => api.get(`${PRODUCT_MEDIA_AI_BASE}/status`),
  generateImage: (productId, prompt) =>
    api.post(`${PRODUCT_MEDIA_AI_BASE}/products/${productId}/image`, { prompt }),
  buildVideoScript: (productId) =>
    api.post(`${PRODUCT_MEDIA_AI_BASE}/products/${productId}/video-script`),
  generateVideo: (productId) =>
    api.post(`${PRODUCT_MEDIA_AI_BASE}/products/${productId}/video`),
  // 2026-09-17: AIProductStudioPage.jsx calls getProviderStatus(), not
  // getStatus() above - same real GET /status endpoint, just a different
  // method name on the same object. Added as an alias rather than
  // renaming getStatus (other callers may already use it).
  getProviderStatus: () => api.get(`${PRODUCT_MEDIA_AI_BASE}/status`),
};

// 2026-09-15: productsAPI and productReviewsAPI didn't exist in this file
// at all - the literal MISSING_EXPORT build errors for SellerProductFormPage.jsx/
// ProductDetailPage.jsx/ComparePage.jsx and others (509 -> 161 remaining
// vite build errors tracked in the TODO backlog). Added against the
// real, now-mounted services/legacy/productService.js router
// (/api/product) and routes/productReviewRoutes.js (/api/productreview,
// already real - not a scaffold, predates this session).
const PRODUCT_BASE = `${UNVERSIONED_BASE}/api/product`;
const PRODUCT_REVIEW_BASE = `${UNVERSIONED_BASE}/api/productreview`;

export const productsAPI = {
  getProducts: (filters, pagination) => api.get(PRODUCT_BASE, { params: { ...filters, ...pagination } }),
  getProduct: (id) => api.get(`${PRODUCT_BASE}/${id}`),
  createProduct: (data) => api.post(PRODUCT_BASE, data),
  updateProduct: (id, data) => api.put(`${PRODUCT_BASE}/${id}`, data),
  deleteProduct: (id) => api.delete(`${PRODUCT_BASE}/${id}`),
  getCategories: () => api.get(`${PRODUCT_BASE}/categories/list`),
  getStates: () => api.get(`${PRODUCT_BASE}/states/list`),
  searchProducts: (query) => api.get(`${PRODUCT_BASE}/search`, { params: { q: query } }),
};

export const productReviewsAPI = {
  getReviews: (productId, params) => api.get(`${PRODUCT_REVIEW_BASE}/products/${productId}`, { params }),
  getStats: (productId) => api.get(`${PRODUCT_REVIEW_BASE}/products/${productId}/stats`),
  createReview: (productId, data) => api.post(`${PRODUCT_REVIEW_BASE}/products/${productId}`, data),
};

// 2026-09-15: didn't exist at all - the MISSING_EXPORT build error for
// ModuleRuntimePage.jsx (which was itself made lazy in the eleventh
// backlog update, since this crash used to take the whole app down with
// it). Its one call, getModules(), reads response.data.modules - matches
// services/legacy/moduleCatalogService.js's real GET / handler
// ({success, modules, generatedAt}) exactly, mounted at
// /api/modulecatalog in the thirteenth update.
const MODULE_CATALOG_BASE = `${UNVERSIONED_BASE}/api/modulecatalog`;

export const modulesAPI = {
  getModules: () => api.get(MODULE_CATALOG_BASE),
  getModule: (id) => api.get(`${MODULE_CATALOG_BASE}/${id}`),
  getOverview: () => api.get(`${MODULE_CATALOG_BASE}/overview`),
  // 2026-09-17: real, mounted at /api/modulecatalog/assistant (services/
  // legacy/moduleCatalogService.js's buildAssistantResponse() - a real,
  // deterministic keyword match against the actual module catalog, not a
  // live LLM call but not fabricated either). ModuleHubPage.jsx calls this.
  askAssistant: (prompt) => api.post(`${MODULE_CATALOG_BASE}/assistant`, { prompt }),
};

// 2026-09-15: didn't exist at all - the highest-frequency remaining
// MISSING_EXPORT (12+ importing pages). routes/farmerRoutes_merged.js
// was a real, complete, already-debugged implementation (its own "FIXED
// 2026-08-15" comments) sitting unmounted next to the usual 38-line
// scaffold - swapped in at /api/farmer in index.js.
//
// IMPORTANT: the 12 pages that import `farmersAPI` call ~28 distinct
// methods between them, and only the 6 below actually match this real
// farmer-directory/FDI/certification/FPO backend - the rest
// (getFields/getHarvestScore/getMarketPrices/getBenchmarks/
// getDemandForecast/savePricingModel and ~16 more) belong to entirely
// different domains (field management, harvest scoring, market pricing)
// that were never investigated here and have no confirmed backend yet.
// Adding only the verified 6 fixes the build (the export now exists) and
// makes calculateFDI/getFarmer/etc. actually work; pages calling the
// other, unverified methods will still fail at runtime until those are
// each checked the same way - not fabricated here.
const FARMER_BASE = `${UNVERSIONED_BASE}/api/farmer`;

export const farmersAPI = {
  getFarmer: (id) => api.get(`${FARMER_BASE}/${id}`),
  getFarmers: (filters, pagination) => api.get(FARMER_BASE, { params: { ...filters, ...pagination } }),
  calculateFDI: (id) => api.post(`${FARMER_BASE}/${id}/fdi`),
  addCertification: (id, data) => api.post(`${FARMER_BASE}/${id}/certifications`, data),
  getCertifications: (id) => api.get(`${FARMER_BASE}/${id}/certifications`),
  getFPOs: (filters) => api.get(`${FARMER_BASE}/fpos/list`, { params: filters }),
};

export const nutritionAPI = {
  getNutritionData: () => api.get('/nutrition'),
  analyzeNutrition: (data) => api.post('/nutrition/analyze', data),
  // 2026-09-17: real, mounted at /api/nutritionintelligence (routes/
  // nutritionIntelligenceRoutes.js -> services/legacy/
  // nutritionIntelligenceService.js). getWellnessPractices/getDietaryProfiles/
  // generateRecipe are all real, DB-backed endpoints (wellness_natural_practices,
  // dietary_profiles tables) - AIProductStudioPage.jsx and DietRecipesPage.jsx
  // call these exact names.
  getWellnessPractices: (params) => api.get(`${UNVERSIONED_BASE}/api/nutritionintelligence/wellness-practices`, { params }),
  getDietaryProfiles: () => api.get(`${UNVERSIONED_BASE}/api/nutritionintelligence/dietary-profiles`),
  generateRecipe: (dietaryProfileId, targetCalories) => api.post(`${UNVERSIONED_BASE}/api/nutritionintelligence/recipes`, {
    dietary_profile_id: dietaryProfileId,
    target_calories: targetCalories,
  }),
};

// 2026-09-15: pigAPI/goatAPI/pigAIAPI/goatAIAPI/sheepAIAPI/poultryAIAPI
// didn't exist - these are the frontend clients for the real
// pig/sheep/poultry/goat backends mounted or fixed this same session
// (pigRoutes_merged.js, sheepRoutes_merged.js, poultryRoutes_merged.js
// all had a "protect...Router is not a function" load-time bug fixed
// earlier today; goatRoutes.js was already live). Endpoint shapes
// verified directly against each route file rather than guessed -
// goat has an extra milk-production sub-resource pig/sheep/poultry
// don't (real domain difference, not an oversight).
//
// IMPORTANT, found while wiring this: the real backend's weight/feed/
// breeding "record" endpoints and its performance/fcr "read" endpoints
// all take the animal id as a URL path segment
// (`/herd/:animalId/weight-records`, `/herd/:animalId/performance`,
// etc). PigFarmingPage.jsx's mutations already pass a single payload
// object containing `animal_id` (weightForm/feedForm) or `sow_id`
// (breedingForm) - handled below by pulling the id out of that payload
// rather than requiring a second argument no call site provides. But
// its performance/weight-records/fcr *queries* call with zero
// arguments at all (`pigAPI.getHerdPerformance()`, no id) - there is no
// fleet-wide equivalent of those three on the real backend, only
// per-animal ones, so those three calls will 404 (or hit
// `/herd/undefined/...`) until the page itself is fixed to pass a
// selected animal id. Not fixed here - that's a page-logic bug, not a
// missing export - documented rather than silently worked around.
// breeding-alerts and vaccination-alerts, by contrast, really are
// fleet-wide on the real backend and are correctly called with zero
// arguments.
const PIG_BASE = `${UNVERSIONED_BASE}/api/pig`;
const SHEEP_BASE = `${UNVERSIONED_BASE}/api/sheep`;
const POULTRY_BASE = `${UNVERSIONED_BASE}/api/poultry`;
const GOAT_BASE = `${UNVERSIONED_BASE}/api/goat`;

export const pigAPI = {
  listHerd: (params) => api.get(`${PIG_BASE}/herd`, { params }),
  createAnimal: (data) => api.post(`${PIG_BASE}/herd`, data),
  updateAnimal: (id, data) => api.put(`${PIG_BASE}/herd/${id}`, data),
  deleteAnimal: (id) => api.delete(`${PIG_BASE}/herd/${id}`),
  // animalId is optional here only because PigFarmingPage.jsx's query
  // calls it with none - see the file-level comment above.
  listWeightRecords: (animalId, params) => api.get(`${PIG_BASE}/herd/${animalId}/weight-records`, { params }),
  recordWeight: (payload) => api.post(`${PIG_BASE}/herd/${payload.animal_id}/weight-records`, payload),
  recordFeedConsumption: (payload) => api.post(`${PIG_BASE}/herd/${payload.animal_id}/feed-consumption`, payload),
  recordBreeding: (payload) => api.post(`${PIG_BASE}/herd/${payload.sow_id}/breeding`, payload),
  getHerdPerformance: (animalId) => api.get(`${PIG_BASE}/herd/${animalId}/performance`),
  getFeedConversionRatio: (animalId) => api.get(`${PIG_BASE}/herd/${animalId}/fcr`),
  getBreedingAlerts: () => api.get(`${PIG_BASE}/breeding-alerts`),
  getVaccinationAlerts: () => api.get(`${PIG_BASE}/vaccination-alerts`),
};

export const pigAIAPI = {
  optimizeMeatProduction: (animalId) => api.post(`${PIG_BASE}/ai/optimize-meat/${animalId}`),
  monitorPigHealth: (animalId) => api.post(`${PIG_BASE}/ai/monitor-health/${animalId}`),
  optimizePigFeed: (animalId, productionGoal) => api.post(`${PIG_BASE}/ai/optimize-feed/${animalId}`, { productionGoal }),
  recommendPigBreeding: (animalId) => api.post(`${PIG_BASE}/ai/recommend-breeding/${animalId}`),
};

export const sheepAIAPI = {
  optimizeWoolProduction: (animalId) => api.post(`${SHEEP_BASE}/ai/optimize-wool/${animalId}`),
  monitorSheepHealth: (animalId) => api.post(`${SHEEP_BASE}/ai/monitor-health/${animalId}`),
  optimizeSheepFeed: (animalId, productionGoal) => api.post(`${SHEEP_BASE}/ai/optimize-feed/${animalId}`, { productionGoal }),
  recommendSheepBreeding: (animalId) => api.post(`${SHEEP_BASE}/ai/recommend-breeding/${animalId}`),
};

export const poultryAIAPI = {
  optimizeEggProduction: (flockId) => api.post(`${POULTRY_BASE}/ai/optimize-production/${flockId}`),
  monitorFlockHealth: (flockId) => api.post(`${POULTRY_BASE}/ai/monitor-health/${flockId}`),
  optimizePoultryFeed: (flockId, productionGoal) => api.post(`${POULTRY_BASE}/ai/optimize-feed/${flockId}`, { productionGoal }),
  predictMortalityRisk: (flockId) => api.post(`${POULTRY_BASE}/ai/predict-mortality/${flockId}`),
};

// Same shape as pigAPI above, verified against goatRoutes.js directly:
// GoatFarmingPage.jsx's record mutations pass a single payload
// (milkForm/feedForm use `animal_id`, breedingForm uses `female_id`,
// matching the real /herd/:animalId/milk-production and
// /herd/:femaleId/breeding path params respectively), but its
// performance query calls getHerdPerformance() with no id - same
// page-logic gap as pig, not fixed here.
export const goatAPI = {
  listHerd: (params) => api.get(`${GOAT_BASE}/herd`, { params }),
  createAnimal: (data) => api.post(`${GOAT_BASE}/herd`, data),
  updateAnimal: (id, data) => api.put(`${GOAT_BASE}/herd/${id}`, data),
  deleteAnimal: (id) => api.delete(`${GOAT_BASE}/herd/${id}`),
  listMilkProduction: (animalId, params) => api.get(`${GOAT_BASE}/herd/${animalId}/milk-production`, { params }),
  recordMilkProduction: (payload) => api.post(`${GOAT_BASE}/herd/${payload.animal_id}/milk-production`, payload),
  recordFeedConsumption: (payload) => api.post(`${GOAT_BASE}/herd/${payload.animal_id}/feed-consumption`, payload),
  recordBreeding: (payload) => api.post(`${GOAT_BASE}/herd/${payload.female_id}/breeding`, payload),
  getHerdPerformance: (animalId) => api.get(`${GOAT_BASE}/herd/${animalId}/performance`),
  getBreedingAlerts: () => api.get(`${GOAT_BASE}/breeding-alerts`),
  getVaccinationAlerts: () => api.get(`${GOAT_BASE}/vaccination-alerts`),
};

export const goatAIAPI = {
  optimizeGoatMilkProduction: (animalId) => api.post(`${GOAT_BASE}/ai/optimize-milk/${animalId}`),
  monitorGoatHealth: (animalId) => api.post(`${GOAT_BASE}/ai/monitor-health/${animalId}`),
  optimizeGoatFeed: (animalId, productionGoal) => api.post(`${GOAT_BASE}/ai/optimize-feed/${animalId}`, { productionGoal }),
  recommendGoatBreeding: (animalId) => api.post(`${GOAT_BASE}/ai/recommend-breeding/${animalId}`),
};

// 2026-09-15: didn't exist - nervousSystemRoutes_merged.js (mounted at
// /api/nervoussystem earlier this session) exposes all 22 of these
// brain/heart/neural/reflex/sensor/motor/route endpoints directly via
// nervousSystemController, one method each, matched 1:1 here rather
// than guessed - every call site checked directly for its actual
// argument shape (most pass a single payload/params object already
// built by the calling page; strengthenNeuralPathway, getSensorData and
// deactivateEnterpriseRoute take a single id string, matching their
// :pathwayId/:sensorId/:routeId path params).
const NERVOUS_SYSTEM_BASE = `${UNVERSIONED_BASE}/api/nervoussystem`;

export const nervousSystemAPI = {
  processEventThroughBrain: (payload) => api.post(`${NERVOUS_SYSTEM_BASE}/brain/process-event`, payload),
  getBrainDecisionHistory: (params) => api.get(`${NERVOUS_SYSTEM_BASE}/brain/decision-history`, { params }),
  getBrainFocus: () => api.get(`${NERVOUS_SYSTEM_BASE}/brain/focus`),
  startHeartBeat: () => api.post(`${NERVOUS_SYSTEM_BASE}/heart/start`),
  stopHeartBeat: () => api.post(`${NERVOUS_SYSTEM_BASE}/heart/stop`),
  getHeartBeatStatus: () => api.get(`${NERVOUS_SYSTEM_BASE}/heart/status`),
  createNeuralPathway: (payload) => api.post(`${NERVOUS_SYSTEM_BASE}/neural/create-pathway`, payload),
  getNeuralPathways: () => api.get(`${NERVOUS_SYSTEM_BASE}/neural/pathways`),
  strengthenNeuralPathway: (pathwayId) => api.post(`${NERVOUS_SYSTEM_BASE}/neural/strengthen/${pathwayId}`),
  createReflexArc: (payload) => api.post(`${NERVOUS_SYSTEM_BASE}/reflex/create-arc`, payload),
  getReflexArcs: () => api.get(`${NERVOUS_SYSTEM_BASE}/reflex/arcs`),
  triggerReflex: (payload) => api.post(`${NERVOUS_SYSTEM_BASE}/reflex/trigger`, payload),
  registerSensor: (payload) => api.post(`${NERVOUS_SYSTEM_BASE}/sensor/register`, payload),
  getSensorData: (sensorId) => api.get(`${NERVOUS_SYSTEM_BASE}/sensor/data/${sensorId}`),
  getSensorsStatus: () => api.get(`${NERVOUS_SYSTEM_BASE}/sensor/status`),
  executeMotorFunction: (payload) => api.post(`${NERVOUS_SYSTEM_BASE}/motor/execute`, payload),
  getActiveMotorFunctions: () => api.get(`${NERVOUS_SYSTEM_BASE}/motor/active`),
  registerEnterpriseRoute: (payload) => api.post(`${NERVOUS_SYSTEM_BASE}/route/register`, payload),
  routeRequest: (payload) => api.post(`${NERVOUS_SYSTEM_BASE}/route/request`, payload),
  getOptimalRoute: () => api.get(`${NERVOUS_SYSTEM_BASE}/route/optimal`),
  deactivateEnterpriseRoute: (routeId) => api.post(`${NERVOUS_SYSTEM_BASE}/route/deactivate/${routeId}`),
  getNervousSystemHealth: () => api.get(`${NERVOUS_SYSTEM_BASE}/health`),
};

// 2026-09-15: didn't exist - organicTraceabilityService.js (mounted at
// /api/organictraceability earlier this session) exposes real
// POST /farms, GET /standards and GET /consumer-transparency/qr/:qrCode
// endpoints matching all 3 call sites checked directly.
const ORGANIC_TRACEABILITY_BASE = `${UNVERSIONED_BASE}/api/organictraceability`;

export const organicTraceabilityAPI = {
  registerFarm: (data) => api.post(`${ORGANIC_TRACEABILITY_BASE}/farms`, data),
  getStandards: () => api.get(`${ORGANIC_TRACEABILITY_BASE}/standards`),
  getConsumerTransparency: (qrCode) => api.get(`${ORGANIC_TRACEABILITY_BASE}/consumer-transparency/qr/${qrCode}`),
};

// 2026-09-15: didn't exist - nutrientValueSalesRoutes_merged.js (mounted
// at /api/nutrientvaluesales earlier this session) via
// nutrientValueSalesController. Body shapes for submitNutrientContent
// (`{productId, contentData, verificationData}`) and
// issueNutrientCertificate (`{productId, certificationData}`) confirmed
// directly against the controller's own req.body destructuring, not
// guessed from the route alone.
const NUTRIENT_VALUE_SALES_BASE = `${UNVERSIONED_BASE}/api/nutrientvaluesales`;

export const nutrientValueSalesAPI = {
  submitNutrientContent: (productId, contentData, verificationData) =>
    api.post(`${NUTRIENT_VALUE_SALES_BASE}/submit-verification`, { productId, contentData, verificationData }),
  issueNutrientCertificate: (productId, certificationData) =>
    api.post(`${NUTRIENT_VALUE_SALES_BASE}/issue-certificate`, { productId, certificationData }),
  searchByNutrientCriteria: (params) => api.get(`${NUTRIENT_VALUE_SALES_BASE}/search`, { params }),
};

// 2026-09-15: didn't exist - projectSystemsRoutes_merged.js (mounted at
// /api/projectsystems earlier this session). Every method's body/params
// shape confirmed against the route file's own req.body/req.query
// destructuring rather than guessed (updateProjectStatus/updateWbsStatus
// only send `{status}` even though the backend also accepts
// actualStartDate/actualEndDate - no call site here provides those;
// completeMilestone sends `{actualCompletionDate}`).
const PROJECT_SYSTEMS_BASE = `${UNVERSIONED_BASE}/api/projectsystems`;

export const projectSystemsAPI = {
  createProject: (data) => api.post(PROJECT_SYSTEMS_BASE, data),
  getProjects: (companyId, filters) => api.get(PROJECT_SYSTEMS_BASE, { params: { companyId, ...filters } }),
  updateProjectStatus: (projectId, status) => api.post(`${PROJECT_SYSTEMS_BASE}/${projectId}/status`, { status }),
  createWbsElement: (projectId, data) => api.post(`${PROJECT_SYSTEMS_BASE}/${projectId}/wbs`, data),
  getProjectWbs: (projectId) => api.get(`${PROJECT_SYSTEMS_BASE}/${projectId}/wbs`),
  getWbsCostRollup: (projectId) => api.get(`${PROJECT_SYSTEMS_BASE}/${projectId}/wbs/rollup`),
  updateWbsStatus: (wbsId, status) => api.post(`${PROJECT_SYSTEMS_BASE}/wbs/${wbsId}/status`, { status }),
  createMilestone: (projectId, data) => api.post(`${PROJECT_SYSTEMS_BASE}/${projectId}/milestones`, data),
  getProjectMilestones: (projectId, params) => api.get(`${PROJECT_SYSTEMS_BASE}/${projectId}/milestones`, { params }),
  getMilestoneStatusSummary: (projectId, asOfDate) =>
    api.get(`${PROJECT_SYSTEMS_BASE}/${projectId}/milestones/summary`, { params: { asOfDate } }),
  completeMilestone: (milestoneId, actualCompletionDate) =>
    api.post(`${PROJECT_SYSTEMS_BASE}/milestones/${milestoneId}/complete`, { actualCompletionDate }),
  getProjectBudgetVsActual: (projectId) => api.get(`${PROJECT_SYSTEMS_BASE}/${projectId}/budget-vs-actual`),
};

// 2026-09-15: didn't exist - glutWarningRoutes_merged.js/
// foluBenchmarkRoutes_merged.js/wikipediaRoutes_merged.js/
// foluRoutes_merged.js were all 38-line 'Route operational' scaffolds
// swapped for their real implementations in index.js this same session;
// logistics/freightPoolingRoutes_merged.js's flat sibling
// (routes/freightPoolingRoutes.js) was already the real implementation
// and already mounted. Every method/param name confirmed directly
// against each route file's own req.query/req.params/req.body
// destructuring.
const GLUT_WARNING_BASE = `${UNVERSIONED_BASE}/api/glutwarning`;
const FOLU_BENCHMARK_BASE = `${UNVERSIONED_BASE}/api/folubenchmark`;
const WIKIPEDIA_BASE = `${UNVERSIONED_BASE}/api/wikipedia`;
const FOLU_BASE = `${UNVERSIONED_BASE}/api/folu`;
const FREIGHT_POOLING_BASE = `${UNVERSIONED_BASE}/api/freightpooling`;

export const glutWarningAPI = {
  checkGlutRisk: (categoryId, stateId) => api.get(`${GLUT_WARNING_BASE}/check`, { params: { categoryId, stateId } }),
  scanAllCategories: (stateId) => api.get(`${GLUT_WARNING_BASE}/scan`, { params: { stateId } }),
};

export const foluBenchmarkAPI = {
  listTransitions: () => api.get(`${FOLU_BENCHMARK_BASE}/transitions`),
  getBenchmarkReport: () => api.get(`${FOLU_BENCHMARK_BASE}/report`),
};

export const wikipediaAPI = {
  lookup: (q) => api.get(`${WIKIPEDIA_BASE}/lookup`, { params: { q } }),
  getSummaryByTitle: (title) => api.get(`${WIKIPEDIA_BASE}/summary/${encodeURIComponent(title)}`),
};

export const foluAPI = {
  landUseSummary: (params) => api.get(`${FOLU_BASE}/land-use/summary`, { params }),
  schemeStatus: (farmerId) => api.get(`${FOLU_BASE}/schemes/${farmerId}`),
};

export const freightPoolingAPI = {
  findPoolableShipments: (originAddress, destinationAddress) =>
    api.get(`${FREIGHT_POOLING_BASE}/poolable-shipments`, { params: { originAddress, destinationAddress } }),
  createPoolWindow: (data) => api.post(`${FREIGHT_POOLING_BASE}/windows`, data),
  listOpenWindows: () => api.get(`${FREIGHT_POOLING_BASE}/windows`),
  getPoolWindow: (windowId) => api.get(`${FREIGHT_POOLING_BASE}/windows/${windowId}`),
  joinPoolWindow: (windowId, shipmentId) => api.post(`${FREIGHT_POOLING_BASE}/windows/${windowId}/join`, { shipmentId }),
  closeAndDispatch: (windowId) => api.post(`${FREIGHT_POOLING_BASE}/windows/${windowId}/dispatch`),
};

// 2026-09-15: didn't exist. routes/labourRoutes.js was never mounted
// anywhere AND had the same silent route-registration bug found 3 times
// already this session (a lone CR where handle()'s closing brace should
// have been, stranding every route inside it - see that file's own
// header comment) - fixed and mounted for the first time at
// /api/labour.
const LABOUR_BASE = `${UNVERSIONED_BASE}/api/labour`;

export const labourAPI = {
  getWorkers: () => api.get(`${LABOUR_BASE}/workers`),
  createWorker: (data) => api.post(`${LABOUR_BASE}/workers`, data),
  getAttendance: () => api.get(`${LABOUR_BASE}/attendance`),
  recordAttendance: (data) => api.post(`${LABOUR_BASE}/attendance`, data),
  getPayments: () => api.get(`${LABOUR_BASE}/payments`),
};

// 2026-09-15: didn't exist. services/legacy/marketIntelligenceService.js
// was never mounted anywhere - unlike most services/legacy/*.js files it
// doesn't export a plain router, it exports a setupRoutes(app) function
// that mounts itself directly at /api/v1/market-intelligence (called
// from index.js this same session). Since that's already under the
// versioned prefix the `api` instance's baseURL provides, these use a
// relative path rather than the UNVERSIONED_BASE pattern every other
// export on this page uses.
export const marketIntelligenceAPI = {
  getLatestIntelligence: (villageId) => api.get(`/market-intelligence/intelligence/village/${villageId}/latest`),
  createIntelligence: (data) => api.post('/market-intelligence/intelligence', data),
};

// 2026-09-15: didn't exist - services/legacy/predictiveAnalyticsService.js
// is already mounted at /api/predictiveanalytics (swapped in from a
// scaffold earlier this session). Of the 5 methods the 2 importing pages
// call, only 3 match this backend's real, generic entity/forecast_type
// model (getForecasts, getPredictions, getUnacknowledgedAlerts) -
// getDemandForecast(cropType, {region, forecastDays}) and
// getPricingPrediction(cropType, {region}) assume a crop-and-region-
// specific forecast endpoint that doesn't exist here (the real
// GET /forecasts only filters by entity_id/entity_type/forecast_type,
// nothing crop- or region-shaped) - not fabricated, left undefined same
// as farmersAPI's unverified methods in the twenty-fourth update.
const PREDICTIVE_ANALYTICS_BASE = `${UNVERSIONED_BASE}/api/predictiveanalytics`;

export const predictiveAnalyticsAPI = {
  getForecasts: (params) => api.get(`${PREDICTIVE_ANALYTICS_BASE}/forecasts`, { params }),
  getPredictions: (entityId, entityType, predictionType) =>
    api.get(`${PREDICTIVE_ANALYTICS_BASE}/predictions/${entityId}/${entityType}`, { params: { prediction_type: predictionType } }),
  getUnacknowledgedAlerts: () => api.get(`${PREDICTIVE_ANALYTICS_BASE}/prediction-alerts/unacknowledged`),
};

// 2026-09-15: didn't exist - services/legacy/blockchainTraceabilityService.js
// is already mounted at /api/blockchaintraceability (mounted earlier this
// session as one of the 40 real-but-unmounted services). Both methods
// confirmed directly against the route file's req.params/req.query
// destructuring.
const BLOCKCHAIN_TRACEABILITY_BASE = `${UNVERSIONED_BASE}/api/blockchaintraceability`;

export const blockchainTraceabilityAPI = {
  getTraceabilityEvents: (productId, batchNumber) =>
    api.get(`${BLOCKCHAIN_TRACEABILITY_BASE}/traceability-events/${productId}`, { params: { batch_number: batchNumber } }),
  verifyChainOfCustody: (productId, batchNumber) =>
    api.get(`${BLOCKCHAIN_TRACEABILITY_BASE}/chain-of-custody/verify/${productId}`, { params: { batch_number: batchNumber } }),
};

// 2026-09-15: didn't exist - services/routes/paymentGatewayRoutes.js is
// already mounted at /api/paymentgateway. All 4 methods matched 1:1
// against paymentGatewayController.js directly.
const PAYMENT_GATEWAY_BASE = `${UNVERSIONED_BASE}/api/paymentgateway`;

export const paymentGatewayAPI = {
  processPayment: (data) => api.post(`${PAYMENT_GATEWAY_BASE}/process`, data),
  getPaymentStatus: (paymentId) => api.get(`${PAYMENT_GATEWAY_BASE}/status/${paymentId}`),
  refundPayment: (paymentId, data) => api.post(`${PAYMENT_GATEWAY_BASE}/refund/${paymentId}`, data),
  getSupportedGateways: () => api.get(`${PAYMENT_GATEWAY_BASE}/gateways`),
};

// 2026-09-15: didn't exist - services/legacy/formService.js is already
// mounted at /api/form (one of the 40 real-but-unmounted services from
// earlier this session). All 4 methods matched 1:1 against the route
// file's own req.params destructuring.
const FORM_BASE = `${UNVERSIONED_BASE}/api/form`;

export const formsAPI = {
  createForm: (data) => api.post(FORM_BASE, data),
  getForms: () => api.get(FORM_BASE),
  updateForm: (id, data) => api.put(`${FORM_BASE}/${id}`, data),
  submitForm: (id, data) => api.post(`${FORM_BASE}/${id}/submit`, data),
};

// 2026-09-15: didn't exist - farmerTrainingRoutes_merged.js was a
// 38-line scaffold swap this same session (mounted at
// /api/farmertraining). Only 2 of the 3 methods the importing pages call
// match this backend - register (POST /register) and getCarbonFootprint
// (GET /carbon-footprint/:farmerId). getPrograms() has no matching
// endpoint: the real backend only has POST /programs (create a program,
// admin-facing), no GET /programs to list them - not fabricated, left
// undefined.
const FARMER_TRAINING_BASE = `${UNVERSIONED_BASE}/api/farmertraining`;

export const farmerTrainingAPI = {
  register: (data) => api.post(`${FARMER_TRAINING_BASE}/register`, data),
  getCarbonFootprint: (farmerId) => api.get(`${FARMER_TRAINING_BASE}/carbon-footprint/${farmerId}`),
};

// 2026-09-15: didn't exist - riskPricingRoutes_merged.js is already
// mounted at /api/riskpricing. Both methods' param names confirmed
// directly against the route file's own req.query/req.body
// destructuring (forward is a GET with crop/months/spot/etc as query
// params; advise is a POST with cropKey/qtyKg/etc as body fields).
const PRICING_BASE = `${UNVERSIONED_BASE}/api/riskpricing`;

export const pricingAPI = {
  forward: (params) => api.get(`${PRICING_BASE}/forward`, { params }),
  advise: (data) => api.post(`${PRICING_BASE}/advise`, data),
};

// 2026-09-15: didn't exist - wearableIntegrationRoutes.js is already
// mounted at /api/wearableintegration. All 6 methods matched 1:1 against
// wearableIntegrationController.js directly.
const WEARABLE_BASE = `${UNVERSIONED_BASE}/api/wearableintegration`;

export const wearableAPI = {
  getStatus: () => api.get(`${WEARABLE_BASE}/status`),
  getFitbitAuthUrl: () => api.get(`${WEARABLE_BASE}/fitbit/auth-url`),
  handleFitbitCallback: (code) => api.post(`${WEARABLE_BASE}/fitbit/callback`, { code }),
  syncFitbit: () => api.post(`${WEARABLE_BASE}/fitbit/sync`),
  getRecentActivity: (days) => api.get(`${WEARABLE_BASE}/activity/recent`, { params: { days } }),
  disconnect: (provider) => api.delete(`${WEARABLE_BASE}/${provider}`),
};

// 2026-09-15: didn't exist - services/legacy/villageProfileService.js was
// never mounted anywhere. Like marketIntelligenceService.js, it exports a
// setupRoutes(app) function rather than a plain router, mounting itself
// at /api/v1/village-profiles (called from index.js this same session).
// Also found and fixed a real route-shadowing bug while wiring this: GET
// /villages/search was registered after GET /villages/:villageId, making
// search unreachable (same shape as productService.js's earlier fix).
export const villageProfileAPI = {
  searchVillages: (params) => api.get('/village-profiles/villages/search', { params }),
};

// 2026-09-16: didn't exist. All of these back onto services/legacy/*.js
// files exporting a setupRoutes(app) function - none were ever manually
// require()'d anywhere, which first looked like 9+ genuinely unmounted
// services (a file called routes/ORPHANED_SERVICES_MOUNT.js even tries
// to fix this, but has its own bug - it passes a sub-router where the
// code expects the real app, so its routes end up double-prefixed and
// unreachable). Investigated further before wiring anything: this
// backend already runs core/dynamicServiceLoader.js's
// mountServiceRoutes(app), called for real in index.js's startup
// sequence, which discovers every services/**/*.js file and calls its
// setupRoutes(app) correctly. Verified live (not assumed): instantiated
// the loader directly, pointed it at the real services/ directory, and
// confirmed GET /api/v1/subsidy/schemes and POST /api/v1/subsidy/apply
// both reach real handlers (500/401, never 404) with zero backend
// changes. ORPHANED_SERVICES_MOUNT.js is real but harmless dead weight
// (a second, broken mount at a garbled path nothing calls) - left alone,
// not worth touching since it doesn't affect anything real.
//
// All paths below use the versioned relative-path pattern (no
// UNVERSIONED_BASE) since these services' setupRoutes() hardcode
// /api/v1/... prefixes matching the api instance's own baseURL.

export const subsidyOpsAPI = {
  apply: (data) => api.post('/subsidy/apply', data),
  calculateGst: (data) => api.post('/subsidy/gst/calculate', data),
  checkEquipmentSubsidy: (data) => api.post('/subsidy/equipment/check', data),
  checkLogisticsSubsidy: (data) => api.post('/subsidy/logistics/check', data),
  checkProjectSubsidy: (data) => api.post('/subsidy/project/check', data),
  getSchemes: (params) => api.get('/subsidy/schemes', { params }),
  track: (id) => api.get(`/subsidy/track/${id}`),
};

export const governmentSchemeAPI = {
  getWeatherAlerts: (params) => api.get('/government/weather/alerts', { params }),
  getAnnouncements: (params) => api.get('/government/announcements', { params }),
  getCsrOpportunities: (params) => api.get('/government/csr/opportunities', { params }),
};

// 2026-09-16: was the duplicate-filename shadowing bug (services/finance/
// governmentSchemeService.js won the service loader's Map over
// services/legacy/governmentSchemeService.js, which has these 2
// endpoints). Fixed not by re-keying the loader (too large/risky a
// change - it discovers 313 services) but by calling the legacy file's
// setupRoutes(app) directly in index.js, additively (see that file's own
// comment) - both files register directly on `app` at the same
// /api/v1/government/... prefix, so the winning file's 9 endpoints keep
// working unchanged and these 2 extra ones from legacy are now also
// registered.
export const schemeRegistryAPI = {
  list: (params) => api.get('/government/schemes/registry', { params }),
  getExpiring: (days) => api.get('/government/schemes/registry/expiring', { params: { days } }),
};

export const preSeasonAPI = {
  getDashboard: (params) => api.get('/pre-season/dashboard', { params }),
  createOrder: (data) => api.post('/pre-season/orders', data),
};

export const sharedInfraAPI = {
  searchAssets: (params) => api.get('/shared-infra/assets/search', { params }),
  searchSecondLife: (params) => api.get('/shared-infra/second-life/search', { params }),
  getRenewableSupport: (params) => api.get('/shared-infra/renewable/support', { params }),
  registerAsset: (data) => api.post('/shared-infra/assets/register', data),
  bookAsset: (data) => api.post('/shared-infra/assets/book', data),
};

// 2026-09-16: aiAdvisoryAPI/buyingClubAPI/procurementSubscriptionAPI/
// renewableEnergyAPI/ruralEnterpriseAPI - same duplicate-filename
// shadowing bug as schemeRegistryAPI above, same fix: each legacy file's
// setupRoutes(app) is now called directly in index.js, additively (see
// that file's comment - verified none collides with what the
// Map-winning file already serves at each prefix).
export const aiAdvisoryAPI = {
  getStatistics: (params) => api.get('/ai-advisories/advisories/statistics', { params }),
};

export const buyingClubAPI = {
  getStatistics: (params) => api.get('/buying-clubs/clubs/statistics', { params }),
};

export const procurementSubscriptionAPI = {
  getStatistics: (params) => api.get('/procurement-subscriptions/subscriptions/statistics', { params }),
};

export const renewableEnergyAPI = {
  getStatistics: (params) => api.get('/renewable-energy/systems/statistics', { params }),
};

export const ruralEnterpriseAPI = {
  getStatistics: (params) => api.get('/rural-enterprises/enterprises/statistics', { params }),
};

export const aiSelfHealingAPI = {
  getSelfHealingStatus: () => api.get('/ai/self-healing/status'),
  initiateSelfHealing: (data) => api.post('/ai/self-healing/initiate', data),
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

// 2026-09-16: was api.get('/products') - resolves to /api/v1/products,
// which doesn't exist. `productsAPI` (plural) above already points at
// the real router correctly - this singular `productAPI` export is used
// elsewhere and left pointed at the same real base for consistency.
export const productAPI = {
  getProducts: (params) => api.get(PRODUCT_BASE, { params }),
  getProduct: (id) => api.get(`${PRODUCT_BASE}/${id}`),
};

export const orderAPI = {
  getOrders: () => api.get('/orders'),
  createOrder: (data) => api.post('/orders', data),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
  getReports: () => api.get('/analytics/reports'),
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
};

// Additional API exports for all pages
export const adminAPI = {
  getAdminData: () => api.get('/admin'),
  manageAdmin: (data) => api.post('/admin/manage', data),
};

export const systemAPI = {
  getSystemData: () => api.get('/system'),
  manageSystem: (data) => api.post('/system/manage', data),
};

export const searchAPI = {
  search: (query) => api.post('/search', query),
  getSearchResults: (id) => api.get(`/search/${id}`),
};

export const animalHealthAPI = {
  getAnimalHealth: () => api.get('/animal-health'),
  manageAnimalHealth: (data) => api.post('/animal-health/manage', data),
};

export const assetAccountingAPI = {
  getAssetAccounting: () => api.get('/asset-accounting'),
  manageAssets: (data) => api.post('/asset-accounting/manage', data),
};

export const companyAPI = {
  getCompanies: () => api.get('/company'),
  getCompany: (id) => api.get(`/company/${id}`),
  // 2026-09-17: real, mounted at /api/company (routes/companyRoutes.js ->
  // services/legacy/companyService.js). AssetAccountingPage.jsx,
  // ProjectSystemsPage.jsx and CostControlPage.jsx all call
  // companyAPI.listCompanies() bare (no try/catch) directly inside a
  // useEffect body - since the method didn't exist, this was a genuine
  // unguarded synchronous TypeError crash on every render of all three
  // pages, the same bug class as the escrowAPI fix earlier this session.
  // getFiscalYears/getChartOfAccounts added alongside it for the same
  // reason - CostControlPage.jsx calls both bare inside a
  // Promise.all([...]) array literal, same unguarded-crash shape, once
  // companyId is set from the (now working) listCompanies() call above.
  listCompanies: () => api.get(`${UNVERSIONED_BASE}/api/company`),
  getFiscalYears: (companyId) => api.get(`${UNVERSIONED_BASE}/api/company/${companyId}/fiscal-years`),
  getChartOfAccounts: (companyId) => api.get(`${UNVERSIONED_BASE}/api/company/${companyId}/chart-of-accounts`),
};

export const authorizationAPI = {
  getAuthorizations: () => api.get('/authorization'),
  checkAuthorization: (data) => api.post('/authorization/check', data),
};

export const ecommerceBusinessSalesAPI = {
  getBusinessSales: () => api.get('/ecommerce/business-sales'),
  analyzeSales: (data) => api.post('/ecommerce/business-sales/analyze', data),
};

export const walletAPI = {
  getWalletBalance: () => api.get('/wallet'),
  makePayment: (data) => api.post('/wallet/payment', data),
  // 2026-09-17: real, DB-backed, transactional wallet functions
  // (services/legacy/farmerService.js - row-level locking on deposit/
  // withdraw/transfer, see that file's own comments) exposed self-scoped
  // (no walletId needed - resolved server-side via resolveFarmerId from
  // the authenticated user's own farmer record) at routes/
  // farmerPortalEnhancements_merged.js, already mounted at
  // /api/farmerportalenhancements. WalletPage.jsx calls all five.
  getWallet: () => api.get(`${UNVERSIONED_BASE}/api/farmerportalenhancements/wallet`),
  getTransactions: (params) => api.get(`${UNVERSIONED_BASE}/api/farmerportalenhancements/wallet/transactions`, { params }),
  deposit: (data) => api.post(`${UNVERSIONED_BASE}/api/farmerportalenhancements/wallet/deposit`, data),
  withdraw: (data) => api.post(`${UNVERSIONED_BASE}/api/farmerportalenhancements/wallet/withdraw`, data),
  transfer: (data) => api.post(`${UNVERSIONED_BASE}/api/farmerportalenhancements/wallet/transfer`, data),
};

export const finmanAPI = {
  getFinmanData: () => api.get('/finman'),
  manageFinman: (data) => api.post('/finman/manage', data),
};

export const bankerAPI = {
  getBankerData: () => api.get('/banker'),
  manageBanker: (data) => api.post('/banker/manage', data),
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
  // 2026-09-17: real, DB-backed (services/legacy/insuranceService.js's own
  // router), already mounted at /api/insurance (unversioned - note this
  // differs from getPolicies/createPolicy above, which use the versioned
  // relative path against a mount that doesn't actually exist there; a
  // pre-existing mismatch, left as-is since it's outside this fix's scope).
  // InsuranceManagementPage.jsx calls all three.
  getInsuranceProducts: () => api.get(`${UNVERSIONED_BASE}/api/insurance/products`),
  getClaims: () => api.get(`${UNVERSIONED_BASE}/api/insurance/claims`),
  submitClaim: (data) => api.post(`${UNVERSIONED_BASE}/api/insurance/claims`, data),
};

export const logisticsAPI = {
  getShipments: () => api.get('/logistics/shipments'),
  createShipment: (data) => api.post('/logistics/shipments', data),
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
  // 2026-09-17: real, mounted at /api/compliance (routes/complianceRoutes.js
  // -> services/legacy/complianceService.js, reads the tds_deductions
  // table). CADashboardPage.jsx already had a comment claiming these were
  // "genuinely wired up" but they were never actually added here - a
  // documented-but-not-done gap, not a working feature.
  tdsSummary: (params) => api.get(`${UNVERSIONED_BASE}/api/compliance/tds/summary`, { params }),
  tdsRates: () => api.get(`${UNVERSIONED_BASE}/api/compliance/tds/rates`),
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
  // 2026-09-17: real, mounted at /api/weather (routes/weatherRoutes_merged.js
  // -> services/agriculture/weatherService.js, migration 057). ClimateAdvisoryPage.jsx's
  // own comment already correctly identified these as real and mounted,
  // but they were never actually added to this object. ForwardPricingPage.jsx
  // calls forArp() for the same real /for-arp endpoint.
  activeAlerts: () => api.get(`${UNVERSIONED_BASE}/api/weather/alerts/active`),
  pestForecast: (params) => api.get(`${UNVERSIONED_BASE}/api/weather/pest-forecast`, { params }),
  forArp: ({ state, district, days }) => api.get(`${UNVERSIONED_BASE}/api/weather/for-arp`, { params: { state, district, days } }),
  // 2026-09-17: same already-mounted router (routes/weatherRoutes_merged.js
  // -> services/legacy/weatherService.js) also exposes these - all real,
  // DB-backed (coverage/dispatchCheck read v_weather_coverage/
  // v_active_dispatch_blocks; forecastAccuracy reads v_forecast_accuracy;
  // advisoryTriggers reads real climate_indices/weather_observations rows -
  // no fabricated values, see the service file's own header comment for
  // the SPI/heat-stress thresholds used). ClimateWeatherPage.jsx and
  // WeatherAnalyticsPage.jsx both call all four.
  coverage: () => api.get(`${UNVERSIONED_BASE}/api/weather/coverage`),
  dispatchCheck: (districts) => api.get(`${UNVERSIONED_BASE}/api/weather/alerts/dispatch-check`, { params: { districts: Array.isArray(districts) ? districts.join(',') : districts } }),
  forecastAccuracy: () => api.get(`${UNVERSIONED_BASE}/api/weather/forecast-accuracy`),
  advisoryTriggers: (params) => api.get(`${UNVERSIONED_BASE}/api/weather/advisory-triggers`, { params }),
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
  // 2026-09-17: real, mounted at /api/recoveredfinance (routes/
  // recoveredFinanceRoutes_merged.js -> services/finance/
  // recoveredFinanceService.js). LedgerPage.jsx calls trialBalance()/
  // verifyLedger() (hash-chained GL integrity check) inside a try/catch'd
  // Promise.all - was already crash-safe, but had no real backend wired.
  // BankPassportPage.jsx calls getMyEnwrReceipts() - self-scoped to the
  // caller's own farmerId via resolveFarmerId middleware, no ID needed.
  trialBalance: () => api.get(`${UNVERSIONED_BASE}/api/recoveredfinance/ledger/trial-balance`),
  verifyLedger: () => api.get(`${UNVERSIONED_BASE}/api/recoveredfinance/ledger/verify`),
  getMyEnwrReceipts: () => api.get(`${UNVERSIONED_BASE}/api/recoveredfinance/enwr/my-receipts`),
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
};

export const farmerAPI2 = {
  getFarmers: () => api.get('/farmer'),
  getFarmer: (id) => api.get(`/farmer/${id}`),
};

export const farmerFamilyAPI = {
  getFarmerFamilies: () => api.get('/farmer-family'),
  addFamilyMember: (data) => api.post('/farmer-family/add', data),
};

export const farmAnalyticsAPI = {
  getFarmAnalytics: () => api.get('/farm-analytics'),
  analyzeFarm: (data) => api.post('/farm-analytics/analyze', data),
};

export const experienceAPI = {
  getExperiences: () => api.get('/experience'),
  addExperience: (data) => api.post('/experience/add', data),
};

// 2026-09-16: was { getEscrows, createEscrow } - unused by the one live
// consumer, EscrowPage.jsx, which calls .list()/.release()/.refund() that
// didn't exist here at all (a TypeError before any request was even sent).
// Wired to the real, now-mounted services/legacy/escrowService.js routes
// (/api/v1/escrow via the api instance's own baseURL) instead.
export const escrowAPI = {
  list: () => api.get('/escrow'),
  create: (data) => api.post('/escrow', data),
  release: (escrowId, data) => api.post(`/escrow/${escrowId}/release`, data),
  refund: (escrowId) => api.post(`/escrow/${escrowId}/refund`),
  get: (escrowId) => api.get(`/escrow/${escrowId}`),
  getByOrder: (orderId) => api.get(`/escrow/order/${orderId}`),
  getByUser: (userId, role) => api.get(`/escrow/user/${userId}`, { params: role ? { role } : undefined }),
};

export const equipmentExchangeAPI = {
  getEquipmentExchange: () => api.get('/equipment-exchange'),
  exchangeEquipment: (data) => api.post('/equipment-exchange/exchange', data),
};

export const enterpriseRouteSupportAPI = {
  getEnterpriseRouteSupport: () => api.get('/enterprise-route-support'),
  supportRoute: (data) => api.post('/enterprise-route-support/support', data),
};

export const enterpriseIntegrationAPI = {
  getEnterpriseIntegration: () => api.get('/enterprise-integration'),
  integrateEnterprise: (data) => api.post('/enterprise-integration/integrate', data),
};

export const enterpriseAIAPI = {
  getEnterpriseAI: () => api.get('/enterprise-ai'),
  runEnterpriseAI: (data) => api.post('/enterprise-ai/run', data),
};

export const engineeringProjectAPI = {
  getEngineeringProjects: () => api.get('/engineering-project'),
  createProject: (data) => api.post('/engineering-project', data),
};

export const energyAPI = {
  getEnergy: () => api.get('/energy'),
  manageEnergy: (data) => api.post('/energy/manage', data),
};

export const ecommerceAPI = {
  getEcommerce: () => api.get('/ecommerce'),
  manageEcommerce: (data) => api.post('/ecommerce/manage', data),
};

export const ecommerceMarketingAPI = {
  getEcommerceMarketing: () => api.get('/ecommerce-marketing'),
  runMarketingCampaign: (data) => api.post('/ecommerce-marketing/campaign', data),
  // 2026-09-17: real, mounted at /api/ecommercemarketing (routes/
  // ecommerceMarketingRoutes_merged.js -> controllers/
  // ecommerceMarketingController.js -> services/legacy/
  // ecommerceMarketingService.js). MarketingCenter.jsx calls both.
  getMarketingAnalytics: (params) => api.get(`${UNVERSIONED_BASE}/api/ecommercemarketing/analytics`, { params }),
  getSponsoredProducts: (params) => api.get(`${UNVERSIONED_BASE}/api/ecommercemarketing/sponsored-products`, { params }),
};

export const ecommerceIntegrationAPI = {
  getEcommerceIntegration: () => api.get('/ecommerce-integration'),
  integrateEcommerce: (data) => api.post('/ecommerce-integration/integrate', data),
};

export const ecommerceERPAPI = {
  getEcommerceERP: () => api.get('/ecommerce-erp'),
  configureERP: (data) => api.put('/ecommerce-erp/configure', data),
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
};

export const decisionSupportAPI = {
  getDecisionSupport: () => api.get('/decision-support'),
  makeDecision: (data) => api.post('/decision-support/make', data),
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
};

export const cropValueResearchAPI = {
  getCropValueResearch: () => api.get('/crop-value-research'),
  researchCropValue: (data) => api.post('/crop-value-research/research', data),
  // 2026-09-17: real, mounted at /api/cropvalueresearch (routes/
  // cropValueResearchRoutes.js, newly wired to controllers/
  // cropValueResearchController.js -> services/legacy/
  // cropValueResearchService.js's getPendingSuggestions()/reviewSuggestion()
  // - AI-suggested crop value-compound reference data, verified=FALSE
  // until a human approves via review()). CropValueReviewPage.jsx calls both.
  getPending: () => api.get(`${UNVERSIONED_BASE}/api/cropvalueresearch/pending`),
  review: (id, approve) => api.post(`${UNVERSIONED_BASE}/api/cropvalueresearch/${id}/review`, { approve }),
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
};

export const cooperativeShareAPI = {
  getCooperativeShares: () => api.get('/cooperative-share'),
  buyShare: (data) => api.post('/cooperative-share/buy', data),
};

export const comprehensiveERPAPI = {
  getComprehensiveERP: () => api.get('/comprehensive-erp'),
  configureERP: (data) => api.put('/comprehensive-erp/configure', data),
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
};

export const completeAIIntegrationAPI = {
  getCompleteAIIntegration: () => api.get('/complete-ai-integration'),
  integrateAI: (data) => api.post('/complete-ai-integration/integrate', data),
};

export const communityManagementAPI = {
  getCommunityManagement: () => api.get('/community-management'),
  manageCommunity: (data) => api.post('/community-management/manage', data),
};

export const coldStorageAPI = {
  getColdStorage: () => api.get('/cold-storage'),
  manageColdStorage: (data) => api.post('/cold-storage/manage', data),
};

export const coldChainMonitoringAPI = {
  getColdChainMonitoring: () => api.get('/cold-chain-monitoring'),
  monitorColdChain: (data) => api.post('/cold-chain-monitoring/monitor', data),
};

export const climateAdvisoryAPI = {
  getClimateAdvisory: () => api.get('/climate-advisory'),
  getAdvisory: (data) => api.post('/climate-advisory/get', data),
};

export const civilDisruptionAPI = {
  getCivilDisruption: () => api.get('/civil-disruption'),
  reportDisruption: (data) => api.post('/civil-disruption/report', data),
  // 2026-09-17: real, mounted at /api/civildisruption (routes/
  // civilDisruptionRoutes.js -> services/legacy/civilDisruptionService.js).
  // DisruptionPage.jsx calls both.
  listActive: (params) => api.get(`${UNVERSIONED_BASE}/api/civildisruption/active`, { params }),
  report: (data) => api.post(`${UNVERSIONED_BASE}/api/civildisruption`, data),
  // 2026-09-17: same already-mounted router (routes/civilDisruptionRoutes.js
  // -> services/legacy/civilDisruptionService.js) also exposes these
  // admin/action endpoints - all real, DB-backed (civil_disruption_events
  // table; checkShipmentRisk does a real ILIKE match against the shipment's
  // own addresses, see the service file's header comment on why that is
  // not GPS routing). MarketSignalsPage.jsx calls all three.
  verify: (id) => api.post(`${UNVERSIONED_BASE}/api/civildisruption/${id}/verify`),
  resolve: (id, endDate) => api.post(`${UNVERSIONED_BASE}/api/civildisruption/${id}/resolve`, { endDate }),
  checkShipmentRisk: (shipmentId) => api.get(`${UNVERSIONED_BASE}/api/civildisruption/shipments/${shipmentId}/risk`),
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
  // 2026-09-17: real, mounted at /api/transaction (routes/
  // transactionRoutes.js -> controllers/transactionController.js ->
  // services/transactionService.js's getUserTransactions). TransactionHistoryPage.jsx
  // calls this - note that page currently passes a hardcoded 'user123'
  // placeholder instead of a real user id (its own pre-existing, separately
  // flagged TODO, not something this fix changes), so this will 404/return
  // empty until that placeholder is replaced with a real id from auth.
  getUserTransactions: (userId, params) => api.get(`${UNVERSIONED_BASE}/api/transaction/user/${userId}`, { params }),
};

export const trackDartAPI = {
  getShipments: () => api.get('/track-dart'),
  trackShipment: (id) => api.get(`/track-dart/${id}`),
};

export const tenantManagementAPI = {
  getTenants: () => api.get('/tenant-management'),
  createTenant: (data) => api.post('/tenant-management', data),
};

export const systemAdministrationAPI = {
  getSystemStatus: () => api.get('/system-administration'),
  configureSystem: (data) => api.put('/system-administration', data),
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

// 2026-09-16: was a pre-existing fabricated placeholder (wrong method
// names, missing update/delete entirely, made-up path). Fixed against
// the new backend/src/routes/soilRegistryRoutes.js (wraps
// services/legacy/soilManagementService.js's real createCrudService(...)
// objects, previously unrouted).
const SOIL_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/soil-registry`;
export const soilHealthAPI = {
  getCards: (params) => api.get(`${SOIL_REGISTRY_BASE}/health-cards`, { params }),
  createCard: (data) => api.post(`${SOIL_REGISTRY_BASE}/health-cards`, data),
  updateCard: (id, data) => api.put(`${SOIL_REGISTRY_BASE}/health-cards/${id}`, data),
  deleteCard: (id) => api.delete(`${SOIL_REGISTRY_BASE}/health-cards/${id}`),
};

export const sheepAPI = {
  getSheepData: () => api.get('/sheep'),
  manageSheep: (id, data) => api.put(`/sheep/${id}`, data),
};

export const sellerVerificationsAPI = {
  getVerifications: () => api.get('/seller-verifications'),
  verifySeller: (id) => api.post(`/seller-verifications/${id}/verify`),
};

export const sellerRankingAPI = {
  getSellerRankings: () => api.get('/seller-ranking'),
  rankSeller: (id, data) => api.post(`/seller-ranking/${id}`, data),
  // 2026-09-17: real, mounted at /api/sellerranking (routes/
  // sellerRankingRoutes.js, newly wired to services/legacy/
  // sellerRankingService.js - ranks sellers by real farmers.fdi_score/
  // fulfilled_orders/disputes/years_active/certification_count/
  // training_completed columns). MarketSignalsPage.jsx calls both.
  getRankedSellers: (params) => api.get(`${UNVERSIONED_BASE}/api/sellerranking/ranked`, { params }),
  getSellerTrustScore: (userId) => api.get(`${UNVERSIONED_BASE}/api/sellerranking/trust-score/${userId}`),
};

// 2026-09-15: pointed at /seed-vault, which doesn't exist under the
// /api/v1 base this file uses, and was missing getCategories()/
// deleteSeed() that SeedVaultPage.jsx actually calls.
// routes/seedVaultRoutes_merged.js is real (not the usual scaffold -
// mounted in the twenty-first backlog update) and matches these 4
// methods exactly; it also has recordUsage(seedId, amountUsed), not yet
// called by any page but real and free to expose alongside the rest.
const SEED_VAULT_BASE = `${UNVERSIONED_BASE}/api/seedvault`;

export const seedVaultAPI = {
  getSeeds: () => api.get(SEED_VAULT_BASE),
  getCategories: () => api.get(`${SEED_VAULT_BASE}/categories`),
  addSeed: (data) => api.post(SEED_VAULT_BASE, data),
  deleteSeed: (seedId) => api.delete(`${SEED_VAULT_BASE}/${seedId}`),
  recordUsage: (seedId, amountUsed) => api.post(`${SEED_VAULT_BASE}/${seedId}/record-usage`, { amountUsed }),
};

export const sapModuleArchitectureAPI = {
  getSAPModules: () => api.get('/sap-module-architecture'),
  configureSAPModule: (id, data) => api.put(`/sap-module-architecture/${id}`, data),
};

export const roleManagementAPI = {
  getRoles: () => api.get('/role-management'),
  createRole: (data) => api.post('/role-management', data),
  // 2026-09-17: real, mounted at /api/rolemanagement (routes/
  // roleManagementRoutes.js -> services/legacy/roleManagementService.js).
  // IdentityManagementPage.jsx's ResourceManager update/remove props call
  // these exact names.
  updateRole: (id, data) => api.put(`${UNVERSIONED_BASE}/api/rolemanagement/${id}`, data),
  deleteRole: (id) => api.delete(`${UNVERSIONED_BASE}/api/rolemanagement/${id}`),
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
  // 2026-09-17: same already-mounted router (routes/rfqRoutes_merged.js at
  // /api/rfq) also exposes these - all real, DB-backed (qc_holds,
  // quote_outcomes, v_fpo_centre_pnl). RfqPage.jsx calls all four.
  activeHolds: () => api.get(`${UNVERSIONED_BASE}/api/rfq/qc/holds`),
  lossAnalysis: (params) => api.get(`${UNVERSIONED_BASE}/api/rfq/quotes/loss-analysis`, { params }),
  centrePnl: (fpoId) => api.get(`${UNVERSIONED_BASE}/api/rfq/fpo/centre-pnl`, { params: fpoId ? { fpoId } : {} }),
  releaseQcHold: (data) => api.post(`${UNVERSIONED_BASE}/api/rfq/qc/release`, data),
};

export const returnLoadBoardAPI = {
  getReturnLoads: () => api.get('/return-load-board'),
  postReturnLoad: (data) => api.post('/return-load-board', data),
};

export const researchAndDevelopmentAPI = {
  getRAndD: () => api.get('/research-and-development'),
  createResearch: (data) => api.post('/research-and-development', data),
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

// 2026-09-16: was a pre-existing fabricated placeholder (generic
// getHydroponics()/manageHydroponics() hitting made-up paths that never
// matched any backend route or HorticultureManagementPage.jsx's real
// getSystems/createSystem/updateSystem/deleteSystem calls). Fixed against
// the new backend/src/routes/horticultureRegistryRoutes.js (wraps
// services/legacy/horticultureManagementService.js's real
// createCrudService(...) objects, previously unrouted).
const HORTICULTURE_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/horticulture-registry`;
export const hydroponicsAPI = {
  getSystems: (params) => api.get(`${HORTICULTURE_REGISTRY_BASE}/hydroponic-systems`, { params }),
  createSystem: (data) => api.post(`${HORTICULTURE_REGISTRY_BASE}/hydroponic-systems`, data),
  updateSystem: (id, data) => api.put(`${HORTICULTURE_REGISTRY_BASE}/hydroponic-systems/${id}`, data),
  deleteSystem: (id) => api.delete(`${HORTICULTURE_REGISTRY_BASE}/hydroponic-systems/${id}`),
};

export const homeAutomationAPI = {
  getHomeAutomation: () => api.get('/home-automation'),
  automateHome: (data) => api.post('/home-automation/automate', data),
};

// Climate and weather monitoring APIs
// 2026-09-16: droughtMonitoringAPI/floodMonitoringAPI/diseaseForecastingAPI/
// climateRiskAPI/agroMeteorologyAPI were pre-existing fabricated
// placeholders (generic getX()/analyzeX() hitting made-up paths that
// never matched any backend route or ClimateMonitoringPage.jsx's real
// getRecords/createRecord/updateRecord/deleteRecord calls). Fixed
// against the new backend/src/routes/climateRegistryRoutes.js (wraps
// services/legacy/climateMonitoringService.js's real
// createCrudService(...) objects, previously unrouted).
const CLIMATE_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/climate-registry`;

export const droughtMonitoringAPI = {
  getRecords: (params) => api.get(`${CLIMATE_REGISTRY_BASE}/drought`, { params }),
  createRecord: (data) => api.post(`${CLIMATE_REGISTRY_BASE}/drought`, data),
  updateRecord: (id, data) => api.put(`${CLIMATE_REGISTRY_BASE}/drought/${id}`, data),
  deleteRecord: (id) => api.delete(`${CLIMATE_REGISTRY_BASE}/drought/${id}`),
};

export const floodMonitoringAPI = {
  getRecords: (params) => api.get(`${CLIMATE_REGISTRY_BASE}/flood`, { params }),
  createRecord: (data) => api.post(`${CLIMATE_REGISTRY_BASE}/flood`, data),
  updateRecord: (id, data) => api.put(`${CLIMATE_REGISTRY_BASE}/flood/${id}`, data),
  deleteRecord: (id) => api.delete(`${CLIMATE_REGISTRY_BASE}/flood/${id}`),
};

// 2026-09-16: M087 Pest Forecasting is NOT covered by
// climateMonitoringService.js (only M085/M086/M088/M089/M090 are, per
// that file's own header comment) - checked directly, no backend
// implements a pest-forecast CRUD anywhere. getForecasts left undefined
// rather than fabricated; ClimateMonitoringPage.jsx's pest tab only
// calls this one method (no create/update/remove), still a genuine gap.
export const pestForecastingAPI = {};

export const diseaseForecastingAPI = {
  getForecasts: (params) => api.get(`${CLIMATE_REGISTRY_BASE}/disease-forecasts`, { params }),
  createForecast: (data) => api.post(`${CLIMATE_REGISTRY_BASE}/disease-forecasts`, data),
  updateForecast: (id, data) => api.put(`${CLIMATE_REGISTRY_BASE}/disease-forecasts/${id}`, data),
  deleteForecast: (id) => api.delete(`${CLIMATE_REGISTRY_BASE}/disease-forecasts/${id}`),
};

export const climateRiskAPI = {
  getAssessments: (params) => api.get(`${CLIMATE_REGISTRY_BASE}/climate-risk`, { params }),
  createAssessment: (data) => api.post(`${CLIMATE_REGISTRY_BASE}/climate-risk`, data),
  updateAssessment: (id, data) => api.put(`${CLIMATE_REGISTRY_BASE}/climate-risk/${id}`, data),
  deleteAssessment: (id) => api.delete(`${CLIMATE_REGISTRY_BASE}/climate-risk/${id}`),
};

export const agroMeteorologyAPI = {
  getRecords: (params) => api.get(`${CLIMATE_REGISTRY_BASE}/agro-meteorology`, { params }),
  createRecord: (data) => api.post(`${CLIMATE_REGISTRY_BASE}/agro-meteorology`, data),
  updateRecord: (id, data) => api.put(`${CLIMATE_REGISTRY_BASE}/agro-meteorology/${id}`, data),
  deleteRecord: (id) => api.delete(`${CLIMATE_REGISTRY_BASE}/agro-meteorology/${id}`),
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

// Same fix as soilHealthAPI above.
export const nutrientManagementAPI = {
  getPlans: (params) => api.get(`${SOIL_REGISTRY_BASE}/nutrient-plans`, { params }),
  createPlan: (data) => api.post(`${SOIL_REGISTRY_BASE}/nutrient-plans`, data),
  updatePlan: (id, data) => api.put(`${SOIL_REGISTRY_BASE}/nutrient-plans/${id}`, data),
  deletePlan: (id) => api.delete(`${SOIL_REGISTRY_BASE}/nutrient-plans/${id}`),
};

export const fertilityManagementAPI = {
  getRecords: (params) => api.get(`${SOIL_REGISTRY_BASE}/fertility-records`, { params }),
  createRecord: (data) => api.post(`${SOIL_REGISTRY_BASE}/fertility-records`, data),
  updateRecord: (id, data) => api.put(`${SOIL_REGISTRY_BASE}/fertility-records/${id}`, data),
  deleteRecord: (id) => api.delete(`${SOIL_REGISTRY_BASE}/fertility-records/${id}`),
};

// 2026-09-16: WaterRecordsPage.jsx calls these 5 with plain list/create/
// update/remove (matching resourceCrudFactory's own method names
// directly, unlike most other pages' getX/createX convention). This is a
// confirmed regression fix, not a fresh feature - see
// backend/src/routes/waterRecordsRegistryRoutes.js's header comment:
// waterManagementRoutes.js used to expose these same 5 real
// createCrudService(...) objects and was overwritten with a stub by a
// later batch-fix commit. Distinct from waterBudgetingAPI/
// rainwaterHarvestingAPI/watershedManagementAPI/waterAnalyticsAPI
// (WaterManagementPage.jsx, action-style names matching the unscanned
// modules/M076-M080 tree) - those remain genuine gaps, not fixed here.
const WATER_RECORDS_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/water-records-registry`;
export const waterBudgetRecordsAPI = {
  list: (params) => api.get(`${WATER_RECORDS_REGISTRY_BASE}/budgets`, { params }),
  create: (data) => api.post(`${WATER_RECORDS_REGISTRY_BASE}/budgets`, data),
  update: (id, data) => api.put(`${WATER_RECORDS_REGISTRY_BASE}/budgets/${id}`, data),
  remove: (id) => api.delete(`${WATER_RECORDS_REGISTRY_BASE}/budgets/${id}`),
};

export const waterQualityRecordsAPI = {
  list: (params) => api.get(`${WATER_RECORDS_REGISTRY_BASE}/quality-readings`, { params }),
  create: (data) => api.post(`${WATER_RECORDS_REGISTRY_BASE}/quality-readings`, data),
  update: (id, data) => api.put(`${WATER_RECORDS_REGISTRY_BASE}/quality-readings/${id}`, data),
  remove: (id) => api.delete(`${WATER_RECORDS_REGISTRY_BASE}/quality-readings/${id}`),
};

export const rainwaterStructuresAPI = {
  list: (params) => api.get(`${WATER_RECORDS_REGISTRY_BASE}/rainwater-structures`, { params }),
  create: (data) => api.post(`${WATER_RECORDS_REGISTRY_BASE}/rainwater-structures`, data),
  update: (id, data) => api.put(`${WATER_RECORDS_REGISTRY_BASE}/rainwater-structures/${id}`, data),
  remove: (id) => api.delete(`${WATER_RECORDS_REGISTRY_BASE}/rainwater-structures/${id}`),
};

export const watershedRecordsAPI = {
  list: (params) => api.get(`${WATER_RECORDS_REGISTRY_BASE}/watersheds`, { params }),
  create: (data) => api.post(`${WATER_RECORDS_REGISTRY_BASE}/watersheds`, data),
  update: (id, data) => api.put(`${WATER_RECORDS_REGISTRY_BASE}/watersheds/${id}`, data),
  remove: (id) => api.delete(`${WATER_RECORDS_REGISTRY_BASE}/watersheds/${id}`),
};

export const waterAnalyticsRecordsAPI = {
  list: (params) => api.get(`${WATER_RECORDS_REGISTRY_BASE}/analytics`, { params }),
  create: (data) => api.post(`${WATER_RECORDS_REGISTRY_BASE}/analytics`, data),
  update: (id, data) => api.put(`${WATER_RECORDS_REGISTRY_BASE}/analytics/${id}`, data),
  remove: (id) => api.delete(`${WATER_RECORDS_REGISTRY_BASE}/analytics/${id}`),
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
  // 2026-09-17: real, mounted at /api/knowledgegraph (index.js requires
  // services/legacy/knowledgeGraphService.js's router directly) - a real
  // Postgres full-text search over knowledge_nodes. CommunityForumPage.jsx
  // and KnowledgeBasePage.jsx call this.
  searchNodes: (q) => api.get(`${UNVERSIONED_BASE}/api/knowledgegraph/knowledge-nodes/search`, { params: { q } }),
};

export const libraryAPI = {
  getLibrary: () => api.get('/library'),
  searchLibrary: (query) => api.post('/library/search', query),
  // 2026-09-17: real, mounted at /api/libraryknowledge (routes/claude/
  // libraryRoutes.js -> services/legacy/libraryKnowledgeService.js - reads
  // actual .md cards under _EBDESIGN_LIBRARY/, real keyword search - not
  // the same object as routes/libraryRoutes_merged.js at /api/library,
  // which is a separate "Resources retrieved" CRUD scaffold). CommunityForumPage.jsx
  // and KnowledgeBasePage.jsx call libraryAPI.search({query}).
  search: ({ query }) => api.get(`${UNVERSIONED_BASE}/api/libraryknowledge/search`, { params: { query } }),
};

export const panchayatAPI = {
  getPanchayats: () => api.get('/panchayats'),
  getPanchayat: (id) => api.get(`/panchayats/${id}`),
  // 2026-09-17: real, mounted at /api/governancemodule (routes/platform/
  // governanceModule_merged.js -> services/legacy/governanceService.js -
  // CommunityManagementPage.jsx's own comment already correctly identified
  // this as real, but createPanchayat was never actually added here).
  createPanchayat: (data) => api.post(`${UNVERSIONED_BASE}/api/governancemodule/panchayats`, data),
};

export const blockManagementAPI = {
  getBlocks: () => api.get('/blocks'),
  getBlock: (id) => api.get(`/blocks/${id}`),
};

export const districtManagementAPI = {
  getDistricts: () => api.get('/districts'),
  getDistrict: (id) => api.get(`/districts/${id}`),
};

export const stateManagementAPI = {
  getStates: () => api.get('/states'),
  getState: (id) => api.get(`/states/${id}`),
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
};

export const producerGroupAPI = {
  getProducerGroups: () => api.get('/producer-groups'),
  createProducerGroup: (data) => api.post('/producer-groups', data),
};

export const auditComplianceAPI = {
  getAuditCompliance: () => api.get('/audit-compliance'),
  runAudit: (data) => api.post('/audit-compliance/run', data),
};

export const strategicAPI = {
  getStrategicData: () => api.get('/strategic'),
  planStrategy: (data) => api.post('/strategic/plan', data),
};

export const vendorsAPI = {
  getVendors: () => api.get('/vendors'),
  getVendor: (id) => api.get(`/vendors/${id}`),
};

export const economicAPI = {
  getEconomicData: () => api.get('/economic'),
  analyzeEconomics: (data) => api.post('/economic/analyze', data),
  // 2026-09-17: real, newly mounted at /api/v1/cost/corridor-model (routes/
  // finance/costRoutes_merged.js, which required a nonexistent module path
  // and was never mountable until fixed - see index.js). Real, DB-backed
  // NE->NCR landed-cost business-plan model (services/costService.js ->
  // legacy/costService.js). CorridorEconomicsPage.jsx calls this.
  corridorModel: (corridor) => api.get(`${UNVERSIONED_BASE}/api/v1/cost/corridor-model`, { params: { corridor } }),
  // Real, already-mounted at /api/demand/mandi-signal (routes/demandRoutes.js
  // -> services/legacy/demandService.js's getMandiSignal()). Same page calls this.
  mandiSignal: (params) => api.get(`${UNVERSIONED_BASE}/api/demand/mandi-signal`, { params }),
};

// Crop management APIs
export const cropCalendarAPI = {
  getCropCalendar: () => api.get('/crop-calendar'),
  updateCropCalendar: (data) => api.put('/crop-calendar', data),
};

// 2026-09-16: cropMonitoringAPI/cropRegistrationAPI/cropVarietyAPI were
// pre-existing fabricated placeholders (wrong method names, missing
// update/delete entirely, made-up paths) - same recurring pattern found
// in the fisheries and horticulture batches. Fixed against the new
// backend/src/routes/cropRegistryRoutes.js (wraps
// services/legacy/cropManagementService.js's real createCrudService(...)
// objects, previously unrouted). Also wires the 3 previously-missing
// exports (nurseryAPI, seedPlanningAPI, sowingAPI) from the same file.
const CROP_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/crop-registry`;

export const cropRegistrationAPI = {
  getCrops: (params) => api.get(`${CROP_REGISTRY_BASE}/registrations`, { params }),
  registerCrop: (data) => api.post(`${CROP_REGISTRY_BASE}/registrations`, data),
  updateCrop: (id, data) => api.put(`${CROP_REGISTRY_BASE}/registrations/${id}`, data),
  deleteCrop: (id) => api.delete(`${CROP_REGISTRY_BASE}/registrations/${id}`),
};

export const cropVarietyAPI = {
  getVarieties: (params) => api.get(`${CROP_REGISTRY_BASE}/varieties`, { params }),
  createVariety: (data) => api.post(`${CROP_REGISTRY_BASE}/varieties`, data),
  updateVariety: (id, data) => api.put(`${CROP_REGISTRY_BASE}/varieties/${id}`, data),
  deleteVariety: (id) => api.delete(`${CROP_REGISTRY_BASE}/varieties/${id}`),
};

export const seedPlanningAPI = {
  getPlans: (params) => api.get(`${CROP_REGISTRY_BASE}/seed-plans`, { params }),
  createPlan: (data) => api.post(`${CROP_REGISTRY_BASE}/seed-plans`, data),
  updatePlan: (id, data) => api.put(`${CROP_REGISTRY_BASE}/seed-plans/${id}`, data),
  deletePlan: (id) => api.delete(`${CROP_REGISTRY_BASE}/seed-plans/${id}`),
};

export const nurseryAPI = {
  getNurseries: (params) => api.get(`${CROP_REGISTRY_BASE}/nurseries`, { params }),
  createNursery: (data) => api.post(`${CROP_REGISTRY_BASE}/nurseries`, data),
  updateNursery: (id, data) => api.put(`${CROP_REGISTRY_BASE}/nurseries/${id}`, data),
  deleteNursery: (id) => api.delete(`${CROP_REGISTRY_BASE}/nurseries/${id}`),
};

export const sowingAPI = {
  getRecords: (params) => api.get(`${CROP_REGISTRY_BASE}/sowing-records`, { params }),
  createRecord: (data) => api.post(`${CROP_REGISTRY_BASE}/sowing-records`, data),
  updateRecord: (id, data) => api.put(`${CROP_REGISTRY_BASE}/sowing-records/${id}`, data),
  deleteRecord: (id) => api.delete(`${CROP_REGISTRY_BASE}/sowing-records/${id}`),
};

export const cropMonitoringAPI = {
  getObservations: (params) => api.get(`${CROP_REGISTRY_BASE}/monitoring-observations`, { params }),
  createObservation: (data) => api.post(`${CROP_REGISTRY_BASE}/monitoring-observations`, data),
  updateObservation: (id, data) => api.put(`${CROP_REGISTRY_BASE}/monitoring-observations/${id}`, data),
  deleteObservation: (id) => api.delete(`${CROP_REGISTRY_BASE}/monitoring-observations/${id}`),
};

// 2026-09-16: services/legacy/landManagementService.js had real
// createCrudService(...) logic for these 6 LandManagementPage.jsx tabs
// (including landLease - previously documented as a plain confirmed gap
// before finding it's actually the same "real CRUD, zero router"
// pattern as the rest of this file) but no Express router at all - wired
// against backend/src/routes/landRegistryRoutes.js.
const LAND_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/land-registry`;
export const landLeaseAPI = {
  getLeases: (params) => api.get(`${LAND_REGISTRY_BASE}/leases`, { params }),
  createLease: (data) => api.post(`${LAND_REGISTRY_BASE}/leases`, data),
  updateLease: (id, data) => api.put(`${LAND_REGISTRY_BASE}/leases/${id}`, data),
  deleteLease: (id) => api.delete(`${LAND_REGISTRY_BASE}/leases/${id}`),
};

export const gisLandMappingAPI = {
  getMappings: (params) => api.get(`${LAND_REGISTRY_BASE}/gis-mappings`, { params }),
  createMapping: (data) => api.post(`${LAND_REGISTRY_BASE}/gis-mappings`, data),
  updateMapping: (id, data) => api.put(`${LAND_REGISTRY_BASE}/gis-mappings/${id}`, data),
  deleteMapping: (id) => api.delete(`${LAND_REGISTRY_BASE}/gis-mappings/${id}`),
};

export const soilMappingAPI = {
  getZones: (params) => api.get(`${LAND_REGISTRY_BASE}/soil-zones`, { params }),
  createZone: (data) => api.post(`${LAND_REGISTRY_BASE}/soil-zones`, data),
  updateZone: (id, data) => api.put(`${LAND_REGISTRY_BASE}/soil-zones/${id}`, data),
  deleteZone: (id) => api.delete(`${LAND_REGISTRY_BASE}/soil-zones/${id}`),
};

export const waterResourceMappingAPI = {
  getResources: (params) => api.get(`${LAND_REGISTRY_BASE}/water-resources`, { params }),
  createResource: (data) => api.post(`${LAND_REGISTRY_BASE}/water-resources`, data),
  updateResource: (id, data) => api.put(`${LAND_REGISTRY_BASE}/water-resources/${id}`, data),
  deleteResource: (id) => api.delete(`${LAND_REGISTRY_BASE}/water-resources/${id}`),
};

export const geoBoundaryAPI = {
  getBoundaries: (params) => api.get(`${LAND_REGISTRY_BASE}/boundaries`, { params }),
  createBoundary: (data) => api.post(`${LAND_REGISTRY_BASE}/boundaries`, data),
  updateBoundary: (id, data) => api.put(`${LAND_REGISTRY_BASE}/boundaries/${id}`, data),
  deleteBoundary: (id) => api.delete(`${LAND_REGISTRY_BASE}/boundaries/${id}`),
};

export const surveyManagementAPI = {
  getSurveys: (params) => api.get(`${LAND_REGISTRY_BASE}/surveys`, { params }),
  createSurvey: (data) => api.post(`${LAND_REGISTRY_BASE}/surveys`, data),
  updateSurvey: (id, data) => api.put(`${LAND_REGISTRY_BASE}/surveys/${id}`, data),
  deleteSurvey: (id) => api.delete(`${LAND_REGISTRY_BASE}/surveys/${id}`),
};

export const dairyAIAPI = {
  getDairyAI: () => api.get('/dairy-ai'),
  analyzeDairy: (data) => api.post('/dairy-ai/analyze', data),
};

// Additional missing exports
export const financialAPI = {
  getFinancialData: () => api.get('/financial'),
  analyzeFinancials: (data) => api.post('/financial/analyze', data),
  // 2026-09-17: real, mounted at /api/financial (index.js requires
  // services/legacy/financialService.js's router directly) -> services/
  // finance/revenueService.js's getOverview(), a real DB-backed revenue
  // read (totalRevenue/pipelineValue/byStatus from revenue_contracts).
  // FinancialServicesDashboard.jsx calls financialAPI.getOverview(timeRange)
  // - note the real endpoint only returns totalRevenue/pipelineValue/
  // byStatus, not the activeLoans/activePolicies/etc. fields this page's
  // UI also renders; those honestly fall back to the page's own `|| 0`
  // defaults rather than being fabricated here. timeRange itself isn't a
  // real query param on this endpoint (it takes from/to/buyerId) - passed
  // through unused rather than invented a date-range conversion.
  getOverview: (timeRange) => api.get(`${UNVERSIONED_BASE}/api/financial/overview`, { params: { timeRange } }),
};

export const enterpriseControlAPI = {
  getEnterpriseControl: () => api.get('/enterprise-control'),
  controlEnterprise: (data) => api.post('/enterprise-control/control', data),
};

export const erpAPI = {
  getERPData: () => api.get('/erp'),
  manageERP: (data) => api.post('/erp/manage', data),
  // 2026-09-17: real, newly mounted at /api/v1/erp/status (services/
  // platform/erpService.js's own router, real DB-backed sync-state query
  // across products/orders/farmers/assets - see index.js). /api/erp is
  // already taken by a different, pre-existing erpService.js (legacy/),
  // hence the distinct /api/v1/erp prefix here. ExportDocumentationPage.jsx
  // calls this.
  getSyncStatus: () => api.get(`${UNVERSIONED_BASE}/api/v1/erp/status`),
};

export const fpoAPI = {
  getFPOs: () => api.get('/fpos'),
  getFPO: (id) => api.get(`/fpos/${id}`),
};

export const farmerHealthRecordsAPI = {
  getFarmerHealthRecords: () => api.get('/farmer-health-records'),
  createHealthRecord: (data) => api.post('/farmer-health-records', data),
};

export const farmerWelfareAPI = {
  getFarmerWelfare: () => api.get('/farmer-welfare'),
  manageWelfare: (data) => api.post('/farmer-welfare/manage', data),
  // 2026-09-17: real, newly mounted at /api/v1/farmer-health (routes/
  // agriculture/farmerHealthRoutes.js, fixed to require services/
  // farmerHealthService.js instead of the generic M029 scaffold it was
  // wired to before - see index.js). Real, DB-backed welfare program
  // catalog + enrollment (welfare_programs/welfare_enrollments tables,
  // migration 013). FarmerHealthWelfarePage.jsx calls both - enroll()
  // self-scopes to the caller's own farmerId unless admin, but the
  // frontend still sends farmerId for the admin case.
  getPrograms: () => api.get(`${UNVERSIONED_BASE}/api/v1/farmer-health/welfare-programs`),
  enroll: (farmerId, programId) => api.post(`${UNVERSIONED_BASE}/api/v1/farmer-health/welfare-enrollments`, { farmerId, programId }),
};

export const kycAPI = {
  getKYC: () => api.get('/kyc'),
  submitKYC: (data) => api.post('/kyc/submit', data),
  // 2026-09-17: real, DB-backed (services/farmerKycService.js, migration
  // 1003_farmer_kyc_applications.sql) router at routes/farmerKycRoutes.js -
  // never explicitly mounted in index.js, but reachable via the dynamic
  // route loader's own auto-mount at /api/v1/farmer-kyc (dynamicRouteLoader.js's
  // _toMountSegment strips the "Routes" suffix and kebab-cases the rest;
  // confirmed live by a direct standalone mount test, not assumed).
  // FarmerKycPage.jsx calls all four.
  getApplications: (params) => api.get('/farmer-kyc/applications', { params }),
  submitApplication: (data) => api.post('/farmer-kyc/applications', data),
  verifyApplication: (id, data) => api.put(`/farmer-kyc/applications/${id}/verify`, data),
  rejectApplication: (id, data) => api.put(`/farmer-kyc/applications/${id}/reject`, data),
};

export const farmerProfileAPI = {
  getFarmerProfile: () => api.get('/farmer-profile'),
  updateFarmerProfile: (data) => api.put('/farmer-profile', data),
};

export const farmerValueAPI = {
  getFarmerValue: () => api.get('/farmer-value'),
  calculateFarmerValue: (data) => api.post('/farmer-value/calculate', data),
};

export const farmerSkillAPI = {
  getFarmerSkills: () => api.get('/farmer-skills'),
  addFarmerSkill: (data) => api.post('/farmer-skills', data),
};

export const farmerVerificationAPI = {
  getFarmerVerifications: () => api.get('/farmer-verifications'),
  verifyFarmer: (data) => api.post('/farmer-verifications/verify', data),
  // 2026-09-17: real, DB-backed (services/farmerVerificationService.js,
  // migration 1002_farmer_verification_requests.sql) router at
  // routes/farmerVerificationRoutes.js - FarmerVerificationPage.jsx's own
  // backendNote claiming this "has not been built yet" is stale; never
  // explicitly mounted in index.js, but reachable via the dynamic route
  // loader's own auto-mount at /api/v1/farmer-verification (confirmed live
  // by a direct standalone mount test, not assumed). Page calls all four.
  getRequests: (params) => api.get('/farmer-verification/requests', { params }),
  submitRequest: (data) => api.post('/farmer-verification/requests', data),
  verifyRequest: (id, data) => api.put(`/farmer-verification/requests/${id}/verify`, data),
  rejectRequest: (id, data) => api.put(`/farmer-verification/requests/${id}/reject`, data),
};

// Additional missing exports for various pages
export const fertilizerAPI = {
  getFertilizers: () => api.get('/fertilizers'),
  manageFertilizer: (data) => api.post('/fertilizers/manage', data),
};

export const microFarmAPI = {
  getMicroFarms: () => api.get('/micro-farms'),
  manageMicroFarm: (data) => api.post('/micro-farms/manage', data),
};

// 2026-09-16: hatcheryManagementAPI/fishFeedAPI/fisheriesWaterQualityAPI/
// fisheriesHarvestAPI were pre-existing fabricated placeholders (generic
// getX()/manageX() hitting made-up paths like /hatchery-management/manage
// that never matched any backend route, and didn't match the real method
// names - getBatches/createBatch/etc - FisheriesManagementPage.jsx
// actually calls). Replaced with real endpoints against the new
// backend/src/routes/fisheriesRegistryRoutes.js (wraps 9
// createCrudService(...) objects in services/legacy/
// fisheriesManagementService.js that had real DB logic but no router).
const FISHERIES_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/fisheries-registry`;

export const hatcheryManagementAPI = {
  getBatches: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/hatcheries`, { params }),
  createBatch: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/hatcheries`, data),
  updateBatch: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/hatcheries/${id}`, data),
  deleteBatch: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/hatcheries/${id}`),
};

export const fishFeedAPI = {
  getLogs: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/feed-logs`, { params }),
  createLog: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/feed-logs`, data),
  updateLog: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/feed-logs/${id}`, data),
  deleteLog: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/feed-logs/${id}`),
};

export const fisheriesWaterQualityAPI = {
  getReadings: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/water-quality`, { params }),
  createReading: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/water-quality`, data),
  updateReading: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/water-quality/${id}`, data),
  deleteReading: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/water-quality/${id}`),
};

// Distinct from fishHealthAPI below (a different, unused, pre-existing
// fabricated export - left alone since nothing imports it).
export const fisheriesHealthAPI = {
  getFisheriesHealth: () => api.get('/fisheries-health'),
  monitorFisheriesHealth: (data) => api.post('/fisheries-health/monitor', data),
};

export const fisheriesHarvestAPI = {
  getHarvests: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/harvests`, { params }),
  createHarvest: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/harvests`, data),
  updateHarvest: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/harvests/${id}`, data),
  deleteHarvest: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/harvests/${id}`),
};

export const biofloccFarmAPI = {
  getTanks: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/biofloc-tanks`, { params }),
  createTank: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/biofloc-tanks`, data),
  updateTank: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/biofloc-tanks/${id}`, data),
  deleteTank: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/biofloc-tanks/${id}`),
};

export const fishHealthAPI = {
  getRecords: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/health-records`, { params }),
  createRecord: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/health-records`, data),
  updateRecord: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/health-records/${id}`, data),
  deleteRecord: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/health-records/${id}`),
};

export const fishProcessingAPI = {
  getBatches: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/processing-batches`, { params }),
  createBatch: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/processing-batches`, data),
  updateBatch: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/processing-batches/${id}`, data),
  deleteBatch: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/processing-batches/${id}`),
};

export const coldFishChainAPI = {
  getShipments: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/cold-chain-shipments`, { params }),
  createShipment: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/cold-chain-shipments`, data),
  updateShipment: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/cold-chain-shipments/${id}`, data),
  deleteShipment: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/cold-chain-shipments/${id}`),
};

export const aquacultureAnalyticsAPI = {
  getMetrics: (params) => api.get(`${FISHERIES_REGISTRY_BASE}/analytics`, { params }),
  createMetric: (data) => api.post(`${FISHERIES_REGISTRY_BASE}/analytics`, data),
  updateMetric: (id, data) => api.put(`${FISHERIES_REGISTRY_BASE}/analytics/${id}`, data),
  deleteMetric: (id) => api.delete(`${FISHERIES_REGISTRY_BASE}/analytics/${id}`),
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

// 2026-09-16: fixed a wrong POST path (was '/market-access/manage', a
// path that has never matched any backend route) - the real winning
// service (services/commerce/marketAccessService.js, confirmed via
// DynamicServiceLoader) only mounts GET / and POST / at /api/v1/market-access.
// Nothing in the frontend actually calls this export either way (checked),
// so this is a correctness fix, not a behavior change anyone will see yet.
export const marketAccessAPI = {
  getMarketAccess: () => api.get('/market-access'),
  manageMarketAccess: (data) => api.post('/market-access', data),
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
  // 2026-09-17: real, mounted at /api/blockchainverification (routes/
  // blockchainVerificationRoutes.js, newly wired to services/
  // blockchainVerificationService.js - queries the real
  // product_custody_transactions table, migration 072). BlockchainVerificationPage.jsx's
  // field usage (totalTransactions/uniqueProducts/currentBlockHeight/
  // authenticityScore/chainValid/custodyChain/...) matches this service's
  // response shape exactly.
  getStats: () => api.get(`${UNVERSIONED_BASE}/api/blockchainverification/stats`),
  verifyProduct: (productId) => api.get(`${UNVERSIONED_BASE}/api/blockchainverification/verify/${productId}`),
};

export const bulkOrderAPI = {
  getBulkOrders: () => api.get('/bulk-orders'),
  createBulkOrder: (data) => api.post('/bulk-orders', data),
};

export const caAPI = {
  getCAData: () => api.get('/ca'),
  manageCA: (data) => api.post('/ca/manage', data),
};

// 2026-09-15: this only had getOrders()/createOrder(), pointed at /orders
// (resolves under the /api/v1 base, which doesn't exist on the backend
// under that path). Real, live pages (CartPage, CheckoutPage,
// OrderDetailPage, PaymentProcessingPage, ProductDetailPage) call
// getCart/addToCart/updateCartItem/removeFromCart/getOrder/processPayment
// too - none of which existed here, all of which crash on first use.
// Rewritten against the real, now-mounted services/legacy/orderService.js
// router (/api/order) - every method below matches its real handler and
// body shape exactly. No DELETE /:id (cancel) exists on the real
// backend; not fabricated here.
const ORDER_BASE = `${UNVERSIONED_BASE}/api/order`;

export const ordersAPI = {
  getCart: () => api.get(`${ORDER_BASE}/cart`),
  addToCart: (data) => api.post(`${ORDER_BASE}/cart`, data),
  updateCartItem: (id, data) => api.put(`${ORDER_BASE}/cart/${id}`, data),
  removeFromCart: (id) => api.delete(`${ORDER_BASE}/cart/${id}`),
  clearCart: () => api.delete(`${ORDER_BASE}/cart`),
  createOrder: (data) => api.post(ORDER_BASE, data),
  getOrder: (id) => api.get(`${ORDER_BASE}/${id}`),
  getOrders: (filters, pagination) => api.get(ORDER_BASE, { params: { ...filters, ...pagination } }),
  updateOrderStatus: (id, data) => api.put(`${ORDER_BASE}/${id}/status`, data),
  processPayment: (id, data) => api.post(`${ORDER_BASE}/${id}/payment`, data),
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

// 2026-09-16: LivestockManagementPage.jsx imports these 4 under different
// names (getAnimals/getBatches vs listHerd, otherwise identical verbs) than
// the pigAPI/goatAPI/sheepAIAPI/poultryAIAPI objects above, which were wired
// earlier this session for PigFarmingPage.jsx/GoatFarmingPage.jsx/etc. Both
// sets of names point at the exact same real, mounted routes (goatRoutes.js,
// pigRoutes_merged.js, sheepRoutes_merged.js, poultryRoutes_merged.js) -
// verified directly against each route file's registered paths, not assumed.
export const goatFarmingAPI = {
  getAnimals: (params) => api.get(`${GOAT_BASE}/herd`, { params }),
  createAnimal: (data) => api.post(`${GOAT_BASE}/herd`, data),
  updateAnimal: (id, data) => api.put(`${GOAT_BASE}/herd/${id}`, data),
  deleteAnimal: (id) => api.delete(`${GOAT_BASE}/herd/${id}`),
};

export const pigFarmingAPI = {
  getAnimals: (params) => api.get(`${PIG_BASE}/herd`, { params }),
  createAnimal: (data) => api.post(`${PIG_BASE}/herd`, data),
  updateAnimal: (id, data) => api.put(`${PIG_BASE}/herd/${id}`, data),
  deleteAnimal: (id) => api.delete(`${PIG_BASE}/herd/${id}`),
};

export const sheepFarmingAPI = {
  getAnimals: (params) => api.get(`${SHEEP_BASE}/flock`, { params }),
  createAnimal: (data) => api.post(`${SHEEP_BASE}/flock`, data),
  updateAnimal: (id, data) => api.put(`${SHEEP_BASE}/flock/${id}`, data),
  deleteAnimal: (id) => api.delete(`${SHEEP_BASE}/flock/${id}`),
};

export const poultryManagementAPI = {
  getBatches: (params) => api.get(`${POULTRY_BASE}/flocks`, { params }),
  createBatch: (data) => api.post(`${POULTRY_BASE}/flocks`, data),
  updateBatch: (id, data) => api.put(`${POULTRY_BASE}/flocks/${id}`, data),
  deleteBatch: (id) => api.delete(`${POULTRY_BASE}/flocks/${id}`),
};

// 2026-09-16: verified live at /api/regionalvariety (unversioned, static
// mount in index.js via regionalVarietyRoutes_merged.js -> services/legacy
// /regionalVarietyService.js directly - no shadowing risk). Distinct from
// the older regionalVarietyAPI export elsewhere in this file, which hits a
// different path (/regional-variety) for a different page - do not merge.
const VARIETY_DIRECTORY_BASE = `${UNVERSIONED_BASE}/api/regionalvariety`;
export const varietyDirectoryAPI = {
  list: (params) => api.get(VARIETY_DIRECTORY_BASE, { params }),
  getCategories: () => api.get(`${VARIETY_DIRECTORY_BASE}/categories`),
  requestImage: (id) => api.post(`${VARIETY_DIRECTORY_BASE}/${id}/generate-image`),
  createListing: (id, data) => api.post(`${VARIETY_DIRECTORY_BASE}/${id}/create-listing`, data),
};

// 2026-09-16: householdEconomyAPI/sharedInfrastructureAPI/ruralFinanceAPI/
// mobilityRidesAPI/machineryAccessAPI are all imported by
// REOSDashboardPage.jsx (and MachineryManagementPage.jsx for the last one)
// but none is ever actually called there yet (only 6 of REOSDashboardPage's
// 13 imported REOS API objects are wired into a useQuery - these 5 fall
// through to a generic "select a tab" placeholder). Wiring them anyway
// because Vite/rolldown's MISSING_EXPORT check fires on the import
// statement itself, regardless of call-site usage - an unused-but-real
// export still fixes a real build error, and all 5 verified against a
// genuine, live, DynamicServiceLoader-confirmed-winning setupRoutes()
// implementation (not fabricated to match a call site that doesn't exist).
export const householdEconomyAPI = {
  getRecords: (params) => api.get('/household-economy', { params }),
  createRecord: (data) => api.post('/household-economy', data),
};

// Distinct from sharedInfraAPI above (services/legacy/sharedInfraService.js,
// /api/v1/shared-infra) - this is a separate real backend,
// services/legacy/sharedInfrastructureService.js, mounted at
// /api/v1/shared-infrastructure. Don't merge the two.
export const sharedInfrastructureAPI = {
  getAccess: (accessId) => api.get(`/shared-infrastructure/access/${accessId}`),
  getAccessByVillage: (villageId) => api.get(`/shared-infrastructure/access/village/${villageId}`),
  getAccessByType: (infrastructureType) => api.get(`/shared-infrastructure/access/type/${infrastructureType}`),
  getVillageSummary: (villageId) => api.get(`/shared-infrastructure/access/village/${villageId}/summary`),
  requestAccess: (data) => api.post('/shared-infrastructure/access', data),
};

export const ruralFinanceAPI = {
  list: (params) => api.get('/rural-finance', { params }),
  get: (id) => api.get(`/rural-finance/${id}`),
  apply: (data) => api.post('/rural-finance', data),
  disburse: (id, data) => api.post(`/rural-finance/${id}/disburse`, data),
  repay: (id, data) => api.post(`/rural-finance/${id}/repay`, data),
  checkRefinance: (id) => api.get(`/rural-finance/${id}/refinance-check`),
};

export const mobilityRidesAPI = {
  getRide: (rideId) => api.get(`/mobility-rides/rides/${rideId}`),
  getRidesByVillage: (villageId) => api.get(`/mobility-rides/rides/village/${villageId}`),
  getRidesByDriver: (driverId) => api.get(`/mobility-rides/rides/driver/${driverId}`),
  requestRide: (data) => api.post('/mobility-rides/rides', data),
  updateRideStatus: (rideId, data) => api.put(`/mobility-rides/rides/${rideId}/status`, data),
  getStatistics: () => api.get('/mobility-rides/rides/statistics'),
};

export const machineryAccessAPI = {
  listBookings: (params) => api.get('/machinery-access', { params }),
  createBooking: (data) => api.post('/machinery-access', data),
  completeBooking: (id) => api.post(`/machinery-access/${id}/complete`),
  getUtilization: (machineryId) => api.get(`/machinery-access/machinery/${machineryId}/utilization`),
};

// 2026-09-16: services/legacy/livestockManagementService.js had real,
// working createCrudService(...) logic for these 3 LivestockManagementPage.jsx
// tabs but no Express router at all - wrote backend/src/routes/
// livestockRegistryRoutes.js to wrap them (mounted at
// /api/livestock-registry, unversioned to match the goat/pig/sheep/
// poultry precedent and avoid colliding with the dynamic route loader's
// own /api/v1/livestock-registry auto-mount of the same file).
const LIVESTOCK_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/livestock-registry`;
export const cattleRegistryAPI = {
  getAnimals: (params) => api.get(`${LIVESTOCK_REGISTRY_BASE}/cattle`, { params }),
  createAnimal: (data) => api.post(`${LIVESTOCK_REGISTRY_BASE}/cattle`, data),
  updateAnimal: (id, data) => api.put(`${LIVESTOCK_REGISTRY_BASE}/cattle/${id}`, data),
  deleteAnimal: (id) => api.delete(`${LIVESTOCK_REGISTRY_BASE}/cattle/${id}`),
};

export const feedManagementAPI = {
  getRecords: (params) => api.get(`${LIVESTOCK_REGISTRY_BASE}/feed`, { params }),
  createRecord: (data) => api.post(`${LIVESTOCK_REGISTRY_BASE}/feed`, data),
  updateRecord: (id, data) => api.put(`${LIVESTOCK_REGISTRY_BASE}/feed/${id}`, data),
  deleteRecord: (id) => api.delete(`${LIVESTOCK_REGISTRY_BASE}/feed/${id}`),
};

export const livestockAnalyticsAPI = {
  getRecords: (params) => api.get(`${LIVESTOCK_REGISTRY_BASE}/analytics`, { params }),
  createRecord: (data) => api.post(`${LIVESTOCK_REGISTRY_BASE}/analytics`, data),
  updateRecord: (id, data) => api.put(`${LIVESTOCK_REGISTRY_BASE}/analytics/${id}`, data),
  deleteRecord: (id) => api.delete(`${LIVESTOCK_REGISTRY_BASE}/analytics/${id}`),
};

// 2026-09-16: services/legacy/operationsManagementService.js had real,
// working createCrudService(...) logic for these 8 OperationsManagementPage.jsx
// tabs but no Express router at all - wrote backend/src/routes/
// operationsRegistryRoutes.js to wrap them (mounted at
// /api/operations-registry, unversioned, same convention as the
// livestock/fisheries registries above).
const OPERATIONS_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/operations-registry`;
export const farmActivityAPI = {
  getActivities: (params) => api.get(`${OPERATIONS_REGISTRY_BASE}/activities`, { params }),
  createActivity: (data) => api.post(`${OPERATIONS_REGISTRY_BASE}/activities`, data),
  updateActivity: (id, data) => api.put(`${OPERATIONS_REGISTRY_BASE}/activities/${id}`, data),
  deleteActivity: (id) => api.delete(`${OPERATIONS_REGISTRY_BASE}/activities/${id}`),
};

export const farmTaskAPI = {
  getTasks: (params) => api.get(`${OPERATIONS_REGISTRY_BASE}/tasks`, { params }),
  createTask: (data) => api.post(`${OPERATIONS_REGISTRY_BASE}/tasks`, data),
  updateTask: (id, data) => api.put(`${OPERATIONS_REGISTRY_BASE}/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`${OPERATIONS_REGISTRY_BASE}/tasks/${id}`),
};

export const contractorManagementAPI = {
  getContractors: (params) => api.get(`${OPERATIONS_REGISTRY_BASE}/contractors`, { params }),
  createContractor: (data) => api.post(`${OPERATIONS_REGISTRY_BASE}/contractors`, data),
  updateContractor: (id, data) => api.put(`${OPERATIONS_REGISTRY_BASE}/contractors/${id}`, data),
  deleteContractor: (id) => api.delete(`${OPERATIONS_REGISTRY_BASE}/contractors/${id}`),
};

export const machineryOperationsAPI = {
  getOperations: (params) => api.get(`${OPERATIONS_REGISTRY_BASE}/machinery-operations`, { params }),
  createOperation: (data) => api.post(`${OPERATIONS_REGISTRY_BASE}/machinery-operations`, data),
  updateOperation: (id, data) => api.put(`${OPERATIONS_REGISTRY_BASE}/machinery-operations/${id}`, data),
  deleteOperation: (id) => api.delete(`${OPERATIONS_REGISTRY_BASE}/machinery-operations/${id}`),
};

export const equipmentSchedulingAPI = {
  getSchedules: (params) => api.get(`${OPERATIONS_REGISTRY_BASE}/equipment-schedules`, { params }),
  createSchedule: (data) => api.post(`${OPERATIONS_REGISTRY_BASE}/equipment-schedules`, data),
  updateSchedule: (id, data) => api.put(`${OPERATIONS_REGISTRY_BASE}/equipment-schedules/${id}`, data),
  deleteSchedule: (id) => api.delete(`${OPERATIONS_REGISTRY_BASE}/equipment-schedules/${id}`),
};

export const inputConsumptionAPI = {
  getRecords: (params) => api.get(`${OPERATIONS_REGISTRY_BASE}/input-consumption`, { params }),
  createRecord: (data) => api.post(`${OPERATIONS_REGISTRY_BASE}/input-consumption`, data),
  updateRecord: (id, data) => api.put(`${OPERATIONS_REGISTRY_BASE}/input-consumption/${id}`, data),
  deleteRecord: (id) => api.delete(`${OPERATIONS_REGISTRY_BASE}/input-consumption/${id}`),
};

export const farmProductivityAPI = {
  getMetrics: (params) => api.get(`${OPERATIONS_REGISTRY_BASE}/productivity-metrics`, { params }),
  createMetric: (data) => api.post(`${OPERATIONS_REGISTRY_BASE}/productivity-metrics`, data),
  updateMetric: (id, data) => api.put(`${OPERATIONS_REGISTRY_BASE}/productivity-metrics/${id}`, data),
  deleteMetric: (id) => api.delete(`${OPERATIONS_REGISTRY_BASE}/productivity-metrics/${id}`),
};

export const farmOperationsDashboardAPI = {
  getKpis: (params) => api.get(`${OPERATIONS_REGISTRY_BASE}/dashboard-kpis`, { params }),
  createKpi: (data) => api.post(`${OPERATIONS_REGISTRY_BASE}/dashboard-kpis`, data),
  updateKpi: (id, data) => api.put(`${OPERATIONS_REGISTRY_BASE}/dashboard-kpis/${id}`, data),
  deleteKpi: (id) => api.delete(`${OPERATIONS_REGISTRY_BASE}/dashboard-kpis/${id}`),
};

// 2026-09-16: same pattern - services/legacy/horticultureManagementService.js
// had real createCrudService(...) logic for these 7 remaining
// HorticultureManagementPage.jsx tabs (hydroponicsAPI, above, was the
// 8th) but no Express router at all - wired against
// backend/src/routes/horticultureRegistryRoutes.js.
export const vegetableProductionAPI = {
  getRecords: (params) => api.get(`${HORTICULTURE_REGISTRY_BASE}/vegetable-production`, { params }),
  createRecord: (data) => api.post(`${HORTICULTURE_REGISTRY_BASE}/vegetable-production`, data),
  updateRecord: (id, data) => api.put(`${HORTICULTURE_REGISTRY_BASE}/vegetable-production/${id}`, data),
  deleteRecord: (id) => api.delete(`${HORTICULTURE_REGISTRY_BASE}/vegetable-production/${id}`),
};

export const floricultureAPI = {
  getRecords: (params) => api.get(`${HORTICULTURE_REGISTRY_BASE}/floriculture`, { params }),
  createRecord: (data) => api.post(`${HORTICULTURE_REGISTRY_BASE}/floriculture`, data),
  updateRecord: (id, data) => api.put(`${HORTICULTURE_REGISTRY_BASE}/floriculture/${id}`, data),
  deleteRecord: (id) => api.delete(`${HORTICULTURE_REGISTRY_BASE}/floriculture/${id}`),
};

export const polyhouseAPI = {
  getRecords: (params) => api.get(`${HORTICULTURE_REGISTRY_BASE}/polyhouses`, { params }),
  createRecord: (data) => api.post(`${HORTICULTURE_REGISTRY_BASE}/polyhouses`, data),
  updateRecord: (id, data) => api.put(`${HORTICULTURE_REGISTRY_BASE}/polyhouses/${id}`, data),
  deleteRecord: (id) => api.delete(`${HORTICULTURE_REGISTRY_BASE}/polyhouses/${id}`),
};

export const aeroponicsAPI = {
  getSystems: (params) => api.get(`${HORTICULTURE_REGISTRY_BASE}/aeroponic-systems`, { params }),
  createSystem: (data) => api.post(`${HORTICULTURE_REGISTRY_BASE}/aeroponic-systems`, data),
  updateSystem: (id, data) => api.put(`${HORTICULTURE_REGISTRY_BASE}/aeroponic-systems/${id}`, data),
  deleteSystem: (id) => api.delete(`${HORTICULTURE_REGISTRY_BASE}/aeroponic-systems/${id}`),
};

export const precisionHorticultureAPI = {
  getReadings: (params) => api.get(`${HORTICULTURE_REGISTRY_BASE}/precision-readings`, { params }),
  createReading: (data) => api.post(`${HORTICULTURE_REGISTRY_BASE}/precision-readings`, data),
  updateReading: (id, data) => api.put(`${HORTICULTURE_REGISTRY_BASE}/precision-readings/${id}`, data),
  deleteReading: (id) => api.delete(`${HORTICULTURE_REGISTRY_BASE}/precision-readings/${id}`),
};

export const protectedCultivationAPI = {
  getStructures: (params) => api.get(`${HORTICULTURE_REGISTRY_BASE}/protected-structures`, { params }),
  createStructure: (data) => api.post(`${HORTICULTURE_REGISTRY_BASE}/protected-structures`, data),
  updateStructure: (id, data) => api.put(`${HORTICULTURE_REGISTRY_BASE}/protected-structures/${id}`, data),
  deleteStructure: (id) => api.delete(`${HORTICULTURE_REGISTRY_BASE}/protected-structures/${id}`),
};

export const horticultureAnalyticsAPI = {
  getMetrics: (params) => api.get(`${HORTICULTURE_REGISTRY_BASE}/analytics`, { params }),
  createMetric: (data) => api.post(`${HORTICULTURE_REGISTRY_BASE}/analytics`, data),
  updateMetric: (id, data) => api.put(`${HORTICULTURE_REGISTRY_BASE}/analytics/${id}`, data),
  deleteMetric: (id) => api.delete(`${HORTICULTURE_REGISTRY_BASE}/analytics/${id}`),
};

// 2026-09-16: services/legacy/inputSupplyManagementService.js had real
// createCrudService(...) logic for these 8 InputSupplyManagementPage.jsx
// tabs but no Express router at all - wired against
// backend/src/routes/inputSupplyRegistryRoutes.js.
const INPUT_SUPPLY_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/input-supply-registry`;
export const biofertilizerAPI = {
  getItems: (params) => api.get(`${INPUT_SUPPLY_REGISTRY_BASE}/biofertilizer`, { params }),
  createItem: (data) => api.post(`${INPUT_SUPPLY_REGISTRY_BASE}/biofertilizer`, data),
  updateItem: (id, data) => api.put(`${INPUT_SUPPLY_REGISTRY_BASE}/biofertilizer/${id}`, data),
  deleteItem: (id) => api.delete(`${INPUT_SUPPLY_REGISTRY_BASE}/biofertilizer/${id}`),
};

export const pesticideInventoryAPI = {
  getItems: (params) => api.get(`${INPUT_SUPPLY_REGISTRY_BASE}/pesticide-inventory`, { params }),
  createItem: (data) => api.post(`${INPUT_SUPPLY_REGISTRY_BASE}/pesticide-inventory`, data),
  updateItem: (id, data) => api.put(`${INPUT_SUPPLY_REGISTRY_BASE}/pesticide-inventory/${id}`, data),
  deleteItem: (id) => api.delete(`${INPUT_SUPPLY_REGISTRY_BASE}/pesticide-inventory/${id}`),
};

export const bioPesticideAPI = {
  getItems: (params) => api.get(`${INPUT_SUPPLY_REGISTRY_BASE}/bio-pesticide`, { params }),
  createItem: (data) => api.post(`${INPUT_SUPPLY_REGISTRY_BASE}/bio-pesticide`, data),
  updateItem: (id, data) => api.put(`${INPUT_SUPPLY_REGISTRY_BASE}/bio-pesticide/${id}`, data),
  deleteItem: (id) => api.delete(`${INPUT_SUPPLY_REGISTRY_BASE}/bio-pesticide/${id}`),
};

export const micronutrientAPI = {
  getItems: (params) => api.get(`${INPUT_SUPPLY_REGISTRY_BASE}/micronutrient`, { params }),
  createItem: (data) => api.post(`${INPUT_SUPPLY_REGISTRY_BASE}/micronutrient`, data),
  updateItem: (id, data) => api.put(`${INPUT_SUPPLY_REGISTRY_BASE}/micronutrient/${id}`, data),
  deleteItem: (id) => api.delete(`${INPUT_SUPPLY_REGISTRY_BASE}/micronutrient/${id}`),
};

export const organicInputAPI = {
  getItems: (params) => api.get(`${INPUT_SUPPLY_REGISTRY_BASE}/organic-input`, { params }),
  createItem: (data) => api.post(`${INPUT_SUPPLY_REGISTRY_BASE}/organic-input`, data),
  updateItem: (id, data) => api.put(`${INPUT_SUPPLY_REGISTRY_BASE}/organic-input/${id}`, data),
  deleteItem: (id) => api.delete(`${INPUT_SUPPLY_REGISTRY_BASE}/organic-input/${id}`),
};

export const inputProcurementAPI = {
  getOrders: (params) => api.get(`${INPUT_SUPPLY_REGISTRY_BASE}/procurement-orders`, { params }),
  createOrder: (data) => api.post(`${INPUT_SUPPLY_REGISTRY_BASE}/procurement-orders`, data),
  updateOrder: (id, data) => api.put(`${INPUT_SUPPLY_REGISTRY_BASE}/procurement-orders/${id}`, data),
  deleteOrder: (id) => api.delete(`${INPUT_SUPPLY_REGISTRY_BASE}/procurement-orders/${id}`),
};

export const inputDistributionAPI = {
  getRecords: (params) => api.get(`${INPUT_SUPPLY_REGISTRY_BASE}/distribution-records`, { params }),
  createRecord: (data) => api.post(`${INPUT_SUPPLY_REGISTRY_BASE}/distribution-records`, data),
  updateRecord: (id, data) => api.put(`${INPUT_SUPPLY_REGISTRY_BASE}/distribution-records/${id}`, data),
  deleteRecord: (id) => api.delete(`${INPUT_SUPPLY_REGISTRY_BASE}/distribution-records/${id}`),
};

export const inputTraceabilityAPI = {
  getRecords: (params) => api.get(`${INPUT_SUPPLY_REGISTRY_BASE}/traceability-records`, { params }),
  createRecord: (data) => api.post(`${INPUT_SUPPLY_REGISTRY_BASE}/traceability-records`, data),
  updateRecord: (id, data) => api.put(`${INPUT_SUPPLY_REGISTRY_BASE}/traceability-records/${id}`, data),
  deleteRecord: (id) => api.delete(`${INPUT_SUPPLY_REGISTRY_BASE}/traceability-records/${id}`),
};

// 2026-09-16: services/legacy/identityManagementService.js (a
// pre-existing file from before this whole session, "Phase 2
// Auto-Implementation", 2026-09-04) had real createCrudService(...)
// logic for these 6 IdentityManagementPage.jsx tabs but no Express
// router at all - wrote backend/src/routes/identityRegistryRoutes.js to
// wrap them (mounted at /api/identity-registry). sessionManagement has
// no create method (sessions come from login, not manual creation,
// matching the page's own tab - no "add" form is offered there either).
const IDENTITY_REGISTRY_BASE = `${UNVERSIONED_BASE}/api/identity-registry`;

export const permissionManagementAPI = {
  getPermissions: (params) => api.get(`${IDENTITY_REGISTRY_BASE}/permissions`, { params }),
  createPermission: (data) => api.post(`${IDENTITY_REGISTRY_BASE}/permissions`, data),
  updatePermission: (id, data) => api.put(`${IDENTITY_REGISTRY_BASE}/permissions/${id}`, data),
  deletePermission: (id) => api.delete(`${IDENTITY_REGISTRY_BASE}/permissions/${id}`),
};

export const ssoAPI = {
  getProviders: (params) => api.get(`${IDENTITY_REGISTRY_BASE}/sso-providers`, { params }),
  createProvider: (data) => api.post(`${IDENTITY_REGISTRY_BASE}/sso-providers`, data),
  updateProvider: (id, data) => api.put(`${IDENTITY_REGISTRY_BASE}/sso-providers/${id}`, data),
  deleteProvider: (id) => api.delete(`${IDENTITY_REGISTRY_BASE}/sso-providers/${id}`),
};

export const mfaManagementAPI = {
  getDevices: (params) => api.get(`${IDENTITY_REGISTRY_BASE}/mfa-devices`, { params }),
  createDevice: (data) => api.post(`${IDENTITY_REGISTRY_BASE}/mfa-devices`, data),
  updateDevice: (id, data) => api.put(`${IDENTITY_REGISTRY_BASE}/mfa-devices/${id}`, data),
  deleteDevice: (id) => api.delete(`${IDENTITY_REGISTRY_BASE}/mfa-devices/${id}`),
};

export const digitalIdentityAPI = {
  getIdentities: (params) => api.get(`${IDENTITY_REGISTRY_BASE}/digital-identities`, { params }),
  createIdentity: (data) => api.post(`${IDENTITY_REGISTRY_BASE}/digital-identities`, data),
  updateIdentity: (id, data) => api.put(`${IDENTITY_REGISTRY_BASE}/digital-identities/${id}`, data),
  deleteIdentity: (id) => api.delete(`${IDENTITY_REGISTRY_BASE}/digital-identities/${id}`),
};

export const consentManagementAPI = {
  getRecords: (params) => api.get(`${IDENTITY_REGISTRY_BASE}/consent-records`, { params }),
  createRecord: (data) => api.post(`${IDENTITY_REGISTRY_BASE}/consent-records`, data),
  updateRecord: (id, data) => api.put(`${IDENTITY_REGISTRY_BASE}/consent-records/${id}`, data),
  deleteRecord: (id) => api.delete(`${IDENTITY_REGISTRY_BASE}/consent-records/${id}`),
};

export const sessionManagementAPI = {
  getSessions: (params) => api.get(`${IDENTITY_REGISTRY_BASE}/sessions`, { params }),
  updateSession: (id, data) => api.put(`${IDENTITY_REGISTRY_BASE}/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`${IDENTITY_REGISTRY_BASE}/sessions/${id}`),
};

// 2026-09-16: RolePermissionPage.jsx's own comment claims "/api/v1/roles
// returns {roles, total} unwrapped" - checked live, that path doesn't
// exist anywhere. The real, already-mounted implementation is
// routes/roleManagementRoutes.js -> services/legacy/roleManagementService.js
// at the unversioned /api/rolemanagement (direct require, no
// loader/shadowing risk) - confirmed getRoles() really does return
// {roles, total} matching the page's expected shape, just at a
// different path than the page's stale comment claims. Only
// listRoles/createRole are wired: listPermissions/getPermissionMatrix/
// getRoleHierarchy/recommendRoleForUser have no matching method
// anywhere in roleManagementService.js (checked directly) - genuine
// gaps, left undefined rather than fabricated.
const ROLE_MANAGEMENT_BASE = `${UNVERSIONED_BASE}/api/rolemanagement`;
export const rolePermissionAPI = {
  listRoles: (params) => api.get(ROLE_MANAGEMENT_BASE, { params }),
  createRole: (data) => api.post(ROLE_MANAGEMENT_BASE, data),
};

// 2026-09-16: services/legacy/informationSharingService.js is a real,
// complete in-memory service matching InformationSharingPage.jsx's
// ActionCard calls almost exactly - wired against the new
// backend/src/routes/informationSharingRegistryRoutes.js.
const INFORMATION_SHARING_BASE = `${UNVERSIONED_BASE}/api/information-sharing-registry`;
// 2026-09-16: routes/logisticsEnhancements_merged.js was already
// mounted and real (fleet/tracking/temperature/warehouse), but 3 of
// LogisticsEnhancementPage.jsx's ActionCards (driver location tracking)
// had no route even though logisticsEnhancementService.js already
// implemented all 3 real, DB-backed methods - added the missing routes
// to that same already-mounted file rather than writing a new one.
const LOGISTICS_ENHANCEMENT_BASE = `${UNVERSIONED_BASE}/api/logisticsenhancements`;
export const logisticsEnhancementAPI = {
  addVehicle: (data) => api.post(`${LOGISTICS_ENHANCEMENT_BASE}/fleet`, data),
  getFleet: (params) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/fleet`, { params }),
  getVehicle: (vehicleId) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/fleet/${vehicleId}`),
  updateVehicle: (vehicleId, data) => api.put(`${LOGISTICS_ENHANCEMENT_BASE}/fleet/${vehicleId}`, data),
  scheduleMaintenance: (vehicleId, data) => api.post(`${LOGISTICS_ENHANCEMENT_BASE}/fleet/${vehicleId}/maintenance`, data),
  updateTracking: (shipmentId, data) => api.post(`${LOGISTICS_ENHANCEMENT_BASE}/shipments/${shipmentId}/tracking`, data),
  getTracking: (shipmentId) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/shipments/${shipmentId}/tracking`),
  getLiveTracking: (shipmentId) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/shipments/${shipmentId}/live-tracking`),
  setGeofence: (shipmentId, data) => api.post(`${LOGISTICS_ENHANCEMENT_BASE}/shipments/${shipmentId}/geofence`, data),
  recordTemperature: (shipmentId, data) => api.post(`${LOGISTICS_ENHANCEMENT_BASE}/shipments/${shipmentId}/temperature`, data),
  getTemperatureData: (shipmentId, params) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/shipments/${shipmentId}/temperature`, { params }),
  getTemperatureAlerts: (shipmentId) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/shipments/${shipmentId}/temperature-alerts`),
  createWarehouse: (data) => api.post(`${LOGISTICS_ENHANCEMENT_BASE}/warehouses`, data),
  getWarehouses: (params) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/warehouses`, { params }),
  addInventory: (warehouseId, data) => api.post(`${LOGISTICS_ENHANCEMENT_BASE}/warehouses/${warehouseId}/inventory`, data),
  getWarehouseInventory: (warehouseId) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/warehouses/${warehouseId}/inventory`),
  recordDriverLocation: (data) => api.post(`${LOGISTICS_ENHANCEMENT_BASE}/drivers/location`, data),
  getActiveDrivers: (params) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/drivers/active`, { params }),
  getShipmentTrail: (id) => api.get(`${LOGISTICS_ENHANCEMENT_BASE}/shipments/${id}/trail`),
};

// 2026-09-16: services/legacy/platformConfigurationService.js's
// getOptimizedRecommendations/applyOptimizedConfiguration were real and
// DB-backed but had zero route - routes/platformConfigurationRoutes.js
// used to be an unrelated dead stub. Rewrote that file to route to the
// real service; wired here. Note: PlatformFoundationPage.jsx reads
// `configRecommendations.optimizedConfig` when calling
// applyConfiguration, but the real getRecommendations() response field
// is `recommendedConfig` (not `optimizedConfig`) - a pre-existing
// page-level field-name mismatch, not something this client fix can
// paper over; same class of known page-logic gap as pigAPI/goatAPI's
// getHerdPerformance() id mismatch documented earlier this session, not
// fixed here.
export const platformConfigurationAPI = {
  getRecommendations: () => api.get(`${UNVERSIONED_BASE}/api/platformconfiguration/recommendations`),
  applyConfiguration: (config) => api.post(`${UNVERSIONED_BASE}/api/platformconfiguration/apply`, config),
};

// 2026-09-16: services/publicDataExtractorService.js's listSources/
// registerSource/extractDataset were real, DB-backed, and genuinely
// security-conscious (HTTPS-only, allowed-hosts validation, response
// size limits) but had zero route - routes/publicDataRoutes.js used to
// be an unrelated dead stub. Rewrote that file to route to the real
// service; wired here.
export const publicDataAPI = {
  listSources: () => api.get(`${UNVERSIONED_BASE}/api/publicdata/sources`),
  registerSource: (data) => api.post(`${UNVERSIONED_BASE}/api/publicdata/sources`, data),
  extract: (sourceId, filter) => api.post(`${UNVERSIONED_BASE}/api/publicdata/sources/${sourceId}/extract`, filter),
};

// 2026-09-16: services/legacy/erpService.js already exports a real
// router (GET /status, POST /sync/bulk, etc.) already mounted at
// /api/erp - ERPDashboardPage.jsx's erpDashboardAPI.getSyncStatus()/
// .triggerSync() just never had a frontend client. Only these 2 of the
// page's 7 methods match: getDashboard/getGLEntries/getReconciliation/
// getFinancialReports/resolveConflict have no matching endpoint
// anywhere in this file - checked directly, genuine gaps, not
// fabricated.
export const erpDashboardAPI = {
  getSyncStatus: () => api.get(`${UNVERSIONED_BASE}/api/erp/status`),
  triggerSync: (syncType) => api.post(`${UNVERSIONED_BASE}/api/erp/sync/bulk`, { entity_type: syncType }),
};

export const informationSharingAPI = {
  getDocuments: (params) => api.get(`${INFORMATION_SHARING_BASE}/documents`, { params }),
  getDocument: (documentId) => api.get(`${INFORMATION_SHARING_BASE}/documents/${documentId}`),
  searchDocuments: (q, filters) => api.get(`${INFORMATION_SHARING_BASE}/documents/search`, { params: { q, ...filters } }),
  createDocument: (data) => api.post(`${INFORMATION_SHARING_BASE}/documents`, data),
  updateDocument: (documentId, data) => api.put(`${INFORMATION_SHARING_BASE}/documents/${documentId}`, data),
  deleteDocument: (documentId) => api.delete(`${INFORMATION_SHARING_BASE}/documents/${documentId}`),
  getFolders: (params) => api.get(`${INFORMATION_SHARING_BASE}/folders`, { params }),
  getFolderTree: (rootId) => api.get(`${INFORMATION_SHARING_BASE}/folders/tree`, { params: { rootId } }),
  createFolder: (data) => api.post(`${INFORMATION_SHARING_BASE}/folders`, data),
  getPermissions: (resourceId, resourceType) => api.get(`${INFORMATION_SHARING_BASE}/permissions`, { params: { resourceId, resourceType } }),
  setPermission: (data) => api.post(`${INFORMATION_SHARING_BASE}/permissions`, data),
  checkPermission: (resourceId, userId, permission) => api.get(`${INFORMATION_SHARING_BASE}/permissions/check`, { params: { resourceId, userId, permission } }),
  createSharingLink: (data) => api.post(`${INFORMATION_SHARING_BASE}/sharing-links`, data),
  accessSharingLink: (token) => api.get(`${INFORMATION_SHARING_BASE}/sharing-links/access`, { params: { token } }),
  getCollaborationSessions: (params) => api.get(`${INFORMATION_SHARING_BASE}/collaboration-sessions`, { params }),
  createCollaborationSession: (data) => api.post(`${INFORMATION_SHARING_BASE}/collaboration-sessions`, data),
  joinCollaborationSession: (sessionId, userId) => api.post(`${INFORMATION_SHARING_BASE}/collaboration-sessions/${sessionId}/join`, { userId }),
  endCollaborationSession: (sessionId) => api.post(`${INFORMATION_SHARING_BASE}/collaboration-sessions/${sessionId}/end`),
  generateAIRecommendations: (userId, context) => api.post(`${INFORMATION_SHARING_BASE}/ai-recommendations`, { userId, context }),
  getActivityLogs: (resourceId) => api.get(`${INFORMATION_SHARING_BASE}/activity-logs`, { params: { resourceId } }),
  getAnalytics: () => api.get(`${INFORMATION_SHARING_BASE}/analytics`),
  getHealthStatus: () => api.get(`${INFORMATION_SHARING_BASE}/health-status`),
};

// 2026-09-16: routes/platform/organizationManagementRoutes_merged.js is
// a real, in-memory CRUD implementation that was never require()'d
// anywhere - the mounted route at /api/organizationmanagement used to be
// a dead "Route operational" stub. Swapped in index.js; wired here
// against the real endpoints (unversioned - matches the stub's own
// unversioned mount path).
export const organizationManagementAPI = {
  getAllOrganizations: (params) => api.get(`${UNVERSIONED_BASE}/api/organizationmanagement`, { params }),
  createOrganization: (data) => api.post(`${UNVERSIONED_BASE}/api/organizationmanagement`, data),
  deleteOrganization: (id) => api.delete(`${UNVERSIONED_BASE}/api/organizationmanagement/${id}`),
};

// 2026-09-16: controllers/platformTelemetryController.js was a real,
// working controller (backed by services/legacy/platformTelemetryService.js)
// that was never actually wired to a route - routes/platformTelemetryRoutes.js
// used to be an unrelated dead stub. Rewrote that file to route to the
// real controller; wired here.
export const platformTelemetryAPI = {
  getStatus: () => api.get(`${UNVERSIONED_BASE}/api/platformtelemetry/status`),
  getAnalytics: () => api.get(`${UNVERSIONED_BASE}/api/platformtelemetry/analytics`),
};

// 2026-09-15: AdvancedMedicalCodingPage.jsx imports { api } (named) and
// calls it directly with relative paths (api.get('/advanced-medical-coding/...'))
// rather than through a dedicated *API object - only a default export
// existed. Its relative paths already resolve correctly under this
// file's own /api/v1 baseURL against the real, now-mounted
// services/advancedMedicalCodingService.js (mounted at
// /api/v1/advanced-medical-coding in index.js specifically to match this
// page - see the fourteenth TODO backlog update).
// 2026-09-16: the 31 names below were the last remaining MISSING_EXPORT
// build errors after this session's wiring pass (started at 161).
// Every one was individually checked against real backend method names
// (not filename matches) - full per-name investigation trail is in
// .ai/tasks/AGENT_ASSIGNMENTS.md and .ai/tasks/2026-09-15-nextgen-vision-todo.md
// (Updates 33-38). Two categories, both genuinely blocked on new backend/
// product work rather than a wiring fix:
//   - ~16 trace to backend/src/modules/ (the M0xx scaffold tree): the
//     routes/controller shape often matches the frontend, but every
//     module's service.js hardcodes `this.table` to a completely wrong,
//     unrelated table (e.g. M141 Orchard -> `releases`), with model.sql
//     an empty placeholder - not safe to wire without a real migration.
//   - The rest have no matching backend implementation anywhere in the
//     codebase, confirmed directly (not by absence of a filename match).
// Exported as empty objects rather than left undefined so the static
// build (which fails the whole bundle on any missing export, not just
// the page that needs it) can succeed - each page's own calls into these
// still fail loudly at the one call site that needs them, same as
// pestForecastingAPI above, rather than silently returning fabricated
// data. Do not add methods here without a confirmed real backend route.
export const assetLifecycleAPI = {};
export const breakdownMaintenanceAPI = {};
export const climateMonitoringAPI = {};
export const competitorAPI = {};
export const decisionEngineAPI = {};
export const enterpriseMemoryAPI = {};
export const equipmentInventoryAPI = {};
export const equipmentRentalAPI = {};
export const fleetManagementAPI = {};
export const fuelManagementAPI = {};
export const governmentAPI = {};
export const implementManagementAPI = {};
export const irrigationAPI = {};
export const medicalCodingAPI = {};
export const nutritionIntelligenceAPI = {};
export const operationsAPI = {};
export const orchardAPI = {};
export const pondAPI = {};
export const preventiveMaintenanceAPI = {};
export const pushNotificationsAPI = {};
export const rainwaterHarvestingAPI = {};
export const securityAccessControlAPI = {};
export const shgAPI = {};
export const soilTestingOpsAPI = {};
export const sparePartsAPI = {};
export const userManagementAPI = {};
export const waterAnalyticsAPI = {};
export const waterBudgetingAPI = {};
export const waterQualityAPI = {};
export const watershedManagementAPI = {};
export const yieldAPI = {};

// 2026-09-16: SalesReportPage.jsx was hardcoded (totalRevenue: 1250000,
// fake top products/farmers). Found a real, mounted, matching endpoint:
// `controllers/ecommerceBusinessSalesController.js`'s `getSalesAnalytics`
// (backed by `services/legacy/ecommerceBusinessSalesService.js`, a real
// query over `orders`/`order_items`/`product_listings`), routed at
// `GET /api/ecommercebusinesssales/sales-analytics` (mounted in
// backend/src/index.js). Returns `{success, filters, summary:
// {total_orders, total_revenue, unique_customers, total_quantity},
// daily_data: [...]}` directly (`res.json(result)`, no envelope wrapper)
// - verified by reading the controller and service directly, not
// guessed. No `topProducts`/`topFarmers`/`growthRate` exist in this
// response, so SalesReportPage.jsx only renders the real summary +
// daily_data fields, nothing invented.
const ECOMMERCE_BUSINESS_SALES_BASE = `${UNVERSIONED_BASE}/api/ecommercebusinesssales`;
export const salesAnalyticsAPI = {
  getSalesAnalytics: (params) => api.get(`${ECOMMERCE_BUSINESS_SALES_BASE}/sales-analytics`, { params }),
};

export { api };

export default api;