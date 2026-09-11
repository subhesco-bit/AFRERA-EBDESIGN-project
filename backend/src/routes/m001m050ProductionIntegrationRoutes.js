const express=require('express');
const router=express.Router();
const service=require('../services/m001m050ProductionIntegrationService');
const assurance=require('../services/moduleProductionAssuranceService');
const {authMiddleware}=require('../middleware/auth');

router.use(authMiddleware);

router.get('/contracts',(req,res)=>{
 const modules=Object.entries(assurance.CONTRACTS).map(([code,definition])=>({code,...definition}));
 res.json({success:true,count:modules.length,modules});
});

router.get('/inventory',(req,res,next)=>{
 try{res.json({success:true,...service.inventory()});}catch(e){next(e);}
});

router.get('/:moduleCode/readiness',(req,res,next)=>{
 try{const item=service.inventory().modules.find(module=>module.code===req.params.moduleCode);if(!item)return res.status(404).json({success:false,error:'Unknown module'});res.json({success:true,module:item});}catch(e){next(e);}
});

router.post('/:moduleCode/verify',async(req,res,next)=>{
 try{
  const actorId=req.user?.id||req.user?.userId||null;
  const result=await service.execute(req.params.moduleCode,req.body,{actorId,correlationId:req.headers['x-correlation-id']});
  res.json({success:true,...result});
 }catch(e){next(e);}
});

router.post('/:moduleCode/execute',async(req,res,next)=>{
 try{
  const actorId=req.user?.id||req.user?.userId||null;
  const result=await service.execute(req.params.moduleCode,req.body,{actorId,correlationId:req.headers['x-correlation-id']});
  res.json({success:true,...result});
 }catch(e){next(e);}
});

module.exports=router;
