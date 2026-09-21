import api from './api';

/**
 * Village ERP Control Center API
 *
 * Wires to the real backend endpoint mounted by DynamicRouteLoader from
 * backend/src/routes/gapClosureOperationalRoutes.js ("gapClosureOperationalRoutes"
 * -> "gap-closure-operational"), which returns
 * { success, readiness: { readiness_score, dimensions, methodology, generated_at } }.
 * This file was missing entirely (broke the production build); created to match
 * that real, already-implemented backend contract rather than fabricating data.
 */
export async function getVillageReadiness(villageId) {
  const response = await api.get(`/gap-closure-operational/villages/${encodeURIComponent(villageId)}/readiness`);
  return response.data.readiness;
}
