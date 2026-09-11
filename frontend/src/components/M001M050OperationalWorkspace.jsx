import React,{useEffect,useState} from 'react';
import {getOperationalWorkspace} from '../services/m001m050OperationalApi';
import './M001M050OperationalWorkspace.css';
export default function M001M050OperationalWorkspace({moduleCode,children}){
 const [w,setW]=useState(null),[error,setError]=useState(''),[tab,setTab]=useState('overview');
 useEffect(()=>{let alive=true;getOperationalWorkspace(moduleCode).then(x=>alive&&setW(x)).catch(e=>alive&&setError(e.message));return()=>{alive=false};},[moduleCode]);
 return <div className="mops-shell">
  <header className="mops-header"><div><p className="mops-eyebrow">{moduleCode} operational ERP workspace</p><h1>{w?.name||moduleCode}</h1><p>{w?`${w.domain} · authoritative workflow + ERP + decision support`:'Loading operational context…'}</p></div><div className="mops-actions"><button type="button" onClick={()=>setTab('workflow')}>Workflow</button><button type="button" onClick={()=>setTab('decisions')}>Decisions</button><button type="button" onClick={()=>setTab('audit')}>Audit</button></div></header>
  {error&&<div role="alert" className="mops-alert">Operational workspace unavailable: {error}</div>}
  {w&&<><section className="mops-kpis">{w.kpis.map(k=><article key={k}><span>{k.replaceAll('_',' ')}</span><strong>Live source</strong><small>Calculated by authoritative module/API</small></article>)}</section>
  <nav className="mops-tabs" aria-label="Module workspace sections"><button onClick={()=>setTab('overview')}>Operations</button><button onClick={()=>setTab('workflow')}>Workflow</button><button onClick={()=>setTab('visuals')}>Visualisation</button><button onClick={()=>setTab('decisions')}>Decision centre</button><button onClick={()=>setTab('controls')}>ERP controls</button><button onClick={()=>setTab('audit')}>Evidence & audit</button></nav>
  <section className="mops-context">
   {tab==='overview'&&<div className="mops-grid">{w.workspace.map(x=><article key={x}><h3>{x.replaceAll('_',' ')}</h3><p>Domain operational surface; uses existing module data and service operations.</p></article>)}</div>}
   {tab==='workflow'&&<ol className="mops-flow">{w.workflow.map((x,i)=><li key={x}><span>{i+1}</span>{x.replaceAll('_',' ')}</li>)}</ol>}
   {tab==='visuals'&&<div className="mops-grid">{w.visualizations.map(x=><article key={x}><h3>{x.replaceAll('_',' ')}</h3><p>Visualization contract. Populate from module API; no fabricated metrics.</p></article>)}</div>}
   {tab==='decisions'&&<div><h2>Decision centre</h2>{w.decisions.map(x=><article className="mops-decision" key={x}><strong>{x.replaceAll('_',' ')}</strong><p>Human accountable. AI may analyse, simulate and recommend; it cannot commit consequential actions.</p></article>)}</div>}
   {tab==='controls'&&<div className="mops-grid">{w.erpControls.map(x=><article key={x}><h3>{x.replaceAll('_',' ')}</h3></article>)}</div>}
   {tab==='audit'&&<div><h2>Evidence & audit</h2><p>Correlation ID, actor, source record, approval, exception history, AI evidence and outcome feedback belong here.</p></div>}
  </section></>}
  <main className="mops-domain-page">{children}</main>
 </div>;
}
