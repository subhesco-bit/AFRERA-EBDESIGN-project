import React,{useEffect,useState} from 'react';

export default function M051M100ProductionWiredPanel({moduleCode,apiBase='/api/m051-m100-wiring'}){
 const [module,setModule]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
 useEffect(()=>{let live=true;setLoading(true);fetch(`${apiBase}/inventory`).then(r=>r.ok?r.json():Promise.reject(new Error(`HTTP ${r.status}`))).then(x=>{if(live)setModule((x.modules||[]).find(m=>m.code===moduleCode)||null);}).catch(e=>{if(live)setError(e.message);}).finally(()=>live&&setLoading(false));return()=>{live=false;};},[moduleCode,apiBase]);
 if(loading)return <section aria-busy="true">Loading {moduleCode} production controls…</section>;
 if(error)return <section role="alert">Unable to load {moduleCode}: {error}</section>;
 if(!module)return <section role="alert">Module {moduleCode} is not registered.</section>;
 return <section aria-label={`${moduleCode} production controls`}><h3>{module.code} — {module.name}</h3><p>Domain: {module.domain||'Agricultural/FPO operations'}</p><dl><dt>Backend service</dt><dd>{module.serviceExists?'Connected':'Missing'}</dd><dt>Controller</dt><dd>{module.controllerExists?'Connected':'Missing'}</dd><dt>UI</dt><dd>{module.uiExists?'Connected':'Missing'}</dd></dl></section>;
}
