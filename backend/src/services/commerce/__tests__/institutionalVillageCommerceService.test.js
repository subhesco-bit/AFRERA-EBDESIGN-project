'use strict';
jest.mock('../../../database/pool',()=>({query:jest.fn()}));
const {scoreCandidate}=require('../institutionalVillageCommerceService');
describe('institutional village commerce scoring',()=>{
 const demand={quantity:100,maxUnitCost:50,maxLeadDays:10,requiredSkills:['weaving','natural-dye']};
 test('publishes deterministic score components and eligibility evidence',()=>{const x=scoreCandidate(demand,{availableCapacity:100,unitCost:45,leadDays:8,qualityScore:90,underservedShare:.8,skills:['weaving','natural-dye'],priorAwards:0});expect(x).toEqual(scoreCandidate(demand,{availableCapacity:100,unitCost:45,leadDays:8,qualityScore:90,underservedShare:.8,skills:['weaving','natural-dye'],priorAwards:0}));expect(x.eligible).toBe(true);expect(x.total).toBeGreaterThan(.8);});
 test('makes missing mandatory skill ineligible regardless of price',()=>{const x=scoreCandidate(demand,{availableCapacity:1000,unitCost:1,leadDays:1,qualityScore:100,underservedShare:1,skills:['weaving']});expect(x.eligible).toBe(false);expect(x.evidence.skillCoverage).toBe(.5);});
 test('fairness improves rank without overriding feasibility gate',()=>{const base={availableCapacity:100,unitCost:50,leadDays:10,qualityScore:80,skills:['weaving','natural-dye']};expect(scoreCandidate(demand,{...base,underservedShare:1,priorAwards:0}).total).toBeGreaterThan(scoreCandidate(demand,{...base,underservedShare:0,priorAwards:10}).total);});
});
