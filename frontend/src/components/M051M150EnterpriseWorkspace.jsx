import React,{useEffect,useState} from 'react';
import {getM051M150Overview} from '../services/m051m150PromotionApi';

function Label({children}){return <span style={{display:'inline-block',padding:'3px 8px',border:'1px solid currentColor',borderRadius:999,fontSize:12,marginRight:6,marginBottom:6}}>{children}</span>;}
export default function M051M150EnterpriseWorkspace({moduleCode,children}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[tab,setTab]=useState('operations');
 useEffect(()=>{let live=true;setError('');getM051M150Overview(moduleCode).then(x=>live&&setData(x)).catch(e=>live&&setError(e.message));return()=>{live=false};},[moduleCode]);
 const p=data?.promotion,r=data?.runtime;
 const tabs=['operations','workflow','visualization','work_queue','decisions','erp_controls','integrations','evidence_audit','ai_assist'];
 return <section data-enterprise-promotion-range="M051-M150" data-module-code={moduleCode}>
  <header style={{padding:'20px 0 12px'}}>
   <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><strong>{moduleCode} Enterprise Product Workspace</strong>{p&&<Label>{p.maturity.state.replaceAll('_',' ')} · {p.maturity.score}/100</Label>}{p&&<Label>{p.domainFamily.replaceAll('_',' ')}</Label>}</div>
   <h1 style={{margin:'8px 0'}}>{p?.name||moduleCode}</h1>
   <p>Authoritative domain implementation + ERP workflow + governed decisions + evidence-backed analytics + enterprise UX.</p>
   {error&&<div role="alert">Promotion profile unavailable: {error}</div>}
  </header>
  {p&&<>
   <nav aria-label={`${moduleCode} enterprise workspace`} style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>{tabs.map(x=><button type="button" key={x} onClick={()=>setTab(x)} aria-pressed={tab===x}>{x.replaceAll('_',' ')}</button>)}</nav>
   <section aria-live="polite" style={{border:'1px solid #d0d5dd',borderRadius:12,padding:16,marginBottom:18}}>
    {tab==='operations'&&<><h2>Operational product</h2><div>{p.pages.map(x=><Label key={x}>{x.replaceAll('_',' ')}</Label>)}</div><p>Implementation maturity is derived from real backend/frontend artifacts. Strong existing services remain authoritative; thin modules are explicitly flagged for promotion.</p>{p.promotionGaps.length>0&&<div role="status"><strong>Promotion gaps:</strong> {p.promotionGaps.join(', ')}</div>}</>}
    {tab==='workflow'&&<><h2>Workflow</h2><ol>{p.workflow.map(x=><li key={x}>{x.replaceAll('_',' ')}</li>)}</ol></>}
    {tab==='visualization'&&<><h2>Visualization</h2>{p.visualizations.map(x=><article key={x}><strong>{x.replaceAll('_',' ')}</strong><p>Uses authoritative API/KPI sources; no fabricated values.</p></article>)}</>}
    {tab==='work_queue'&&<><h2>Work queue</h2><p>Tasks, priority, owner, SLA, blocked state and entity linkage are provided by the shared enterprise runtime.</p>{r?.tasks?.map((x,i)=><Label key={i}>{x.status} · {x.priority} · {x.count}</Label>)}</>}
    {tab==='decisions'&&<><h2>Decision centre</h2>{p.decisionControls.map(x=><Label key={x}>{x.replaceAll('_',' ')}</Label>)}<p>AI may recommend or simulate; accountable approval remains human and maker/checker controlled.</p></>}
    {tab==='erp_controls'&&<><h2>ERP controls</h2>{p.erpControls.map(x=><Label key={x}>{x.replaceAll('_',' ')}</Label>)}</>}
    {tab==='integrations'&&<><h2>Integrations</h2>{p.integrations.map(x=><Label key={x}>{x.replaceAll('_',' ')}</Label>)}</>}
    {tab==='evidence_audit'&&<><h2>Evidence & audit</h2><p>Correlation ID, actor, source record, approval history, KPI provenance, workflow evidence, overrides and outcome feedback are mandatory release evidence.</p></>}
    {tab==='ai_assist'&&<><h2>Governed intelligence</h2>{p.ai.capabilities.map(x=><Label key={x}>{x.replaceAll('_',' ')}</Label>)}<p>Grounded data, evidence, confidence, insufficient-data behavior, human override and audit trace are required.</p></>}
   </section>
  </>}
  <main>{children}</main>
 </section>;
}
