import React,{lazy,useMemo} from 'react';
import {useParams} from 'react-router-dom';

const physicalPages=import.meta.glob('../pages/enterprise-generated/**/*.jsx');
function normalize(input){const m=String(input||'').toUpperCase().match(/^P(\d{1,3})$/);if(!m)return null;const n=Number(m[1]);if(n<1||n>790)return null;return `P${String(n).padStart(3,'0')}`;}
export default function EnterprisePhysicalPageResolver(){
 const {pageId}=useParams();const normalized=normalize(pageId);
 const loader=useMemo(()=>normalized?Object.entries(physicalPages).find(([path])=>path.endsWith(`/${normalized}Page.jsx`))?.[1]:null,[normalized]);
 if(!normalized||!loader)return <div role="alert" className="p-6">Enterprise page not found.</div>;
 const Page=lazy(loader);
 return <Page/>;
}
export const physicalEnterprisePageCount=Object.keys(physicalPages).length;
export const physicalEnterprisePagePaths=Object.keys(physicalPages);
