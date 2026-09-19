const runtime=require('../src/services/m001m050ProductionRuntimeService');
const assurance=require('../src/services/moduleProductionAssuranceService');

const samples={
M001:{platform_name:'EBDESIGN',version:'1.0',environment:'test',deployment_type:'container'},M002:{config_key:'erp.locale',config_type:'string',environment:'test'},M003:{tenant_name:'demo',tenant_code:'DEMO',plan_tier:'standard'},M004:{organization_name:'Village Operations'},M005:{environment:'test',status:'active'},M006:{operation:'rotate_key',target:'test-service'},M007:{flag_key:'new-village-ui',environment:'test',rollout_percentage:25},M008:{locale:'en-IN',resource_key:'village.name',value:'Village'},M009:{timezone:'Asia/Kolkata'},M010:{config_key:'finance.currency',value:'INR',category:'finance'},M011:{user_id:'u1',status:'active'},M012:{credential_context:'test-auth'},M013:{subject:'u1',resource:'village:v1',action:'read'},M014:{role_name:'village_operator',permissions:['village.read']},M015:{permission:'village.read',resource:'village'},M016:{provider:'oidc',redirect_uri:'https://example.test/callback'},M017:{user_id:'u1',factor_type:'totp'},M018:{identity_id:'id1',assurance_level:'verified'},M019:{subject_id:'u1',purpose:'operations',status:'granted'},M020:{session_id:'s1',user_id:'u1',issued_at:new Date().toISOString()},M021:{farmer_id:'f1',name:'Farmer One',village_id:'v1'},M022:{farmer_id:'f1'},M023:{farmer_id:'f1',members:['m1','m2']},M024:{farmer_id:'f1',document_type:'identity',document_reference:'doc1'},M025:{farmer_id:'f1',verification_type:'identity',status:'pending'},M026:{farmer_id:'f1',skill:'organic farming'},M027:{farmer_id:'f1',certificate_type:'organic',expiry_date:'2030-01-01'},M028:{farmer_id:'f1',advisory_type:'crop',recommendation:'review irrigation'},M029:{farmer_id:'f1',assessment_date:'2026-09-11'},M030:{farmer_id:'f1',period:'2026-Q3'},M031:{land_id:'l1',owner_reference:'f1',location:'v1'},M032:{land_id:'l1',owner_reference:'f1',effective_date:'2026-01-01'},M033:{land_id:'l1',lessor:'o1',lessee:'f1',start_date:'2026-01-01',end_date:'2027-01-01'},M034:{parcel_id:'p1',geometry:'POLYGON((0 0,1 0,1 1,0 0))'},M035:{layer:'parcels',geometry:'POLYGON((0 0,1 0,1 1,0 0))'},M036:{location:'p1',sample_date:'2026-09-01',soil_attributes:{ph:6.5}},M037:{resource_id:'w1',resource_type:'pond',location:'v1'},M038:{boundary_type:'village',geometry:'POLYGON((0 0,1 0,1 1,0 0))'},M039:{survey_id:'s1',survey_date:'2026-09-01',location:'v1'},M040:{record_id:'lr1',record_type:'title',source_reference:'registry-1'},M041:{village_id:'v1',village_name:'Demo Village',district:'D1',state:'S1'},M042:{panchayat_id:'p1',village_id:'v1'},M043:{block_id:'b1',district_id:'d1'},M044:{district_id:'d1',state_id:'s1'},M045:{state_id:'s1',state_code:'AS'},M046:{group_id:'shg1',members:['f1','f2'],meeting_frequency:'monthly'},M047:{cooperative_id:'c1',members:['f1'],member_shares_total:100,ledger_share_total:100},M048:{group_id:'pg1',producer_type:'farmer',members:['f1']},M049:{asset_id:'a1',asset_type:'water',location:'v1',condition:'good'},M050:{village_id:'v1',initiative:'irrigation improvement',status:'planned'}
};

describe('M001-M050 production runtime wiring',()=>{
 test('catalog contains exactly 50 domain contracts',()=>{
  expect(Object.keys(assurance.CONTRACTS)).toHaveLength(50);
  expect(runtime.MODULE_CODES).toHaveLength(50);
 });

 test.each(runtime.MODULE_CODES)('%s has backend, database, UI and executable service assets',code=>{
  const item=runtime.inspect(code);
  expect(item.missing).toEqual([]);
  expect(item.placeholders).toEqual([]);
  expect(item.loadError).toBeNull();
  expect(item.serviceExports.length).toBeGreaterThan(0);
  expect(item.ready).toBe(true);
 });

 test.each(runtime.MODULE_CODES)('%s verifies a domain-specific production workflow payload',async code=>{
  const result=await runtime.verifyWorkflow(code,samples[code],{actorId:'clone-e2e'});
  expect(result.assessment.module_id).toBe(code);
  expect(result.assessment.valid).toBe(true);
  expect(result.module.ready).toBe(true);
  expect(result.verified).toBe(true);
 });

 test('production gate rejects invalid lease chronology',async()=>{
  const result=await runtime.verifyWorkflow('M033',{land_id:'l1',lessor:'o1',lessee:'f1',start_date:'2027-01-01',end_date:'2026-01-01'});
  expect(result.verified).toBe(false);
  expect(result.assessment.violations).toContain('lease_end_must_follow_start');
 });
});
