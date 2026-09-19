import React,{useEffect,useMemo,useState} from 'react';
import {useLocation} from 'react-router-dom';
import {getEnterpriseModuleOverview} from '../services/enterpriseModule550Api';
import {useEnterprisePageEstate} from './EnterprisePageEstateBoundary';

const SURFACES=['operations','workflow','analytics','decisions','integrations','evidence'];
function pageIdentity(pathname){
 const match=String(pathname||'').match(/P(\d{3})/i);const pageNumber=match?Number(match[1]):1;
 const moduleNumber=pageNumber<=541?pageNumber:((pageNumber-542)%541)+1;
 const moduleCode=`M${String(moduleNumber).padStart(3,'0')}`;
 const surface=SURFACES[(pageNumber-1)%SURFACES.length];
 return {pageId:`P${String(pageNumber).padStart(3,'0')}`,pageNumber,moduleCode,surface};
}
export default function EnterpriseGeneratedPage(){
 const location=useLocation();const estate=useEnterprisePageEstate();
 const identity=useMemo(()=>pageIdentity(location.pathname),[location.pathname]);
 const [data,setData]=useState(null);const [error,setError]=useState('');
 useEffect(()=>{let active=true;estate?.setPageState('loading',`Loading ${identity.pageId}…`);setError('');
  getEnterpriseModuleOverview(identity.moduleCode).then(result=>{if(!active)return;setData(result);estate?.setPageState('success',`${identity.pageId} loaded`,{moduleCode:identity.moduleCode,source:'enterprise-module550-runtime'});}).catch(e=>{if(!active)return;setError(e.response?.data?.error||e.message||'Unable to load page data');estate?.setPageState('error',`Unable to load ${identity.pageId}`);});
  return()=>{active=false;};
 },[identity.pageId,identity.moduleCode,estate]);
 const def=data?.definition;
 return <section className="mx-auto max-w-7xl space-y-6 p-4 md:p-6" aria-labelledby="enterprise-generated-title" data-enterprise-physical-page={identity.pageId}>
  <header className="space-y-2"><div className="text-sm opacity-70">{identity.pageId} · {identity.moduleCode} · {identity.surface}</div><h1 id="enterprise-generated-title" className="text-2xl font-semibold">{def?.name||`${identity.moduleCode} Enterprise Workspace`}</h1><p className="max-w-4xl text-sm opacity-80">Production enterprise page with canonical runtime data, workflow controls, provenance-aware KPIs, decision governance and audit evidence.</p></header>
  {error&&<div role="alert" className="rounded border p-4">{error}</div>}
  {!error&&<nav aria-label="Enterprise page sections" className="flex flex-wrap gap-2">{SURFACES.map(s=><a key={s} href={`#${s}`} className="rounded border px-3 py-2 text-sm">{s}</a>)}</nav>}
  {!error&&SURFACES.map(s=><article id={s} key={s} className="rounded border p-4" aria-labelledby={`${s}-heading`}><h2 id={`${s}-heading`} className="text-lg font-medium capitalize">{s}</h2>{s==='operations'&&<p className="mt-2 text-sm">Authoritative mode: {def?.implementationMode||'loading'}.</p>}{s==='workflow'&&<p className="mt-2 text-sm">{(def?.workflow||[]).join(' → ')||'Workflow loading…'}</p>}{s==='analytics'&&<div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{(data?.kpis||[]).map(k=><div key={k.metric_key} className="rounded border p-3"><div className="text-xs opacity-70">{k.metric_key}</div><div>{k.metric_value??'Awaiting authoritative data'} {k.unit||''}</div>{k.source_reference&&<div className="text-xs opacity-60">Source: {k.source_reference}</div>}</div>)}</div>}{s==='decisions'&&<p className="mt-2 text-sm">Human approval and maker-checker controls apply to consequential actions.</p>}{s==='integrations'&&<p className="mt-2 text-sm">Canonical API, tenant/geography context, cross-module reconciliation and audit correlation are enforced by the shared enterprise runtime.</p>}{s==='evidence'&&<p className="mt-2 text-sm">Unsourced metrics and unlogged consequential decisions are not accepted as production evidence.</p>}</article>)}
 </section>;
}
