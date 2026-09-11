import React,{useEffect,useState} from 'react';

export default function M001M050ProductionWiredPanel({moduleCode,apiBase='/api/m001-m050-production-integration'}){
 const [module,setModule]=useState(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  let live=true;
  setLoading(true);
  fetch(`${apiBase}/${moduleCode}/readiness`,{credentials:'include'})
   .then(r=>r.ok?r.json():Promise.reject(new Error(`HTTP ${r.status}`)))
   .then(x=>{if(live)setModule(x.module||null);})
   .catch(e=>{if(live)setError(e.message);})
   .finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[moduleCode,apiBase]);
 if(loading)return <section aria-busy="true">Checking {moduleCode} production readiness…</section>;
 if(error)return <section role="alert">Unable to verify {moduleCode}: {error}</section>;
 if(!module)return <section role="alert">No production evidence is registered for {moduleCode}.</section>;
 return (
  <section aria-label={`${moduleCode} production readiness`} className="mt-4 rounded border p-4">
   <h3>{module.code} — {module.name}</h3>
   <p>Domain: {module.domain}</p>
   <p><strong>Runtime state:</strong> {module.certificationState}</p>
   <dl>
    <dt>Service</dt><dd>{module.assets?.service?.exists&&!module.assets?.service?.placeholder?'Connected':'Repair required'}</dd>
    <dt>Controller</dt><dd>{module.assets?.controller?.exists&&!module.assets?.controller?.placeholder?'Connected':'Repair required'}</dd>
    <dt>Routes</dt><dd>{module.assets?.routes?.exists&&!module.assets?.routes?.placeholder?'Connected':'Repair required'}</dd>
    <dt>Database model</dt><dd>{module.assets?.model?.exists&&!module.assets?.model?.placeholder?'Connected':'Repair required'}</dd>
    <dt>UI</dt><dd>{module.assets?.page?.exists&&!module.assets?.page?.placeholder?'Connected':'Repair required'}</dd>
    <dt>Executable service operations</dt><dd>{module.serviceExports?.length||0}</dd>
   </dl>
   {module.missing?.length>0&&<p role="alert">Missing: {module.missing.join(', ')}</p>}
   {module.placeholders?.length>0&&<p role="alert">Placeholder assets: {module.placeholders.join(', ')}</p>}
   {module.loadError&&<p role="alert">Service load error: {module.loadError}</p>}
  </section>
 );
}
