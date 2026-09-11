import React,{useEffect,useMemo,useState} from 'react';
import {getEnterpriseSpec,getEnterpriseKpis,getTaskSummary,createOperationalTask} from '../services/m001m050EnterpriseProductApi';
import './M001M050OperationalWorkspace.css';
const label=x=>String(x||'').replaceAll('_',' ');
export default function M001M050OperationalWorkspace({moduleCode,children}){
 const [spec,setSpec]=useState(null),[kpis,setKpis]=useState([]),[tasks,setTasks]=useState([]),[tab,setTab]=useState('operations'),[error,setError]=useState(''),[taskTitle,setTaskTitle]=useState('');
 const reload=()=>Promise.all([getEnterpriseSpec(moduleCode),getEnterpriseKpis(moduleCode),getTaskSummary(moduleCode)]).then(([s,k,t])=>{setSpec(s);setKpis(k);setTasks(t);setError('');}).catch(e=>setError(e.message));
 useEffect(()=>{reload();},[moduleCode]);
 const taskCount=useMemo(()=>tasks.reduce((n,x)=>n+Number(x.count||0),0),[tasks]);
 const addTask=async()=>{if(!taskTitle.trim())return;try{await createOperationalTask(moduleCode,{title:taskTitle.trim(),priority:'normal'});setTaskTitle('');reload();}catch(e){setError(e.message);}};
 if(!spec)return <section aria-busy="true" className="mops-shell">Loading {moduleCode} enterprise workspace…{error&&<p role="alert">{error}</p>}</section>;
 return <div className="mops-shell">
  <header className="mops-header"><div><p className="mops-eyebrow">{moduleCode} · {spec.family} enterprise workspace</p><h1>{spec.name}</h1><p>{spec.focus.join(' · ')}</p></div><div className="mops-actions"><button onClick={()=>setTab('workflow')}>Workflow</button><button onClick={()=>setTab('decisions')}>Decision centre</button><button onClick={()=>setTab('audit')}>Evidence</button></div></header>
  {error&&<div role="alert" className="mops-alert">{error}</div>}
  <section className="mops-kpis">{kpis.map(k=><article key={k.metric_key}><span>{label(k.metric_key)}</span><strong>{k.metric_value??'—'}{k.unit?` ${k.unit}`:''}</strong><small>{k.source_reference?'Authoritative source linked':'Awaiting authoritative measurement'}</small></article>)}</section>
  <nav className="mops-tabs" aria-label={`${moduleCode} enterprise sections`}>{[['operations','Operations'],['workflow','Workflow'],['visuals','Visualisation'],['tasks','Work queue'],['decisions','Decisions'],['controls','ERP controls'],['integrations','Integrations'],['audit','Evidence & audit']].map(([k,v])=><button key={k} aria-current={tab===k?'page':undefined} onClick={()=>setTab(k)}>{v}</button>)}</nav>
  <section className="mops-context">
   {tab==='operations'&&<><div className="mops-grid">{spec.pages.map(x=><article key={x}><h3>{label(x)}</h3><p>{spec.focus.join(', ')}. Uses the authoritative module service and records.</p></article>)}</div><h2>Domain application</h2>{children}</>}
   {tab==='workflow'&&<><h2>Controlled workflow</h2><ol className="mops-flow">{spec.workflow.map((x,i)=><li key={x}><span>{i+1}</span>{label(x)}</li>)}</ol><p>State transitions are server-enforced and auditable; steps cannot be skipped arbitrarily.</p></>}
   {tab==='visuals'&&<div className="mops-grid">{spec.visualizations.map(x=><article key={x}><h3>{label(x)}</h3><p>Rendered only from sourced API data. Missing measurements remain visibly unavailable.</p></article>)}</div>}
   {tab==='tasks'&&<div><h2>Operational work queue <small>({taskCount})</small></h2><div className="mops-actions"><input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Create operational task" aria-label="Task title"/><button onClick={addTask}>Add task</button></div><div className="mops-grid">{tasks.map(x=><article key={`${x.status}-${x.priority}`}><h3>{label(x.status)}</h3><strong>{x.count}</strong><p>{label(x.priority)} priority</p></article>)}</div></div>}
   {tab==='decisions'&&<div><h2>Decision centre</h2>{spec.decisionControls.map(x=><article className="mops-decision" key={x}><strong>{label(x)}</strong></article>)}<p>AI may analyse and recommend, but consequential actions require accountable human authorization.</p></div>}
   {tab==='controls'&&<div className="mops-grid">{spec.erpControls.map(x=><article key={x}><h3>{label(x)}</h3></article>)}</div>}
   {tab==='integrations'&&<div className="mops-grid">{spec.integrations.map(x=><article key={x}><h3>{label(x)}</h3><p>Contracted cross-module integration; authorization and provenance required.</p></article>)}</div>}
   {tab==='audit'&&<div><h2>Evidence & audit</h2><p>Actor, tenant/geography scope, correlation ID, source records, workflow transitions, approvals, exceptions, AI evidence and outcomes are retained.</p><p><strong>Certification gates:</strong> {spec.certification.map(label).join(' · ')}</p></div>}
  </section>
 </div>;
}