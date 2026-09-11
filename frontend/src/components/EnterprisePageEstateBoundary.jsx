import React,{createContext,useContext,useMemo,useState,useEffect} from 'react';
import {useLocation} from 'react-router-dom';

const PageEstateContext=createContext(null);
const pageFiles=import.meta.glob('../pages/**/*.{jsx,tsx,js,ts}');
const modulePageFiles=import.meta.glob('../modules/M*/M*Page.jsx');
export function useEnterprisePageEstate(){return useContext(PageEstateContext);}
export default function EnterprisePageEstateBoundary({children}){
 const location=useLocation();
 const [online,setOnline]=useState(typeof navigator==='undefined'?true:navigator.onLine);
 useEffect(()=>{const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);};},[]);
 const value=useMemo(()=>({route:location.pathname,online,discoveredApplicationPages:Object.keys(pageFiles).length,discoveredModulePages:Object.keys(modulePageFiles).length,standards:{accessibility:'WCAG-oriented keyboard/semantic/error-state contract',responsive:true,multilingual:true,telemetry:true,evidenceFirst:true,loadingEmptyErrorSuccessStates:true}}),[location.pathname,online]);
 return <PageEstateContext.Provider value={value}>
  <div data-enterprise-page-estate="true" data-route={location.pathname} data-online={online?'true':'false'}>
   <a href="#enterprise-page-main" className="sr-only focus:not-sr-only">Skip to page content</a>
   {!online&&<div role="status" aria-live="polite" className="border-b p-2 text-sm">Offline/degraded mode: changes may be unavailable until connectivity returns.</div>}
   <div id="enterprise-page-main">{children}</div>
  </div>
 </PageEstateContext.Provider>;
}
export const enterprisePageEstateInventory={applicationPages:Object.keys(pageFiles),modulePages:Object.keys(modulePageFiles)};
