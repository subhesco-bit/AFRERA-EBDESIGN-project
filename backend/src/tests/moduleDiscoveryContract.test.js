const { normalizeDiscoveryMetadata, validateDiscoveryMetadata, matchDiscovery } = require('../core/moduleDiscoveryContract');

describe('Module discovery wire contract',()=>{
  const raw={moduleId:'M900_TEST',name:'Cold Chain Planner',version:'1.0.0',domainId:'DOMAIN:COLD_CHAIN',discovery:{capabilities:['route planning','temperature integrity'],keywords:['reefer','cold-chain']},contexts:{roles:['logistics_manager']},dependencies:{modules:[],services:[],data:[],external:[],tools:[]},interfaces:{api:['/plan']},naturalLanguage:{intents:['plan cold shipment'],examples:['route my reefer'],disambiguation:[]}};
  it('normalizes legacy discovery fields into canonical metadata',()=>{const m=normalizeDiscoveryMetadata(raw);expect(m.keywords).toEqual(expect.arrayContaining(['cold','chain','reefer','planner']));expect(m.capabilities).toContain('route planning');});
  it('validates a complete discovery contract',()=>{expect(validateDiscoveryMetadata(normalizeDiscoveryMetadata(raw))).toEqual({valid:true,errors:[]});});
  it('returns evidence-backed natural-language matches',()=>{const m=normalizeDiscoveryMetadata(raw);const r=matchDiscovery(m,'plan cold reefer',{role:'logistics_manager'});expect(r.score).toBeGreaterThan(0);expect(r.evidence.capabilities).toContain('temperature integrity');});
});
