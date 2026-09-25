jest.mock('../middleware/auth', () => ({
  authMiddleware:(req,res,next)=>{req.user={id:'test-user',role:'admin',permissions:['*']};next();},
  userRateLimit:()=> (req,res,next)=>next(),
}));

const express=require('express');
const request=require('supertest');
const router=require('../routes/aiAgentRoutes');

describe('AI completion/backbone HTTP API',()=>{
  const app=express();
  app.use(express.json({limit:'1mb'}));
  app.use('/api/v1/ai/agents',router);

  it('returns 36 governed domain contracts',async()=>{
    const res=await request(app).get('/api/v1/ai/agents/domains');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(36);
    expect(res.body.data.every(d=>d.contractStatus==='COVERED')).toBe(true);
    expect(res.body.data.every(d=>d.agenticBackbone.templateCoverage===true)).toBe(true);
  });

  it('exposes completion truth without system prompts',async()=>{
    const res=await request(app).get('/api/v1/ai/agents/completion');
    expect(res.status).toBe(200);
    expect(res.body.data.codeComplete).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/Act as an evidence-first research specialist/);
  });

  it('builds an isolated hybrid plan without requiring external credentials',async()=>{
    const res=await request(app).post('/api/v1/ai/agents/backbone/plan').send({
      domainCode:'RESEARCH',
      task:{question:'review evidence'},
      options:{dataClassification:'internal'},
    });
    expect(res.status).toBe(200);
    expect(res.body.plan.architecture).toBe('isolated-hybrid-step-up');
    expect(res.body.plan.authorityStepDown.directExternalExecution).toBe(false);
  });
});
