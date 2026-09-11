import api from './api';
export async function getOperationalWorkspace(moduleCode){const r=await api.get(`/m001m050-operational-experience/${moduleCode}/workspace`);return r.data?.workspace||r.data?.data?.workspace;}
