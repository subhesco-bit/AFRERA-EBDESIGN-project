import React,{lazy,useMemo} from 'react';
import M001M050OperationalWorkspace from './M001M050OperationalWorkspace';
import M001M050ProductionWiredPanel from './M001M050ProductionWiredPanel';
import M001M050HighestStandardPanel from './M001M050HighestStandardPanel';
import M051M100ProductionWiredPanel from './M051M100ProductionWiredPanel';
import M051M150EnterpriseWorkspace from './M051M150EnterpriseWorkspace';
import EnterprisePromotion541Workspace from './EnterprisePromotion541Workspace';
import UniversalEnterpriseModulePage from './UniversalEnterpriseModulePage';

const pageLoaders=import.meta.glob('../modules/M*/M*Page.jsx');
function ExistingPage({moduleCode,loader}){const Page=useMemo(()=>lazy(loader),[loader]);return <Page data-module-code={moduleCode}/>;}
export default function EnterpriseModuleResolver({moduleCode}){
 const n=Number(moduleCode.slice(1));
 const loader=pageLoaders[`../modules/${moduleCode}/${moduleCode}Page.jsx`];
 const existing=loader?<ExistingPage moduleCode={moduleCode} loader={loader}/>:null;
 let domainSurface=existing||<UniversalEnterpriseModulePage moduleCode={moduleCode}/>;
 if(n<=50){domainSurface=<M001M050OperationalWorkspace moduleCode={moduleCode}><>{domainSurface}<M001M050ProductionWiredPanel moduleCode={moduleCode}/><M001M050HighestStandardPanel moduleCode={moduleCode}/></></M001M050OperationalWorkspace>;}
 else if(n<=150){domainSurface=<M051M150EnterpriseWorkspace moduleCode={moduleCode}><>{domainSurface}{n<=100&&<M051M100ProductionWiredPanel moduleCode={moduleCode}/>}</></M051M150EnterpriseWorkspace>;}
 return n<=541?<EnterprisePromotion541Workspace moduleCode={moduleCode}>{domainSurface}</EnterprisePromotion541Workspace>:domainSurface;
}
export const discoveredBespokeModulePages=Object.keys(pageLoaders);
