import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

const villageClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

villageClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const moduleURL = (operation, id) => id === undefined ? `/backend-modules/M041/${operation}` : `/backend-modules/M041/${operation}/${id}`;
const restURL = (path) => `/m041${path}`;

export const villageAPI = {
  getVillages: (params = {}) => villageClient.get(moduleURL('getVillages'), { params }),
  getVillage: (id) => villageClient.get(moduleURL('getVillage', id)),
  createVillage: (data) => villageClient.post(moduleURL('createVillage'), data),
  updateVillage: (id, data) => villageClient.put(moduleURL('updateVillage', id), data),
  deleteVillage: (id) => villageClient.delete(moduleURL('deleteVillage', id)),
  addVillageResource: (id, data) => villageClient.post(moduleURL('addVillageResource'), { villageId: id, ...data }),
  getVillageAnalytics: (id) => villageClient.get(moduleURL('getVillageAnalytics', id)),

  // Village ERP / accounting
  getVillageFinance: (id) => villageClient.get(moduleURL('getVillageFinance', id)),
  initializeFinance: (id) => villageClient.post(moduleURL('initializeFinance', id)),
  postVillageJournal: (id, data) => villageClient.post(moduleURL('postVillageJournal', id), data),

  // Village master entities
  listHouseholds: (id, params = {}) => villageClient.get(moduleURL('listHouseholds', id), { params }),
  createHousehold: (id, data) => villageClient.post(moduleURL('createHousehold', id), data),
  addHouseholdMember: (householdId, data) => villageClient.post(moduleURL('addHouseholdMember', householdId), data),
  listEnterprises: (id) => villageClient.get(moduleURL('listEnterprises', id)),
  createEnterprise: (id, data) => villageClient.post(moduleURL('createEnterprise', id), data),
  listBudgets: (id) => villageClient.get(moduleURL('listBudgets', id)),
  createBudget: (id, data) => villageClient.post(moduleURL('createBudget', id), data),
  getERPOverview: (id) => villageClient.get(moduleURL('getERPOverview', id)),

  // Operations and workflow
  getDashboard: (id) => villageClient.get(moduleURL('getDashboard', id)),
  upsertKPI: (id, data) => villageClient.post(moduleURL('upsertKPI', id), data),
  createTask: (id, data) => villageClient.post(moduleURL('createTask', id), data),
  updateTask: (taskId, data) => villageClient.patch(moduleURL('updateTask', taskId), data),

  // AI decision support
  generateAIInsights: (id, data = {}) => villageClient.post(moduleURL('generateAI', id), data),

  // Village Project Design / DPR / Estimate / Funding / Subsidy Intelligence
  listProjects: (villageId, params = {}) => villageClient.get(moduleURL('listProjects', villageId), { params }),
  createProject: (villageId, data) => villageClient.post(moduleURL('createProject', villageId), data),
  getProject: (projectId) => villageClient.get(moduleURL('getProject', projectId)),
  createEstimate: (projectId, data) => villageClient.post(moduleURL('createEstimate', projectId), data),
  addFundingSource: (projectId, data) => villageClient.post(moduleURL('addFundingSource', projectId), data),
  matchSubsidies: (projectId) => villageClient.post(moduleURL('matchSubsidies', projectId)),
  getSubsidyAIContext: (projectId) => villageClient.get(moduleURL('buildSubsidyAIContext', projectId)),
  upsertSchemeCatalogue: (data) => villageClient.post(moduleURL('upsertScheme'), data),

  // Village economy: production -> household/village consumption -> surplus -> market
  getEconomicBalance: (villageId, params = {}) => villageClient.get(restURL(`/villages/${villageId}/economy/balance`), { params }),
  recordProduction: (villageId, data) => villageClient.post(restURL(`/villages/${villageId}/economy/production`), data),
  recordEconomicFlow: (villageId, data) => villageClient.post(restURL(`/villages/${villageId}/economy/flows`), data),

  // GIS / geolocation / logistics
  getVillageGeo: (villageId) => villageClient.get(restURL(`/villages/${villageId}/geolocation`)),
  updateVillageGeo: (villageId, data) => villageClient.put(restURL(`/villages/${villageId}/geolocation`), data),
  getNearestFacilities: (villageId, types) => villageClient.get(restURL(`/villages/${villageId}/logistics/nearest`), { params: types ? { types: types.join(',') } : {} }),
  upsertLogisticsFacility: (data) => villageClient.post(restURL('/logistics/facilities'), data),

  // Geographic roll-up
  getDistrictSummary: (district) => villageClient.get(`/backend-modules/M041/districtSummary/${encodeURIComponent(district)}`),
};

export default villageAPI;
