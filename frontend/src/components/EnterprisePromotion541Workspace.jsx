import React,{useEffect,useState} from 'react';
import {getEnterprise541Overview} from '../services/enterprisePromotion541Api';
function Chip({children}){return <span style={{display:'inline-block',padding:'3px 8px',border:'1px solid currentColor',borderRadius:999,fontSize:12,marginRight:6,marginBottom:6}}>{children}</span>;}
export default function EnterprisePromotion541Workspace({moduleCode,children}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[tab,setTab]=useState('operations');
 useEffect(()=>{let active=true;setError('');getEnterprise541Overview(moduleCode).then(v=>active&&setData(v)).catch(e=>active&&setError(e.message));return()=>{active=false};},[moduleCode]);
 const p=data?.promotion,r=data?.runtime;
 const tabs=['operations','workflow','visualization','work_queue','decision_center','erp_controls','integrations','evidence_audit','ai_assist','certification'];
 return <section data-enterprise-standard="M001-M541" data-module-code={moduleCode}>
  <header style={{padding:'16px 0 10px'}}>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}><strong>{moduleCode} Enterprise Standard</strong>{p&&<Chip>{p.domainFamily.replaceAll('_',' ')}</Chip>}{p&&<Chip>{p.maturity.state.replaceAll('_',' ')} · {p.maturity.score}/100</Chip>}</div>
   <p style={{margin:'8px 0'}}>Uniform ERP, UX, workflow, decision, visualization, evidence, integration and governed-intelligence standard across M001–M541.</p>
   {error&&<div role="alert">Enterprise profile unavailable: {error}</div>}
  </header>
  {p&&<>
   <nav aria-label={`${moduleCode} enterprise standard`} style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>{tabs.map(x=><button type="button" key={x} onClick={()=>setTab(x)} aria-pressed={tab===x}>{x.replaceAll('_',' ')}</button>)}</nav>
   <section aria-live="polite" style={{border:'1px solid #d0d5dd',borderRadius:12,padding:16,marginBottom:16}}>
    {tab==='operations'&&<><h2>Operational product</h2>{p.pages.map(x=><Chip key={x}>{x.replaceAll('_',' ')}</Chip>)}<p>Existing bespoke services/pages remain authoritative. Missing or shallow implementations are surfaced as promotion gaps, not hidden by the runtime.</p>{p.promotionGaps.length>0&&<p><strong>Promotion gaps:</strong> {p.promotionGaps.join(', ')}</p>}</>}
    {tab==='workflow'&&<><h2>Workflow</h2><ol>{p.workflow.map(x=><li key={x}>{x.replaceAll('_',' ')}</li>)}</ol></>}
    {tab==='visualization'&&<><h2>Visualization</h2>{p.visualizations.map(x=><article key={x}><strong>{x.replaceAll('_',' ')}</strong><p>Must bind to authoritative data with drill-down and provenance.</p></article>)}</>}
    {tab==='work_queue'&&<><h2>Work queue & SLA</h2><p>Entity-linked tasks, priority, assignment, due dates, blocked state and escalation use the shared persisted runtime.</p>{r?.tasks?.map((x,i)=><Chip key={i}>{x.status} · {x.priority} · {x.count}</Chip>)}</>}
    {tab==='decision_center'&&<><h2>Decision centre</h2>{p.decisionControls.map(x=><Chip key={x}>{x.replaceAll('_',' ')}</Chip>)}<p>Consequential actions remain human approved with maker-checker and segregation of duties.</p></>}
    {tab==='erp_controls'&&<><h2>ERP controls</h2>{p.erpControls.map(x=><Chip key={x}>{x.replaceAll('_',' ')}</Chip>)}</>}
    {tab==='integrations'&&<><h2>Integrations & graph</h2>{p.integrations.map(x=><Chip key={x}>{x.replaceAll('_',' ')}</Chip>)}<p>Knowledge graph: {p.knowledgeGraph.relationships.join(' · ')}</p></>}
    {tab==='evidence_audit'&&<><h2>Evidence & audit</h2><p>Every state change and decision must retain actor, correlation, reason, evidence, source provenance, override history and measurable outcome.</p></>}
    {tab==='ai_assist'&&<><h2>Governed intelligence</h2>{p.ai.capabilities.map(x=><Chip key={x}>{x.replaceAll('_',' ')}</Chip>)}<p>AI is advisory, grounded and evidence-first. Insufficient data must produce an explicit insufficient-data result rather than fabricated confidence.</p>{p.interoperability.applicable&&<p><strong>Applicable biological/lab interoperability:</strong> {p.interoperability.scope.join(', ')}</p>}</>}
    {tab==='certification'&&<><h2>Certification</h2>{p.certification.map(x=><Chip key={x}>{x.replaceAll('_',' ')}</Chip>)}<p>Physical files alone do not certify a module. Domain depth, real workflow execution, authorization negatives, provenance, accessibility and E2E evidence remain mandatory.</p></>}
   </section>
  </>}
  <main>{children}</main>
 </section>;
}
