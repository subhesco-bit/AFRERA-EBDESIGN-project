import api from './api';
export async function getEnterpriseModuleDefinition(moduleCode){const r=await api.get(`/enterprise-module550-runtime/${moduleCode}/definition`);return r.data?.data;}
export async function getEnterpriseModuleOverview(moduleCode){const r=await api.get(`/enterprise-module550-runtime/${moduleCode}/overview`);return r.data?.data;}
export async function createEnterpriseTask(moduleCode,payload){const r=await api.post(`/enterprise-module550-runtime/${moduleCode}/tasks`,payload);return r.data?.data;}
export async function createEnterpriseWorkflow(moduleCode,payload){const r=await api.post(`/enterprise-module550-runtime/${moduleCode}/workflows`,payload);return r.data?.data;}
export async function transitionEnterpriseWorkflow(moduleCode,id,payload){const r=await api.post(`/enterprise-module550-runtime/${moduleCode}/workflows/${id}/transition`,payload);return r.data?.data;}
export async function queueEnterpriseDecision(moduleCode,payload){const r=await api.post(`/enterprise-module550-runtime/${moduleCode}/decisions`,payload);return r.data?.data;}
