import api from './api';
export async function getEnterprise541Profile(moduleCode){const r=await api.get(`/enterprise-promotion541/${moduleCode}/profile`);return r.data?.data;}
export async function getEnterprise541Overview(moduleCode){const r=await api.get(`/enterprise-promotion541/${moduleCode}/overview`);return r.data?.data;}
export async function getEnterprise541Portfolio(start=1,end=541){const r=await api.get('/enterprise-promotion541/portfolio',{params:{start,end}});return r.data?.data||[];}
