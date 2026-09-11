import React,{lazy,useMemo} from 'react';
import M001M050OperationalWorkspace from './M001M050OperationalWorkspace';
import M001M050ProductionWiredPanel from './M001M050ProductionWiredPanel';
import M001M050HighestStandardPanel from './M001M050HighestStandardPanel';
import M051M100ProductionWiredPanel from './M051M100ProductionWiredPanel';
import M051M150EnterpriseWorkspace from './M051M150EnterpriseWorkspace';
import UniversalEnterpriseModulePage from './UniversalEnterpriseModulePage';

const pageLoaders=import.meta.glob('../modules/M*/M*Page.jsx');
function ExistingPage({moduleCode,loader}){const Page=useMemo(()=>lazy(loader),[loader]);return <Page data-module-code={moduleCode}/>;}
export default function EnterpriseModuleResolver({moduleCode}){
 const n=Number(moduleCode.slice(1));
 const loader=pageLoaders[`../modules/${moduleCode}/${moduleCode}Page.jsx`];
 const existing=loader?<ExistingPage moduleCode={moduleCode} loader={loader}/>:null;
 if(n<=50){return <M001M050OperationalWorkspace moduleCode={moduleCode}><>{existing||<UniversalEnterpriseModulePage moduleCode={moduleCode}/>}<M001M050ProductionWiredPanel moduleCode={moduleCode}/><M001M050HighestStandardPanel moduleCode={moduleCode}/></></M001M050OperationalWorkspace>;}
 if(n<=150){return <M051M150EnterpriseWorkspace moduleCode={moduleCode}><>{existing||<UniversalEnterpriseModulePage moduleCode={moduleCode}/>} {n<=100&&<M051M100ProductionWiredPanel moduleCode={moduleCode}/>}</></M051M150EnterpriseWorkspace>;}
 return existing||<UniversalEnterpriseModulePage moduleCode={moduleCode}/>;
}
export const discoveredBespokeModulePages=Object.keys(pageLoaders);
