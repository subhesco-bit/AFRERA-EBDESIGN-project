// Component-facing adapter. API ownership remains in services/api.js.
export { default } from './api';
export * from './api';

// Additional component-specific API exports
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

// ---------------------------------------------------------------------------
// CLIENTS NEVER WRITTEN IN THIS FILE (added 2026-09-23) — same situation and
// same treatment as the block at the end of services/api.js: these names are
// imported by components here but were never exported, so the production build
// stopped on them. Each method rejects, naming itself, without sending a
// request; the method lists are extracted from the real call sites.
// ---------------------------------------------------------------------------
function notWiredComponent(clientName, methodNames) {
  const reject = (method) => () => Promise.reject(new Error(
    `${clientName}.${method}() is not wired: this API client was never implemented. `
    + 'No request was sent.',
  ));
  return methodNames.reduce(
    (client, method) => Object.assign(client, { [method]: reject(method) }),
    { __notWired: true, __clientName: clientName, __methods: methodNames },
  );
}

export const aiAPI = notWiredComponent('aiAPI', ['collaboration', 'copilot']);
export const arVrAPI = notWiredComponent('arVrAPI', ['getExperiences', 'getInteractionPoints']);
export const authAPI = notWiredComponent('authAPI', ['login', 'register', 'setup2FA']);
export const blockchainTraceabilityAPI = notWiredComponent('blockchainTraceabilityAPI', ['getTraceabilityEvents', 'verifyChainOfCustody']);
export const consumerHealthAPI = notWiredComponent('consumerHealthAPI', ['getBMI', 'getDietaryRecommendations', 'getHealthGoals', 'getHealthMetrics', 'getHealthProfiles']);
export const custodyAPI = notWiredComponent('custodyAPI', ['getChain']);
export const farmerPortalAPI = notWiredComponent('farmerPortalAPI', ['addLandRecord', 'getLandRecords', 'syncGovernmentLandRecords']);
export const foodIntelligenceAPI = notWiredComponent('foodIntelligenceAPI', ['getActiveRecalls']);
export const giIntelligenceAPI = notWiredComponent('giIntelligenceAPI', ['verifyAuthentication']);
export const insuranceAPI = notWiredComponent('insuranceAPI', ['calculatePremiumByType', 'createPolicy', 'generateQuote', 'getClaims', 'getInsuranceProducts', 'getPolicies', 'submitClaim']);
export const iotAPI = notWiredComponent('iotAPI', ['getDevices', 'getSensorData', 'getUnacknowledgedAlerts']);
export const knowledgeGraphAPI = notWiredComponent('knowledgeGraphAPI', ['getRelatedNodes', 'searchNodes']);
export const laboratoryERPAPI = notWiredComponent('laboratoryERPAPI', ['getLaboratories', 'getTestCategories', 'getTestMethods', 'registerSample']);
export const libraryAPI = notWiredComponent('libraryAPI', ['getModule', 'getModules', 'getStatistics', 'initialize', 'search', 'verifyCatalog']);
export const logisticsAPI = notWiredComponent('logisticsAPI', ['getLiveTracking', 'getShipments', 'getTemperatureAlerts', 'getTemperatureData']);
export const marketplaceAPI = notWiredComponent('marketplaceAPI', ['calculateOrderGST', 'calculateProductGST', 'generateGstInvoice', 'getProductReviewStats', 'getProductReviews', 'getUserReviews', 'markReviewHelpful', 'submitReview']);
export const mfaAPI = notWiredComponent('mfaAPI', ['setup', 'verify']);
export const moduleAPI = notWiredComponent('moduleAPI', ['execute', 'getOperations']);
export const notificationAPI = notWiredComponent('notificationAPI', ['getNotifications', 'markAllAsRead', 'markAsRead']);
export const nutritionAPI = notWiredComponent('nutritionAPI', ['generateRecipe', 'getDietaryProfiles', 'getNutritionScore', 'getProductNutrition', 'getValuePerNutrient', 'getWellnessPractices']);
export const organicTraceabilityAPI = notWiredComponent('organicTraceabilityAPI', ['getConsumerTransparency', 'getStandards', 'registerFarm']);
export const predictiveAnalyticsAPI = notWiredComponent('predictiveAnalyticsAPI', ['getDemandForecast', 'getForecasts', 'getPredictions', 'getPricingPrediction', 'getUnacknowledgedAlerts']);
export const privacyAPI = notWiredComponent('privacyAPI', ['recordConsent']);
