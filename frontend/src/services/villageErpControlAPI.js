import api from './api';

/**
 * Village ERP Control Center (API Client)
 * Backs GET /api/v1/gap-closure-operational/villages/:villageId/readiness
 * (backend/src/routes/gapClosureOperationalRoutes.js)
 */
export const getVillageReadiness = async (villageId) => {
  const { data } = await api.get(`/gap-closure-operational/villages/${villageId}/readiness`);
  return data.readiness;
};

export default { getVillageReadiness };
