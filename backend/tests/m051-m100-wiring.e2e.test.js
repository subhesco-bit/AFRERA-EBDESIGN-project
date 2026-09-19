const wiring=require('../src/services/m051m100ModuleWiringService');
const hardening=require('../src/services/m051m100ProductionHardeningService');

describe('M051-M100 wired production E2E contract',()=>{
 test('all 50 modules are registered with concrete module identities',()=>{
  expect(wiring.MODULE_CODES).toHaveLength(50);
  for(const code of wiring.MODULE_CODES){
   const definition=hardening.get(code);
   expect(definition).toBeTruthy();
   expect(definition.name).not.toBe(code);
   expect(definition.domain).toBeTruthy();
   expect(definition.required.length).toBeGreaterThan(0);
   expect(definition.ai.length).toBeGreaterThan(0);
  }
 });

 test('all 50 modules expose or resolve their existing runtime assets',()=>{
  const inventory=wiring.MODULE_CODES.map(wiring.resolveModule);
  expect(inventory).toHaveLength(50);
  expect(inventory.every(x=>x.serviceExists||x.controllerExists||x.uiExists)).toBe(true);
  const missingServices=inventory.filter(x=>!x.serviceExists).map(x=>x.code);
  expect(missingServices.length).toBeLessThan(50);
 });

 test.each(wiring.MODULE_CODES)('%s rejects an incomplete production operation',code=>{
  const result=hardening.validate(code,{});
  expect(result.valid).toBe(false);
  expect(result.missing.length).toBeGreaterThan(0);
 });

 test.each([
  ['M051',{fpoId:'fpo-1',legalName:'Assam Growers FPO',registrationNumber:'FPO-001',registrationDate:'2026-01-10',status:'active'}],
  ['M055',{fpoId:'fpo-1',supplierId:'sup-1',productId:'rice',quantity:100,unitPrice:42}],
  ['M061',{farmId:'farm-1',plotId:'plot-1',cropId:'rice',season:'kharif',plannedArea:2}],
  ['M065',{cropId:'rice',area:2,seedRate:25,requiredQuantity:50}],
  ['M069',{plotId:'plot-1',irrigationDate:'2026-08-01',waterVolume:100,method:'drip'}],
  ['M071',{plotId:'plot-1',assessmentDate:'2026-08-01',organicCarbon:0.8,ph:6.4}],
  ['M076',{villageId:'v-1',periodStart:'2026-01-01',periodEnd:'2026-03-31',availableVolume:1000,plannedDemand:800}],
  ['M087',{cropId:'rice',locationId:'v-1',forecastDate:'2026-08-01',pestCode:'stem-borer',riskScore:0.35}],
  ['M093',{farmId:'farm-1',workerId:'w-1',workDate:'2026-08-01',hours:8,activityCode:'harvest'}],
  ['M098',{farmId:'farm-1',periodStart:'2026-01-01',periodEnd:'2026-03-31',costType:'labour',amount:12000}]
 ])('validates real %s business payload',(_code,payload)=>{
  const result=hardening.validate(_code,payload);
  expect(result.valid).toBe(true);
  expect(result.errors).toEqual([]);
 });
});
