const { createContext, validateModule, executeWithContract } = require('../core/moduleExecutionContract');

function moduleFixture(){return {moduleId:'M900_EXEC',initialize:async()=>true,healthCheck:async()=>({status:'healthy'}),execute:async(op,p)=>({op,p})};}

describe('Module execution wire contract',()=>{
  it('creates strong request and correlation ids',()=>{const c=createContext();expect(c.requestId).toMatch(/^[0-9a-f-]{36}$/);expect(c.correlationId).toMatch(/^[0-9a-f-]{36}$/);});
  it('validates executable module methods',()=>{expect(validateModule(moduleFixture()).valid).toBe(true);expect(validateModule({moduleId:'X'}).valid).toBe(false);});
  it('rejects mutating execution without idempotency',async()=>{const r=await executeWithContract(moduleFixture(),'write',{}, {mutating:true});expect(r.success).toBe(false);expect(r.error.code).toBe('IDEMPOTENCY_REQUIRED');});
  it('fails closed on authorization',async()=>{const r=await executeWithContract(moduleFixture(),'read',{}, {authorization:async()=>false});expect(r.error.code).toBe('FORBIDDEN');});
  it('returns the standard success envelope',async()=>{const r=await executeWithContract(moduleFixture(),'read',{x:1},{authorization:async()=>true});expect(r.success).toBe(true);expect(r.data).toEqual({op:'read',p:{x:1}});expect(r.error).toBeNull();});
});
