import React,{createContext,useContext,useMemo,useState,useEffect,useRef,useCallback} from 'react';
import {useLocation} from 'react-router-dom';

const PageEstateContext=createContext(null);
const pageFiles=import.meta.glob('../pages/**/*.{jsx,tsx,js,ts}');
const modulePageFiles=import.meta.glob('../modules/M*/M*Page.jsx');
export function useEnterprisePageEstate(){return useContext(PageEstateContext);}

const initialState={status:'ready',message:'',evidence:null};
const validStates=new Set(['ready','loading','empty','error','success','blocked']);
function routeLabel(pathname){
 const raw=(pathname||'/').replace(/^\/+|\/+$/g,'');
 if(!raw)return 'Home';
 return raw.split('/').filter(Boolean).map(x=>x.replace(/[-_]+/g,' ')).join(' · ');
}

export default function EnterprisePageEstateBoundary({children}){
 const location=useLocation();
 const mainRef=useRef(null);
 const [online,setOnline]=useState(typeof navigator==='undefined'?true:navigator.onLine);
 const [pageState,setPageStateInternal]=useState(initialState);
 const [announcement,setAnnouncement]=useState('');
 const [density,setDensity]=useState(()=>{
  if(typeof window==='undefined')return 'comfortable';
  return window.localStorage.getItem('enterprise-page-density')||'comfortable';
 });
 const setPageState=useCallback((next,message='',evidence=null)=>{
  const status=validStates.has(next)?next:'ready';
  setPageStateInternal({status,message,evidence});
  if(message)setAnnouncement(message);
 },[]);
 const announce=useCallback((message)=>setAnnouncement(String(message||'')),[]);
 const setPageEvidence=useCallback((evidence)=>setPageStateInternal(prev=>({...prev,evidence:evidence||null})),[]);
 const changeDensity=useCallback((next)=>{
  const value=next==='compact'?'compact':'comfortable';
  setDensity(value);
  if(typeof window!=='undefined')window.localStorage.setItem('enterprise-page-density',value);
 },[]);

 useEffect(()=>{
  const on=()=>{setOnline(true);setAnnouncement('Connectivity restored.');};
  const off=()=>{setOnline(false);setAnnouncement('Offline or degraded connectivity.');};
  window.addEventListener('online',on);window.addEventListener('offline',off);
  const stateHandler=e=>setPageState(e.detail?.status||'ready',e.detail?.message||'',e.detail?.evidence||null);
  const announceHandler=e=>announce(e.detail?.message||e.detail||'');
  window.addEventListener('enterprise:page-state',stateHandler);
  window.addEventListener('enterprise:announce',announceHandler);
  return()=>{
   window.removeEventListener('online',on);window.removeEventListener('offline',off);
   window.removeEventListener('enterprise:page-state',stateHandler);
   window.removeEventListener('enterprise:announce',announceHandler);
  };
 },[announce,setPageState]);

 useEffect(()=>{
  setPageStateInternal(initialState);
  const label=routeLabel(location.pathname);
  setAnnouncement(`${label} page loaded`);
  if(typeof performance!=='undefined')performance.mark?.(`enterprise-page:${location.pathname}`);
  window.dispatchEvent(new CustomEvent('enterprise:page-view',{detail:{route:location.pathname,label,online,timestamp:new Date().toISOString()}}));
  requestAnimationFrame(()=>mainRef.current?.focus({preventScroll:true}));
 },[location.pathname,online]);

 const value=useMemo(()=>({
  route:location.pathname,
  routeLabel:routeLabel(location.pathname),
  online,
  density,
  pageState,
  setPageState,
  announce,
  setPageEvidence,
  setDensity:changeDensity,
  discoveredApplicationPages:Object.keys(pageFiles).length,
  discoveredModulePages:Object.keys(modulePageFiles).length,
  standards:{
   accessibility:'WCAG-oriented semantic, keyboard, focus-management and live-region contract',
   responsive:true,
   multilingual:true,
   telemetry:true,
   evidenceFirst:true,
   loadingEmptyErrorSuccessStates:true,
   offlineDegradedStateAwareness:true,
   roleAndContextAware:true,
   pageStateEvents:true,
   focusManagement:true,
  }
 }),[location.pathname,online,density,pageState,setPageState,announce,setPageEvidence,changeDensity]);

 const stateVisible=pageState.status!=='ready'&&(pageState.message||pageState.status==='loading');
 return <PageEstateContext.Provider value={value}>
  <div data-enterprise-page-estate="true" data-route={location.pathname} data-online={online?'true':'false'} data-density={density} data-page-state={pageState.status}>
   <a href="#enterprise-page-main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:bg-white focus:p-2">Skip to page content</a>
   <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
   {!online&&<div role="status" aria-live="polite" className="border-b p-2 text-sm">Offline/degraded mode: read-only information may remain available, but network-dependent changes can fail until connectivity returns.</div>}
   {stateVisible&&<div role={pageState.status==='error'?'alert':'status'} aria-live={pageState.status==='error'?'assertive':'polite'} className="border-b p-2 text-sm" data-page-state-banner={pageState.status}>
    {pageState.message||`${pageState.status}…`}
   </div>}
   <main id="enterprise-page-main" ref={mainRef} tabIndex={-1} aria-busy={pageState.status==='loading'?'true':'false'}>
    {children}
   </main>
  </div>
 </PageEstateContext.Provider>;
}

export const enterprisePageEstateInventory={applicationPages:Object.keys(pageFiles),modulePages:Object.keys(modulePageFiles)};
export function signalEnterprisePageState(status,message='',evidence=null){
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('enterprise:page-state',{detail:{status,message,evidence}}));
}
export function announceEnterprisePage(message){
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('enterprise:announce',{detail:{message}}));
}
