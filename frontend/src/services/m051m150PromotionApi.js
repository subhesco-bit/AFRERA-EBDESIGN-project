import api from './api';
export async function getM051M150Profile(moduleCode){const r=await api.get(`/m051m150-enterprise-promotion/${moduleCode}/profile`);return r.data?.data;}
export async function getM051M150Overview(moduleCode){const r=await api.get(`/m051m150-enterprise-promotion/${moduleCode}/overview`);return r.data?.data;}
