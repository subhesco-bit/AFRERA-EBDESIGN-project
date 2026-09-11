import React,{useEffect,useState} from 'react';
import { getVillageReadiness } from '../services/villageErpControlAPI';

export default function VillageErpControlCenter(){
 const [villageId,setVillageId]=useState('');const [data,setData]=useState(null);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const load=async()=>{if(!villageId.trim())return;setLoading(true);setError('');try{setData(await getVillageReadiness(villageId.trim()));}catch(e){setError(e?.message||'Unable to load village readiness');}finally{setLoading(false);}};
 useEffect(()=>{if(villageId)load();},[]);
 return <main aria-labelledby="village-erp-title"><h1 id="village-erp-title">Village ERP Control Center</h1><p>Operational readiness across household, assets, services, skills, hazards, connectivity and natural resources.</p>
 <form onSubmit={e=>{e.preventDefault();load();}}><label htmlFor="village-id">Village ID</label><input id="village-id" value={villageId} onChange={e=>setVillageId(e.target.value)} placeholder="Enter village ID" required/><button type="submit" disabled={loading}>{loading?'Loading…':'Assess readiness'}</button></form>
 {error&&<div role="alert">{error}</div>}
 {data&&<section aria-live="polite"><h2>Readiness: {data.readiness_score}%</h2><dl>{Object.entries(data.dimensions||{}).map(([k,v])=><div key={k}><dt>{k.replaceAll('_',' ')}</dt><dd>{v}</dd></div>)}</dl><small>Method: {data.methodology} · Generated: {data.generated_at}</small></section>}
 </main>;
}
