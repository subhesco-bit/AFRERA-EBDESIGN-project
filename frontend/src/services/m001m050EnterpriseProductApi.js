import api from './api';
export const getEnterpriseSpec=async c=>(await api.get(`/m001m050-enterprise-product/${c}/spec`)).data.spec;
export const getEnterpriseKpis=async c=>(await api.get(`/m001m050-enterprise-product/${c}/kpis`)).data.kpis;
export const getTaskSummary=async c=>(await api.get(`/m001m050-enterprise-product/${c}/tasks/summary`)).data.summary;
export const createOperationalTask=async(c,p)=>(await api.post(`/m001m050-enterprise-product/${c}/tasks`,p)).data.task;
export const updateOperationalTask=async(c,id,p)=>(await api.patch(`/m001m050-enterprise-product/${c}/tasks/${id}`,p)).data.task;